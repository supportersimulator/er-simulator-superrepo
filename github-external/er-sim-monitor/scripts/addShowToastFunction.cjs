#!/usr/bin/env node

/**
 * Add showToast() Function to Apps Script
 *
 * Error: "showToast is not defined"
 * The function was referenced but never added to the code!
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function addShowToastFunction() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  ADD showToast() FUNCTION');
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

  console.log('Checking if showToast() function exists...');
  console.log('');

  const hasShowToast = source.includes('function showToast(');

  if (hasShowToast) {
    console.log('✅ showToast() already exists!');
    console.log('');
    console.log('But it might not be working correctly...');
    console.log('Let me check the implementation...');
    console.log('');

    const funcStart = source.indexOf('function showToast(');
    const funcEnd = source.indexOf('\n}', funcStart) + 2;
    const existingFunc = source.substring(funcStart, funcEnd);

    console.log('Current showToast() function:');
    console.log('─────────────────────────────────────────────────');
    console.log(existingFunc);
    console.log('─────────────────────────────────────────────────');
    console.log('');

    // Check if it tries to use UI (which might fail)
    if (existingFunc.includes('getSafeUi_()')) {
      console.log('⚠️  Function tries to use UI first (might fail in batch)');
      console.log('Replacing with simpler version...');
      console.log('');

      const betterFunc = `function showToast(message, duration) {
  try {
    SpreadsheetApp.getActiveSpreadsheet().toast(message, '✅ Success', duration || 3);
  } catch (e) {
    Logger.log('Toast: ' + message);
  }
}
`;

      source = source.substring(0, funcStart) + betterFunc + source.substring(funcEnd);
      console.log('✅ Replaced with simpler, more reliable version');
    } else {
      console.log('✅ Function looks good, might be a different issue');
      return;
    }

  } else {
    console.log('❌ showToast() function NOT found!');
    console.log('Adding it now...');
    console.log('');

    const showToastFunc = `
/**
 * Show a temporary toast notification
 * Auto-closes after specified duration (default 3 seconds)
 */
function showToast(message, duration) {
  try {
    SpreadsheetApp.getActiveSpreadsheet().toast(message, '✅ Success', duration || 3);
  } catch (e) {
    Logger.log('Toast: ' + message);
  }
}
`;

    // Add before the last closing brace
    const lastBrace = source.lastIndexOf('}');
    source = source.substring(0, lastBrace) + showToastFunc + '\n' + source.substring(lastBrace);

    console.log('✅ Added showToast() function');
  }

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
  console.log('✅ showToast() FUNCTION READY!');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('Function added/fixed:');
  console.log('  - showToast(message, duration)');
  console.log('  - Uses SpreadsheetApp.toast() API');
  console.log('  - Auto-closes after 3 seconds');
  console.log('  - Fallback to Logger if toast fails');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Row 18 was skipped (error occurred)');
  console.log('  2. Current batch will continue from Row 19');
  console.log('  3. After batch completes, run specific mode for Row 18:');
  console.log('     - Select "Specific rows"');
  console.log('     - Enter "18"');
  console.log('     - Click Launch');
  console.log('');
  console.log('OR:');
  console.log('  1. Stop current batch');
  console.log('  2. Refresh Google Sheets (F5)');
  console.log('  3. Use "All remaining rows" to process 18-41');
  console.log('');
}

if (require.main === module) {
  addShowToastFunction().catch(error => {
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

module.exports = { addShowToastFunction };
