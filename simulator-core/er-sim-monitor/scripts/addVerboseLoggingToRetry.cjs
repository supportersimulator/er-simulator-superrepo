/**
 * Add Verbose Logging to Retry Function
 *
 * Problem: Retry reports "success" but doesn't populate results
 * Solution: Add extensive logging to diagnose the issue
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Adding verbose logging to retry function\n');

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
  const codeFile = project.data.files.find(f => f.name === 'Code');

  if (!codeFile) {
    console.log('❌ Code.gs not found!');
    return;
  }

  // Find retry function
  const retryMatch = codeFile.source.match(/(function retryFailedCategorization\(\)[^{]*\{[\s\S]*?^})/m);

  if (!retryMatch) {
    console.log('❌ Could not find retryFailedCategorization function');
    return;
  }

  const originalRetry = retryMatch[0];

  // Enhanced version with verbose logging
  const enhancedRetry = originalRetry
    // Log batch results
    .replace(
      /const batchResults = categorizeBatchWithAI\(batch\);/,
      `const batchResults = categorizeBatchWithAI(batch);
      Logger.log('📦 Batch results received: ' + batchResults.length + ' items');
      Logger.log('   Sample result: ' + JSON.stringify(batchResults[0] || {}));`
    )
    // Log what's being written
    .replace(
      /retryResults\.forEach\(result => \{/,
      `Logger.log('📝 Writing ' + retryResults.length + ' results back to sheet...');
  retryResults.forEach(result => {
    Logger.log('   Writing row ' + result.resultRowIndex + ': ' + result.caseID + ' -> ' + (result.suggestedSymptom || '(empty)'));`
    )
    // Log validation failures
    .replace(
      /if \(!resultRow \|\| isNaN\(resultRow\) \|\| resultRow < 2\) \{/,
      `if (!resultRow || isNaN(resultRow) || resultRow < 2) {
      Logger.log('   ❌ VALIDATION FAILED for resultRow: ' + result.resultRowIndex + ' (parsed: ' + resultRow + ')');`
    );

  // Replace function
  codeFile.source = codeFile.source.replace(originalRetry, enhancedRetry);

  console.log('✅ Added verbose logging to retry function\n');
  console.log('🚀 Deploying...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('🎯 What Changed:\n');
  console.log('  - Added logging after categorizeBatchWithAI call');
  console.log('  - Shows how many results received from each batch');
  console.log('  - Shows sample result structure');
  console.log('  - Logs each row being written');
  console.log('  - Logs validation failures\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('💡 Next Steps:\n');
  console.log('  1. Click "🔄 Retry Failed Cases" button again');
  console.log('  2. Open Apps Script IDE → Executions tab');
  console.log('  3. Click on the most recent retryFailedCategorization execution');
  console.log('  4. Read the detailed logs to see where it fails\n');
  console.log('Expected to see:');
  console.log('  - "📦 Batch results received: 10 items" (or 0 if API failed)');
  console.log('  - "Sample result: {...}" (shows if results have data)');
  console.log('  - "Writing row 27: CARD0005 -> RESP" (or -> (empty))');
  console.log('  - Any validation failures\n');
}

main().catch(console.error);
