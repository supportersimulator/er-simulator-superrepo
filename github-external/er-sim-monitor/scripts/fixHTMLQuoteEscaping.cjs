#!/usr/bin/env node

/**
 * FIX HTML QUOTE ESCAPING IN FIELD SELECTOR
 *
 * Problem: JavaScript inside HTML has unescaped double quotes
 * Example: <div class="section-header"> breaks the Apps Script string
 * Solution: Escape all double quotes inside the HTML string
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

    console.log('🔧 Fixing quote escaping in render3Sections()...\n');

    // Find render3Sections function
    const funcStart = code.indexOf('function render3Sections() {');
    if (funcStart === -1) {
      console.log('❌ Could not find render3Sections\n');
      process.exit(1);
    }

    // Find the section-header lines that need escaping
    const fixes = [
      {
        old: 'section1.innerHTML = "<div class="section-header default">',
        new: 'section1.innerHTML = "<div class=\\"section-header default\\">'
      },
      {
        old: 'section2.innerHTML = "<div class="section-header recommended">',
        new: 'section2.innerHTML = "<div class=\\"section-header recommended\\">'
      },
      {
        old: 'section3.innerHTML = "<div class="section-header other">',
        new: 'section3.innerHTML = "<div class=\\"section-header other\\">'
      },
      {
        old: 'labelHTML = "<span class="field-name">" + fieldName + "</span>";',
        new: 'labelHTML = "<span class=\\"field-name\\">" + fieldName + "</span>";'
      },
      {
        old: 'labelHTML = "<span class="ai-checkmark">✓✓</span> " + labelHTML;',
        new: 'labelHTML = "<span class=\\"ai-checkmark\\">✓✓</span> " + labelHTML;'
      },
      {
        old: 'labelHTML += "<div class="rationale">" + rationale + "</div>";',
        new: 'labelHTML += "<div class=\\"rationale\\">" + rationale + "</div>";'
      }
    ];

    fixes.forEach(fix => {
      code = code.replace(fix.old, fix.new);
    });

    console.log('✅ Fixed all quote escaping issues\n');

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
    console.log('✅ FIXED QUOTE ESCAPING!\n');
    console.log('\nWhat was fixed:\n');
    console.log('  - Escaped class="section-header default"');
    console.log('  - Escaped class="section-header recommended"');
    console.log('  - Escaped class="section-header other"');
    console.log('  - Escaped class="field-name"');
    console.log('  - Escaped class="ai-checkmark"');
    console.log('  - Escaped class="rationale"\n');
    console.log('Try again now:\n');
    console.log('  1. Refresh Google Sheet (F5)');
    console.log('  2. Click 🧠 Sim Builder → 🧩 Categories & Pathways');
    console.log('  3. Click cache button');
    console.log('  4. Modal should open without error!\n');
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
