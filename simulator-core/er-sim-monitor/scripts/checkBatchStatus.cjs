#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const TOKEN_PATH = path.join(__dirname, '../config/token.json');
const CREDS_PATH = path.join(__dirname, '../config/credentials.json');

async function checkCurrentProgress() {
  const credentials = JSON.parse(fs.readFileSync(CREDS_PATH, 'utf8'));
  const { client_id, client_secret } = credentials.installed || credentials.web;
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));

  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, 'http://localhost');
  oauth2Client.setCredentials(token);

  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

  console.log('\n📊 CHECKING CURRENT BATCH PROCESSING STATUS\n');
  console.log('='.repeat(80) + '\n');

  // Check latest rows created
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "'Master Scenario Convert'!200:212",
  });

  const rows = response.data.values || [];

  console.log('🔍 ROWS 200-211 STATUS:\n');

  rows.forEach((row, idx) => {
    const rowNum = 200 + idx;
    const caseId = row[0] || 'EMPTY';
    const title = row[1] || 'EMPTY';

    if (caseId !== 'EMPTY') {
      console.log(`✅ Row ${rowNum}: ${caseId} - ${title.substring(0, 50)}...`);
    } else {
      console.log(`⚪ Row ${rowNum}: Not created yet`);
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log('📋 DUPLICATE PATTERN CHECK (Rows 200-205)\n');

  // Check recent rows for duplicate patterns
  const recentResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "'Master Scenario Convert'!200:206",
  });

  const recentRows = recentResponse.data.values || [];
  const titles = recentRows.map(row => row[1] || 'N/A');

  console.log('Recent titles:\n');
  titles.forEach((title, idx) => {
    if (title !== 'N/A') {
      console.log(`  Row ${200 + idx}: ${title}`);
    }
  });

  // Check for duplicate titles
  const validTitles = titles.filter(t => t !== 'N/A');
  const uniqueTitles = [...new Set(validTitles)];
  const duplicateTitles = validTitles.length - uniqueTitles.length;

  console.log(`\nTitle Analysis:`);
  console.log(`  Total: ${validTitles.length}`);
  console.log(`  Unique: ${uniqueTitles.length}`);
  console.log(`  Duplicates: ${duplicateTitles}`);

  if (duplicateTitles > 0) {
    console.log('\n⚠️  WARNING: Duplicate titles detected in this batch!');
  } else {
    console.log('\n✅ No duplicate titles in this batch');
  }
}

checkCurrentProgress().catch(console.error);
