/**
 * Fix buildCategoriesPathwaysMainMenu_() to use new column structure
 *
 * Problem: Function looks for 'Case_Organization:Category' which doesn't exist
 * Solution: Update to use 'Case_Organization_Category_Symptom'
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Fixing buildCategoriesPathwaysMainMenu_() column references\n');

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
    throw new Error('Code.gs not found');
  }

  console.log('📥 Downloaded Code.gs\n');

  // Find the old line
  const oldLine = "const categoryIdx = headers.indexOf('Case_Organization:Category');";

  if (!codeFile.source.includes(oldLine)) {
    console.log('⚠️  Old line not found - checking current state...\n');

    // Extract function to see current state
    const funcMatch = codeFile.source.match(/function buildCategoriesPathwaysMainMenu_\(\)[\s\S]{0,800}/);
    if (funcMatch) {
      console.log('Current function start:\n');
      console.log(funcMatch[0].substring(0, 500));
    }
    return;
  }

  console.log('✅ Found old column reference\n');

  // Replace with new column reference (use Symptom as the primary category)
  const newLine = "const categoryIdx = headers.indexOf('Case_Organization_Category_Symptom');";

  codeFile.source = codeFile.source.replace(oldLine, newLine);

  console.log('🔄 Updated: Case_Organization:Category → Case_Organization_Category_Symptom\n');
  console.log('🚀 Deploying...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('🎯 What Changed:\n');
  console.log('   - buildCategoriesPathwaysMainMenu_() now looks for correct column');
  console.log('   - Uses Case_Organization_Category_Symptom instead of old Case_Organization:Category');
  console.log('   - Function should no longer get undefined when calling indexOf()\n');
  console.log('💡 Try clicking the "✨ Open AI Categorization Tools" button now!');
}

main().catch(console.error);
