#!/usr/bin/env node

/**
 * Check Which Sheet Is Being Used
 *
 * User says row 12 should be next available in "Master Scenario Convert"
 * But detection is finding rows 22-26 as available
 *
 * Hypothesis: getNext25InputRows_() might be comparing against wrong output sheet
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function checkWhichSheet() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  CHECK WHICH SHEETS ARE BEING COMPARED');
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

  console.log('Adding sheet name logging to getNext25InputRows_...');
  console.log('');

  const funcStart = source.indexOf('function getNext25InputRows_');
  const funcBody = source.substring(funcStart, source.indexOf('\nfunction ', funcStart + 50));

  // Check if we already log sheet names
  if (funcBody.includes('inputSheet.getName()')) {
    console.log('✅ Already logs sheet names');
  } else {
    console.log('Adding sheet name logging...');

    // Find the start of the function body
    const bodyStart = source.indexOf('{', funcStart) + 1;
    const insertPoint = source.indexOf('\n', bodyStart) + 1;

    const newLogging = `  appendLogSafe('🔍 Comparing Input sheet: "' + inputSheet.getName() + '" vs Output sheet: "' + outputSheet.getName() + '"');\n`;

    source = source.substring(0, insertPoint) + newLogging + source.substring(insertPoint);
    console.log('✅ Added sheet name logging');
  }

  // Also add logging to show first few Case IDs from each sheet
  const outputDataIdx = source.indexOf('const outputData = outputSheet.getRange', funcStart);
  if (outputDataIdx !== -1) {
    const afterForEach = source.indexOf(');', source.indexOf('forEach', outputDataIdx)) + 2;

    if (!source.substring(outputDataIdx, afterForEach + 200).includes('First 5 Case IDs in output')) {
      const caseIdLogging = `\n  const outputCaseIds = Array.from(processedIds).slice(0, 10);\n  appendLogSafe('🔍 First 10 Case IDs in output: ' + outputCaseIds.join(', '));\n`;

      source = source.substring(0, afterForEach) + caseIdLogging + source.substring(afterForEach);
      console.log('✅ Added Case ID logging');
    }
  }

  // Add logging to show Case IDs from Input rows 12-21
  const forLoopStart = source.indexOf('for (let r = 3; r <= inputLast', funcStart);
  if (forLoopStart !== -1) {
    const forLoopBody = source.indexOf('{', forLoopStart) + 1;

    if (!source.substring(forLoopStart, forLoopStart + 500).includes('Checking Input row')) {
      const rowLogging = `\n    if (r >= 12 && r <= 21) {\n      appendLogSafe('🔍 Checking Input row ' + r + ': Case ID = "' + inputId + '", in output? ' + processedIds.has(inputId));\n    }\n`;

      source = source.substring(0, forLoopBody) + rowLogging + source.substring(forLoopBody);
      console.log('✅ Added Input row 12-21 logging');
    }
  }

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
  console.log('✅ SHEET COMPARISON LOGGING ADDED!');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('Next steps:');
  console.log('1. Refresh Google Sheets (F5)');
  console.log('2. Click "Launch Batch Engine"');
  console.log('3. Check Live Logs for:');
  console.log('');
  console.log('Expected to see:');
  console.log('  🔍 Comparing Input sheet: "..." vs Output sheet: "..."');
  console.log('  🔍 First 10 Case IDs in output: ...');
  console.log('  🔍 Checking Input row 12: Case ID = "...", in output? true/false');
  console.log('  🔍 Checking Input row 13: Case ID = "...", in output? true/false');
  console.log('  ... (rows 12-21)');
  console.log('');
  console.log('This will show us:');
  console.log('1. Which sheets are being compared (might be wrong sheet!)');
  console.log('2. What Case IDs exist in the output');
  console.log('3. Why rows 12-21 are being skipped');
  console.log('');
}

if (require.main === module) {
  checkWhichSheet().catch(error => {
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

module.exports = { checkWhichSheet };
