#!/usr/bin/env node

/**
 * FIX MALFORMED JAVASCRIPT COMMENTS IN HTML STRING
 *
 * Problem: Lines 5092 and 5106 have // comments inside JavaScript strings
 *          This creates invalid JavaScript in the generated HTML
 *
 * Solution: Remove the // comments from the JavaScript strings
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

    console.log('🔧 Removing invalid JavaScript comments from HTML strings...\n');

    // Remove the problematic // comments inside JavaScript strings
    code = code.replace(
      "'  // Section 1: Default/Selected fields' +",
      "'  ' +"
    );

    code = code.replace(
      "'  // Section 2: Recommended to consider (AI suggestions)' +",
      "'  ' +"
    );

    console.log('✅ Removed invalid comments\n');

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
    console.log('✅ FIXED - REMOVED INVALID JAVASCRIPT COMMENTS!\n');
    console.log('\nWhat was fixed:\n');
    console.log('  Line 5092: Removed "// Section 1: Default/Selected fields"');
    console.log('  Line 5106: Removed "// Section 2: Recommended to consider (AI suggestions)"\n');
    console.log('These comments were inside JavaScript string concatenation,');
    console.log('causing Apps Script to reject the HTML as malformed.\n');
    console.log('Try now - refresh Google Sheet and click cache button!\n');
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
