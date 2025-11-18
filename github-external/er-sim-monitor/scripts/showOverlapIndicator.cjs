#!/usr/bin/env node

/**
 * SHOW OVERLAP INDICATOR
 * Show which defaults are ALSO AI-recommended with a visual badge
 * Keep all defaults in Section 1, but mark the ones AI agrees with
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

    console.log('🔧 Adding overlap indicator for defaults that AI also recommends...\n');

    // Find the section 1 rendering code
    const section1Start = code.indexOf('// Section 1: Selected fields');

    if (section1Start === -1) {
      console.log('❌ Could not find Section 1 rendering code\n');
      return;
    }

    // Find where we create the label for selected fields
    const labelCode = code.indexOf('label.textContent = field.name;', section1Start);

    if (labelCode === -1) {
      console.log('❌ Could not find label.textContent line\n');
      return;
    }

    // Replace the simple textContent with logic that adds indicator
    const oldLabel = 'label.textContent = field.name;';

    const newLabel = `// Check if this default field is ALSO AI-recommended
      var isAlsoRecommended = data.recommended.indexOf(field.name) !== -1;
      var indicatorBadge = isAlsoRecommended ? ' <span style="color:#4CAF50;font-weight:bold;font-size:14px;" title="AI also recommends this field">✓</span>' : '';
      label.innerHTML = field.name + indicatorBadge;`;

    code = code.replace(oldLabel, newLabel);

    // Also update the section 1 header to show overlap count
    const section1Header = code.indexOf("var section1Title = document.createElement('h3');");

    if (section1Header > -1) {
      const oldHeaderText = "section1Title.textContent = '✅ SELECTED FIELDS (' + selectedFields.length + ')';";

      const newHeaderText = `// Count how many defaults are also AI-recommended
      var overlapCount = selectedFields.filter(function(f) {
        return data.recommended.indexOf(f.name) !== -1;
      }).length;

      var headerText = '✅ SELECTED FIELDS (' + selectedFields.length + ')';
      if (overlapCount > 0) {
        headerText += ' — ' + overlapCount + ' also AI-recommended ✓';
      }
      section1Title.textContent = headerText;`;

      code = code.replace(oldHeaderText, newHeaderText);
    }

    // Make sure Section 2 doesn't show duplicates
    const section2Code = code.indexOf('// Section 2: AI Recommended');

    if (section2Code > -1) {
      // Find where we filter recommended fields
      const filterStart = code.indexOf('data.recommended.forEach(function(fieldName)', section2Code);

      if (filterStart > -1) {
        const oldFilter = 'data.recommended.forEach(function(fieldName) {';

        const newFilter = `// Only show recommendations that are NOT already in selected
      var selectedNames = selectedFields.map(function(f) { return f.name; });
      var uniqueRecommended = data.recommended.filter(function(name) {
        return selectedNames.indexOf(name) === -1;
      });

      uniqueRecommended.forEach(function(fieldName) {`;

        code = code.replace(oldFilter, newFilter);
      }
    }

    console.log('✅ Added overlap indicators and deduplication\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ OVERLAP INDICATORS ADDED!\n');
    console.log('\nNow the UI shows:\n');
    console.log('  📍 Section 1: ALL defaults (with ✓ if AI agrees)');
    console.log('  💡 Section 2: ONLY unique AI recommendations (not already in defaults)');
    console.log('  📋 Section 3: All other fields\n');
    console.log('Header shows: "35 fields — 8 also AI-recommended ✓"\n');
    console.log('Benefits:\n');
    console.log('  • See which defaults AI validates');
    console.log('  • No duplicate fields across sections');
    console.log('  • Clear what AI suggests beyond defaults\n');
    console.log('Try "Categories & Pathways" to see the overlap indicators!\n');
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
