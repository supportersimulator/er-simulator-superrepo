#!/usr/bin/env node

/**
 * Check Row Detection Logic
 *
 * User shows rows 3-11 are filled, row 12 is next available
 * But queue shows [22,23,24,25,26]
 *
 * This means getNext25InputRows_() is detecting wrong rows!
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function checkRowDetection() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  CHECK ROW DETECTION LOGIC');
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
  const source = response.data.files.find(f => f.name === 'Code').source;

  console.log('Finding getNext25InputRows_ function...');
  console.log('');

  const funcStart = source.indexOf('function getNext25InputRows_');
  const funcEnd = source.indexOf('\nfunction ', funcStart + 50);
  const funcBody = source.substring(funcStart, funcEnd);

  console.log('Current getNext25InputRows_ function:');
  console.log('═══════════════════════════════════════════════════');
  console.log(funcBody);
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  // Analyze the logic
  console.log('Analysis:');
  console.log('');

  if (funcBody.includes('outputDataRows')) {
    console.log('⚠️  Uses outputDataRows calculation');
    console.log('   This calculates NEXT row based on count, not gaps!');
    console.log('');
    console.log('Problem:');
    console.log('  outputLast = 11 (last row in output)');
    console.log('  outputDataRows = 11 - 2 = 9');
    console.log('  nextInputRow = 3 + 9 = 12 ✅ (should be correct!)');
    console.log('');
    console.log('But why is it returning [22,23,24,25,26]?');
    console.log('');
  }

  if (funcBody.includes('processedIds')) {
    console.log('✅ Uses processedIds.has() to check gaps');
    console.log('   This compares Case IDs to find missing rows');
    console.log('');
  }

  console.log('');
  console.log('User reports:');
  console.log('  - Output has rows 3-11 filled (9 rows)');
  console.log('  - Row 12 should be next available');
  console.log('  - But queue shows [22,23,24,25,26]');
  console.log('');
  console.log('Hypothesis:');
  console.log('  getNext25InputRows_() might be looking at wrong sheet!');
  console.log('  OR outputSheet parameter is pointing to wrong sheet');
  console.log('');
}

if (require.main === module) {
  checkRowDetection().catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}

module.exports = { checkRowDetection };
