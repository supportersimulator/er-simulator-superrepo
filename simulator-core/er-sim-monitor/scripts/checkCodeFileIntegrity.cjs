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

async function checkCodeFile() {
  const auth = getOAuth2Client();
  const script = google.script({ version: 'v1', auth });

  console.log('🔍 Checking Code.gs file integrity...\n');

  const getResponse = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = getResponse.data.files;

  const codeFile = files.find(f => f.name === 'Code');

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('CODE.GS FILE ANALYSIS:');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Check for syntax errors
  console.log('1. CHECKING FOR SYNTAX ERRORS:\n');

  // Check for unmatched braces
  const openBraces = (codeFile.source.match(/{/g) || []).length;
  const closeBraces = (codeFile.source.match(/}/g) || []).length;
  console.log(`   Open braces: ${openBraces}`);
  console.log(`   Close braces: ${closeBraces}`);
  if (openBraces === closeBraces) {
    console.log('   ✅ Braces are balanced');
  } else {
    console.log(`   ❌ SYNTAX ERROR: ${Math.abs(openBraces - closeBraces)} unmatched braces`);
  }

  // Check for unmatched parentheses
  const openParens = (codeFile.source.match(/\(/g) || []).length;
  const closeParens = (codeFile.source.match(/\)/g) || []).length;
  console.log(`\n   Open parentheses: ${openParens}`);
  console.log(`   Close parentheses: ${closeParens}`);
  if (openParens === closeParens) {
    console.log('   ✅ Parentheses are balanced');
  } else {
    console.log(`   ❌ SYNTAX ERROR: ${Math.abs(openParens - closeParens)} unmatched parentheses`);
  }

  console.log('\n2. CHECKING MENU FUNCTIONS:\n');

  // Check for all expected menu functions
  const menuFunctions = [
    'runATSRTitleGenerator',
    'runPathwayChainBuilder',
    'openUltimateCategorization',
    'openEnhancedVisualPanel',
    'openSimSidebar'
  ];

  menuFunctions.forEach(funcName => {
    const regex = new RegExp(`function ${funcName}\\s*\\(`);
    if (regex.test(codeFile.source)) {
      console.log(`   ✅ ${funcName}() exists`);
    } else {
      console.log(`   ❌ ${funcName}() NOT FOUND`);
    }
  });

  console.log('\n3. CHECKING FILE ORDER:\n');

  files.forEach((file, index) => {
    console.log(`   ${index + 1}. ${file.name}`);
  });

  console.log('\n4. CHECKING IF CODE FILE WAS MODIFIED:\n');

  // Get last 50 lines of Code file
  const lines = codeFile.source.split('\n');
  console.log(`   Total lines: ${lines.length}`);
  console.log(`   Last line: "${lines[lines.length - 1]}"`);

  // Check if there are any obvious corruption signs
  const lastChunk = lines.slice(-50).join('\n');
  if (lastChunk.includes('Ultimate_Categorization_Tool')) {
    console.log('   ❌ WARNING: Ultimate Categorization code found at end of Code.gs');
    console.log('   This suggests files may have been concatenated incorrectly');
  } else {
    console.log('   ✅ No obvious corruption detected');
  }

  console.log('\n5. FILE SIZE COMPARISON:\n');
  console.log(`   Code.gs: ${lines.length} lines`);
  console.log(`   Ultimate_Categorization_Tool_Complete: ${files.find(f => f.name === 'Ultimate_Categorization_Tool_Complete').source.split('\n').length} lines`);

  console.log('\n═══════════════════════════════════════════════════════════════');
}

checkCodeFile().catch(console.error);
