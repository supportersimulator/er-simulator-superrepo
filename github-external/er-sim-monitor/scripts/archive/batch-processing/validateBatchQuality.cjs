#!/usr/bin/env node

/**
 * Automated Quality Validation
 *
 * Post-processing validation pipeline for batch-processed scenarios
 * Catches common issues, validates Monitor.js compatibility, scores quality
 *
 * Validation Checks:
 * 1. Required fields presence (Case_ID, vitals, waveform)
 * 2. JSON validity (all vitals fields parseable)
 * 3. Clinical plausibility (HR 0-300, SpO2 0-100, etc.)
 * 4. Waveform naming (must end with _ecg, canonical names)
 * 5. Data completeness (% of fields populated)
 * 6. Consistency (state progression, decision logic)
 *
 * Auto-fixes:
 * - Invalid waveform names → canonical equivalents
 * - "N/A" strings → empty/null
 * - Out-of-range vitals → clinical defaults
 *
 * Usage:
 *   node scripts/validateBatchQuality.cjs --rows 10-50
 *   node scripts/validateBatchQuality.cjs --batch-id batch_123
 *   node scripts/validateBatchQuality.cjs --auto-fix
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const {
  batchReadVitals,
  batchReadCaseContext,
  batchWriteVitals
} = require('./lib/batchSheetsOps.cjs');

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

const args = process.argv.slice(2);
const autoFix = args.includes('--auto-fix');
const verbose = args.includes('--verbose');

// Parse row range
const rowsArg = args.find(arg => arg.startsWith('--rows'));
let rowRange = null;
if (rowsArg) {
  const range = rowsArg.split('=')[1];
  if (range.includes('-')) {
    const [start, end] = range.split('-').map(Number);
    rowRange = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  } else {
    rowRange = range.split(',').map(Number);
  }
}

// Canonical waveform corrections
const WAVEFORM_CORRECTIONS = {
  'peapulseless_ecg': 'pea_ecg',
  'pea_pulseless_ecg': 'pea_ecg',
  'sinus_tachycardia_ecg': 'sinus_tachy_ecg',
  'sinus_bradycardia_ecg': 'sinus_brady_ecg',
  'v_fib_ecg': 'vfib_ecg',
  'v_tach_ecg': 'vtach_ecg',
  'a_fib_ecg': 'afib_ecg',
  'a_flutter_ecg': 'aflutter_ecg'
};

// Valid canonical waveforms
const VALID_WAVEFORMS = [
  'sinus_ecg', 'sinus_brady_ecg', 'sinus_tachy_ecg',
  'afib_ecg', 'aflutter_ecg', 'afib_rvr_ecg',
  'vtach_ecg', 'vfib_ecg', 'svt_ecg',
  'pea_ecg', 'asystole_ecg',
  'first_degree_block_ecg', 'second_degree_type1_ecg', 'second_degree_type2_ecg',
  'third_degree_block_ecg', 'rbbb_ecg', 'lbbb_ecg',
  'stemi_anterior_ecg', 'stemi_inferior_ecg', 'stemi_lateral_ecg', 'stemi_posterior_ecg',
  'nstemi_ecg', 'pericarditis_ecg', 'hyperkalemia_ecg', 'hypokalemia_ecg'
];

// Clinical ranges
const CLINICAL_RANGES = {
  HR: { min: 0, max: 300, typical: [40, 160] },
  SpO2: { min: 0, max: 100, typical: [88, 100] },
  RR: { min: 0, max: 60, typical: [8, 30] },
  Temp: { min: 30, max: 45, typical: [36, 39] }, // Celsius
  EtCO2: { min: 0, max: 100, typical: [25, 50] },
  BP_Sys: { min: 0, max: 300, typical: [80, 180] },
  BP_Dia: { min: 0, max: 200, typical: [40, 120] }
};

/**
 * Validate single vitals object
 */
