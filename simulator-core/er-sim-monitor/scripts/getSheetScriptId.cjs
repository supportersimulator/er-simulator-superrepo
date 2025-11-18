#!/usr/bin/env node

/**
 * Get Apps Script ID from Container-Bound Sheet Script
 *
 * Container-bound scripts live inside Google Sheets and aren't visible
 * in Drive API searches. This script finds the script ID from the sheet itself.
 *
 * Usage:
 *   node scripts/getSheetScriptId.cjs
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

// OAuth2 credentials
const OAUTH_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const OAUTH_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SHEET_ID = process.env.SHEET_ID;

/**
 * Load OAuth2 token from disk
 */
function loadToken() {
  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error(`Token file not found at ${TOKEN_PATH}. Run 'npm run auth-google' first.`);
  }
  const tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  return tokenData;
}

/**
 * Create authenticated Drive API client
 */
function createDriveClient() {
  const oauth2Client = new google.auth.OAuth2(
    OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );

  const token = loadToken();
  oauth2Client.setCredentials(token);

  return google.drive({ version: 'v3', auth: oauth2Client });
}

/**
 * Get container-bound Apps Script ID from sheet
 */
async function getSheetScriptId() {
  console.log('');
  console.log('🔍 CONTAINER-BOUND APPS SCRIPT DISCOVERY');
  console.log('════════════════════════════════════════════════════');
  console.log(`Sheet ID: ${SHEET_ID}`);
  console.log('════════════════════════════════════════════════════');
  console.log('');

  try {
    const drive = createDriveClient();

    // Get sheet details
    console.log('📊 Fetching sheet details...');
    const sheetResponse = await drive.files.get({
      fileId: SHEET_ID,
      fields: 'id, name, webViewLink, owners'
    });

    const sheet = sheetResponse.data;
    console.log('');
    console.log(`✅ Found sheet: "${sheet.name}"`);
    console.log(`   URL: ${sheet.webViewLink}`);
    console.log(`   Owner: ${sheet.owners?.[0]?.displayName || 'Unknown'}`);
    console.log('');

    // List all files in Drive to find Apps Script projects
    console.log('🔎 Searching for container-bound script...');
    console.log('');

    // Try to find the script by looking for related Apps Script files
    // Container-bound scripts have the same parent as the sheet
    const scriptsResponse = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.script'`,
      fields: 'files(id, name, parents, createdTime, modifiedTime, webViewLink)',
      orderBy: 'modifiedTime desc',
      pageSize: 100
    });

    const scripts = scriptsResponse.data.files || [];

    if (scripts.length > 0) {
      console.log(`✅ Found ${scripts.length} Apps Script project(s):`);
      console.log('');

      scripts.forEach((script, index) => {
        console.log(`📋 Script ${index + 1}:`);
        console.log(`   Name: ${script.name}`);
        console.log(`   Script ID: ${script.id}`);
        console.log(`   URL: ${script.webViewLink || 'N/A'}`);
        console.log(`   Created: ${new Date(script.createdTime).toLocaleString()}`);
        console.log(`   Modified: ${new Date(script.modifiedTime).toLocaleString()}`);
        console.log(`   Parents: ${script.parents?.join(', ') || 'None'}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No Apps Script projects found via Drive API.');
      console.log('');
    }

    // Alternative method: Extract script ID from sheet directly
    console.log('═══════════════════════════════════════════════════');
    console.log('📌 ALTERNATIVE METHOD: Direct Script ID Lookup');
    console.log('');
    console.log('For container-bound scripts, the Script ID may not be discoverable via API.');
    console.log('You can find it manually:');
    console.log('');
    console.log('1. Open your Google Sheet:');
    console.log(`   ${sheet.webViewLink}`);
    console.log('');
    console.log('2. Go to: Extensions → Apps Script');
    console.log('');
    console.log('3. In the Apps Script editor, look at the URL:');
    console.log('   https://script.google.com/home/projects/YOUR_SCRIPT_ID/edit');
    console.log('');
    console.log('4. Copy the YOUR_SCRIPT_ID part');
    console.log('');
    console.log('5. Add to your .env file:');
    console.log('   APPS_SCRIPT_ID=your-script-id-here');
    console.log('');
    console.log('═══════════════════════════════════════════════════');

    // Try to access the sheet's bound script if possible
    console.log('');
    console.log('🔧 Attempting to detect bound script via Sheets API...');
    console.log('');

    const sheets = google.sheets({ version: 'v4', auth: createDriveClient().context._options.auth });

    try {
      // Try to get spreadsheet metadata which might include script info
      const spreadsheetResponse = await sheets.spreadsheets.get({
        spreadsheetId: SHEET_ID
      });

      console.log('✅ Successfully accessed spreadsheet via Sheets API');
      console.log(`   Title: ${spreadsheetResponse.data.properties.title}`);
      console.log('');

      // Note: The Sheets API doesn't directly expose the script ID
      // but we can confirm the sheet is accessible

    } catch (error) {
      console.log(`⚠️  Could not access sheet via Sheets API: ${error.message}`);
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════');
    console.log('✅ DISCOVERY COMPLETE');
    console.log('');
    console.log('Next step: Manually find the Script ID using the instructions above');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ DISCOVERY FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');

    if (error.message.includes('insufficient authentication scopes')) {
      console.error('💡 Solution: You need to re-authenticate with additional scopes');
      console.error('');
      console.error('   Run this to re-authenticate:');
      console.error('   1. Delete config/token.json');
      console.error('   2. Run: npm run auth-google');
      console.error('');
    }

    process.exit(1);
  }
}

// Run discovery
if (require.main === module) {
  getSheetScriptId().catch(console.error);
}

module.exports = { getSheetScriptId };
