#!/usr/bin/env node

/**
 * Check Batch Reports Detailed Logs
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TEST_SHEET_ID = '1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI';

async function authorize() {
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const tokenPath = path.join(__dirname, '../config/token.json');

  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);

  return oAuth2Client;
}

async function checkBatchReports() {
  console.log('\n📋 CHECKING BATCH REPORTS DETAILED LOGS\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    // Read all columns from Batch_Reports
    const data = await sheets.spreadsheets.values.get({
      spreadsheetId: TEST_SHEET_ID,
      range: 'Batch_Reports!A:Z'
    });

    if (!data.data.values || data.data.values.length === 0) {
      console.log('⚠️  Batch_Reports is empty\n');
      return;
    }

    console.log(`Found ${data.data.values.length} rows in Batch_Reports\n`);

    // Show headers
    console.log('Column Headers:\n');
    const headers = data.data.values[0];
    headers.forEach((header, idx) => {
      if (header) {
        console.log(`   Column ${String.fromCharCode(65 + idx)}: ${header}`);
      }
    });
    console.log('');

    // Show last 20 entries with all columns
    console.log('Last 20 Log Entries (All Columns):\n');
    const lastTwenty = data.data.values.slice(-20);

    lastTwenty.forEach((row, idx) => {
      const rowNum = data.data.values.length - 20 + idx + 1;
      console.log(`   Row ${rowNum}:`);

      row.forEach((cell, colIdx) => {
        if (cell) {
          const colLetter = String.fromCharCode(65 + colIdx);
          const header = headers[colIdx] || `Col ${colLetter}`;
          console.log(`      ${header}: ${cell}`);
        }
      });
      console.log('');
    });

    // Check for any error patterns
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔍 ERROR PATTERN ANALYSIS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const errorRows = data.data.values.filter(row =>
      row.some(cell =>
        typeof cell === 'string' &&
        (cell.toLowerCase().includes('error') ||
         cell.toLowerCase().includes('fail') ||
         cell.toLowerCase().includes('invalid') ||
         cell.toLowerCase().includes('row 206'))
      )
    );

    if (errorRows.length === 0) {
      console.log('   ✓ No explicit error messages found in logs\n');
    } else {
      console.log(`   ⚠️  Found ${errorRows.length} rows mentioning errors or Row 206:\n`);
      errorRows.forEach((row, idx) => {
        console.log(`   Error Entry ${idx + 1}:`);
        row.forEach((cell, colIdx) => {
          if (cell) {
            console.log(`      ${headers[colIdx] || 'Col' + colIdx}: ${cell}`);
          }
        });
        console.log('');
      });
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

checkBatchReports().catch(error => {
  console.error('\nCheck failed:', error.message);
  process.exit(1);
});
