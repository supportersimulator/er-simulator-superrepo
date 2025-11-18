/**
 * Fix resultRowIndex Bug - The Root Cause
 *
 * PROBLEM: categorizeBatchWithAI() was not preserving the resultRowIndex field
 * from input cases, causing all retry writes to be skipped (undefined row indices).
 *
 * FIX: Added `resultRowIndex: caseData.resultRowIndex` to the results object
 * on line 267 of AI_Categorization_Backend.gs
 *
 * This ensures the row number is preserved through the entire retry pipeline:
 * 1. failedCases collects cases with resultRowIndex (line 729)
 * 2. Cases batched and sent to categorizeBatchWithAI (line 790)
 * 3. ✅ NOW PRESERVED in results (line 267)
 * 4. Write-back uses resultRowIndex to target correct rows (line 860)
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🐛 Fixing resultRowIndex Preservation Bug\n');

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

  // Read updated backend with fix
  const updatedBackend = fs.readFileSync('./apps-script-deployable/AI_Categorization_Backend.gs', 'utf-8');

  // Find Code.gs file
  const codeFile = project.data.files.find(f => f.name === 'Code');

  if (!codeFile) {
    console.log('❌ Code.gs not found in project');
    return;
  }

  // Extract the categorizeBatchWithAI function
  const batchMatch = updatedBackend.match(/(function categorizeBatchWithAI\(cases\)[\s\S]*?^}(?=\n\n\/\*\*|$))/m);

  if (!batchMatch) {
    console.log('❌ Could not find categorizeBatchWithAI function');
    return;
  }

  const newBatchFunction = batchMatch[0];

  // Replace in Code.gs
  codeFile.source = codeFile.source.replace(
    /(function categorizeBatchWithAI\(cases\)[\s\S]*?^}(?=\n\n\/\*\*|$))/m,
    newBatchFunction
  );

  console.log('✅ Updated categorizeBatchWithAI function\n');

  // Deploy
  console.log('🚀 Deploying to Apps Script...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('🐛 Bug Fix Summary:\n');
  console.log('PROBLEM:');
  console.log('  ❌ categorizeBatchWithAI() was not preserving resultRowIndex');
  console.log('  ❌ All retry results had resultRowIndex = undefined');
  console.log('  ❌ Write-back validation skipped all 25 rows\n');
  console.log('SOLUTION:');
  console.log('  ✅ Added line 267: resultRowIndex: caseData.resultRowIndex');
  console.log('  ✅ Field now preserved through entire retry pipeline');
  console.log('  ✅ Write-back will now target correct rows (27, 37, 47, etc.)\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('💡 Next Steps:\n');
  console.log('  1. Refresh Google Sheet (F5)');
  console.log('  2. Open "✨ Open AI Categorization Tools"');
  console.log('  3. Click "Retry Failed Cases"');
  console.log('  4. Watch logs - should now see:\n');
  console.log('Expected NEW logs:');
  console.log('  [HH:MM:SS] 📝 Writing Results Back to Sheet...');
  console.log('  [HH:MM:SS]    Sample row indices: CARD0005→row 27, PEDNE26→row 37...');
  console.log('  [HH:MM:SS]    ✍️  Row 27: CARD0005 → ACLS');
  console.log('  [HH:MM:SS]    ✍️  Row 37: PEDNE26 → PGEN');
  console.log('  [HH:MM:SS]    ✍️  Row 47: CARD0046 → CP');
  console.log('  [HH:MM:SS] 📊 Write Summary:');
  console.log('  [HH:MM:SS]    ✅ Rows written: 25');
  console.log('  [HH:MM:SS]    ⚠️  Rows skipped: 0\n');
  console.log('🎯 Expected Result:');
  console.log('  All 25 failed cases should now populate successfully!');
  console.log('  Check rows 27, 37, 47, etc. for ACLS, PGEN, CP data\n');
}

main().catch(console.error);
