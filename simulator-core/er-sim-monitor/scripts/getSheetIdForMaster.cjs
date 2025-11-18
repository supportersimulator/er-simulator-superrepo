#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

async function getSheetId() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oauth2Client.setCredentials(token);

  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

  const response = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID
  });

  const masterSheet = response.data.sheets.find(s =>
    s.properties.title === 'Master Scenario Convert'
  );

  if (masterSheet) {
    console.log('Sheet ID:', masterSheet.properties.sheetId);
  } else {
    console.log('Available sheets:');
    response.data.sheets.forEach(s => {
      console.log(`  ${s.properties.title} (ID: ${s.properties.sheetId})`);
    });
  }
}

getSheetId();
