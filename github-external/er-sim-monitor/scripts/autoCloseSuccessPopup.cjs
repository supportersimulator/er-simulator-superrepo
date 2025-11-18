#!/usr/bin/env node

/**
 * Auto-Close Success Popup After 3 Seconds
 *
 * The "Row 12: Created. ($2.35)" popup should auto-close
 * instead of requiring user to click OK
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function autoCloseSuccessPopup() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  AUTO-CLOSE SUCCESS POPUP');
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

  console.log('Finding where success popup is shown...');
  console.log('');

  // Find the loopStep function that shows the popup
  const loopStepIdx = source.indexOf('function loopStep()');
  if (loopStepIdx === -1) {
    console.log('❌ Could not find loopStep function');
    return;
  }

  const loopStepEnd = source.indexOf('\n    }', loopStepIdx) + 6;
  const loopStepFunc = source.substring(loopStepIdx, loopStepEnd);

  console.log('Checking if there is a toast/notification function...');
  console.log('');

  // Look for toast or showToast functions
  if (source.includes('function showToast(') || source.includes('function toast(')) {
    console.log('✅ Found toast function - will use that');

    // Replace any alert() calls with toast() calls
    const updatedLoopStep = loopStepFunc.replace(/alert\(/g, 'showToast(');
    source = source.substring(0, loopStepIdx) + updatedLoopStep + source.substring(loopStepEnd);

    console.log('✅ Replaced alert() with showToast()');
  } else {
    console.log('⚠️  No toast function found, creating one...');

    // Add a toast function
    const toastFunc = `
/**
 * Show a temporary toast notification
 * Auto-closes after 3 seconds
 */
function showToast(message, duration) {
  const ui = getSafeUi_();
  if (!ui) {
    Logger.log(message);
    return;
  }

  try {
    SpreadsheetApp.getActiveSpreadsheet().toast(message, '✅ Success', duration || 3);
  } catch (e) {
    // Fallback to alert if toast not available
    ui.alert(message);
  }
}
`;

    // Add the toast function before the last closing brace
    const lastBrace = source.lastIndexOf('}');
    source = source.substring(0, lastBrace) + toastFunc + source.substring(lastBrace);

    console.log('✅ Added showToast() function');

    // Replace alert() in loopStep with showToast()
    const updatedLoopStep = loopStepFunc.replace(/alert\(/g, 'showToast(');
    const newLoopStepIdx = source.indexOf('function loopStep()');
    const newLoopStepEnd = source.indexOf('\n    }', newLoopStepIdx) + 6;
    source = source.substring(0, newLoopStepIdx) + updatedLoopStep + source.substring(newLoopStepEnd);

    console.log('✅ Replaced alert() with showToast()');
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
  console.log('✅ SUCCESS POPUP WILL AUTO-CLOSE!');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('Changes:');
  console.log('  - Added showToast() function');
  console.log('  - Toast notifications auto-close after 3 seconds');
  console.log('  - No more clicking OK for each row!');
  console.log('');
  console.log('Next time you run batch mode:');
  console.log('  - Success messages will show as toast (bottom right)');
  console.log('  - Auto-close after 3 seconds');
  console.log('  - Batch continues without interruption');
  console.log('');
}

if (require.main === module) {
  autoCloseSuccessPopup().catch(error => {
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

module.exports = { autoCloseSuccessPopup };
