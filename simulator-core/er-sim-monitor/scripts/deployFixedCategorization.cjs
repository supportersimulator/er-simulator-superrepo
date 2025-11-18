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

async function deploy() {
  const auth = getOAuth2Client();
  const script = google.script({ version: 'v1', auth });
  
  console.log('📥 Reading fixed Ultimate_Categorization_Tool_Complete.js...\n');
  
  const fixedContent = fs.readFileSync(
    path.join(__dirname, '../Ultimate_Categorization_Tool_Complete.js'),
    'utf8'
  );
  
  console.log('  Fixed file size: ' + fixedContent.length + ' characters');
  console.log('  Checking for problematic patterns...');
  
  if (fixedContent.includes('Ultimate_Categorization_Tool_Complete.js')) {
    console.log('  ❌ Still contains ".js" extension!');
    return;
  }
  
  console.log('  ✅ No .js extensions found in file identifiers');
  
  console.log('\n📤 Getting current project files...');
  
  const getResponse = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = getResponse.data.files;
  
  console.log('  Found ' + files.length + ' files in project\n');
  
  // Update Ultimate_Categorization_Tool_Complete
  const completeFile = files.find(f => f.name === 'Ultimate_Categorization_Tool_Complete');
  if (!completeFile) {
    console.log('❌ Ultimate_Categorization_Tool_Complete not found');
    return;
  }
  
  console.log('🔄 Updating Ultimate_Categorization_Tool_Complete...');
  completeFile.source = fixedContent;
  
  // Also create Phase2E version with modified identifier
  const phase2eFile = files.find(f => f.name === 'Ultimate_Categorization_Tool_Phase2E');
  if (phase2eFile) {
    console.log('🔄 Updating Ultimate_Categorization_Tool_Phase2E...');
    const phase2eContent = fixedContent
      .replace(/Ultimate Categorization Tool \(Complete\)/g, 'Ultimate Categorization Tool (Phase2E)');
    phase2eFile.source = phase2eContent;
  }
  
  // Send ALL files back (required by Apps Script API)
  await script.projects.updateContent({
    scriptId: SCRIPT_ID,
    requestBody: { files: files }
  });
  
  console.log('\n✅ Ultimate Categorization Tool files updated with fixed identifiers!');
  console.log('\n🔍 Please test the Ultimate Categorization Tool to verify it works.');
}

deploy().catch(console.error);
