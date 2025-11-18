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

async function compareDataQuality() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('        DATA QUALITY COMPARISON ANALYSIS');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const sheets = createSheetsClient();

  // Get Master Scenario Convert sheet data
  const masterResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Master Scenario Convert!A1:J12'
  });

  const masterRows = masterResponse.data.values || [];
  
  console.log('📊 MASTER SCENARIO CONVERT SHEET:\n');
  console.log(`Total rows: ${masterRows.length}\n`);

  // Show header
  console.log('ROW 1 (HEADER - Tier 1):');
  console.log(`   ${(masterRows[0] || []).slice(0, 10).join(' | ')}`);
  console.log('');

  // Analyze original vs new rows
  console.log('ORIGINAL ROWS (Pre-existing data):');
  console.log('─────────────────────────────────────────────────');
  
  for (let i = 2; i <= 8; i++) {
    const row = masterRows[i] || [];
    const caseId = row[0] || 'N/A';
    const caseTitle = row[1] || 'N/A';
    const filledCells = row.filter(cell => cell && cell.toString().trim() !== '').length;
    console.log(`Row ${i + 1}: ${caseId} - "${caseTitle.substring(0, 40)}..."`);
    console.log(`   Filled cells: ${filledCells}/${row.length}`);
  }

  console.log('');
  console.log('NEW ROWS (AI-Generated from batch processing):');
  console.log('─────────────────────────────────────────────────');
  
  for (let i = 8; i < Math.min(masterRows.length, 12); i++) {
    const row = masterRows[i] || [];
    const caseId = row[0] || 'N/A';
    const caseTitle = row[1] || 'N/A';
    const filledCells = row.filter(cell => cell && cell.toString().trim() !== '').length;
    console.log(`Row ${i + 1}: ${caseId} - "${caseTitle.substring(0, 40)}..."`);
    console.log(`   Filled cells: ${filledCells}/${row.length}`);
  }

  console.log('');
  console.log('🔍 DETAILED ANALYSIS OF NEWEST ROW:');
  console.log('─────────────────────────────────────────────────');
  
  const newestRow = masterRows[masterRows.length - 1] || [];
  const newestRowIndex = masterRows.length;
  
  console.log(`Row ${newestRowIndex}: Full data sample\n`);
  
  for (let i = 0; i < Math.min(10, newestRow.length); i++) {
    const header = masterRows[0][i] || `Column ${i + 1}`;
    const value = newestRow[i] || 'EMPTY';
    const preview = value.toString().substring(0, 80);
    console.log(`   ${header}:`);
    console.log(`      ${preview}${value.length > 80 ? '...' : ''}`);
  }

  console.log('');
  console.log('✅ CONFIRMATION:');
  console.log('─────────────────────────────────────────────────');
  console.log('   Processing Method: OpenAI API (GPT-4)');
  console.log('   Input: HTML_Source + Word_Text from Input sheet');
  console.log('   Output: Structured JSON → Master sheet row');
  console.log('   Case ID: AI-generated based on scenario context');
  console.log('');

  console.log('═══════════════════════════════════════════════════');
  console.log('');
}

compareDataQuality().catch(console.error);
