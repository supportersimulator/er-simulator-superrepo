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

async function checkMenu() {
  const auth = getOAuth2Client();
  const script = google.script({ version: 'v1', auth });
  
  const res = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const codeFile = res.data.files.find(f => f.name === 'Code');
  
  // Find onOpen function
  const onOpenIndex = codeFile.source.indexOf('function onOpen()');
  if (onOpenIndex === -1) {
    console.log('❌ onOpen() not found!');
    return;
  }
  
  // Find the end of onOpen
  let braceCount = 0;
  let inFunction = false;
  let onOpenEnd = onOpenIndex;
  
  for (let i = onOpenIndex; i < codeFile.source.length; i++) {
    if (codeFile.source[i] === '{') {
      inFunction = true;
      braceCount++;
    } else if (codeFile.source[i] === '}') {
      braceCount--;
      if (inFunction && braceCount === 0) {
        onOpenEnd = i + 1;
        break;
      }
    }
  }
  
  const onOpenFunc = codeFile.source.substring(onOpenIndex, onOpenEnd);
  
  console.log('CURRENT onOpen() FUNCTION:');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(onOpenFunc);
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  // Check for self-executing menu function
  const hasExtendMenu = codeFile.source.includes('extendMenu_');
  
  if (hasExtendMenu) {
    console.log('⚠️  Found extendMenu_ - searching for it...\n');
    
    const extendIndex = codeFile.source.indexOf('extendMenu_');
    if (extendIndex !== -1) {
      const context = codeFile.source.substring(Math.max(0, extendIndex - 100), extendIndex + 500);
      console.log('extendMenu_ context:');
      console.log('─────────────────────────────────────────────────────────');
      console.log(context);
      console.log('─────────────────────────────────────────────────────────');
    }
  } else {
    console.log('✅ No extendMenu_ found');
  }
}

checkMenu().catch(console.error);
