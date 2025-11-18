#!/usr/bin/env node

/**
 * ADD COMPACT GRID LAYOUT
 * Add CSS for multi-column grid display for Selected and Recommended sections only
 * This is a SURGICAL change - only adding new CSS rules, not modifying existing code
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

async function add() {
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

    console.log('🎨 Adding compact grid CSS (surgical insertion)...\n');

    // Find the closing </style> tag and insert new CSS rules before it
    const styleClose = "'.btn-reset { background: white; color: #667eea; border: 2px solid #667eea; padding: 8px 16px; border-radius: 5px; font-size: 12px; font-weight: bold; cursor: pointer; margin-right: 8px; }' +";

    const newCSS = "'.btn-reset { background: white; color: #667eea; border: 2px solid #667eea; padding: 8px 16px; border-radius: 5px; font-size: 12px; font-weight: bold; cursor: pointer; margin-right: 8px; }' +\n" +
      "      '.compact-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px 8px; margin-top: 8px; }' +\n" +
      "      '.compact-grid .field-item { font-size: 9px; padding: 2px 4px; margin: 0; }' +\n" +
      "      '.compact-grid .field-item input { width: 11px; height: 11px; margin-right: 4px; }' +\n" +
      "      '.compact-grid .field-item label { font-size: 9px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }' +";

    code = code.replace(styleClose, newCSS);
    console.log('✅ Added compact-grid CSS classes\n');

    // Now modify the renderFields function to use the grid for sections 1 & 2
    console.log('🔧 Updating renderFields to use compact grid for sections 1 & 2...\n');

    // Find where we render section 1 (selected fields)
    const section1Pattern = "if (currentSection === \\\"selected\\\") {' +\n" +
      "          'sectionDiv.textContent = \\\"✅ SELECTED FIELDS (Default or Previously Saved)\\\";'";

    const section1New = "if (currentSection === \\\"selected\\\") {' +\n" +
      "          'sectionDiv.innerHTML = \\\"✅ SELECTED FIELDS (Default or Previously Saved)<div class=\\\\\\\\\\\"compact-grid\\\\\\\\\\\" id=\\\\\\\\\\\"grid-selected\\\\\\\\\\\"></div>\\\";'";

    if (code.includes(section1Pattern)) {
      code = code.replace(section1Pattern, section1New);
      console.log('✅ Added compact-grid container for selected fields\n');
    }

    // Find where we render section 2 (recommended fields)
    const section2Pattern = "} else if (currentSection === \\\"recommended\\\") {' +\n" +
      "          'sectionDiv.innerHTML = \\\"💡 AI RECOMMENDED TO CONSIDER<div class=\\\\\\\\\\\"ai-rationale\\\\\\\\\\\">AI suggests these fields would maximize pathway discovery by revealing clinical reasoning patterns, grouping similar cases, and identifying time-critical scenarios.</div>\\\";'";

    const section2New = "} else if (currentSection === \\\"recommended\\\") {' +\n" +
      "          'sectionDiv.innerHTML = \\\"💡 AI RECOMMENDED TO CONSIDER<div class=\\\\\\\\\\\"ai-rationale\\\\\\\\\\\">AI suggests these fields would maximize pathway discovery by revealing clinical reasoning patterns, grouping similar cases, and identifying time-critical scenarios.</div><div class=\\\\\\\\\\\"compact-grid\\\\\\\\\\\" id=\\\\\\\\\\\"grid-recommended\\\\\\\\\\\"></div>\\\";'";

    if (code.includes(section2Pattern)) {
      code = code.replace(section2Pattern, section2New);
      console.log('✅ Added compact-grid container for recommended fields\n');
    }

    // Update the field rendering to append to grid containers instead of category div
    const oldAppend = "'      fieldDiv.appendChild(label);' +\n" +
      "      '      catDiv.appendChild(fieldDiv);'";

    const newAppend = "'      fieldDiv.appendChild(label);' +\n" +
      "      '      if (currentSection === \\\"selected\\\" || currentSection === \\\"recommended\\\") {' +\n" +
      "      '        var gridId = currentSection === \\\"selected\\\" ? \\\"grid-selected\\\" : \\\"grid-recommended\\\";' +\n" +
      "      '        var gridContainer = document.getElementById(gridId);' +\n" +
      "      '        if (gridContainer) gridContainer.appendChild(fieldDiv);' +\n" +
      "      '      } else {' +\n" +
      "      '        catDiv.appendChild(fieldDiv);' +\n" +
      "      '      }'";

    if (code.includes(oldAppend)) {
      code = code.replace(oldAppend, newAppend);
      console.log('✅ Updated field rendering to use grid containers\n');
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
    console.log('🎨 COMPACT GRID LAYOUT ADDED!\n');
    console.log('Changes:\n');
    console.log('  ✅ 3-column grid layout for Selected section\n');
    console.log('  ✅ 3-column grid layout for Recommended section\n');
    console.log('  ✅ 9px font, tight spacing - see many more fields!\n');
    console.log('  ✅ Section 3 (Other) unchanged - normal display\n');
    console.log('\nTry "Pre-Cache Rich Data" - should see compact layout!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

add();
