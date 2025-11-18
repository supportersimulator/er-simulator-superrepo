/**
 * Deploy ACLS Filter Fix
 *
 * Updates categorizeBatchWithAI to filter ACLS from valid symptoms list
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Deploying ACLS Filter Fix\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oAuth2Client });
  const scriptId = process.env.APPS_SCRIPT_ID;

  const updatedBackend = fs.readFileSync(
    './apps-script-deployable/AI_Categorization_Backend.gs',
    'utf-8'
  );

  const project = await script.projects.getContent({ scriptId });
  const codeFile = project.data.files.find(f => f.name === 'Code');

  if (!codeFile) {
    throw new Error('Code.gs not found');
  }

  // Extract categorizeBatchWithAI function
  const funcMatch = updatedBackend.match(/function categorizeBatchWithAI[\s\S]*?(?=\nfunction [a-zA-Z]|\n\/\/|$)/);

  if (!funcMatch) {
    throw new Error('categorizeBatchWithAI function not found');
  }

  console.log(`✅ Extracted function (${funcMatch[0].length} chars)\n`);

  // Find and replace in Code.gs
  const oldFuncMatch = codeFile.source.match(/function categorizeBatchWithAI[\s\S]*?(?=\nfunction [a-zA-Z]|\n\/\/)/);

  if (!oldFuncMatch) {
    throw new Error('Old function not found in Code.gs');
  }

  console.log('✅ Found old function\n');

  codeFile.source = codeFile.source.replace(oldFuncMatch[0], funcMatch[0]);

  console.log('🚀 Deploying...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('🎯 What Changed:\n');
  console.log('   BEFORE: validSymptoms = Object.keys(accronymMapping).join(\', \')');
  console.log('   AFTER:  validSymptoms = Object.keys(accronymMapping)');
  console.log('                            .filter(symptom => symptom !== \'ACLS\')');
  console.log('                            .join(\', \')\n');
  console.log('📊 Expected Impact:');
  console.log('   - AI will NO LONGER see ACLS as a valid option');
  console.log('   - ACLS cases: 120 → ~0-5 (only if truly cardiac arrest)');
  console.log('   - Other symptoms will be used correctly (CP, SOB, AMS, etc.)\n');
  console.log('💡 Re-run AI Categorization now for correct results!');
}

main().catch(console.error);
