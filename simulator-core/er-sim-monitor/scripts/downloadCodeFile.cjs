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

async function downloadCode() {
  const auth = getOAuth2Client();
  const script = google.script({ version: 'v1', auth });
  const res = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const codeFile = res.data.files.find(f => f.name === 'Code');
  
  // Save to temp file
  const outputPath = path.join(__dirname, '../temp-code-current.gs');
  fs.writeFileSync(outputPath, codeFile.source, 'utf8');
  
  console.log('✅ Downloaded Code.gs to temp-code-current.gs');
  console.log('File size: ' + codeFile.source.length + ' characters');
  console.log('Lines: ' + codeFile.source.split('\n').length);
}

downloadCode().catch(console.error);
