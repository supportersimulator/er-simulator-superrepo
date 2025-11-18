#!/usr/bin/env node

/**
 * ADD CHECKMARK OVERLAP (FIXED)
 * Show ✓ next to defaults that AI also recommends
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

async function fix() {
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

    console.log('🔧 Adding checkmark for overlapping recommendations...\n');

    // Find where we create the label in Section 1
    const labelStart = code.indexOf('var label = document.createElement("label");', 187000);

    if (labelStart === -1) {
      console.log('❌ Could not find label creation in Section 1\n');
      return;
    }

    // Find the next occurrence of label.textContent after this
    const textContentStart = code.indexOf('label.textContent = field.name;', labelStart);

    if (textContentStart === -1) {
      console.log('❌ Could not find label.textContent\n');
      return;
    }

    const oldCode = 'label.textContent = field.name;';

    const newCode = `// Check if AI also recommends this default field
      var isAlsoRecommended = data.recommended && data.recommended.indexOf(field.name) !== -1;
      label.innerHTML = field.name + (isAlsoRecommended ? ' <span style="color:#4CAF50;font-weight:bold;margin-left:4px;" title="AI also recommends">✓</span>' : '');`;

    code = code.replace(oldCode, newCode);

    console.log('✅ Added checkmark indicator\n');

    // Also update Section 1 header to show overlap count
    const headerStart = code.indexOf('header1.textContent = "✅ SELECTED FIELDS ("', 186000);

    if (headerStart > -1) {
      const headerEnd = code.indexOf(';', headerStart);
      const oldHeader = code.substring(headerStart, headerEnd + 1);

      const newHeader = `// Count overlaps
      var overlapCount = selectedFields.filter(function(f) { return data.recommended && data.recommended.indexOf(f.name) !== -1; }).length;
      header1.textContent = "✅ SELECTED FIELDS (" + selectedFields.length + ")" + (overlapCount > 0 ? " — " + overlapCount + " also AI-recommended ✓" : "")`;

      code = code.replace(oldHeader, newHeader);
      console.log('✅ Updated header to show overlap count\n');
    }

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✓ CHECKMARK OVERLAP INDICATOR ADDED!\n');
    console.log('\nNow defaults show ✓ when AI also recommends them\n');
    console.log('Example:\n');
    console.log('  Case_Organization_Case_ID ✓\n');
    console.log('  Patient_Demographics_Age ✓\n');
    console.log('  Monitor_Vital_Signs_Initial_Vitals\n');
    console.log('\nHeader shows: "35 fields — 8 also AI-recommended ✓"\n');
    console.log('Try "Categories & Pathways" to see the checkmarks!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

fix();
