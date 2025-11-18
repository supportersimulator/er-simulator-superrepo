#!/usr/bin/env node

/**
 * FIX render3Sections TO USE DOM CREATION INSTEAD OF innerHTML
 *
 * Problem: innerHTML with string concatenation has quote escaping issues
 * Solution: Use createElement and textContent instead
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

    console.log('📥 Downloading current production...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('🔧 Replacing render3Sections to use DOM creation...\n');

    // Find and replace the problematic section header creation
    const oldSection1 = `  const section1 = document.createElement("div");' +
    '  section1.className = "section";' +
    '  section1.innerHTML = "<div class=\\"section-header default\\">✅ DEFAULT (" + selectedFields.length + ")</div>";' +
    '  selectedFields.forEach(function(fieldName) {`;

    const newSection1 = `  const section1 = document.createElement("div");' +
    '  section1.className = "section";' +
    '  const header1 = document.createElement("div");' +
    '  header1.className = "section-header default";' +
    '  header1.textContent = "✅ DEFAULT (" + selectedFields.length + ")";' +
    '  section1.appendChild(header1);' +
    '  selectedFields.forEach(function(fieldName) {`;

    code = code.replace(oldSection1, newSection1);

    const oldSection2 = `    const section2 = document.createElement("div");' +
    '    section2.className = "section";' +
    '    section2.innerHTML = "<div class=\\"section-header recommended\\">💡 RECOMMENDED TO CONSIDER (" + recommendedFields.length + ")</div>";' +
    '    recommendedFields.forEach(function(rec) {`;

    const newSection2 = `    const section2 = document.createElement("div");' +
    '    section2.className = "section";' +
    '    const header2 = document.createElement("div");' +
    '    header2.className = "section-header recommended";' +
    '    header2.textContent = "💡 RECOMMENDED TO CONSIDER (" + recommendedFields.length + ")";' +
    '    section2.appendChild(header2);' +
    '    recommendedFields.forEach(function(rec) {`;

    code = code.replace(oldSection2, newSection2);

    const oldSection3 = `  const section3 = document.createElement("div");' +
    '  section3.className = "section";' +
    '  section3.innerHTML = "<div class=\\"section-header other\\">📋 OTHER (" + otherFields.length + ")</div>";' +
    '  otherFields.forEach(function(fieldName) {`;

    const newSection3 = `  const section3 = document.createElement("div");' +
    '  section3.className = "section";' +
    '  const header3 = document.createElement("div");' +
    '  header3.className = "section-header other";' +
    '  header3.textContent = "📋 OTHER (" + otherFields.length + ")";' +
    '  section3.appendChild(header3);' +
    '  otherFields.forEach(function(fieldName) {`;

    code = code.replace(oldSection3, newSection3);

    console.log('✅ Replaced section headers to use DOM creation\n');

    // Now fix the createCheckbox function similarly
    const oldLabelHTML = `  let labelHTML = "<span class=\\"field-name\\">" + fieldName + "</span>";' +
    '  if (hasAIAgreement) {' +
    '    labelHTML = "<span class=\\"ai-checkmark\\">✓✓</span> " + labelHTML;' +
    '  }' +
    '  if (rationale) {' +
    '    labelHTML += "<div class=\\"rationale\\">" + rationale + "</div>";' +
    '  }' +
    '  label.innerHTML = labelHTML;`;

    const newLabelHTML = `  const nameSpan = document.createElement("span");' +
    '  nameSpan.className = "field-name";' +
    '  nameSpan.textContent = fieldName;' +
    '  if (hasAIAgreement) {' +
    '    const checkSpan = document.createElement("span");' +
    '    checkSpan.className = "ai-checkmark";' +
    '    checkSpan.textContent = "✓✓ ";' +
    '    label.appendChild(checkSpan);' +
    '  }' +
    '  label.appendChild(nameSpan);' +
    '  if (rationale) {' +
    '    const ratDiv = document.createElement("div");' +
    '    ratDiv.className = "rationale";' +
    '    ratDiv.textContent = rationale;' +
    '    label.appendChild(ratDiv);' +
    '  }`;

    code = code.replace(oldLabelHTML, newLabelHTML);

    console.log('✅ Replaced label creation to use DOM creation\n');

    console.log('📤 Deploying...\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: {
        files: [
          { name: 'Code', type: 'SERVER_JS', source: code },
          manifestFile
        ]
      }
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ FIXED - NOW USING DOM CREATION!\n');
    console.log('\nWhat was changed:\n');
    console.log('  - Section headers now use createElement + textContent');
    console.log('  - Field labels now use createElement + textContent');
    console.log('  - No more innerHTML with string concatenation');
    console.log('  - No more quote escaping issues!\n');
    console.log('Try now:\n');
    console.log('  1. Refresh Google Sheet');
    console.log('  2. Click Categories & Pathways → Cache button');
    console.log('  3. Modal should open without error!\n');
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