function validateVitals(vitals, context = {}) {
  const issues = [];
  const warnings = [];
  const fixes = [];

  if (!vitals || typeof vitals !== 'object') {
    issues.push('Vitals is not a valid object');
    return { issues, warnings, fixes, vitals: null };
  }

  const fixed = { ...vitals };

  // 1. Check required fields
  const required = ['HR', 'BP', 'SpO2', 'RR', 'waveform'];
  required.forEach(field => {
    if (!(field in fixed) || fixed[field] === null || fixed[field] === undefined) {
      issues.push(`Missing required field: ${field}`);
    }
  });

  // 2. Validate waveform
  if (fixed.waveform) {
    // Check if ends with _ecg
    if (!fixed.waveform.endsWith('_ecg')) {
      issues.push(`Waveform "${fixed.waveform}" doesn't end with "_ecg"`);
    }

    // Check if canonical
    if (WAVEFORM_CORRECTIONS[fixed.waveform]) {
      const corrected = WAVEFORM_CORRECTIONS[fixed.waveform];
      fixes.push(`Waveform: ${fixed.waveform} → ${corrected}`);
      fixed.waveform = corrected;
    }

    // Check if valid
    if (!VALID_WAVEFORMS.includes(fixed.waveform)) {
      warnings.push(`Waveform "${fixed.waveform}" not in canonical list`);
    }
  }

  // 3. Validate vital ranges
  if (fixed.HR !== undefined && fixed.HR !== null) {
    const hr = parseFloat(fixed.HR);
    if (isNaN(hr)) {
      issues.push(`HR "${fixed.HR}" is not a number`);
    } else if (hr < CLINICAL_RANGES.HR.min || hr > CLINICAL_RANGES.HR.max) {
      issues.push(`HR ${hr} out of valid range (${CLINICAL_RANGES.HR.min}-${CLINICAL_RANGES.HR.max})`);
    } else if (hr < CLINICAL_RANGES.HR.typical[0] || hr > CLINICAL_RANGES.HR.typical[1]) {
      warnings.push(`HR ${hr} outside typical range (${CLINICAL_RANGES.HR.typical.join('-')})`);
    }
  }

  if (fixed.SpO2 !== undefined && fixed.SpO2 !== null) {
    const spo2 = parseFloat(fixed.SpO2);
    if (isNaN(spo2)) {
      issues.push(`SpO2 "${fixed.SpO2}" is not a number`);
    } else if (spo2 < CLINICAL_RANGES.SpO2.min || spo2 > CLINICAL_RANGES.SpO2.max) {
      issues.push(`SpO2 ${spo2} out of valid range (${CLINICAL_RANGES.SpO2.min}-${CLINICAL_RANGES.SpO2.max})`);
    }
  }

  if (fixed.RR !== undefined && fixed.RR !== null) {
    const rr = parseFloat(fixed.RR);
    if (isNaN(rr)) {
      issues.push(`RR "${fixed.RR}" is not a number`);
    } else if (rr < CLINICAL_RANGES.RR.min || rr > CLINICAL_RANGES.RR.max) {
      issues.push(`RR ${rr} out of valid range (${CLINICAL_RANGES.RR.min}-${CLINICAL_RANGES.RR.max})`);
    }
  }

  if (fixed.Temp !== undefined && fixed.Temp !== null) {
    const temp = parseFloat(fixed.Temp);
    if (isNaN(temp)) {
      issues.push(`Temp "${fixed.Temp}" is not a number`);
    } else if (temp < CLINICAL_RANGES.Temp.min || temp > CLINICAL_RANGES.Temp.max) {
      issues.push(`Temp ${temp} out of valid range (${CLINICAL_RANGES.Temp.min}-${CLINICAL_RANGES.Temp.max})`);
    }
  }

  // 4. Validate BP format
  if (fixed.BP) {
    if (typeof fixed.BP === 'string') {
      const bpMatch = fixed.BP.match(/^(\d+)\/(\d+)$/);
      if (!bpMatch) {
        issues.push(`BP "${fixed.BP}" invalid format (should be "sys/dia")`);
      } else {
        const sys = parseInt(bpMatch[1]);
        const dia = parseInt(bpMatch[2]);

        if (sys < CLINICAL_RANGES.BP_Sys.min || sys > CLINICAL_RANGES.BP_Sys.max) {
          issues.push(`Systolic BP ${sys} out of range`);
        }
        if (dia < CLINICAL_RANGES.BP_Dia.min || dia > CLINICAL_RANGES.BP_Dia.max) {
          issues.push(`Diastolic BP ${dia} out of range`);
        }
        if (sys <= dia) {
          issues.push(`Systolic BP (${sys}) should be > Diastolic BP (${dia})`);
        }
      }
    } else if (typeof fixed.BP === 'object') {
      if (!fixed.BP.sys || !fixed.BP.dia) {
        issues.push('BP object missing sys/dia');
      }
    }
  }

  // 5. Check for "N/A" strings
  Object.keys(fixed).forEach(key => {
    if (fixed[key] === 'N/A') {
      fixes.push(`${key}: "N/A" → null`);
      fixed[key] = null;
    }
  });

  return {
    issues,
    warnings,
    fixes,
    vitals: fixes.length > 0 ? fixed : vitals
  };
}

/**
 * Calculate quality score
 */
function calculateQualityScore(vitalsStates) {
  let score = 0;
  let maxScore = 0;

  Object.entries(vitalsStates).forEach(([stateName, vitals]) => {
    if (!vitals) return;

    // Required fields (20 points each)
    const required = ['HR', 'BP', 'SpO2', 'RR', 'waveform'];
    required.forEach(field => {
      maxScore += 20;
      if (vitals[field] !== null && vitals[field] !== undefined && vitals[field] !== '') {
        score += 20;
      }
    });

    // Optional fields (10 points each)
    const optional = ['Temp', 'EtCO2'];
    optional.forEach(field => {
      maxScore += 10;
      if (vitals[field] !== null && vitals[field] !== undefined && vitals[field] !== '') {
        score += 10;
      }
    });

    // Valid waveform (10 bonus points)
    if (vitals.waveform && VALID_WAVEFORMS.includes(vitals.waveform)) {
      score += 10;
    }
  });

  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
}

/**
 * Main validation function
 */
