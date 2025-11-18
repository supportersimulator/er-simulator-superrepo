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

async function removeCacheSubmenu() {
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
  
  console.log('🔍 Finding Cache Management submenu...');
  
  // Find and remove the entire Cache Management submenu block
  const cacheSubmenuPattern = /  \/\/ Cache Management Submenu[\s\S]*?\.addItem\('👁️ View Saved Field Selection', 'showSavedFieldSelection'\)\s*\);\s*\n/;
  
  const match = codeFile.source.match(cacheSubmenuPattern);
  if (!match) {
    console.log('❌ Could not find Cache Management submenu pattern');
    return;
  }
  
  console.log('✅ Found Cache Management submenu');
  console.log('   Length: ' + match[0].length + ' characters\n');
  
  console.log('🗑️ Removing Cache Management submenu (functions don\'t exist)...');
  
  // Remove the entire submenu
  codeFile.source = codeFile.source.replace(cacheSubmenuPattern, '');
  
  console.log('💾 Deploying updated menu...');
  
  // Send ALL files back
  await script.projects.updateContent({
    scriptId: SCRIPT_ID,
    requestBody: { files: files }
  });
  
  console.log('✅ Cache Management submenu removed!');
  console.log('\n🔍 Please refresh your Google Sheet - the menu should now appear.');
}

removeCacheSubmenu().catch(console.error);
