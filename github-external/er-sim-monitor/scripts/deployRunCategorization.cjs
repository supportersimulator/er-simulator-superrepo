/**
 * Deploy runAICategorization with Clear-on-Start
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Deploying runAICategorization (Clear on Start)\n');

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

  // Extract runAICategorization function
  const funcMatch = updatedBackend.match(/function runAICategorization[\s\S]*?(?=\n\nfunction [a-zA-Z]|\n\/\/ ===)/);

  if (!funcMatch) {
    throw new Error('runAICategorization function not found');
  }

  console.log(`✅ Extracted function (${funcMatch[0].length} chars)\n`);

  // Find and replace in Code.gs
  const oldFuncMatch = codeFile.source.match(/function runAICategorization[\s\S]*?(?=\n\nfunction [a-zA-Z]|\n\/\/ ===)/);

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
  console.log('   Added at START of runAICategorization():');
  console.log('   - Checks if AI_Categorization_Results sheet exists');
  console.log('   - If exists: Clears it immediately');
  console.log('   - Then proceeds with AI processing\n');
  console.log('📊 Benefits:');
  console.log('   ✅ No "sheet already exists" errors');
  console.log('   ✅ Old data cleared before new run starts');
  console.log('   ✅ Clean slate every time\n');
  console.log('💡 Re-run AI Categorization now!');
}

main().catch(console.error);
