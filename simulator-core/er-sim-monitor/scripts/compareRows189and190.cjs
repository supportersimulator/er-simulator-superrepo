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
  
  console.log('\n📊 COMPARING ROWS 189 & 190\n');
  
  // Fetch headers (rows 1-2)
  const headerResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "'Master Scenario Convert'!1:2",
  });
  
  const headers = headerResponse.data.values || [];
  const tier1 = headers[0] || [];
  const tier2 = headers[1] || [];
  
  // Fetch data rows 189 and 190 (sheet rows 189+2=191 and 190+2=192, accounting for 2 header rows)
  // Actually, if row 1-2 are headers, then data row 1 is at sheet row 3
  // So data row 189 is at sheet row 189+2 = 191
  // And data row 190 is at sheet row 190+2 = 192
  
  const dataResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "'Master Scenario Convert'!189:190",  // These are data rows 187 and 188
  });
  
  const rows = dataResponse.data.values || [];
  
  if (rows.length < 2) {
    console.log('❌ Only found', rows.length, 'row(s)');
    console.log('Trying different range...\n');
    
    // Try fetching the last 2 rows
    const lastRowsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "'Master Scenario Convert'!188:191",
    });
    
    const lastRows = lastRowsResponse.data.values || [];
    console.log(`Found ${lastRows.length} rows in range 188:191`);
    
    if (lastRows.length >= 2) {
      const row189 = lastRows[lastRows.length - 2];
      const row190 = lastRows[lastRows.length - 1];
      
      await analyzeRows(row189, row190, tier1, tier2);
    }
    return;
  }
  
  await analyzeRows(rows[0], rows[1], tier1, tier2);
}

async function analyzeRows(row189, row190, tier1, tier2) {
  console.log(`\nRow 189: ${row189.length} columns`);
  console.log(`Row 190: ${row190.length} columns\n`);
  console.log('='.repeat(80));
  
  let differenceCount = 0;
  let comparisonResults = [];
  
  for (let i = 0; i < Math.max(row189.length, row190.length); i++) {
    const fieldName = tier2[i] ? `${tier1[i]}:${tier2[i]}` : (tier1[i] || `Column ${i+1}`);
    const val189 = row189[i] || '';
    const val190 = row190[i] || '';
    
    if (val189 !== val190) {
      differenceCount++;
      comparisonResults.push({
        column: i + 1,
        field: fieldName,
        row189: val189,
        row190: val190,
        lengthDiff: val190.length - val189.length
      });
    }
  }
  
  console.log(`\n📈 COMPARISON SUMMARY:`);
  console.log(`   Total fields compared: ${Math.max(row189.length, row190.length)}`);
  console.log(`   Fields that differ: ${differenceCount}\n`);
  
  if (differenceCount === 0) {
    console.log('✅ Rows are IDENTICAL');
  } else {
    console.log(`📋 TOP 15 DIFFERENCES:\n`);
    comparisonResults.slice(0, 15).forEach((diff, idx) => {
      console.log(`${idx + 1}. ${diff.field} (Col ${diff.column})`);
      console.log(`   Row 189 (${diff.row189.length} chars): "${diff.row189.substring(0, 150)}${diff.row189.length > 150 ? '...' : ''}"`);
      console.log(`   Row 190 (${diff.row190.length} chars): "${diff.row190.substring(0, 150)}${diff.row190.length > 150 ? '...' : ''}"`);
      console.log(`   Δ: ${diff.lengthDiff > 0 ? '+' : ''}${diff.lengthDiff} chars\n`);
    });
    
    if (differenceCount > 15) {
      console.log(`\n... and ${differenceCount - 15} more differences`);
    }
  }
  
  // Save full comparison
  const outputPath = path.join(__dirname, '../testing/results/row_comparison_189_vs_190.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    summary: {
      totalFields: Math.max(row189.length, row190.length),
      fieldsDifferent: differenceCount
    },
    row189: row189,
    row190: row190,
    differences: comparisonResults
  }, null, 2));
  
  console.log(`\n📁 Full comparison saved to: ${outputPath}`);
}

compareRows().catch(console.error);
