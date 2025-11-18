#!/usr/bin/env node

/**
 * Validate Vitals JSON Format
 *
 * Checks all processed rows in Master sheet for Monitor compatibility
 * - Waveform naming (must end in _ecg)
 * - Required fields (HR, BP, SpO2, RR, waveform)
 * - Field naming (case-sensitive)
 * - BP format (object vs string)
 * - Missing EtCO2 field
 *
 * Usage:
 *   node scripts/validateVitalsJSON.cjs
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const OAUTH_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const OAUTH_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

// Valid waveform names from canonicalWaveformList.js
const VALID_WAVEFORMS = [
  'sinus_ecg', 'sinus_brady_ecg', 'sinus_tachy_ecg',
  'afib_ecg', 'aflutter_ecg', 'mat_ecg', 'svt_ecg', 'pac_ecg',
  'junctional_ecg',
  'vtach_ecg', 'vfib_ecg', 'torsades_ecg', 'bigeminy_ecg', 'trigeminy_ecg',
  'idioventricular_ecg', 'aivr_ecg',
  'avblock1_ecg', 'avblock2_type1_ecg', 'avblock2_type2_ecg', 'avblock3_ecg',
  'lbbb_ecg', 'rbbb_ecg',
  'wpw_ecg',
  'vpaced_ecg', 'dual_paced_ecg',
  'hyperkalemia_ecg', 'hypokalemia_ecg',
  'hypothermia_ecg',
  'stemi_ecg', 'stemi_inferior_ecg', 'nstemi_ecg', 'lbbb_sgarbossa_ecg',
  'pericarditis_ecg', 'pulmonary_embolism_ecg', 'early_repolarization_ecg',
  'electrical_alternans_ecg',
  'asystole_ecg', 'pea_ecg',
  'artifact_ecg'
];

function loadToken() {
  const tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  return tokenData;
}

function createSheetsClient() {
  const oauth2Client = new google.auth.OAuth2(
    OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  const token = loadToken();
  oauth2Client.setCredentials(token);
  return google.sheets({ version: 'v4', auth: oauth2Client });
}

function validateVitalsObject(vitals, stateName, rowNum) {
  const issues = [];

  // Check if vitals is valid JSON object
  if (!vitals || typeof vitals !== 'object') {
    issues.push(`❌ ${stateName}: Not a valid JSON object`);
    return issues;
  }

  // Required fields
  const requiredFields = ['HR', 'BP', 'SpO2', 'RR', 'waveform'];
  requiredFields.forEach(field => {
    if (!(field in vitals)) {
      issues.push(`❌ ${stateName}: Missing required field "${field}"`);
    }
  });

  // Check waveform naming
  if (vitals.waveform) {
    if (!vitals.waveform.endsWith('_ecg')) {
      issues.push(`❌ ${stateName}: Waveform "${vitals.waveform}" doesn't end with "_ecg"`);
    }
    if (!VALID_WAVEFORMS.includes(vitals.waveform)) {
      issues.push(`⚠️  ${stateName}: Waveform "${vitals.waveform}" not in canonical list`);
    }
  }

  // Check BP format (should be string "sys/dia" for compatibility)
  if (vitals.BP) {
    if (typeof vitals.BP === 'object') {
      issues.push(`⚠️  ${stateName}: BP is object {sys, dia}, should be string "sys/dia"`);
    } else if (typeof vitals.BP === 'string') {
      if (!/^\d+\/\d+$/.test(vitals.BP)) {
        issues.push(`❌ ${stateName}: BP format invalid, should be "120/80"`);
      }
    }
  }

  // Check for EtCO2 (recommended but not required)
  if (!vitals.EtCO2 && !vitals.etco2) {
    issues.push(`ℹ️  ${stateName}: Missing EtCO2 field (recommended)`);
  }

  // Check for Temp (recommended)
  if (!vitals.Temp && !vitals.temp) {
    issues.push(`ℹ️  ${stateName}: Missing Temp field (recommended)`);
  }

  return issues;
}

async function validateAllRows() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('          VITALS JSON VALIDATION REPORT');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const sheets = createSheetsClient();

  // Get headers to find vitals columns
  const headerResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Master Scenario Convert!AV1:BF2'
  });

  const [tier1, tier2] = headerResponse.data.values;

  // Find vitals columns (53-58 based on earlier inspection)
  const vitalsColumns = {};
  tier2.forEach((header, idx) => {
    if (header && header.includes('Vitals')) {
      const fullHeader = `${tier1[idx]}:${header}`;
      vitalsColumns[header] = 48 + idx; // AV is column 48
    }
  });

  console.log('📊 Vitals Columns Found:');
  Object.entries(vitalsColumns).forEach(([name, col]) => {
    console.log(`   ${name}: Column ${col}`);
  });
  console.log('');

  // Get all data rows (rows 3-12, assuming 10 scenarios)
  const dataResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Master Scenario Convert!A3:BF12'
  });

  const rows = dataResponse.data.values || [];
  let totalIssues = 0;
  const criticalIssues = [];

  console.log('🔍 Validating Rows:');
  console.log('─────────────────────────────────────────────────');
  console.log('');

  rows.forEach((row, idx) => {
    const rowNum = idx + 3;
    const caseId = row[0] || `Row ${rowNum}`;
    const rowIssues = [];

    console.log(`Row ${rowNum} (${caseId}):`);

    // Check each vitals state
    ['Initial_Vitals', 'State1_Vitals', 'State2_Vitals', 'State3_Vitals', 'State4_Vitals', 'State5_Vitals'].forEach(stateName => {
      const colIndex = vitalsColumns[stateName];
      if (!colIndex) return;

      const jsonStr = row[colIndex - 1]; // Convert to 0-based index
      if (!jsonStr || !jsonStr.trim()) {
        // Empty is OK for State4 and State5
        if (!stateName.includes('State4') && !stateName.includes('State5')) {
          console.log(`   ℹ️  ${stateName}: Empty`);
        }
        return;
      }

      try {
        const vitals = JSON.parse(jsonStr);
        const issues = validateVitalsObject(vitals, stateName, rowNum);

        if (issues.length > 0) {
          issues.forEach(issue => {
            console.log(`   ${issue}`);
            rowIssues.push(issue);

            // Track critical issues
            if (issue.startsWith('❌')) {
              criticalIssues.push(`Row ${rowNum} (${caseId}): ${issue}`);
            }
          });
        } else {
          console.log(`   ✅ ${stateName}: Valid`);
        }
      } catch (e) {
        console.log(`   ❌ ${stateName}: JSON parse error - ${e.message}`);
        rowIssues.push(`JSON parse error in ${stateName}`);
        criticalIssues.push(`Row ${rowNum} (${caseId}): ${stateName} - JSON parse error`);
      }
    });

    if (rowIssues.length === 0) {
      console.log('   ✅ All vitals valid');
    }

    totalIssues += rowIssues.length;
    console.log('');
  });

  console.log('═══════════════════════════════════════════════════');
  console.log('                     SUMMARY');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log(`Total rows checked: ${rows.length}`);
  console.log(`Total issues found: ${totalIssues}`);
  console.log(`Critical issues: ${criticalIssues.length}`);
  console.log('');

  if (criticalIssues.length > 0) {
    console.log('🚨 CRITICAL ISSUES (Must Fix):');
    console.log('─────────────────────────────────────────────────');
    criticalIssues.forEach(issue => console.log(`   ${issue}`));
    console.log('');
  }

  console.log('📋 MONITOR COMPATIBILITY REQUIREMENTS:');
  console.log('─────────────────────────────────────────────────');
  console.log('   ✅ Required fields: HR, BP, SpO2, RR, waveform');
  console.log('   ✅ Waveform naming: Must end with "_ecg"');
  console.log('   ✅ BP format: String "120/80" (object also supported)');
  console.log('   ⚠️  Recommended: EtCO2, Temp');
  console.log('   ⚠️  Field names: Case-sensitive (HR not hr)');
  console.log('');

  console.log('═══════════════════════════════════════════════════');
  console.log('');
}

if (require.main === module) {
  validateAllRows().catch(console.error);
}

module.exports = { validateAllRows };
