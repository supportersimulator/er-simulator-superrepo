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

async function removeExtendMenu() {
  const auth = getOAuth2Client();
  const script = google.script({ version: 'v1', auth });
  
  console.log('📥 Getting current files...\n');
  
  const getResponse = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = getResponse.data.files;
  
  const codeFile = files.find(f => f.name === 'Code');
  if (!codeFile) {
    console.log('❌ Code.gs not found');
    return;
  }
  
  console.log('🔍 Searching for extendMenu_ self-executing function...');
  
  // Find the IIFE pattern: (function extendMenu_() { ... })();
  const pattern = /\(function extendMenu_\(\) \{[\s\S]*?\}\)\(\);/;
  const match = codeFile.source.match(pattern);
  
  if (!match) {
    console.log('❌ Could not find extendMenu_ IIFE pattern');
    return;
  }
  
  console.log('✅ Found extendMenu_ IIFE');
  console.log('   Length: ' + match[0].length + ' characters\n');
  
  console.log('🗑️ Removing extendMenu_ IIFE...');
  
  // Remove the entire IIFE
  codeFile.source = codeFile.source.replace(pattern, '// Removed extendMenu_ IIFE that was overwriting the main menu');
  
  // Send ALL files back
  await script.projects.updateContent({
    scriptId: SCRIPT_ID,
    requestBody: { files: files }
  });
  
  console.log('✅ extendMenu_ IIFE removed!');
  console.log('\n🔍 Please refresh your Google Sheet - the full menu should now appear.');
}

removeExtendMenu().catch(console.error);
