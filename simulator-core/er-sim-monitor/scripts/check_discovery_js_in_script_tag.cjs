#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function checkDiscoveryJSInScriptTag() {
  try {
    console.log('🔍 CHECKING IF DISCOVERY JS IS IN buildBirdEyeViewUI_ <SCRIPT> TAG\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const credPath = path.join(__dirname, '../config/credentials.json');
    const tokenPath = path.join(__dirname, '../config/token.json');

    const credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    oAuth2Client.setCredentials(token);

    const script = google.script({ version: 'v1', auth: oAuth2Client });
    const scriptId = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

    const content = await script.projects.getContent({ scriptId });
    const codeFile = content.data.files.find(f => f.name === 'Code');

    // Find buildBirdEyeViewUI_ function
    const funcStart = codeFile.source.indexOf('function buildBirdEyeViewUI_(');
    const funcEnd = codeFile.source.indexOf('\n}\n', funcStart) + 3;
    const funcCode = codeFile.source.substring(funcStart, funcEnd);

    console.log('📊 CHECKING buildBirdEyeViewUI_ FUNCTION:\n');

    // Find the <script> tag section
    const scriptStart = funcCode.indexOf("'  <script>' +");
    const scriptEnd = funcCode.indexOf("'  </script>' +");

    if (scriptStart === -1 || scriptEnd === -1) {
      console.log('❌ <script> tag not found in buildBirdEyeViewUI_\n');
      return;
    }

    const scriptSection = funcCode.substring(scriptStart, scriptEnd);

    console.log(`   <script> section size: ${scriptSection.length} characters\n`);

    // Check for Discovery tab functions
    const checks = [
      'function handleLogicTypeChange',
      'function discoverPathways',
      'addEventListener(\'change\', handleLogicTypeChange)',
      'addEventListener(\'click\', discoverPathways)',
      'logic-type-selector',
      'discover-btn'
    ];

    checks.forEach(check => {
      const found = scriptSection.includes(check);
      console.log(`   ${found ? '✅' : '❌'} ${check}`);
    });

    console.log('\n');

    if (!scriptSection.includes('handleLogicTypeChange')) {
      console.log('🐛 PROBLEM FOUND:\n');
      console.log('   Discovery tab JavaScript functions are NOT in the <script> tag!\n');
      console.log('   They need to be added to buildBirdEyeViewUI_() <script> section\n');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkDiscoveryJSInScriptTag();
