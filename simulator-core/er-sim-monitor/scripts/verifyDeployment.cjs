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

async function verify() {
  const auth = getOAuth2Client();
  const script = google.script({ version: 'v1', auth });
  
  console.log('📥 Downloading current deployed files...\n');
  
  const res = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = res.data.files;
  
  console.log('VERIFICATION RESULTS:');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const ultimateFiles = ['Ultimate_Categorization_Tool_Complete', 'Ultimate_Categorization_Tool_Phase2E'];
  
  ultimateFiles.forEach(fileName => {
    const file = files.find(f => f.name === fileName);
    if (!file) {
      console.log('❌ ' + fileName + ': NOT FOUND');
      return;
    }
    
    console.log('✅ ' + fileName + ':');
    console.log('   Size: ' + file.source.length + ' characters');
    
    // Check for problematic patterns
    const hasJsExtension = file.source.includes('_Tool_Complete.js') || file.source.includes('_Tool_Phase2E.js');
    if (hasJsExtension) {
      console.log('   ❌ STILL HAS .js EXTENSION IN FILE IDENTIFIERS!');
      
      // Show the problematic lines
      const lines = file.source.split('\n');
      lines.forEach((line, i) => {
        if (line.includes('_Tool_Complete.js') || line.includes('_Tool_Phase2E.js')) {
          console.log('      Line ' + (i + 1) + ': ' + line.trim().substring(0, 80));
        }
      });
    } else {
      console.log('   ✅ No .js extensions in file identifiers');
    }
    
    // Check for the correct pattern
    const hasCorrectPattern = file.source.includes('Ultimate Categorization Tool (Complete)') ||
                            file.source.includes('Ultimate Categorization Tool (Phase2E)');
    if (hasCorrectPattern) {
      console.log('   ✅ Has correct file identifier format');
    } else {
      console.log('   ⚠️  Could not find expected file identifier pattern');
    }
    
    console.log('');
  });
  
  // Check Code.gs for menu
  const codeFile = files.find(f => f.name === 'Code');
  if (codeFile) {
    console.log('✅ Code.gs:');
    console.log('   Size: ' + codeFile.source.length + ' characters');
    
    if (codeFile.source.includes('function onOpen()')) {
      console.log('   ✅ Has onOpen() function');
      
      // Check menu items
      const hasUltimateCat = codeFile.source.includes('openUltimateCategorization');
      const hasATSR = codeFile.source.includes('runATSRTitleGenerator');
      const hasPathways = codeFile.source.includes('runPathwayChainBuilder');
      
      console.log('   Menu items:');
      console.log('      ' + (hasATSR ? '✅' : '❌') + ' ATSR Titles Optimizer');
      console.log('      ' + (hasPathways ? '✅' : '❌') + ' Categories & Pathways');
      console.log('      ' + (hasUltimateCat ? '✅' : '❌') + ' Ultimate Categorization Tool');
    } else {
      console.log('   ❌ Missing onOpen() function');
    }
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════');
}

verify().catch(console.error);
