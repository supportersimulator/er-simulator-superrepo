#!/usr/bin/env node

/**
 * Re-authorize with full API scopes for comprehensive monitoring
 * - Apps Script API (existing)
 * - Apps Script Processes API (new - for executions)
 * - Google Sheets API (new - for cache sheet access)
 * - Apps Script Management API (new - for triggers)
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Full scopes needed for comprehensive monitoring
const SCOPES = [
  'https://www.googleapis.com/auth/script.projects',           // Read/write Apps Script projects (already have)
  'https://www.googleapis.com/auth/script.processes',          // NEW: Read execution logs
  'https://www.googleapis.com/auth/spreadsheets',              // NEW: Read/write spreadsheet data (cache sheet)
  'https://www.googleapis.com/auth/drive.readonly',            // NEW: Read Drive files (spreadsheet metadata)
];

const TOKEN_PATH = path.join(__dirname, '../config/token.json');
const CREDENTIALS_PATH = path.join(__dirname, '../config/credentials.json');

async function authorize() {
  console.log('\n🔐 RE-AUTHORIZING WITH FULL API SCOPES\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('📋 Requesting the following permissions:\n');
  console.log('   ✅ Apps Script Projects API');
  console.log('      - Deploy code updates');
  console.log('      - Read deployed functions\n');

  console.log('   🆕 Apps Script Processes API');
  console.log('      - Read recent executions');
  console.log('      - Check function performance');
  console.log('      - Analyze errors\n');

  console.log('   🆕 Google Sheets API');
  console.log('      - Read cache sheet data');
  console.log('      - Verify cache validity');
  console.log('      - Check cache age\n');

  console.log('   🆕 Google Drive API (read-only)');
  console.log('      - Access spreadsheet metadata');
  console.log('      - List sheets in workbook\n');

  console.log('═══════════════════════════════════════════════════════════════\n');

  // Load credentials
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Generate auth URL
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('🌐 AUTHORIZATION REQUIRED\n');
  console.log('Please visit this URL to authorize:\n');
  console.log(authUrl);
  console.log('\n');

  // Prompt for code
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question('Enter the authorization code from the browser: ', async (code) => {
      rl.close();

      try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);

        // Save token
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));

        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('✅ AUTHORIZATION SUCCESSFUL!\n');
        console.log('Token saved to: config/token.json\n');

        console.log('🎯 YOU CAN NOW:\n');
        console.log('   • Check recent executions and errors');
        console.log('   • Verify cache sheet existence and data');
        console.log('   • Monitor function performance');
        console.log('   • Analyze execution logs\n');

        console.log('📋 RUN THIS COMMAND TO CHECK CACHE STATUS:\n');
        console.log('   node scripts/checkCacheStatus.cjs\n');

        console.log('═══════════════════════════════════════════════════════════════\n');

        resolve();
      } catch (err) {
        console.error('\n❌ Error retrieving access token:', err.message);
        reject(err);
      }
    });
  });
}

authorize().catch(console.error);
