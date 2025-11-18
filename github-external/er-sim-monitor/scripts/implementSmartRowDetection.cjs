#!/usr/bin/env node

/**
 * Implement Smart Row Detection
 *
 * USER'S KEY INSIGHT:
 * "This is based on NOT counting down rows... but to see what google sheets actual row it is"
 *
 * Strategy:
 * - Look at which INPUT rows already have corresponding OUTPUT rows
 * - Find the gaps (missing row numbers)
 * - Queue the next 25 missing rows
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function implementSmartRowDetection() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  IMPLEMENT SMART ROW DETECTION');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oauth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oauth2Client });
  const response = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = response.data.files;

  const codeFile = files.find(f => f.name === 'Code');
  let source = codeFile.source;

  console.log('Replacing getNext25InputRows_ with smart gap detection...');
  console.log('');

  // Find and replace getNext25InputRows_
  const funcStart = source.indexOf('function getNext25InputRows_');
  if (funcStart === -1) {
    console.log('❌ getNext25InputRows_ not found');
    return;
  }

  const funcEnd = source.indexOf('\nfunction ', funcStart + 50);

  const newFunction = `function getNext25InputRows_(inputSheet, outputSheet) {
  Logger.log('🧠 Smart Row Detection: Finding next 25 available rows...');

  const inputLast = inputSheet.getLastRow();
  const outputLast = outputSheet.getLastRow();

  // Get all Case IDs from output sheet (column A, skipping 2 header rows)
  const processedIds = new Set();
  if (outputLast > 2) {
    const outputData = outputSheet.getRange(3, 1, outputLast - 2, 1).getValues();
    outputData.forEach(row => {
      if (row[0]) processedIds.add(String(row[0]).trim());
    });
  }

  Logger.log(\`📊 Output has \${processedIds.size} processed case IDs\`);

  // Find next 25 input rows that DON'T have matching output
  const availableRows = [];
  for (let r = 3; r <= inputLast && availableRows.length < 25; r++) {
    const inputId = String(inputSheet.getRange(r, 1).getValue() || '').trim();
    if (inputId && !processedIds.has(inputId)) {
      availableRows.push(r);
    }
  }

  if (availableRows.length === 0) {
    Logger.log('✅ All Input rows have been processed!');
  } else {
    Logger.log(\`✅ Found \${availableRows.length} available rows: \${availableRows.slice(0, 5).join(', ')}\${availableRows.length > 5 ? '...' : ''}\`);
  }

  return availableRows;
}`;

  source = source.substring(0, funcStart) + newFunction + source.substring(funcEnd);
  console.log('✅ Replaced with smart gap detection');
  console.log('');

  // Upload
  console.log('💾 Uploading code...');
  const updatedFiles = files.map(f => {
    if (f.name === 'Code') {
      return { ...f, source };
    }
    return f;
  });

  await script.projects.updateContent({
    scriptId: SCRIPT_ID,
    requestBody: { files: updatedFiles }
  });

  console.log('✅ Code updated!');
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('✅ SMART ROW DETECTION IMPLEMENTED!');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('How it works now:');
  console.log('1. Reads ALL Case IDs from output sheet');
  console.log('2. Checks each input row to see if its Case ID exists in output');
  console.log('3. Finds the ACTUAL missing rows (gaps included!)');
  console.log('4. Queues next 25 missing rows');
  console.log('');
  console.log('Example:');
  console.log('  Input rows: 3, 4, 5, 6, 7, 8...');
  console.log('  Output has: GI003, GI005, GI008');
  console.log('  Available:  4, 6, 7, 9, 10, 11... (fills gaps!)');
  console.log('');
  console.log('Test:');
  console.log('1. Refresh Google Sheets (F5)');
  console.log('2. Click "Launch Batch Engine"');
  console.log('3. Should process next 25 missing rows automatically!');
  console.log('');
}

if (require.main === module) {
  implementSmartRowDetection().catch(error => {
    console.error('');
    console.error('❌ FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  });
}

module.exports = { implementSmartRowDetection };
