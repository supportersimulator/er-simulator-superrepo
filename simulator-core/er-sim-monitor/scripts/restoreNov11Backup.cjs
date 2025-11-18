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

async function restore() {
  const auth = getOAuth2Client();
  const script = google.script({ version: 'v1', auth });
  
  console.log('📥 Reading Nov 11 backup...\n');
  
  const backupCode = fs.readFileSync(
    path.join(__dirname, '../backups/apps-script-backup-2025-11-11/Code.gs'),
    'utf8'
  );
  
  console.log('Backup stats:');
  console.log('  Size: ' + backupCode.length + ' characters');
  console.log('  Lines: ' + backupCode.split('\n').length);
  
  console.log('\n📤 Getting current project state...');
  
  const getResponse = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = getResponse.data.files;
  
  // Find and update only Code.gs
  const codeFile = files.find(f => f.name === 'Code');
  if (!codeFile) {
    console.log('❌ Code.gs not found in project');
    return;
  }
  
  console.log('\n🔄 Updating Code.gs with Nov 11 backup...');
  codeFile.source = backupCode;
  
  await script.projects.updateContent({
    scriptId: SCRIPT_ID,
    requestBody: { files: [codeFile] }  // Only send Code.gs
  });
  
  console.log('✅ Code.gs restored from Nov 11 backup!');
  console.log('\n🔍 Please refresh your Google Sheet and check if the menu appears.');
}

restore().catch(console.error);
