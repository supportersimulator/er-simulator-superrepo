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

async function checkAllFiles() {
  const auth = getOAuth2Client();
  const script = google.script({ version: 'v1', auth });
  
  console.log('📥 Downloading all project files...\n');
  
  const res = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = res.data.files;
  
  console.log('CHECKING ALL FILES FOR .js or .gs REFERENCES:');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const jsPatterns = [
    /\.js['"\)]/g,
    /\.gs['"\)]/g,
    /_Tool_Complete\.js/g,
    /_Tool_Phase2E\.js/g,
    /SOURCE FILE:.*\.js/g,
    /Executing from:.*\.js/g
  ];
  
  files.forEach(file => {
    if (file.type !== 'SERVER_JS') return;
    
    let foundIssues = false;
    const issues = [];
    
    jsPatterns.forEach(pattern => {
      const matches = file.source.match(pattern);
      if (matches && matches.length > 0) {
        foundIssues = true;
        issues.push({
          pattern: pattern.toString(),
          count: matches.length,
          samples: matches.slice(0, 3)
        });
      }
    });
    
    if (foundIssues) {
      console.log('⚠️  ' + file.name + ':');
      issues.forEach(issue => {
        console.log('   Pattern: ' + issue.pattern);
        console.log('   Count: ' + issue.count);
        console.log('   Samples: ' + issue.samples.join(', '));
        console.log('');
      });
    } else {
      console.log('✅ ' + file.name + ': No .js/.gs references found');
    }
  });
  
  console.log('\n═══════════════════════════════════════════════════════════════');
}

checkAllFiles().catch(console.error);
