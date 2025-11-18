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
  
  console.log('📥 Checking Ultimate Categorization files...\n');
  
  const res = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = res.data.files;
  
  console.log('ULTIMATE CATEGORIZATION FILES STATUS:');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const ultimateFiles = [
    'Ultimate_Categorization_Tool_Complete',
    'Ultimate_Categorization_Tool_Phase2E'
  ];
  
  ultimateFiles.forEach(fileName => {
    const file = files.find(f => f.name === fileName);
    if (!file) {
      console.log('❌ ' + fileName + ': NOT FOUND\n');
      return;
    }
    
    console.log('✅ ' + fileName + ':');
    console.log('   Size: ' + file.source.length + ' characters');
    
    // Check for openUltimateCategorization function
    if (file.source.includes('function openUltimateCategorization')) {
      console.log('   ✅ Has openUltimateCategorization() function');
    } else {
      console.log('   ❌ Missing openUltimateCategorization() function');
    }
    
    // Check for problematic .js extensions
    const hasJsExt = file.source.includes('_Tool_Complete.js') || 
                     file.source.includes('_Tool_Phase2E.js');
    if (hasJsExt) {
      console.log('   ❌ STILL HAS .js EXTENSION IN IDENTIFIERS!');
      
      // Show the problematic lines
      const lines = file.source.split('\n');
      let count = 0;
      lines.forEach((line, i) => {
        if ((line.includes('_Tool_Complete.js') || line.includes('_Tool_Phase2E.js')) && count < 3) {
          console.log('      Line ' + (i + 1) + ': ' + line.trim().substring(0, 80));
          count++;
        }
      });
    } else {
      console.log('   ✅ No .js extensions in identifiers');
    }
    
    // Check for safe identifiers
    const hasSafeId = file.source.includes('Ultimate Categorization Tool (Complete)') ||
                      file.source.includes('Ultimate Categorization Tool (Phase2E)');
    if (hasSafeId) {
      console.log('   ✅ Has safe file identifiers');
    } else {
      console.log('   ⚠️  No safe identifiers found (might not have logging)');
    }
    
    console.log('');
  });
  
  console.log('═══════════════════════════════════════════════════════════════');
}

verify().catch(console.error);