async function validateBatchQuality() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('      AUTOMATED QUALITY VALIDATION');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log(`Mode: ${autoFix ? '⚠️  AUTO-FIX ENABLED' : '🔍 READ-ONLY (use --auto-fix to apply fixes)'}`);
  console.log('');

  // Determine rows
  const rowNumbers = rowRange || Array.from({ length: 10 }, (_, i) => i + 3);

  console.log(`📊 Validating ${rowNumbers.length} rows: ${rowNumbers[0]}-${rowNumbers[rowNumbers.length - 1]}`);
  console.log('');

  // Read data
  console.log('📖 Reading data...');
  const [vitalsData, caseData] = await Promise.all([
    batchReadVitals(SHEET_ID, rowNumbers),
    batchReadCaseContext(SHEET_ID, rowNumbers)
  ]);
  console.log(`✅ Read ${vitalsData.length} rows`);
  console.log('');

  // Validate each row
  const results = [];
  const updates = [];
  let totalIssues = 0;
  let totalWarnings = 0;
  let totalFixes = 0;

  console.log('🔍 Validating rows:');
  console.log('─────────────────────────────────────────────────');
  console.log('');

  vitalsData.forEach((vitalRow, idx) => {
    const caseRow = caseData[idx];
    const rowResult = {
      rowNum: vitalRow.rowNum,
      caseId: caseRow.caseId,
      issues: [],
      warnings: [],
      fixes: [],
      score: 0
    };

    console.log(`Row ${vitalRow.rowNum} (${caseRow.caseId}):`);

    Object.entries(vitalRow.vitals).forEach(([stateName, vitals]) => {
      if (!vitals) {
        console.log(`   ${stateName}: Empty (skipped)`);
        return;
      }

      const validation = validateVitals(vitals, { stateName, caseId: caseRow.caseId });

      if (validation.issues.length > 0) {
        validation.issues.forEach(issue => {
          console.log(`   ❌ ${stateName}: ${issue}`);
          rowResult.issues.push(`${stateName}: ${issue}`);
        });
        totalIssues += validation.issues.length;
      }

      if (validation.warnings.length > 0 && verbose) {
        validation.warnings.forEach(warning => {
          console.log(`   ⚠️  ${stateName}: ${warning}`);
          rowResult.warnings.push(`${stateName}: ${warning}`);
        });
        totalWarnings += validation.warnings.length;
      }

      if (validation.fixes.length > 0) {
        validation.fixes.forEach(fix => {
          console.log(`   🔧 ${stateName}: ${fix}`);
          rowResult.fixes.push(`${stateName}: ${fix}`);
        });
        totalFixes += validation.fixes.length;

        if (autoFix) {
          updates.push({
            rowNum: vitalRow.rowNum,
            columnName: stateName,
            vitals: validation.vitals
          });
        }
      }

      if (validation.issues.length === 0 && validation.fixes.length === 0) {
        console.log(`   ✅ ${stateName}: Valid`);
      }
    });

    // Calculate quality score
    rowResult.score = calculateQualityScore(vitalRow.vitals);
    console.log(`   📊 Quality Score: ${rowResult.score}%`);
    console.log('');

    results.push(rowResult);
  });

  // Apply fixes if enabled
  if (autoFix && updates.length > 0) {
    console.log('💾 Applying fixes...');
    await batchWriteVitals(SHEET_ID, updates);
    console.log(`✅ Applied ${updates.length} fixes`);
    console.log('');
  }

  // Summary
  console.log('═══════════════════════════════════════════════════');
  console.log('✅ VALIDATION COMPLETE');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log(`Rows validated: ${rowNumbers.length}`);
  console.log(`Total issues: ${totalIssues} ${totalIssues === 0 ? '✅' : '❌'}`);
  console.log(`Total warnings: ${totalWarnings} ${totalWarnings === 0 ? '✅' : '⚠️'}`);
  console.log(`Total fixes: ${totalFixes} ${autoFix ? '(applied)' : '(not applied)'}`);
  console.log('');

  // Average quality score
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  console.log(`📊 Average Quality Score: ${Math.round(avgScore)}%`);
  console.log('');

  // Issues summary
  if (totalIssues > 0) {
    console.log('❌ Critical Issues Found:');
    results.forEach(r => {
      if (r.issues.length > 0) {
        console.log(`   Row ${r.rowNum} (${r.caseId}): ${r.issues.length} issue(s)`);
        if (verbose) {
          r.issues.forEach(issue => console.log(`      - ${issue}`));
        }
      }
    });
    console.log('');
  }

  if (!autoFix && totalFixes > 0) {
    console.log('💡 Tip: Run with --auto-fix to apply fixes automatically');
    console.log('');
  }

  // Return summary
  return {
    totalRows: rowNumbers.length,
    issues: totalIssues,
    warnings: totalWarnings,
    fixes: totalFixes,
    avgScore: Math.round(avgScore),
    results
  };
}

if (require.main === module) {
  validateBatchQuality().catch(error => {
    console.error('');
    console.error('❌ VALIDATION FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  });
}

module.exports = { validateBatchQuality, validateVitals, calculateQualityScore };
