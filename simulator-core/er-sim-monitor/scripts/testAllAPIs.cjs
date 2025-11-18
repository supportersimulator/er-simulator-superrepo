#!/usr/bin/env node
/**
 * Test Google APIs Access
 * Tests: Drive API, Sheets API, Apps Script API
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const APPS_SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function testAPIs() {
  console.log('🧪 Testing Google API Access...\n');

  // Load OAuth credentials
  const credentials = {
    installed: {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uris: ['http://localhost']
    }
  };

  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Load token
  if (!fs.existsSync(TOKEN_PATH)) {
    console.error('❌ Token file not found at:', TOKEN_PATH);
    process.exit(1);
  }

  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
  oAuth2Client.setCredentials(token);

  // Test 1: Google Drive API
  console.log('📁 Testing Drive API...');
  try {
    const drive = google.drive({ version: 'v3', auth: oAuth2Client });
    const response = await drive.files.list({
      pageSize: 5,
      fields: 'files(id, name, mimeType)',
    });
    console.log('✅ Drive API: WORKING');
    console.log(`   Found ${response.data.files.length} files in Drive`);
    if (response.data.files.length > 0) {
      console.log(`   Sample: "${response.data.files[0].name}"`);
    }
  } catch (error) {
    console.error('❌ Drive API: FAILED');
    console.error('   Error:', error.message);
  }

  console.log('');

  // Test 2: Google Sheets API
  console.log('📊 Testing Sheets API...');
  try {
    const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SHEET_ID,
    });
    console.log('✅ Sheets API: WORKING');
    console.log(`   Sheet title: "${response.data.properties.title}"`);
    console.log(`   Sheet ID: ${SHEET_ID}`);
  } catch (error) {
    console.error('❌ Sheets API: FAILED');
    console.error('   Error:', error.message);
  }

  console.log('');

  // Test 3: Apps Script API
  console.log('🔧 Testing Apps Script API...');
  try {
    const script = google.script({ version: 'v1', auth: oAuth2Client });
    const response = await script.projects.get({
      scriptId: APPS_SCRIPT_ID,
    });
    console.log('✅ Apps Script API: WORKING');
    console.log(`   Project title: "${response.data.title}"`);
    console.log(`   Script ID: ${APPS_SCRIPT_ID}`);
  } catch (error) {
    console.error('❌ Apps Script API: FAILED');
    console.error('   Error:', error.message);
  }

  console.log('\n🏁 API Test Complete');
}

testAPIs().catch(console.error);
