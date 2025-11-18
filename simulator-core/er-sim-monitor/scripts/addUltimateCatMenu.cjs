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

async function addMenuItem() {
  const auth = getOAuth2Client();
  const script = google.script({ version: 'v1', auth });
  
  console.log('📥 Getting current Code.gs...\n');
  
  const getResponse = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = getResponse.data.files;
  
  const codeFile = files.find(f => f.name === 'Code');
  if (!codeFile) {
    console.log('❌ Code.gs not found');
    return;
  }
  
  // Find the onOpen function and add the Ultimate Categorization menu item
  const onOpenStart = codeFile.source.indexOf('function onOpen()');
  if (onOpenStart === -1) {
    console.log('❌ onOpen() function not found');
    return;
  }
  
  // Check if already has the menu item
  if (codeFile.source.includes('openUltimateCategorization')) {
    console.log('✅ Menu item already exists!');
    return;
  }
  
  console.log('🔄 Adding Ultimate Categorization Tool menu item...');
  
  // Find the line with Categories & Pathways and add after it
  const pathwaysLine = "menu.addItem('🧩 Categories & Pathways', 'runPathwayChainBuilder');";
  const ultimateLine = "  menu.addItem('🤖 Ultimate Categorization Tool', 'openUltimateCategorization');\n";
  
  if (codeFile.source.includes(pathwaysLine)) {
    codeFile.source = codeFile.source.replace(
      pathwaysLine,
      pathwaysLine + '\n' + ultimateLine
    );
    
    // Send ALL files back
    await script.projects.updateContent({
      scriptId: SCRIPT_ID,
      requestBody: { files: files }
    });
    
    console.log('✅ Ultimate Categorization Tool menu item added!');
    console.log('\n🔍 Please refresh your Google Sheet and the full menu should now appear.');
  } else {
    console.log('❌ Could not find Categories & Pathways menu item to insert after');
  }
}

addMenuItem().catch(console.error);
