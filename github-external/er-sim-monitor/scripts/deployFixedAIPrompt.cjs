/**
 * Deploy Fixed AI Categorization Prompt
 *
 * Updates the AI_Categorization_Backend.gs file with improved prompt that:
 * - Explains the PURPOSE of categorization
 * - Prevents ACLS over-categorization
 * - Focuses on chief complaint, not pathway names
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Deploying Fixed AI Categorization Prompt\n');

  // Auth setup
  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oAuth2Client });
  const scriptId = process.env.APPS_SCRIPT_ID;

  // Step 1: Read updated backend file
  console.log('📥 Step 1: Reading updated AI_Categorization_Backend.gs...\n');

  const updatedBackend = fs.readFileSync(
    './apps-script-deployable/AI_Categorization_Backend.gs',
    'utf-8'
  );

  console.log(`   ✅ Loaded (${(updatedBackend.length / 1024).toFixed(1)} KB)\n`);

  // Step 2: Get current project files
  console.log('📥 Step 2: Downloading current Apps Script project...\n');

  const project = await script.projects.getContent({ scriptId });
  const files = project.data.files;

  console.log(`   ✅ Found ${files.length} files in project\n`);

  // Step 3: Find Code.gs file (contains AI categorization functions)
  const codeFile = files.find(f => f.name === 'Code');

  if (!codeFile) {
    throw new Error('❌ Code.gs not found in project!');
  }

  console.log('   ✅ Found Code.gs\n');

  // Step 4: Find and replace buildCategorizationPrompt function
  console.log('🔄 Step 3: Updating buildCategorizationPrompt function...\n');

  // Extract the function from updated backend
  const functionMatch = updatedBackend.match(/function buildCategorizationPrompt\([\s\S]*?\n\}/);

  if (!functionMatch) {
    throw new Error('❌ buildCategorizationPrompt function not found in updated file!');
  }

  const newFunction = functionMatch[0];
  console.log(`   ✅ Extracted new function (${newFunction.length} chars)\n`);

  // Find the function in Code.gs
  const oldFunctionMatch = codeFile.source.match(/function buildCategorizationPrompt\([\s\S]*?\n\}/);

  if (!oldFunctionMatch) {
    throw new Error('❌ buildCategorizationPrompt function not found in Code.gs!');
  }

  const oldFunction = oldFunctionMatch[0];
  console.log(`   ✅ Found old function (${oldFunction.length} chars)\n`);

  // Replace the function
  const originalSize = (codeFile.source.length / 1024).toFixed(1);
  codeFile.source = codeFile.source.replace(oldFunction, newFunction);
  const newSize = (codeFile.source.length / 1024).toFixed(1);

  console.log(`   Original Code.gs: ${originalSize} KB`);
  console.log(`   Updated Code.gs:  ${newSize} KB`);
  console.log(`   Change:           ${(newSize - originalSize).toFixed(1)} KB\n`);

  // Step 5: Deploy to Apps Script
  console.log('🚀 Step 4: Deploying to Apps Script...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: {
      files: files
    }
  });

  console.log('✅ Deployment complete!\n');

  // Summary
  console.log('📋 What Was Fixed:\n');
  console.log('   ✅ Added PURPOSE section explaining categorization goal');
  console.log('   ✅ Added strict ACLS RULE (only for actual cardiac arrest)');
  console.log('   ✅ Added instruction to focus on chief complaint, not pathway');
  console.log('   ✅ Added specific examples of correct categorization');
  console.log('');

  console.log('🎯 Next Steps:\n');
  console.log('   1. Go back to Categories & Pathways panel in Google Sheets');
  console.log('   2. Click "🚀 Run AI Categorization (All 207 Cases)"');
  console.log('   3. Wait 2-3 minutes for AI processing');
  console.log('   4. Review results - ACLS count should drop significantly');
  console.log('');

  console.log('📊 Expected Improvements:\n');
  console.log('   - ACLS cases: 91 → ~10-15 (only actual cardiac arrests)');
  console.log('   - SOB cases: 12 → ~30-40 (breathing issues)');
  console.log('   - CP cases: 7 → ~20-30 (chest pain presentations)');
  console.log('   - AMS cases: 10 → ~15-20 (altered mental status)');
  console.log('');

  console.log('🎉 AI prompt fixed and deployed!\n');
}

main().catch(console.error);
