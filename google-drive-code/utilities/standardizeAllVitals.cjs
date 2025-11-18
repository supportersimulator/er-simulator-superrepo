#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const SHEET_NAME = 'Master Scenario Convert';

function standardizeVitals(vitalsObj) {
  // Create standardized vitals object
  const standardized = {};

  // Convert keys to lowercase and standardize
  Object.keys(vitalsObj).forEach(key => {
    const lowerKey = key.toLowerCase();
    standardized[lowerKey] = vitalsObj[key];
  });

  // Parse BP string into object if needed
  if (typeof standardized.bp === 'string') {
    const bpMatch = standardized.bp.match(/(\d+)\/(\d+)/);
    if (bpMatch) {
      standardized.bp = {
        sys: parseInt(bpMatch[1]),
        dia: parseInt(bpMatch[2])
      };
    }
  }

  // Fix waveform mappings
  const waveformMappings = {
    'undefined': 'sinus_ecg',        // Default to sinus
    'sinus_tachycardia': 'sinus_ecg', // Sinus tach is just fast sinus
    'normal_ecg': 'nsr_ecg',          // Normal → NSR
    'v-tach_ecg': 'vtach_ecg'         // Fix hyphen
  };

  if (!standardized.waveform || waveformMappings[standardized.waveform]) {
    standardized.waveform = waveformMappings[standardized.waveform] || waveformMappings['undefined'];
  }

  // Add lastUpdated if missing
  if (!standardized.lastupdated) {
    standardized.lastupdated = new Date().toISOString();
  }

  return standardized;
}

async function standardizeAll() {
  console.log('\n🔄 STANDARDIZING ALL VITALS (189 rows)\n');
  console.log('This will:');
  console.log('  1. Convert vitals keys to lowercase');
  console.log('  2. Parse BP strings into objects');
  console.log('  3. Fix invalid waveform names');
  console.log('  4. Add lastUpdated timestamps\n');
  console.log('━'.repeat(70) + '\n');

  // Auth
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const {client_id, client_secret, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const tokenPath = path.join(__dirname, '../config/token.json');
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  oAuth2Client.setCredentials(token);

  const sheets = google.sheets({version: 'v4', auth: oAuth2Client});

  // Get all data
  const dataResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SHEET_NAME}!3:200`
  });

  const rows = dataResponse.data.values || [];
  const vitalsIdx = 55; // Column 56 (0-indexed)
  const caseIdIdx = 0;   // Column 1

  console.log(`📊 Processing ${rows.length} rows\n`);

  const updates = [];
  let converted = 0;
  let waveformsFix = 0;

  rows.forEach((row, i) => {
    const rowNum = i + 3;
    const vitals = row[vitalsIdx];
    const caseId = row[caseIdIdx];

    if (!vitals) {
      console.log(`⚠️  Row ${rowNum} (${caseId}): No vitals, skipping`);
      return;
    }

    try {
      const original = JSON.parse(vitals);
      const standardized = standardizeVitals(original);

      // Check if anything changed
      const originalStr = JSON.stringify(original, Object.keys(original).sort());
      const standardizedStr = JSON.stringify(standardized, Object.keys(standardized).sort());

      if (originalStr !== standardizedStr) {
        // Track what changed
        const changes = [];
        if (typeof original.BP === 'string') changes.push('BP format');
        if (original.waveform !== standardized.waveform) {
          changes.push(`waveform (${original.waveform} → ${standardized.waveform})`);
          waveformsFix++;
        }
        if (Object.keys(original).some(k => k !== k.toLowerCase())) changes.push('case normalization');

        console.log(`🔄 Row ${rowNum} (${caseId}): ${changes.join(', ')}`);

        updates.push({
          range: `${SHEET_NAME}!${String.fromCharCode(65 + vitalsIdx)}${rowNum}`,
          values: [[JSON.stringify(standardized)]]
        });

        converted++;
      }
    } catch (e) {
      console.log(`❌ Row ${rowNum} (${caseId}): Invalid JSON - ${e.message}`);
    }
  });

  console.log('\n' + '━'.repeat(70));
  console.log(`\n📊 Summary:\n`);
  console.log(`   Total rows processed: ${rows.length}`);
  console.log(`   Rows needing updates: ${converted}`);
  console.log(`   Waveforms fixed: ${waveformsFix}`);
  console.log(`   Rows already standard: ${rows.length - converted}\n`);

  if (updates.length > 0) {
    console.log('💾 Writing updates to Google Sheets...\n');

    // Batch update in chunks of 100
    const chunkSize = 100;
    for (let i = 0; i < updates.length; i += chunkSize) {
      const chunk = updates.slice(i, i + chunkSize);

      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        requestBody: {
          valueInputOption: 'RAW',
          data: chunk
        }
      });

      console.log(`   Updated rows ${i + 1}-${Math.min(i + chunkSize, updates.length)} of ${updates.length}`);
    }

    console.log('\n✅ All updates complete!\n');
  } else {
    console.log('✅ All rows already standardized!\n');
  }

  console.log('━'.repeat(70) + '\n');

  return {converted, waveformsFix, total: rows.length};
}

standardizeAll().catch(err => {
  console.error('❌ Error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
