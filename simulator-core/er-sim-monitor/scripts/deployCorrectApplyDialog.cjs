/**
 * Deploy Corrected Apply Dialog
 *
 * Updates the confirmation dialog to show the correct column names:
 * - Case_Organization_Category_Symptom_Name (Column P / 16)
 * - Case_Organization_Category_System_Name (Column Q / 17)
 * - Case_Organization_Category_Symptom (Column R / 18)
 * - Case_Organization_Category_System (Column S / 19)
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Deploying Corrected Apply Dialog\n');

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

  // Read updated Phase2 file
  const updatedPhase2 = fs.readFileSync('./apps-script-deployable/Phase2_Enhanced_Categories_With_AI.gs', 'utf-8');

  // Find Phase2 file in project
  const phase2File = project.data.files.find(f => f.name === 'Phase2_Enhanced_Categories_With_AI');

  if (!phase2File) {
    console.log('❌ Phase2_Enhanced_Categories_With_AI.gs not found in project');
    return;
  }

  // Update the file
  phase2File.source = updatedPhase2;

  console.log('✅ Updated Phase2_Enhanced_Categories_With_AI.gs\n');

  // Deploy
  console.log('🚀 Deploying to Apps Script...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('📝 Updated Apply Dialog Message:\n');
  console.log('Apply all final categorizations to Master Scenario Convert?');
  console.log('');
  console.log('This will update 4 columns for each case:');
  console.log('  - Case_Organization_Category_Symptom_Name (Column P / 16)');
  console.log('  - Case_Organization_Category_System_Name (Column Q / 17)');
  console.log('  - Case_Organization_Category_Symptom (Column R / 18)');
  console.log('  - Case_Organization_Category_System (Column S / 19)');
  console.log('');
  console.log('A backup will be created before updating.');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('✅ The dialog now correctly shows the Django-compatible column names!');
  console.log('');
  console.log('💡 Next: Verify the Apply function in Code.gs uses columns 16-19');
  console.log('');
}

main().catch(console.error);
