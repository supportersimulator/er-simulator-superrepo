#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

async function verifyRow82() {
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const {client_id, client_secret, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const tokenPath = path.join(__dirname, '../config/token.json');
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  oAuth2Client.setCredentials(token);

  const sheets = google.sheets({version: 'v4', auth: oAuth2Client});

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Master Scenario Convert!82:82'
  });

  const row = response.data.values[0];
  const vitalsIdx = 55;
  
  console.log('\n🔍 Row 82 Vitals (Current State):\n');
  console.log(row[vitalsIdx]);
  console.log('\n');
  
  const vitalsObj = JSON.parse(row[vitalsIdx]);
  console.log('Parsed object:');
  console.log(JSON.stringify(vitalsObj, null, 2));
  console.log('\nBP type:', typeof vitalsObj.bp);
  console.log('BP value:', vitalsObj.bp);
}

verifyRow82().catch(err => console.error('Error:', err.message));
