/**
 * Deploy Retry Failed Cases Feature
 *
 * Changes deployed:
 * 1. Increase max_tokens from 3000 to 4000 (fix JSON truncation)
 * 2. Add retryFailedCategorization() function
 * 3. Add "Retry Failed Cases" button to UI
 * 4. Add retry button handlers (JavaScript)
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔄 Deploying Retry Failed Cases Feature\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oAuth2Client });
  const scriptId = process.env.APPS_SCRIPT_ID;

  console.log('📥 Downloading current project...\n');

  const project = await script.projects.getContent({ scriptId });

  // Load local backend file with all changes
  const localBackend = fs.readFileSync('./apps-script-deployable/AI_Categorization_Backend.gs', 'utf-8');

  // Update Code.gs with backend functions
  const codeFile = project.data.files.find(f => f.name === 'Code');
  if (!codeFile) {
    console.log('❌ Code.gs not found!');
    return;
  }

  // Extract the retry function and updated categorizeBatchWithAI from local file
  const retryFunctionMatch = localBackend.match(/\/\*\*\s*\n\s*\* Retry AI categorization[\s\S]*?^function retryFailedCategorization[\s\S]*?^}/m);
  const maxTokensLineMatch = localBackend.match(/max_tokens: 4000.*$/m);

  if (!retryFunctionMatch) {
    console.log('❌ Could not extract retryFailedCategorization function');
    return;
  }

  // Update max_tokens in Code.gs
  if (codeFile.source.includes('max_tokens: 3000')) {
    codeFile.source = codeFile.source.replace(/max_tokens: 3000/, 'max_tokens: 4000  // Increased from 3000 to prevent JSON truncation');
    console.log('✅ Updated max_tokens: 3000 → 4000');
  } else {
    console.log('⚠️  max_tokens line not found or already updated');
  }

  // Add retry function after clearAICategorizationResults if not exists
  if (!codeFile.source.includes('function retryFailedCategorization')) {
    // Find clearAICategorizationResults function
    const clearFunctionMatch = codeFile.source.match(/(function clearAICategorizationResults[\s\S]*?^})/m);

    if (clearFunctionMatch) {
      const insertAfter = clearFunctionMatch[0];
      codeFile.source = codeFile.source.replace(
        insertAfter,
        insertAfter + '\n\n' + retryFunctionMatch[0]
      );
      console.log('✅ Added retryFailedCategorization() function to Code.gs');
    } else {
      console.log('❌ Could not find clearAICategorizationResults function');
      return;
    }
  } else {
    console.log('⚠️  retryFailedCategorization already exists in Code.gs');
  }

  // Update Phase2_Enhanced_Categories_With_AI file
  const phase2File = project.data.files.find(f => f.name === 'Phase2_Enhanced_Categories_With_AI');
  if (phase2File) {
    const localPhase2 = fs.readFileSync('./apps-script-deployable/Phase2_Enhanced_Categories_With_AI.gs', 'utf-8');
    phase2File.source = localPhase2;
    console.log('✅ Updated Phase2_Enhanced_Categories_With_AI.gs');
    console.log('   - Added "🔄 Retry Failed Cases" button');
    console.log('   - Added retryFailedCases() JavaScript function');
    console.log('   - Added handleRetryComplete() handler');
    console.log('   - Added handleRetryError() handler');
  } else {
    console.log('❌ Phase2_Enhanced_Categories_With_AI file not found!');
    return;
  }

  console.log('\n🚀 Deploying to Apps Script...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('🎯 What Changed:\n');
  console.log('1. JSON Truncation Fix:');
  console.log('   - max_tokens increased from 3000 → 4000 tokens');
  console.log('   - This should prevent JSON being cut off mid-response\n');
  console.log('2. New Retry Function:');
  console.log('   - retryFailedCategorization() identifies empty results');
  console.log('   - Re-processes ONLY failed cases (batch size: 10)');
  console.log('   - Updates results sheet with retry data\n');
  console.log('3. New UI Button:');
  console.log('   - "🔄 Retry Failed Cases" button in AI panel');
  console.log('   - Orange color to distinguish from Run and Clear');
  console.log('   - Shows retry statistics on completion\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('💡 Next Steps:\n');
  console.log('1. Click "🔄 Retry Failed Cases" button in panel');
  console.log('2. Wait ~30 seconds for 25 cases to re-process');
  console.log('3. Check alert for success/failure statistics');
  console.log('4. Click "Refresh" to see updated results\n');
  console.log('Expected Result:');
  console.log('   - 25 failed cases should now have valid symptoms');
  console.log('   - Empty/pink rows should be filled with data');
  console.log('   - If still failing, indicates deeper API issue\n');
}

main().catch(console.error);
