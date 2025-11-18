#!/usr/bin/env node

/**
 * USE SINGLE QUOTES IN CSS VALUES
 *
 * Root cause: Apps Script's HtmlService parses the HTML string and when it sees:
 *   'font-family: "Courier New"'
 * It renders it as actual double quotes in the HTML output, which breaks HTML parsing.
 *
 * Solution: Use single quotes in CSS values:
 *   'font-family: \'Courier New\''
 * This renders as valid CSS and doesn't conflict with HTML attribute quoting.
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

    console.log('🔧 Replacing double quotes with single quotes in CSS...\n');

    // Find showFieldSelector function
    const funcStart = code.indexOf('function showFieldSelector() {');
    const funcEnd = code.indexOf('function saveFieldSelectionAndStartCache', funcStart);

    if (funcStart === -1 || funcEnd === -1) {
      console.log('❌ Could not find showFieldSelector function\n');
      process.exit(1);
    }

    let func = code.substring(funcStart, funcEnd);

    // Replace all CSS font-family values to use single quotes instead of double quotes
    // Change: "Segoe UI" → 'Segoe UI'
    // Change: "Courier New" → 'Courier New'

    func = func.replace(/\\"Segoe UI\\"/g, "\\'Segoe UI\\'");
    func = func.replace(/\\"Courier New\\"/g, "\\'Courier New\\'");

    console.log('✅ Replaced font-family double quotes with single quotes\n');

    // Replace the function
    code = code.substring(0, funcStart) + func + code.substring(funcEnd);

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
    console.log('New size:', (code.length / 1024).toFixed(1), 'KB\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ FIXED CSS QUOTES!\n');
    console.log('\nChanges made:\n');
    console.log('  Before: font-family: "Segoe UI"');
    console.log("  After:  font-family: 'Segoe UI'");
    console.log('');
    console.log('  Before: font-family: "Courier New"');
    console.log("  After:  font-family: 'Courier New'");
    console.log("\nCSS single quotes don't conflict with HTML attribute parsing.\n");
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
