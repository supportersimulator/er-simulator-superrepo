#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const TOKEN_PATH = path.join(__dirname, '../config/token.json');
const CREDS_PATH = path.join(__dirname, '../config/credentials.json');

async function compareRows() {
  const credentials = JSON.parse(fs.readFileSync(CREDS_PATH, 'utf8'));
  const { client_id, client_secret } = credentials.installed || credentials.web;
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, 'http://localhost');
  oauth2Client.setCredentials(token);
  
  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
  
  console.log('\n📊 FETCHING ROWS 188-193 FROM OUTPUT SHEET\n');
  
  // Fetch headers
  const headerResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "'Master Scenario Convert'!1:2",
  });
  
  const headers = headerResponse.data.values || [];
  const tier1 = headers[0] || [];
  const tier2 = headers[1] || [];
  
  // Fetch rows 188-193 (sheet rows 189-194, accounting for header offset)
  const dataResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "'Master Scenario Convert'!189:194",
  });
  
  const rows = dataResponse.data.values || [];
  
  console.log(`Found ${rows.length} row(s)\n`);
  console.log('='.repeat(80) + '\n');
  
  // Display summary of each row
  rows.forEach((row, idx) => {
    const rowNum = 188 + idx;
    const caseId = row[0] || 'N/A';
    const sparkTitle = row[1] || 'N/A';
    const revealTitle = row[2] || 'N/A';
    const category = row[11] || 'N/A';
    
    // Check vital signs completeness
    const initialVitals = row[24] || '';
    const state1Vitals = row[25] || '';
    const state2Vitals = row[26] || '';
    const state3Vitals = row[27] || '';
    const state4Vitals = row[28] || '';
    const state5Vitals = row[29] || '';
    
    const vitalsCount = [initialVitals, state1Vitals, state2Vitals, state3Vitals, state4Vitals, state5Vitals]
      .filter(v => v && v.length > 10).length;
    
    console.log(`Row ${rowNum}:`);
    console.log(`  Case ID: ${caseId}`);
    console.log(`  Spark Title: ${sparkTitle.substring(0, 60)}${sparkTitle.length > 60 ? '...' : ''}`);
    console.log(`  Reveal Title: ${revealTitle.substring(0, 60)}${revealTitle.length > 60 ? '...' : ''}`);
    console.log(`  Category: ${category}`);
    console.log(`  Total columns: ${row.length}`);
    console.log(`  Vitals states filled: ${vitalsCount}/6`);
    console.log(`  Initial Vitals: ${initialVitals.length > 0 ? '✅' : '❌'} (${initialVitals.length} chars)`);
    console.log(`  State 1: ${state1Vitals.length > 0 ? '✅' : '❌'} (${state1Vitals.length} chars)`);
    console.log(`  State 2: ${state2Vitals.length > 0 ? '✅' : '❌'} (${state2Vitals.length} chars)`);
    console.log(`  State 3: ${state3Vitals.length > 0 ? '✅' : '❌'} (${state3Vitals.length} chars)`);
    console.log(`  State 4: ${state4Vitals.length > 0 ? '✅' : '❌'} (${state4Vitals.length} chars)`);
    console.log(`  State 5: ${state5Vitals.length > 0 ? '✅' : '❌'} (${state5Vitals.length} chars)`);
    console.log('');
  });
  
  // Save detailed comparison
  const outputPath = path.join(__dirname, '../testing/results/rows_188_to_193_analysis.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    metadata: {
      timestamp: new Date().toISOString(),
      rowsAnalyzed: rows.length
    },
    rows: rows.map((row, idx) => ({
      rowNumber: 188 + idx,
      caseId: row[0],
      sparkTitle: row[1],
      revealTitle: row[2],
      category: row[11],
      totalColumns: row.length,
      vitalsData: {
        initial: row[24],
        state1: row[25],
        state2: row[26],
        state3: row[27],
        state4: row[28],
        state5: row[29]
      }
    }))
  }, null, 2));
  
  console.log(`📁 Full analysis saved to: ${outputPath}\n`);
}

compareRows().catch(console.error);
