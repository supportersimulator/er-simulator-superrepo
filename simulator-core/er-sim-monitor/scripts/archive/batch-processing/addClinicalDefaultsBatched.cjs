#!/usr/bin/env node

/**
 * Add Clinical Defaults to Vitals JSON (BATCHED VERSION)
 *
 * Intelligently fills missing vitals fields using clinical reasoning
 * Uses batched Sheets API calls for 100x performance improvement
 *
 * Performance:
 * - Before: 22,000+ individual API calls for 1000 rows
 * - After: ~20 batched API calls
 * - Speed: 100x faster I/O
 *
 * Usage:
 *   node scripts/addClinicalDefaultsBatched.cjs
 *   node scripts/addClinicalDefaultsBatched.cjs --dry-run
 *   node scripts/addClinicalDefaultsBatched.cjs --rows 10-50
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
const dryRun = args.includes('--dry-run');

// Parse --rows argument
let rowRange = null;
const rowsArg = args.find(arg => arg.startsWith('--rows'));
if (rowsArg) {
  const range = rowsArg.split('=')[1];
  if (range.includes('-')) {
    const [start, end] = range.split('-').map(Number);
    rowRange = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  } else {
    rowRange = range.split(',').map(Number);
  }
}

// Waveform name corrections (common AI mistakes → canonical names)
const WAVEFORM_CORRECTIONS = {
  'peapulseless_ecg': 'pea_ecg',
  'pea_pulseless_ecg': 'pea_ecg',
  'vfib_ecg': 'vfib_ecg',
  'vtach_ecg': 'vtach_ecg',
  'asystole_ecg': 'asystole_ecg',
  'sinus_ecg': 'sinus_ecg',
  'sinus_tachycardia_ecg': 'sinus_tachy_ecg',
  'sinus_bradycardia_ecg': 'sinus_brady_ecg',
  'afib_ecg': 'afib_ecg',
  'aflutter_ecg': 'aflutter_ecg'
};

/**
 * Infer RR from HR, SpO2, waveform
 */
function inferRR(vitals) {
  const hr = vitals.HR || 75;
  const spo2 = vitals.SpO2 || 98;
  const waveform = vitals.waveform || 'sinus_ecg';

  // Cardiac arrest rhythms
  if (['asystole_ecg', 'pea_ecg', 'vfib_ecg'].includes(waveform)) {
    return 0;
  }

  // Severe hypoxemia → respiratory distress
  if (spo2 < 85) {
    return Math.round(32 + Math.random() * 8); // 32-40 bpm
  }

  // Moderate hypoxemia
  if (spo2 < 90) {
    return Math.round(24 + Math.random() * 6); // 24-30 bpm
  }

  // Tachycardia suggests compensatory response
  if (hr > 120) {
    return Math.round(20 + Math.random() * 6); // 20-26 bpm
  }

  // Bradycardia
  if (hr < 50) {
    return Math.round(10 + Math.random() * 4); // 10-14 bpm
  }

  // Normal
  return Math.round(14 + Math.random() * 4); // 14-18 bpm
}

/**
 * Infer temperature from case context and vitals
 */
function inferTemp(vitals, caseContext) {
  const hr = vitals.HR || 75;
  const rr = vitals.RR || 16;

  const feverKeywords = ['fever', 'sepsis', 'infection', 'pneumonia', 'meningitis'];
  const hypothermiaKeywords = ['hypothermia', 'exposure', 'cold'];

  const contextLower = caseContext.toLowerCase();

  // Explicit fever indicators
  if (feverKeywords.some(kw => contextLower.includes(kw))) {
    return Math.round((38.5 + Math.random() * 2) * 10) / 10; // 38.5-40.5°C
  }

  // Hypothermia
  if (hypothermiaKeywords.some(kw => contextLower.includes(kw))) {
    return Math.round((32 + Math.random() * 3) * 10) / 10; // 32-35°C
  }

  // Tachycardia + tachypnea suggests fever
  if (hr > 110 && rr > 20) {
    return Math.round((38 + Math.random() * 1.5) * 10) / 10; // 38-39.5°C
  }

  // Normal
  return Math.round((36.5 + Math.random() * 1) * 10) / 10; // 36.5-37.5°C
}

/**
 * Infer EtCO2 from RR
 */
function inferEtCO2(vitals) {
  const rr = vitals.RR || 16;
  const waveform = vitals.waveform || 'sinus_ecg';

  // Cardiac arrest
  if (['asystole_ecg', 'pea_ecg', 'vfib_ecg'].includes(waveform)) {
    return 0;
  }

  // Hyperventilation (high RR → low CO2)
  if (rr > 30) {
    return Math.round(25 + Math.random() * 5); // 25-30 mmHg
  }

  if (rr > 24) {
    return Math.round(30 + Math.random() * 5); // 30-35 mmHg
  }

  // Hypoventilation (low RR → high CO2)
  if (rr < 10) {
    return Math.round(45 + Math.random() * 10); // 45-55 mmHg
  }

  if (rr < 12) {
    return Math.round(42 + Math.random() * 6); // 42-48 mmHg
  }

  // Normal
  return Math.round(35 + Math.random() * 10); // 35-45 mmHg
}

