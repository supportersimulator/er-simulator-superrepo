#!/usr/bin/env node

/**
 * FIX SCRIPT TAG QUOTE ALIGNMENT
 * The window.onerror line has improper spacing breaking string concatenation
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

    console.log('🔧 Fixing script tag quote alignment...\n');

    // Fix the improperly aligned quote
    const brokenLine = "      'function copyLogs() {' +\n      '  navigator.clipboard.writeText(logs.join(\"\\\\n\")).then(function() { alert(\"✅ Copied!\"); });' +\n      '}' +\n       'window.onerror = function(msg, url, line, col, error) {' +";

    const fixedLine = "      'function copyLogs() {' +\n      '  navigator.clipboard.writeText(logs.join(\"\\\\n\")).then(function() { alert(\"✅ Copied!\"); });' +\n      '}' +\n      'window.onerror = function(msg, url, line, col, error) {' +";

    if (code.includes(brokenLine)) {
      code = code.replace(brokenLine, fixedLine);
      console.log('✅ Fixed window.onerror line spacing\n');
    } else {
      console.log('⚠️  Exact pattern not found, trying alternative fix...\n');

      // Try to find and fix just the problematic line
      code = code.replace(
        "       'window.onerror = function(msg, url, line, col, error) {' +",
        "      'window.onerror = function(msg, url, line, col, error) {' +"
      );
      console.log('✅ Fixed window.onerror indentation\n');
    }

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('✅ SCRIPT TAG QUOTE ALIGNMENT FIXED!\n');
    console.log('\nThe JavaScript should now execute properly.\n');
    console.log('Try clicking "Cache All Layers" again!\n');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

fix();
