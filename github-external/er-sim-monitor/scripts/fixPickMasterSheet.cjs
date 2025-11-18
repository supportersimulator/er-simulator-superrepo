/**
 * Fix buildCategoriesPathwaysMainMenu_() to use correct sheet
 *
 * Problem: pickMasterSheet_() looks for "Master Scenario CSV" but sheet is "Master Scenario Convert"
 * Solution: Replace pickMasterSheet_() call with direct sheet reference
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Fixing sheet reference in buildCategoriesPathwaysMainMenu_()\n');

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

  // Replace pickMasterSheet_() with direct reference to correct sheet
  const oldLine = 'const sheet = pickMasterSheet_();';
  const newLine = "const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Master Scenario Convert');";

  if (!codeFile.source.includes(oldLine)) {
    console.log('⚠️  Line not found in buildCategoriesPathwaysMainMenu_()');
    return;
  }

  console.log('✅ Found pickMasterSheet_() call\n');

  // Only replace within buildCategoriesPathwaysMainMenu_ function
  // Extract the function, replace within it, then put it back
  const funcMatch = codeFile.source.match(/function buildCategoriesPathwaysMainMenu_\(\)[\s\S]*?^}/m);

  if (!funcMatch) {
    throw new Error('buildCategoriesPathwaysMainMenu_() not found');
  }

  const oldFunc = funcMatch[0];
  const newFunc = oldFunc.replace(oldLine, newLine);

  codeFile.source = codeFile.source.replace(oldFunc, newFunc);

  console.log('🔄 Replaced pickMasterSheet_() with direct sheet reference\n');
  console.log('🚀 Deploying...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('🎯 What Changed:\n');
  console.log('   - buildCategoriesPathwaysMainMenu_() now directly references "Master Scenario Convert"');
  console.log('   - No longer depends on pickMasterSheet_() which was finding wrong sheet');
  console.log('   - headers (data[1]) should now be defined\n');
  console.log('💡 Try the button again!');
}

main().catch(console.error);
