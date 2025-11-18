#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || process.env.SHEET_ID;

async function listAllSheets() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oauth2Client.setCredentials(token);

  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

  const response = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID
  });

  console.log('\n All Sheets:');
  response.data.sheets.forEach((sheet, idx) => {
    console.log(`  ${idx + 1}. ${sheet.properties.title}`);
  });
  console.log('');
}

listAllSheets().catch(console.error);
