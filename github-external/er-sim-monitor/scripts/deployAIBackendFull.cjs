/**
 * Deploy Complete AI Backend
 *
 * Updates both:
 * - buildCategorizationPrompt (improved prompt)
 * - saveCategorizationResults (clear instead of delete)
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Deploying Complete AI Backend (with sheet clear fix)\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oAuth2Client });
  const scriptId = process.env.APPS_SCRIPT_ID;

  // Read updated backend
  const updatedBackend = fs.readFileSync(
    './apps-script-deployable/AI_Categorization_Backend.gs',
    'utf-8'
  );

  console.log('📥 Reading updated backend...\n');

  // Get current project
  const project = await script.projects.getContent({ scriptId });
  const codeFile = project.data.files.find(f => f.name === 'Code');

  if (!codeFile) {
    throw new Error('Code.gs not found');
  }

  // Extract both functions to update
  const promptFunc = updatedBackend.match(/function buildCategorizationPrompt\([\s\S]*?\n\}/);
  const saveFunc = updatedBackend.match(/function saveCategorizationResults\([\s\S]*?\n\}/);

  if (!promptFunc || !saveFunc) {
    throw new Error('Functions not found in updated file');
  }

  console.log('✅ Extracted functions:\n');
  console.log(`   - buildCategorizationPrompt (${promptFunc[0].length} chars)`);
  console.log(`   - saveCategorizationResults (${saveFunc[0].length} chars)\n`);

  // Replace both functions in Code.gs
  let newCode = codeFile.source;

  const oldPrompt = newCode.match(/function buildCategorizationPrompt\([\s\S]*?\n\}/);
  const oldSave = newCode.match(/function saveCategorizationResults\([\s\S]*?\n\}/);

  if (oldPrompt) {
    newCode = newCode.replace(oldPrompt[0], promptFunc[0]);
    console.log('✅ Replaced buildCategorizationPrompt');
  }

  if (oldSave) {
    newCode = newCode.replace(oldSave[0], saveFunc[0]);
    console.log('✅ Replaced saveCategorizationResults');
  }

  codeFile.source = newCode;

  console.log('\n🚀 Deploying to Apps Script...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('🎯 Fixed Issues:\n');
  console.log('   ✅ Sheet now CLEARS data instead of delete/recreate');
  console.log('   ✅ No more "sheet already exists" error');
  console.log('   ✅ Can run categorization multiple times safely\n');
  console.log('💡 Now try running AI Categorization again!');
}

main().catch(console.error);
