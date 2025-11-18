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

async function checkInputData() {
  console.log('📋 CHECKING INPUT SHEET DATA\n');
  
  const sheets = createSheetsClient();
  
  // Get Input sheet data
  const inputResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Input!A1:D10'
  });

  const inputRows = inputResponse.data.values || [];
  
  console.log('Input Sheet Rows:\n');
  inputRows.forEach((row, idx) => {
    const rowNum = idx + 1;
    const colA = row[0] || 'EMPTY';
    const colB = row[1] ? `${row[1].length} chars` : 'EMPTY';
    const colC = row[2] ? `${row[2].length} chars` : 'EMPTY';
    const colD = row[3] ? `${row[3].length} chars` : 'EMPTY';
    console.log(`Row ${rowNum}: A="${colA}" | B=${colB} | C=${colC} | D=${colD}`);
  });

  // Check emsim_final sheet
  console.log('\n\n📊 CHECKING EMSIM_FINAL SHEET\n');
  
  try {
    const emResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'emsim_final!A1:D10'
    });

    const emRows = emResponse.data.values || [];
    console.log(`Found ${emRows.length} rows in emsim_final\n`);
    
    emRows.forEach((row, idx) => {
      const rowNum = idx + 1;
      const colA = row[0] || 'EMPTY';
      const colB = row[1] ? `${row[1].length} chars` : 'EMPTY';
      const colC = row[2] ? `${row[2].length} chars` : 'EMPTY';
      const colD = row[3] ? `${row[3].length} chars` : 'EMPTY';
      console.log(`Row ${rowNum}: A="${colA}" | B=${colB} | C=${colC} | D=${colD}`);
    });
    
    console.log('\n✅ emsim_final sheet found - ready to copy data');
    
  } catch (error) {
    console.log('⚠️  emsim_final sheet not found or not accessible');
    console.log(`Error: ${error.message}`);
  }
}

checkInputData().catch(console.error);
