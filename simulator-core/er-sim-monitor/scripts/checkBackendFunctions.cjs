/**
 * Check Backend Functions in Code.gs
 *
 * Verifies if the functions called by buttons actually exist
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Checking Backend Functions\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oAuth2Client });
  const scriptId = process.env.APPS_SCRIPT_ID;

  const project = await script.projects.getContent({ scriptId });
  const codeFile = project.data.files.find(f => f.name === 'Code');

  if (!codeFile) {
    console.log('❌ Code.gs not found\n');
    return;
  }

  const code = codeFile.source;

  console.log('🔍 Checking for Button Functions:\n');

  const requiredFunctions = [
    'applyCategorizations',
    'applyCategoriesResultsToMaster',
    'exportCategorizationResults',
    'exportAIResultsToCSV',
    'retryFailedCases',
    'retryFailedAICategorizations',
  ];

  for (const funcName of requiredFunctions) {
    const exists = code.includes(`function ${funcName}(`);
    console.log(`  ${exists ? '✅' : '❌'} ${funcName}`);
  }

  console.log('\n══════════════════════════════════════════════════════════════\n');
  console.log('🔍 Analysis:\n');

  // Check which naming convention is correct
  const hasNew = code.includes('function applyCategorizations(');
  const hasOld = code.includes('function applyCategoriesResultsToMaster(');

  if (hasNew && !hasOld) {
    console.log('  ✅ Backend uses NEW naming: applyCategorizations()');
    console.log('     Panel buttons are CORRECT\n');
  } else if (hasOld && !hasNew) {
    console.log('  ⚠️  Backend uses OLD naming: applyCategoriesResultsToMaster()');
    console.log('     Panel buttons are WRONG - need to update onclick handlers\n');
  } else if (hasNew && hasOld) {
    console.log('  ⚠️  Backend has BOTH versions (duplicates)');
    console.log('     Need to determine which is correct\n');
  } else {
    console.log('  ❌ Backend missing BOTH versions\n');
  }

  console.log('══════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
