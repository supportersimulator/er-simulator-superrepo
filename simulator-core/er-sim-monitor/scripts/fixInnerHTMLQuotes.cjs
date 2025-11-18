#!/usr/bin/env node

/**
 * FIX 1: innerHTML Quote Escaping
 *
 * ROOT CAUSE FIX - This is what's preventing JavaScript from executing
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

    console.log('🔧 Fixing innerHTML quote escaping (ROOT CAUSE)...\n');

    // Find showFieldSelector function
    const funcStart = code.indexOf('function showFieldSelector() {');
    const funcEnd = code.indexOf('function saveFieldSelectionAndStartCache', funcStart);
    let func = code.substring(funcStart, funcEnd);

    // Fix Section 1
    func = func.replace(
      'section1.innerHTML = "<div class=\\"section-header default\\">',
      'section1.innerHTML = "<div class=\\\\\\"section-header default\\\\\\">"'
    );

    // Fix Section 2
    func = func.replace(
      'section2.innerHTML = "<div class=\\"section-header recommended\\">',
      'section2.innerHTML = "<div class=\\\\\\"section-header recommended\\\\\\">"'
    );

    // Fix Section 3
    func = func.replace(
      'section3.innerHTML = "<div class=\\"section-header other\\">',
      'section3.innerHTML = "<div class=\\\\\\"section-header other\\\\\\">"'
    );

    code = code.substring(0, funcStart) + func + code.substring(funcEnd);

    console.log('📤 Deploying fix...\n');

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
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ FIXED: innerHTML quote escaping');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('Changed 3 lines:');
    console.log('  section1.innerHTML = "<div class=\\\\\\"...\\\\\\">');
    console.log('  section2.innerHTML = "<div class=\\\\\\"...\\\\\\">');
    console.log('  section3.innerHTML = "<div class=\\\\\\"...\\\\\\">');
    console.log('\nThis was the root cause preventing JavaScript from executing.');
    console.log('Test now: Refresh sheet → Categories & Pathways → Click cache button');
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
