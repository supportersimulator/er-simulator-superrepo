#!/usr/bin/env node

/**
 * Fix Comparison Column
 *
 * USER'S INSIGHT:
 * "it may not necessarily be case ID but some kind of ID that i build with
 *  chatgpt to ensure no duplicates"
 *
 * The code currently compares Column A (Case_ID)
 * But user has a different unique identifier column
 *
 * Need to find out which column to use for comparison
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function fixComparisonColumn(columnLetter) {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  CHANGE COMPARISON COLUMN TO ${columnLetter}`);
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  // Convert column letter to number (A=1, B=2, C=3, etc.)
  const columnNumber = columnLetter.toUpperCase().charCodeAt(0) - 64;
  console.log(`Column ${columnLetter} = Column number ${columnNumber}`);
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

  console.log('Updating getNext25InputRows_ to use correct column...');
  console.log('');

  // Find and replace the column reference in outputSheet.getRange
  const funcStart = source.indexOf('function getNext25InputRows_');
  const funcEnd = source.indexOf('\nfunction ', funcStart + 50);
  let funcBody = source.substring(funcStart, funcEnd);

  // Replace: outputSheet.getRange(3, 1, outputLast - 2, 1)
  //    with: outputSheet.getRange(3, X, outputLast - 2, 1)
  const oldOutputRange = 'outputSheet.getRange(3, 1, outputLast - 2, 1)';
  const newOutputRange = `outputSheet.getRange(3, ${columnNumber}, outputLast - 2, 1)`;

  if (funcBody.includes(oldOutputRange)) {
    funcBody = funcBody.replace(oldOutputRange, newOutputRange);
    console.log(`✅ Changed output range from column 1 to column ${columnNumber}`);
  }

  // Replace: inputSheet.getRange(r, 1)
  //    with: inputSheet.getRange(r, X)
  const oldInputRange = 'inputSheet.getRange(r, 1)';
  const newInputRange = `inputSheet.getRange(r, ${columnNumber})`;

  if (funcBody.includes(oldInputRange)) {
    funcBody = funcBody.replace(oldInputRange, newInputRange);
    console.log(`✅ Changed input range from column 1 to column ${columnNumber}`);
  }

  // Update the source
  source = source.substring(0, funcStart) + funcBody + source.substring(funcEnd);

  console.log('');
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
  console.log(`✅ NOW COMPARING COLUMN ${columnLetter}!`);
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('The system will now compare the unique ID in column ' + columnLetter);
  console.log('instead of Case_ID in column A');
  console.log('');
  console.log('Next steps:');
  console.log('1. Refresh Google Sheets (F5)');
  console.log('2. Click "Launch Batch Engine"');
  console.log('3. Should now detect row 12 as available!');
  console.log('');
}

if (require.main === module) {
  const columnLetter = process.argv[2];

  if (!columnLetter) {
    console.error('');
    console.error('Usage: node fixComparisonColumn.cjs <COLUMN_LETTER>');
    console.error('');
    console.error('Example: node fixComparisonColumn.cjs B');
    console.error('         (to compare column B instead of column A)');
    console.error('');
    console.error('Please tell me which column contains the unique ID!');
    console.error('');
    process.exit(1);
  }

  fixComparisonColumn(columnLetter).catch(error => {
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

module.exports = { fixComparisonColumn };
