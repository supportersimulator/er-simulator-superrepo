#!/usr/bin/env node

/**
 * Fix alert() to showToast() for Auto-Close Notifications
 *
 * The batch is stuck showing "Row 15: Created. (~$2.36)" popup
 * that requires clicking OK. Need to replace with auto-closing toast.
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function fixAlertToToast() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  FIX ALERT TO TOAST - AUTO-CLOSE NOTIFICATIONS');
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

  console.log('Step 1: Finding runSingleCaseFromSidebar()...');
  console.log('');

  const funcStart = source.indexOf('function runSingleCaseFromSidebar(');
  if (funcStart === -1) {
    console.log('❌ Could not find runSingleCaseFromSidebar');
    return;
  }

  let braceCount = 0;
  let pos = source.indexOf('{', funcStart);
  let funcEnd = pos;

  do {
    if (source[funcEnd] === '{') braceCount++;
    if (source[funcEnd] === '}') braceCount--;
    funcEnd++;
  } while (braceCount > 0 && funcEnd < source.length);

  const oldFunc = source.substring(funcStart, funcEnd);

  console.log('Current function uses ui.alert()');
  console.log('');

  // Replace with version that uses showToast
  const newFunc = `function runSingleCaseFromSidebar(inputSheetName, outputSheetName, row) {
  const ss = SpreadsheetApp.getActive();

  // Define the input and output sheets first
  const inSheet = ss.getSheetByName(inputSheetName);
  let outSheet = ss.getSheetByName(outputSheetName);

  // ⭐ Dynamic output sheet detection
  const settingsSheet = ss.getSheetByName('Settings');
  const settingsOut = settingsSheet ? settingsSheet.getRange('A1').getValue() : '';
  if (settingsOut) outSheet = ss.getSheetByName(settingsOut) || outSheet;

  // Validate
  if (!inSheet || !outSheet) throw new Error('❌ Could not find selected sheets.');

  cacheHeaders(outSheet);
  const result = processOneInputRow_(inSheet, outSheet, row, /*batchMode*/ false);

  // Show auto-closing toast notification (3 seconds)
  if (result.message) {
    showToast(result.message, 3);
  }

  return result.message;
}
`;

  source = source.substring(0, funcStart) + newFunc + source.substring(funcEnd);

  console.log('✅ Replaced ui.alert() with showToast()');
  console.log('');

  console.log('💾 Uploading code...');
  console.log('');

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
  console.log('✅ TOAST NOTIFICATIONS NOW AUTO-CLOSE!');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('Changes:');
  console.log('  - runSingleCaseFromSidebar() now uses showToast()');
  console.log('  - Toast appears for 3 seconds');
  console.log('  - Auto-closes without clicking OK');
  console.log('  - Batch continues without interruption');
  console.log('');
  console.log('Next steps:');
  console.log('  1. The current batch is stuck on Row 15');
  console.log('  2. Click OK on that popup to continue');
  console.log('  3. Future rows will auto-close ✅');
  console.log('');
  console.log('OR:');
  console.log('  1. Click Stop to cancel current batch');
  console.log('  2. Refresh Google Sheets (F5)');
  console.log('  3. Re-launch batch - will start at Row 16');
  console.log('  4. All future toasts will auto-close ✅');
  console.log('');
}

if (require.main === module) {
  fixAlertToToast().catch(error => {
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

module.exports = { fixAlertToToast };
