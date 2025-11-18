#!/usr/bin/env node

/**
 * SHOW ALL WITH BADGES
 * Show all selected fields that exist, with AI recommended badge
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

async function authorize() {
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const tokenPath = path.join(__dirname, '../config/token.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

async function update() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading current code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('🔧 Updating rendering to show AI badge for overlapping fields...\n');

    // Update Section 1 rendering to include AI badge
    const oldSection1Render = `'      label.textContent = field.name;'`;

    const newSection1Render = `'      var isAlsoRecommended = data.recommended.indexOf(field.name) !== -1;' +
      '      label.innerHTML = field.name + (isAlsoRecommended ? \" <span style=\\\\\"color:#ff9800;font-weight:bold\\\\\">💡</span>\" : \"\");'`;

    code = code.replace(oldSection1Render, newSection1Render);

    console.log('✅ Added AI recommendation badge to Section 1\n');

    // Update the section 1 header to show count including AI overlaps
    const oldHeader1 = `'    header1.textContent = "✅ SELECTED FIELDS (" + selectedFields.length + ") - Default or Previously Saved";'`;

    const newHeader1 = `'    var overlappingCount = selectedFields.filter(function(f) { return data.recommended.indexOf(f.name) !== -1; }).length;' +
      '    var headerText = "✅ SELECTED FIELDS (" + selectedFields.length + ")";' +
      '    if (overlappingCount > 0) {' +
      '      headerText += " - " + overlappingCount + " also AI recommended 💡";' +
      '    }' +
      '    header1.textContent = headerText;'`;

    code = code.replace(oldHeader1, newHeader1);

    console.log('✅ Updated Section 1 header to show overlap count\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('💡 AI BADGE SYSTEM ADDED!\n');
    console.log('Changes:\n');
    console.log('  ✅ Selected fields that AI also recommends get 💡 badge\n');
    console.log('  ✅ Section 1 header shows count of AI-recommended overlaps\n');
    console.log('  ✅ No more deduplication issues!\n');
    console.log('\nTry "Pre-Cache Rich Data" - selected fields with AI badge!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

update();
