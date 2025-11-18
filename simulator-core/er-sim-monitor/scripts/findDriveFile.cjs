#!/usr/bin/env node

/**
 * Find File in Google Drive
 *
 * Searches for files by name in Google Drive
 *
 * Usage:
 *   node scripts/findDriveFile.cjs [search_term]
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

// OAuth2 credentials
const OAUTH_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const OAUTH_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');

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
 * Search for files in Drive
 */
async function findDriveFile(searchTerm) {
  console.log('');
  console.log('🔍 SEARCHING GOOGLE DRIVE');
  console.log('════════════════════════════════════════════════════');
  console.log(`Search term: "${searchTerm}"`);
  console.log('════════════════════════════════════════════════════');
  console.log('');

  try {
    const drive = createDriveClient();

    // Search for files
    const response = await drive.files.list({
      q: `name contains '${searchTerm}' and trashed=false`,
      fields: 'files(id, name, mimeType, webViewLink, createdTime, modifiedTime)',
      orderBy: 'modifiedTime desc',
      pageSize: 20
    });

    const files = response.data.files || [];

    if (files.length === 0) {
      console.log('⚠️  No files found matching that search term');
      console.log('');
      return;
    }

    console.log(`✅ Found ${files.length} file(s):\n`);

    files.forEach((file, index) => {
      console.log(`📄 File ${index + 1}:`);
      console.log(`   Name: ${file.name}`);
      console.log(`   ID: ${file.id}`);
      console.log(`   Type: ${file.mimeType}`);
      console.log(`   URL: ${file.webViewLink || 'N/A'}`);
      console.log(`   Created: ${new Date(file.createdTime).toLocaleString()}`);
      console.log(`   Modified: ${new Date(file.modifiedTime).toLocaleString()}`);
      console.log('');
    });

    // If it's a spreadsheet, read its structure
    const spreadsheets = files.filter(f =>
      f.mimeType === 'application/vnd.google-apps.spreadsheet'
    );

    if (spreadsheets.length > 0) {
      console.log('════════════════════════════════════════════════════');
      console.log('📊 SPREADSHEET DETAILS');
      console.log('════════════════════════════════════════════════════');
      console.log('');

      const sheets = google.sheets({ version: 'v4', auth: createDriveClient().context._options.auth });

      for (const spreadsheet of spreadsheets) {
        console.log(`📊 "${spreadsheet.name}" (${spreadsheet.id})`);
        console.log('');

        try {
          const sheetResponse = await sheets.spreadsheets.get({
            spreadsheetId: spreadsheet.id,
            fields: 'sheets.properties'
          });

          const sheetTabs = sheetResponse.data.sheets || [];
          console.log(`   Tabs (${sheetTabs.length}):`);
          sheetTabs.forEach(tab => {
            console.log(`   - ${tab.properties.title} (${tab.properties.gridProperties.rowCount} rows x ${tab.properties.gridProperties.columnCount} cols)`);
          });
          console.log('');

        } catch (err) {
          console.log(`   ⚠️  Could not read tabs: ${err.message}`);
          console.log('');
        }
      }
    }

  } catch (error) {
    console.error('');
    console.error('❌ SEARCH FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');

    if (error.message.includes('insufficient authentication')) {
      console.error('💡 Solution: Re-authenticate with Drive access');
      console.error('');
      console.error('   Run: npm run auth-google');
      console.error('');
    }

    process.exit(1);
  }
}

// Run search
const searchTerm = process.argv[2] || 'emsim_final';
if (require.main === module) {
  findDriveFile(searchTerm).catch(console.error);
}

module.exports = { findDriveFile };
