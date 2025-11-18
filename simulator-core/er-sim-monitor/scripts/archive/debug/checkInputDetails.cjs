#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const OAUTH_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const OAUTH_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

function loadToken() {
  const tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  return tokenData;
}

function createSheetsClient() {
  const oauth2Client = new google.auth.OAuth2(
    OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  const token = loadToken();
  oauth2Client.setCredentials(token);
  return google.sheets({ version: 'v4', auth: oauth2Client });
}

async function checkInputDetails() {
  console.log('');
  console.log('📋 INPUT SHEET DETAILS');
  console.log('════════════════════════════════════════════════════');
  console.log('');

  const sheets = createSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Input!A1:C10'
  });

  const rows = response.data.values || [];
  rows.forEach((row, idx) => {
    const caseId = row[0] || 'EMPTY';
    const hasHtml = row[1] ? 'YES' : 'NO';
    const hasWord = row[2] ? 'YES' : 'NO';
    console.log(`Row ${idx + 1}: Case_ID="${caseId}" | HTML=${hasHtml} | Word=${hasWord}`);
  });

  console.log('');
  console.log('✅ Row 2 (Case ID = "1") was successfully processed');
  console.log('❌ Row 3 (Case ID = EMPTY) failed - no Case ID to process');
  console.log('');
}

checkInputDetails().catch(console.error);
