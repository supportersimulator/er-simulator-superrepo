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

async function restoreFromDrive() {
  const auth = getOAuth2Client();
  const drive = google.drive({ version: 'v3', auth });
  const script = google.script({ version: 'v1', auth });
  
  console.log('🔍 Searching for backup files in Drive...\n');
  
  // Search for backup files with "Apps Script Backup" in the name
  const response = await drive.files.list({
    q: "name contains 'Apps Script Backup' and mimeType='application/vnd.google-apps.folder'",
    fields: 'files(id, name, createdTime, modifiedTime)',
    orderBy: 'modifiedTime desc',
    pageSize: 10
  });
  
  if (!response.data.files || response.data.files.length === 0) {
    console.log('❌ No backup folders found');
    return;
  }
  
  console.log('Found ' + response.data.files.length + ' backup folder(s):\n');
  response.data.files.forEach((file, i) => {
    console.log((i+1) + '. ' + file.name);
    console.log('   Modified: ' + file.modifiedTime);
    console.log('   ID: ' + file.id);
    console.log('');
  });
  
  // Use the most recent one
  const mostRecent = response.data.files[0];
  console.log('📂 Using most recent backup: ' + mostRecent.name + '\n');
  
  // List files in the backup folder
  const filesResponse = await drive.files.list({
    q: "'" + mostRecent.id + "' in parents",
    fields: 'files(id, name, mimeType)',
  });
  
  console.log('Files in backup:');
  filesResponse.data.files.forEach(file => {
    console.log('  - ' + file.name);
  });
  console.log('');
  
  // Find Code.gs
  const codeBackup = filesResponse.data.files.find(f => f.name === 'Code.gs');
  if (!codeBackup) {
    console.log('❌ Code.gs not found in backup');
    return;
  }
  
  console.log('📥 Downloading Code.gs from backup...');
  
  const fileContent = await drive.files.export({
    fileId: codeBackup.id,
    mimeType: 'text/plain'
  });
  
  const backupCode = fileContent.data;
  console.log('   Size: ' + backupCode.length + ' characters\n');
  
  console.log('🔄 Restoring to Apps Script project...');
  
  // Get current project files
  const getResponse = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = getResponse.data.files;
  
  // Update Code.gs
  const codeFile = files.find(f => f.name === 'Code');
  if (!codeFile) {
    console.log('❌ Code.gs not found in project');
    return;
  }
  
  codeFile.source = backupCode;
  
  // Send ALL files back
  await script.projects.updateContent({
    scriptId: SCRIPT_ID,
    requestBody: { files: files }
  });
  
  console.log('✅ Code.gs restored from Drive backup!');
  console.log('\n🔍 Please refresh your Google Sheet.');
}

restoreFromDrive().catch(console.error);
