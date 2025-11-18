/**
 * Find which panel has "Specific Rows" mode
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
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

  console.log('🔍 Searching for Batch Processing UI with Specific Rows Mode\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  let foundInFile = null;

  for (const file of project.data.files) {
    if (file.source.includes('Specific Rows') || file.source.includes('specific rows')) {
      console.log('✅ Found "Specific Rows" in: ' + file.name + '.gs\n');
      foundInFile = file;
      break;
    }
  }

  if (!foundInFile) {
    console.log('❌ "Specific Rows" mode not found in any file\n');
    console.log('This feature may not be deployed yet.\n');
    console.log('Available AI panels:\n');

    for (const file of project.data.files) {
      if (file.source.includes('AI') && file.source.includes('Categorization')) {
        console.log('  - ' + file.name + '.gs');
      }
    }
    console.log('');
    return;
  }

  // Check which UI this belongs to
  const hasLiveLogs = foundInFile.source.includes('Live Retry Logs') || foundInFile.source.includes('Live Logs');
  const hasCategoriesPathways = foundInFile.source.includes('Categories & Pathways');
  const hasAICategorization = foundInFile.source.includes('AI Auto-Categorization');

  console.log('📋 File Analysis:\n');
  console.log('  File: ' + foundInFile.name + '.gs');
  console.log('  Has Live Logs: ' + (hasLiveLogs ? 'Yes' : 'No'));
  console.log('  Has Categories & Pathways: ' + (hasCategoriesPathways ? 'Yes' : 'No'));
  console.log('  Has AI Auto-Categorization: ' + (hasAICategorization ? 'Yes' : 'No'));
  console.log('');

  // Find the specific rows UI section
  const specificRowsMatch = foundInFile.source.match(/Specific Rows[\s\S]{0,500}/);

  if (specificRowsMatch) {
    console.log('══════════════════════════════════════════════════════════════\n');
    console.log('📝 Context around "Specific Rows":\n');
    console.log(specificRowsMatch[0].substring(0, 400));
    console.log('...\n');
  }

  // Check if it's a different panel than Categories & Pathways
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🎯 Conclusion:\n');

  if (hasCategoriesPathways) {
    console.log('  "Specific Rows" IS in Categories & Pathways panel');
    console.log('  But you said you don\'t see it - need to check deployment\n');
  } else {
    console.log('  "Specific Rows" is in a DIFFERENT panel');
    console.log('  You need to open: ' + foundInFile.name + ' panel instead\n');
  }
}

main().catch(console.error);
