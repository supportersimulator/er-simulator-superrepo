/**
 * Deploy Enhanced Retry Logging
 *
 * This adds detailed logging to show:
 * - Sheet name being written to
 * - Sample row indices before write
 * - Each individual write operation (case ID → row → data)
 * - Rows that are skipped (with reason)
 * - Write summary (rows written vs skipped)
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Deploying Enhanced Retry Logging\n');

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

  // Read updated backend
  const updatedBackend = fs.readFileSync('./apps-script-deployable/AI_Categorization_Backend.gs', 'utf-8');

  // Find Code.gs file
  const codeFile = project.data.files.find(f => f.name === 'Code');

  if (!codeFile) {
    console.log('❌ Code.gs not found in project');
    return;
  }

  // Extract the retry function from updated backend
  const retryMatch = updatedBackend.match(/(function retryFailedCategorization\(\)[\s\S]*?^}(?=\n|$))/m);

  if (!retryMatch) {
    console.log('❌ Could not find retryFailedCategorization function');
    return;
  }

  const newRetryFunction = retryMatch[0];

  // Replace old retry function in Code.gs
  codeFile.source = codeFile.source.replace(
    /(function retryFailedCategorization\(\)[\s\S]*?^}(?=\n|$))/m,
    newRetryFunction
  );

  console.log('✅ Updated retryFailedCategorization function\n');

  // Deploy
  console.log('🚀 Deploying to Apps Script...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('🎯 What Changed:\n');
  console.log('Enhanced logging now shows:');
  console.log('  ✅ Sheet name being written to');
  console.log('  ✅ Sample row indices: "CARD0005→row 27, PEDNE26→row 37..."');
  console.log('  ✅ Each write: "✍️  Row 27: CARD0005 → ACLS"');
  console.log('  ✅ Skipped rows: "⚠️  SKIPPED CARD0005: invalid resultRowIndex = undefined"');
  console.log('  ✅ Write summary: "Rows written: 1, Rows skipped: 24"\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('💡 Next Steps:\n');
  console.log('  1. Refresh Google Sheet (F5)');
  console.log('  2. Open "✨ Open AI Categorization Tools"');
  console.log('  3. Click "Retry Failed Cases"');
  console.log('  4. Watch detailed logs showing exactly what happens');
  console.log('  5. Click "Copy Logs" and paste back here\n');
  console.log('Expected to see:');
  console.log('  [HH:MM:SS] 📝 Writing Results Back to Sheet...');
  console.log('  [HH:MM:SS]    Sheet name: AI_Categorization_Results');
  console.log('  [HH:MM:SS]    Sample row indices: CARD0005→row 27, PEDNE26→row 37...');
  console.log('  [HH:MM:SS]    ✍️  Row 27: CARD0005 → ACLS');
  console.log('  OR');
  console.log('  [HH:MM:SS]    ⚠️  SKIPPED CARD0005: invalid resultRowIndex = undefined\n');
}

main().catch(console.error);
