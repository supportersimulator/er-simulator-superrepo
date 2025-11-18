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

async function findCacheFunctions() {
  const auth = getOAuth2Client();
  const script = google.script({ version: 'v1', auth });
  
  console.log('📥 Searching for cache-related functions...\n');
  
  const res = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = res.data.files;
  
  const cacheKeywords = ['cache', 'Cache', 'field', 'Field'];
  const functionPattern = /^function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/gm;
  
  console.log('CACHE-RELATED FUNCTIONS FOUND:');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  files.forEach(file => {
    if (file.type !== 'SERVER_JS') return;
    
    const matches = [...file.source.matchAll(functionPattern)];
    const cacheFunctions = matches
      .map(m => m[1])
      .filter(name => cacheKeywords.some(kw => name.includes(kw)));
    
    if (cacheFunctions.length > 0) {
      console.log(file.name + ':');
      cacheFunctions.forEach(fn => console.log('  - ' + fn));
      console.log('');
    }
  });
  
  console.log('═══════════════════════════════════════════════════════════════');
}

findCacheFunctions().catch(console.error);
