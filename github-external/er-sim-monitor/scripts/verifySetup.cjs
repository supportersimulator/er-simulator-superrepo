#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

async function verifySetup() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oauth2Client.setCredentials(token);

  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

  console.log('🔍 PRE-FLIGHT VERIFICATION');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  // 1. Check Input sheet current state
  console.log('1️⃣ INPUT SHEET STATUS:');
  const inputResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Input!A1:D10'
  });

  const inputRows = inputResponse.data.values || [];
  console.log(`   Rows in Input sheet: ${inputRows.length}`);
  console.log(`   Headers: ${inputRows[0]?.join(' | ') || '(no headers)'}`);
  console.log(`   Data rows (excluding header): ${inputRows.length - 1}`);
  console.log('');

  // Check if any actual data in columns B and C
  const hasData = inputRows.slice(1).some(row =>
    (row[1] && row[1].trim()) || (row[2] && row[2].trim())
  );
  console.log(`   Has data in columns B/C: ${hasData ? 'YES ✅' : 'NO ❌'}`);
  console.log('');

  // 2. Check Master Scenario Convert current state
  console.log('2️⃣ MASTER SCENARIO CONVERT STATUS:');
  const masterResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Master Scenario Convert!A1:K10'
  });

  const masterRows = masterResponse.data.values || [];
  console.log(`   Total rows: ${masterRows.length}`);
  console.log(`   Tier 1 headers: ${masterRows[0]?.slice(0, 5).join(' | ')}`);
  console.log(`   Tier 2 headers: ${masterRows[1]?.slice(0, 5).join(' | ')}`);
  console.log(`   Data rows (after 2-tier headers): ${Math.max(0, masterRows.length - 2)}`);
  console.log('');

  // 3. Check emsim_final source
  console.log('3️⃣ EMSIM_FINAL SOURCE:');
  const emsimResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: '1Sx_6R3Dr1fbaV3u8y9tgtkc0ir7GV2X-zI9ZJiDwRXA',
    range: 'emsim_final!A1:B5'
  });

  const emsimRows = emsimResponse.data.values || [];
  console.log(`   Total rows available: ${emsimRows.length - 1} (excluding header)`);
  console.log(`   Columns: ${emsimRows[0]?.join(' | ')}`);
  console.log('');

  // 4. Check processing script
  console.log('4️⃣ PROCESSING SCRIPT CHECK:');
  const scriptExists = fs.existsSync(path.join(__dirname, 'runBatchViaHTTP.cjs'));
  console.log(`   runBatchViaHTTP.cjs exists: ${scriptExists ? 'YES ✅' : 'NO ❌'}`);
  console.log('');

  // 5. Check .env configuration
  console.log('5️⃣ ENVIRONMENT CONFIGURATION:');
  console.log(`   GOOGLE_SHEET_ID: ${SHEET_ID ? 'SET ✅' : 'MISSING ❌'}`);
  console.log(`   WEB_APP_URL: ${process.env.WEB_APP_URL ? 'SET ✅' : 'MISSING ❌'}`);
  console.log('');

  console.log('═══════════════════════════════════════════════════');
  console.log('');

  // Summary and recommendations
  const issues = [];
  if (!hasData) issues.push('Input sheet is empty');
  if (!SHEET_ID) issues.push('GOOGLE_SHEET_ID missing');
  if (!process.env.WEB_APP_URL) issues.push('WEB_APP_URL missing');
  if (!scriptExists) issues.push('runBatchViaHTTP.cjs missing');

  if (issues.length > 0) {
    console.log('⚠️  ISSUES FOUND:');
    issues.forEach(issue => console.log(`   - ${issue}`));
    console.log('');

    if (!hasData) {
      console.log('📝 NEXT STEP: Import data first');
      console.log('   node scripts/importEmsimFinal.cjs --limit=10 --execute');
      console.log('');
    }
  } else {
    console.log('✅ ALL CHECKS PASSED - READY TO TEST');
    console.log('');
    console.log('📝 RECOMMENDED TEST COMMAND:');
    console.log('   npm run run-batch-http -- "2,3,4"');
    console.log('');
    console.log('   This will process 3 rows from Input sheet');
    console.log('   and write results to Master Scenario Convert');
    console.log('');
  }
}

if (require.main === module) {
  verifySetup().catch(error => {
    console.error('');
    console.error('❌ VERIFICATION FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(error.message);
    process.exit(1);
  });
}

module.exports = { verifySetup };
