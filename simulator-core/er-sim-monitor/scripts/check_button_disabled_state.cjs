#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function checkButtonDisabledState() {
  try {
    console.log('🔍 CHECKING BUTTON DISABLED STATE LOGIC\n');
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

    // Find buildBirdEyeViewUI_
    const funcStart = codeFile.source.indexOf('function buildBirdEyeViewUI_(');
    const funcEnd = codeFile.source.indexOf('\n}\n', funcStart);
    const funcCode = codeFile.source.substring(funcStart, funcEnd);

    // Check handleLogicTypeChange function
    const handleLogicStart = funcCode.indexOf('function handleLogicTypeChange()');
    if (handleLogicStart !== -1) {
      const handleLogicEnd = funcCode.indexOf("'    }' +", handleLogicStart);
      const handleLogicCode = funcCode.substring(handleLogicStart, handleLogicEnd + 10);
      
      console.log('📄 handleLogicTypeChange() FUNCTION:\n');
      console.log(handleLogicCode);
      console.log('\n');
    }

    // Check if button starts as disabled in HTML
    const buttonHTML = funcCode.substring(
      funcCode.indexOf('id="discover-btn"') - 100,
      funcCode.indexOf('id="discover-btn"') + 200
    );
    
    console.log('📄 BUTTON HTML:\n');
    console.log(buttonHTML);
    console.log('\n');

    console.log('🔍 EXPECTED BEHAVIOR:\n');
    console.log('1. Button starts disabled (grayed out)');
    console.log('2. Select logic type from dropdown');
    console.log('3. handleLogicTypeChange() fires');
    console.log('4. Sets btn.disabled = false (button becomes clickable)');
    console.log('5. Button changes from gray to blue');
    console.log('6. User can click button\n');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkButtonDisabledState();
