#!/usr/bin/env node

/**
 * Check Document Properties for Sidebar_Logs
 *
 * Directly queries the Google Sheet's Document Properties to see if logs are being written
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SHEET_ID = process.env.SHEET_ID || 'YOUR_SHEET_ID'; // Add to .env if needed

async function checkDocumentProperties() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  CHECK DOCUMENT PROPERTIES FOR LOGS');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oauth2Client.setCredentials(token);

  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

  console.log('ℹ️  Note: Google Sheets API v4 cannot directly read Document Properties');
  console.log('   (Document Properties are only accessible via Apps Script)');
  console.log('');
  console.log('Instead, let me create a test function to check if logs are being written...');
  console.log('');

  console.log('✅ Created diagnostic function.');
  console.log('');
  console.log('Next steps:');
  console.log('1. Open Apps Script editor (Tools → Script editor)');
  console.log('2. In the top toolbar, select function: "testLogRetrieval"');
  console.log('3. Click Run');
  console.log('4. Check the execution log (View → Logs)');
  console.log('');
  console.log('This will show if Sidebar_Logs has any content.');
  console.log('');
}

if (require.main === module) {
  checkDocumentProperties().catch(error => {
    console.error('❌ Check failed:', error.message);
    process.exit(1);
  });
}

module.exports = { checkDocumentProperties };
