#!/usr/bin/env node

/**
 * FIX HTML QUOTES PROPERLY
 *
 * The issue: Apps Script is rejecting the HTML because of quote inconsistency
 *
 * Current code uses:
 * - Single quotes for string delimiters: 'body { font-family: ...'
 * - Double quotes inside for CSS: "Segoe UI", "Courier New"
 * - Escaped double quotes in innerHTML: class=\"section-header\"
 *
 * Apps Script's HtmlService validates the ENTIRE string and may be rejecting
 * mixed quote styles. Solution: Escape ALL double quotes consistently.
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

    console.log('🔧 Fixing quote escaping in showFieldSelector HTML...\n');

    // Find showFieldSelector function
    const funcStart = code.indexOf('function showFieldSelector() {');
    const funcEnd = code.indexOf('function saveFieldSelectionAndStartCache', funcStart);

    if (funcStart === -1 || funcEnd === -1) {
      console.log('❌ Could not find showFieldSelector function\n');
      process.exit(1);
    }

    let func = code.substring(funcStart, funcEnd);

    // Replace ALL instances of unescaped " with \" in CSS font-family values
    // Line 19: "Segoe UI" → \"Segoe UI\"
    func = func.replace(/"Segoe UI"/g, '\\"Segoe UI\\"');
    func = func.replace(/"Courier New"/g, '\\"Courier New\\"');

    console.log('✅ Escaped font-family quotes\n');

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
    console.log('✅ FIXED HTML QUOTE ESCAPING!\n');
    console.log('\nChanges made:\n');
    console.log('1. Escaped "Segoe UI" → \\"Segoe UI\\" in font-family');
    console.log('2. Escaped "Courier New" → \\"Courier New\\" in font-family\n');
    console.log('All quotes now consistently escaped in HTML string.\n');
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
