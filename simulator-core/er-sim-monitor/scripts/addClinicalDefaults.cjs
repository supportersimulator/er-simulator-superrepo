#!/usr/bin/env node

/**
 * Add Clinical Defaults to Vitals JSON
 *
 * Intelligently fills missing vitals fields based on clinical context:
 * - RR derived from HR and clinical scenario
 * - Temp inferred from presentation (fever, hypothermia, normal)
 * - EtCO2 calculated from RR and acid-base status
 * - Validates and corrects waveform names
 *
 * Clinical Logic:
 * - High HR (>100) → likely tachypneic (RR 20-30)
 * - Low SpO2 (<90) → respiratory distress (RR 24-40)
 * - Fever patterns → Temp 38-40°C
 * - Sepsis/shock → RR >20, Temp may vary
 * - Cardiac arrest → RR 0, Temp not applicable
 *
 * Usage:
 *   node scripts/addClinicalDefaults.cjs [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const OAUTH_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const OAUTH_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

/**
 * Convert column number to Excel-style letter (1=A, 27=AA, etc.)
 */
function columnToLetter(column) {
  let temp, letter = '';
  while (column > 0) {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}

// Waveform name corrections (common AI mistakes → canonical names)
const WAVEFORM_CORRECTIONS = {
  'peapulseless_ecg': 'pea_ecg',
  'pea_pulseless_ecg': 'pea_ecg',
  'vfib_ecg': 'vfib_ecg', // Already correct
  'vtach_ecg': 'vtach_ecg', // Already correct
  'asystole_ecg': 'asystole_ecg', // Already correct
  'sinus_ecg': 'sinus_ecg', // Already correct
  'sinus_tachycardia_ecg': 'sinus_tachy_ecg',
  'sinus_bradycardia_ecg': 'sinus_brady_ecg',
  'atrial_fibrillation_ecg': 'afib_ecg',
  'afib_ecg': 'afib_ecg', // Already correct
};

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

/**
 * Calculate clinically appropriate RR based on HR, SpO2, and waveform
 */
function inferRR(vitals) {
  const hr = vitals.HR || 75;
  const spo2 = vitals.SpO2 || 98;
  const waveform = vitals.waveform || 'sinus_ecg';

  // Cardiac arrest rhythms
  if (['asystole_ecg', 'pea_ecg', 'vfib_ecg'].includes(waveform)) {
    return 0; // No spontaneous respiration
  }

  // Severe hypoxemia → respiratory distress
  if (spo2 < 85) {
    return Math.round(32 + Math.random() * 8); // 32-40 bpm (severe tachypnea)
  }

  // Moderate hypoxemia
  if (spo2 < 90) {
    return Math.round(24 + Math.random() * 6); // 24-30 bpm (moderate tachypnea)
  }

  // Tachycardia suggests compensatory response
  if (hr > 120) {
    return Math.round(20 + Math.random() * 6); // 20-26 bpm (mild tachypnea)
  }

  // Bradycardia (sedation, neurological)
  if (hr < 50) {
    return Math.round(10 + Math.random() * 4); // 10-14 bpm (slow but adequate)
  }

  // Normal sinus rhythm
  return Math.round(14 + Math.random() * 4); // 14-18 bpm (normal adult)
}

/**
 * Infer temperature based on clinical presentation
 */
function inferTemp(vitals, caseContext) {
  const hr = vitals.HR || 75;
  const rr = vitals.RR || 16;
  const waveform = vitals.waveform || 'sinus_ecg';

  // Check case title/context for fever keywords
  const feverKeywords = ['fever', 'sepsis', 'infection', 'pneumonia', 'UTI', 'cellulitis'];
  const hypothermiaKeywords = ['hypothermia', 'cold', 'exposure'];

  const contextLower = caseContext.toLowerCase();

  // Hypothermia
  if (hypothermiaKeywords.some(kw => contextLower.includes(kw))) {
    return Math.round((32 + Math.random() * 3) * 10) / 10; // 32.0-35.0°C
  }

  // Fever/infection
  if (feverKeywords.some(kw => contextLower.includes(kw))) {
    return Math.round((38.5 + Math.random() * 2) * 10) / 10; // 38.5-40.5°C
  }

  // Tachycardia + tachypnea suggests fever
  if (hr > 110 && rr > 20) {
    return Math.round((38 + Math.random() * 1.5) * 10) / 10; // 38.0-39.5°C
  }

  // Cardiac arrest - not applicable
  if (['asystole_ecg', 'vfib_ecg'].includes(waveform)) {
    return null; // Don't include Temp for arrest
  }

  // Normal
  return Math.round((36.5 + Math.random() * 1) * 10) / 10; // 36.5-37.5°C
}

/**
 * Calculate EtCO2 based on RR and clinical status
 */
function inferEtCO2(vitals) {
  const rr = vitals.RR || 16;
  const waveform = vitals.waveform || 'sinus_ecg';

  // Cardiac arrest
  if (['asystole_ecg', 'pea_ecg', 'vfib_ecg'].includes(waveform)) {
    return 0; // No CO2 production/detection
  }

  // Hyperventilation (low CO2)
  if (rr > 30) {
    return Math.round(25 + Math.random() * 5); // 25-30 mmHg (respiratory alkalosis)
  }

  // Tachypnea (mild hyperventilation)
  if (rr > 20) {
    return Math.round(30 + Math.random() * 5); // 30-35 mmHg (mild hypocapnia)
  }

  // Bradypnea (CO2 retention)
  if (rr < 10) {
    return Math.round(45 + Math.random() * 10); // 45-55 mmHg (respiratory acidosis)
  }

  // Normal
  return Math.round(35 + Math.random() * 6); // 35-41 mmHg (normal range)
}

/**
 * Fix waveform name if it doesn't match canonical list
 */
function correctWaveform(waveform) {
  if (!waveform) return 'sinus_ecg';

  // Direct correction from map
  if (WAVEFORM_CORRECTIONS[waveform]) {
    return WAVEFORM_CORRECTIONS[waveform];
  }

  // Already ends with _ecg and looks valid
  if (waveform.endsWith('_ecg')) {
    return waveform;
  }

  // Doesn't end with _ecg, try to fix
  if (!waveform.includes('_ecg')) {
    return `${waveform}_ecg`;
  }

  return waveform;
}

/**
 * Add missing fields to vitals object
 */
function enrichVitals(vitals, caseContext = '') {
  if (!vitals || typeof vitals !== 'object') {
    return vitals; // Can't enrich non-objects
  }

  const enriched = { ...vitals };
  const changes = [];

  // Fix waveform name
  if (enriched.waveform) {
    const corrected = correctWaveform(enriched.waveform);
    if (corrected !== enriched.waveform) {
      changes.push(`waveform: "${enriched.waveform}" → "${corrected}"`);
      enriched.waveform = corrected;
    }
  } else {
    enriched.waveform = 'sinus_ecg';
    changes.push('waveform: (missing) → "sinus_ecg"');
  }

  // Add missing RR
  if (!enriched.RR && enriched.RR !== 0) {
    enriched.RR = inferRR(enriched);
    changes.push(`RR: (missing) → ${enriched.RR}`);
  }

  // Add missing Temp
  if (!enriched.Temp && enriched.Temp !== null) {
    const temp = inferTemp(enriched, caseContext);
    if (temp !== null) {
      enriched.Temp = temp;
      changes.push(`Temp: (missing) → ${temp}°C`);
    }
  }

  // Add missing EtCO2
  if (!enriched.EtCO2 && enriched.EtCO2 !== 0) {
    enriched.EtCO2 = inferEtCO2(enriched);
    changes.push(`EtCO2: (missing) → ${enriched.EtCO2} mmHg`);
  }

  return { enriched, changes };
}

async function addClinicalDefaults() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('      ADD CLINICAL DEFAULTS TO VITALS JSON');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log(`Mode: ${dryRun ? '🔍 DRY RUN (no changes)' : '⚠️  LIVE MODE'}`);
  console.log('');

  const sheets = createSheetsClient();

  // Get headers (columns AV-BF are 48-58)
  const headerResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Master Scenario Convert!AV1:BF2'
  });

  const [tier1, tier2] = headerResponse.data.values;

  // Find vitals columns
  const vitalsColumns = {};
  tier2.forEach((header, idx) => {
    if (header && header.includes('Vitals') && !header.includes('Format') &&
        !header.includes('API') && !header.includes('Frequency')) {
      vitalsColumns[header] = 48 + idx; // AV is column 48, index 0 = column 48
    }
  });

  console.log('📊 Vitals Columns to Process:');
  Object.entries(vitalsColumns).forEach(([name, col]) => {
    console.log(`   ${name}: Column ${col}`);
  });
  console.log('');

  // Get all data rows and case titles
  const dataResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Master Scenario Convert!A3:BF12'
  });

  const rows = dataResponse.data.values || [];

  // Also get just the vitals columns data for easier access
  const vitalsDataResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Master Scenario Convert!AV3:BF12'
  });

  const vitalsRows = vitalsDataResponse.data.values || [];
  const updates = [];
  let totalChanges = 0;

  console.log('🔧 Processing Rows:');
  console.log('─────────────────────────────────────────────────');
  console.log('');

  rows.forEach((row, idx) => {
    const rowNum = idx + 3;
    const caseId = row[0] || `Row ${rowNum}`;
    const caseTitle = row[1] || ''; // Assuming column B is title
    const caseContext = `${caseId} ${caseTitle}`;
    const vitalsRow = vitalsRows[idx] || [];

    console.log(`Row ${rowNum} (${caseId}):`);

    let rowUpdated = false;

    // Process each vitals state
    Object.entries(vitalsColumns).forEach(([stateName, colIndex]) => {
      const colLetter = columnToLetter(colIndex); // Convert to Excel letter (BA, BB, etc.)
      const vitalsColumnIndex = colIndex - 48; // AV is column 48, so AV (48) → index 0
      const jsonStr = vitalsRow[vitalsColumnIndex];

      // Skip empty states
      if (!jsonStr || !jsonStr.trim() || jsonStr === 'N/A') {
        // Fix "N/A" to empty string
        if (jsonStr === 'N/A') {
          console.log(`   ${stateName}: Fixed "N/A" → empty string`);
          if (!dryRun) {
            updates.push({
              range: `Master Scenario Convert!${colLetter}${rowNum}`,
              values: [['']]
            });
          }
          totalChanges++;
          rowUpdated = true;
        }
        return;
      }

      try {
        const vitals = JSON.parse(jsonStr);
        const { enriched, changes } = enrichVitals(vitals, caseContext);

        if (changes.length > 0) {
          console.log(`   ${stateName}:`);
          changes.forEach(change => console.log(`      ✅ ${change}`));

          if (!dryRun) {
            updates.push({
              range: `Master Scenario Convert!${colLetter}${rowNum}`,
              values: [[JSON.stringify(enriched)]]
            });
          }

          totalChanges += changes.length;
          rowUpdated = true;
        }
      } catch (e) {
        console.log(`   ${stateName}: ⚠️  JSON parse error (skipped)`);
      }
    });

    if (!rowUpdated) {
      console.log('   ✅ No changes needed');
    }

    console.log('');
  });

  console.log('═══════════════════════════════════════════════════');
  console.log('                     SUMMARY');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log(`Total rows processed: ${rows.length}`);
  console.log(`Total changes: ${totalChanges}`);
  console.log(`Cells to update: ${updates.length}`);
  console.log('');

  if (!dryRun && updates.length > 0) {
    console.log('💾 Writing updates to Google Sheet...');

    // Batch update all cells
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        valueInputOption: 'RAW',
        data: updates
      }
    });

    console.log('✅ Updates complete!');
    console.log('');
  } else if (dryRun && updates.length > 0) {
    console.log('🔍 DRY RUN - No changes written');
    console.log('');
    console.log('To apply these changes, run:');
    console.log('   node scripts/addClinicalDefaults.cjs');
    console.log('');
  } else {
    console.log('✅ All vitals already complete!');
    console.log('');
  }

  console.log('📋 Clinical Logic Applied:');
  console.log('─────────────────────────────────────────────────');
  console.log('   RR: Derived from HR, SpO2, and waveform');
  console.log('   Temp: Inferred from case context and vitals');
  console.log('   EtCO2: Calculated from RR and clinical status');
  console.log('   Waveform: Auto-corrected to canonical names');
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
}

if (require.main === module) {
  addClinicalDefaults().catch(console.error);
}

module.exports = { addClinicalDefaults, inferRR, inferTemp, inferEtCO2, correctWaveform };
