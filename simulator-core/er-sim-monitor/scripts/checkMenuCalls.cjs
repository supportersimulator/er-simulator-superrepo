const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SCRIPT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

function getOAuth2Client() {
  const clasprcPath = path.join(process.env.HOME, '.clasprc.json');
  const credentials = JSON.parse(fs.readFileSync(clasprcPath, 'utf8'));
  const token = credentials.tokens.default;
  const oauth2Client = new google.auth.OAuth2(token.client_id, token.client_secret);
  oauth2Client.setCredentials({
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    token_type: token.token_type,
    expiry_date: token.expiry_date
  });
  return oauth2Client;
}

async function checkMenuCalls() {
  const auth = getOAuth2Client();
  const script = google.script({ version: 'v1', auth });
  const getResponse = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = getResponse.data.files;

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('FINDING MENU DEFINITIONS:');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const codeFile = files.find(f => f.name === 'Code');
  if (codeFile && codeFile.source) {
    // Search for menu items related to Ultimate Categorization
    const menuRegex = /addItem\(['"](.*?Ultimate.*?Categorization.*?)['"],\s*['"](.*?)['"]\)/gi;
    let match;

    console.log('Menu items in Code.gs:\n');
    while ((match = menuRegex.exec(codeFile.source)) !== null) {
      console.log(`  Menu: "${match[1]}"`);
      console.log(`  Calls: ${match[2]}()`);
      console.log('');
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('CHECKING WHICH FUNCTIONS EXIST:');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Check for specific function names
  const functionsToCheck = [
    'showUltimateCategorizationDialog',
    'runUltimateCategorization',
    'processUltimateCategorizationBatch'
  ];

  functionsToCheck.forEach(funcName => {
    console.log(`\nFunction: ${funcName}()`);
    files.forEach(f => {
      if (f.source && f.source.includes(`function ${funcName}`)) {
        console.log(`  ✅ Found in: ${f.name}`);
      }
    });
  });

  console.log('\n\n═══════════════════════════════════════════════════════════════');
  console.log('SEARCHING FOR ACTUAL CATEGORIZATION EXECUTION:');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Look for where runUltimateCategorization is actually called
  files.forEach(f => {
    if (f.source && f.source.includes('runUltimateCategorization(')) {
      const calls = f.source.match(/runUltimateCategorization\([^)]*\)/g);
      if (calls) {
        console.log(`\n${f.name}:`);
        calls.forEach(call => {
          console.log(`  → ${call}`);
        });
      }
    }
  });
}

checkMenuCalls().catch(console.error);