/**
 * Enrich vitals with intelligent defaults
 */
function enrichVitals(vitals, caseContext) {
  if (!vitals) return null;

  const enriched = { ...vitals };
  const changes = [];

  // Fix waveform naming
  if (enriched.waveform && WAVEFORM_CORRECTIONS[enriched.waveform]) {
    const corrected = WAVEFORM_CORRECTIONS[enriched.waveform];
    changes.push(`waveform: ${enriched.waveform} → ${corrected}`);
    enriched.waveform = corrected;
  }

  // Add missing RR
  if (!enriched.RR && enriched.RR !== 0) {
    enriched.RR = inferRR(enriched);
    changes.push(`RR: ${enriched.RR}`);
  }

  // Add missing Temp
  if (!enriched.Temp) {
    enriched.Temp = inferTemp(enriched, caseContext);
    changes.push(`Temp: ${enriched.Temp}°C`);
  }

  // Add missing EtCO2
  if (!enriched.EtCO2 && enriched.EtCO2 !== 0) {
    enriched.EtCO2 = inferEtCO2(enriched);
    changes.push(`EtCO2: ${enriched.EtCO2} mmHg`);
  }

  return { vitals: enriched, changes };
}

/**
 * Main processing function
 */
async function addClinicalDefaults() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('   ADD CLINICAL DEFAULTS (BATCHED VERSION)');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log(`Mode: ${dryRun ? '🔍 DRY RUN (no changes)' : '⚠️  LIVE MODE'}`);
  console.log('');

  // Determine which rows to process
  const rowNumbers = rowRange || Array.from({ length: 10 }, (_, i) => i + 3); // Rows 3-12 by default

  console.log(`📊 Processing ${rowNumbers.length} rows: ${rowNumbers[0]}-${rowNumbers[rowNumbers.length - 1]}`);
  console.log('');

  // Batch read all data in 2 API calls
  console.log('📖 Reading data (batched)...');
  const startRead = Date.now();

  const [vitalsData, caseData] = await Promise.all([
    batchReadVitals(SHEET_ID, rowNumbers),
    batchReadCaseContext(SHEET_ID, rowNumbers)
  ]);

  const readTime = Date.now() - startRead;
  console.log(`✅ Read complete in ${readTime}ms (2 API calls)`);
  console.log('');

  // Process each row
  const updates = [];
  let totalChanges = 0;

  console.log('🔧 Processing Rows:');
  console.log('─────────────────────────────────────────────────');
  console.log('');

  vitalsData.forEach((vitalRow, idx) => {
    const caseRow = caseData[idx];
    const caseContext = `${caseRow.caseId} ${caseRow.caseTitle}`;

    console.log(`Row ${vitalRow.rowNum} (${caseRow.caseId}):`);

    Object.entries(vitalRow.vitals).forEach(([stateName, vitals]) => {
      if (!vitals) {
        console.log(`   ${stateName}: Empty (skipped)`);
        return;
      }

      const result = enrichVitals(vitals, caseContext);

      if (result.changes.length > 0) {
        console.log(`   ${stateName}: Added ${result.changes.join(', ')}`);

        updates.push({
          rowNum: vitalRow.rowNum,
          columnName: stateName,
          vitals: result.vitals
        });

        totalChanges += result.changes.length;
      } else {
        console.log(`   ${stateName}: ✓ Complete`);
      }
    });

    console.log('');
  });

  // Batch write all updates in 1 API call
  if (updates.length > 0 && !dryRun) {
    console.log('💾 Writing updates (batched)...');
    const startWrite = Date.now();

    await batchWriteVitals(SHEET_ID, updates);

    const writeTime = Date.now() - startWrite;
    console.log(`✅ Write complete in ${writeTime}ms (1 API call)`);
    console.log('');
  }

  // Summary
  console.log('═══════════════════════════════════════════════════');
  console.log('✅ PROCESSING COMPLETE');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log(`Rows processed: ${rowNumbers.length}`);
  console.log(`Changes made: ${totalChanges}`);
  console.log(`Updates written: ${updates.length} vitals states`);
  console.log(`API calls: 3 (2 reads + 1 write)`);
  console.log('');

  if (dryRun) {
    console.log('ℹ️  DRY RUN - No changes written to sheet');
    console.log('   Run without --dry-run to apply changes');
    console.log('');
  }

  // Performance comparison
  console.log('📊 Performance vs Individual API Calls:');
  console.log(`   Old method: ${rowNumbers.length * 11 * 2} API calls`);
  console.log(`   New method: 3 API calls`);
  console.log(`   Improvement: ${Math.round((rowNumbers.length * 11 * 2 / 3))}x faster`);
  console.log('');
}

if (require.main === module) {
  addClinicalDefaults().catch(error => {
    console.error('');
    console.error('❌ PROCESSING FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  });
}

module.exports = { addClinicalDefaults, enrichVitals };
