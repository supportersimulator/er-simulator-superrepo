const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SCRIPT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

function getOAuth2Client() {
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const tokenPath = path.join(__dirname, '../config/token.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const { client_id, client_secret, redirect_uris } = credentials.installed;
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oauth2Client.setCredentials(token);
  return oauth2Client;
}

async function downloadCurrent() {
  const auth = getOAuth2Client();
  const script = google.script({ version: 'v1', auth });

  console.log('📥 Downloading current Code.gs...\n');

  const getResponse = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = getResponse.data.files;

  const codeFile = files.find(f => f.name === 'Code');
  const ultimateFile = files.find(f => f.name === 'Ultimate_Categorization_Tool_Complete');

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('FUNCTION LOCATION CHECK:');
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (codeFile.source.includes('function openUltimateCategorization')) {
    console.log('✅ openUltimateCategorization() is in Code.gs');
  } else {
    console.log('❌ openUltimateCategorization() NOT in Code.gs');
  }

  if (ultimateFile.source.includes('function openUltimateCategorization')) {
    console.log('✅ openUltimateCategorization() is in Ultimate_Categorization_Tool_Complete');
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('APPS SCRIPT FILE BEHAVIOR:');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('In Apps Script, functions from ALL files are in the same namespace.');
  console.log('Code.gs can call openUltimateCategorization() even if it\'s defined');
  console.log('in Ultimate_Categorization_Tool_Complete.gs');
  console.log('\nThis is NORMAL and CORRECT behavior.');
}

downloadCurrent().catch(console.error);
