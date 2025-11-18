const { google } = require('googleapis');
const fs = require('fs');
require('dotenv').config();

async function checkActiveCategoriesPanel() {
  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oAuth2Client });
  const scriptId = process.env.APPS_SCRIPT_ID;

  console.log('🔍 Checking which Categories panel is currently active\n');

  const project = await script.projects.getContent({ scriptId });

  // Check which files are being included
  console.log('📂 Files with buildCategoriesPathwaysMainMenu_ function:\n');

  let lastFileWithBuild = null;
  let lastIndex = -1;

  project.data.files.forEach((file, index) => {
    const hasBuild = file.source.includes('function buildCategoriesPathwaysMainMenu_');

    if (hasBuild) {
      const hasRetry = file.source.includes('Retry Failed Cases');
      const hasLogs = file.source.includes('retry-logs-panel');

      console.log((index + 1) + '.', file.name);
      console.log('   Retry button:', hasRetry ? '✅ YES' : '❌ NO');
      console.log('   Live logs:', hasLogs ? '✅ YES' : '❌ NO');
      console.log('');

      lastFileWithBuild = file.name;
      lastIndex = index;
    }
  });

  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('💡 Apps Script uses the LAST definition of functions\n');
  console.log('🎯 Currently Active Panel:', lastFileWithBuild);
  console.log('   (File #' + (lastIndex + 1) + ' in execution order)\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const targetFile = 'Phase2_Enhanced_Categories_With_AI';

  if (lastFileWithBuild !== targetFile) {
    console.log('❌ PROBLEM: The active panel is NOT ' + targetFile);
    console.log('   Your retry button and live logs are in ' + targetFile);
    console.log('   But the active panel is ' + lastFileWithBuild + '\n');
    console.log('SOLUTION: We need to remove buildCategoriesPathwaysMainMenu_ from');
    console.log('          ' + lastFileWithBuild + ' so ' + targetFile + ' becomes active\n');

    return { needsFix: true, activeFile: lastFileWithBuild, targetFile: targetFile };
  } else {
    console.log('✅ CORRECT: ' + targetFile + ' is the active panel');
    console.log('   Your retry button and live logs should be visible\n');
    console.log('💡 If you still don\'t see them:');
    console.log('   1. Refresh the Google Sheet (F5)');
    console.log('   2. Close and reopen the sidebar\n');

    return { needsFix: false, activeFile: lastFileWithBuild, targetFile: targetFile };
  }
}

checkActiveCategoriesPanel()
  .then(result => {
    if (result.needsFix) {
      console.log('Would you like me to fix this automatically? (Y/n)');
    }
  })
  .catch(console.error);
