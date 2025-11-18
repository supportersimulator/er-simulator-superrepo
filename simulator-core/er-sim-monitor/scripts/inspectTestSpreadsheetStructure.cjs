#!/usr/bin/env node

/**
 * Inspect Test Spreadsheet Structure
 *
 * Lists all sheets and checks for data in Master Scenario Convert tab
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

async function inspectSpreadsheet() {
  console.log('\n🔍 INSPECTING TEST SPREADSHEET STRUCTURE\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    // Get spreadsheet metadata
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: TEST_SHEET_ID
    });

    console.log('Test Spreadsheet Tabs:\n');
    metadata.data.sheets.forEach((sheet, index) => {
      const title = sheet.properties.title;
      const rowCount = sheet.properties.gridProperties.rowCount;
      const colCount = sheet.properties.gridProperties.columnCount;
      console.log(`   ${index + 1}. "${title}" (${rowCount} rows × ${colCount} cols)`);
    });
    console.log('');

    // Find "Master Scenario Convert" tab
    const masterTab = metadata.data.sheets.find(s =>
      s.properties.title.includes('Master') ||
      s.properties.title.includes('Convert')
    );

    if (!masterTab) {
      console.log('⚠️  No "Master Scenario Convert" tab found!\n');
      console.log('Available tabs:');
      metadata.data.sheets.forEach(s => console.log(`   - ${s.properties.title}`));
      return;
    }

    const tabName = masterTab.properties.title;
    console.log(`Found master tab: "${tabName}"\n`);

    // Check row count
    console.log(`Checking first 210 rows of "${tabName}"...\n`);

    const data = await sheets.spreadsheets.values.get({
      spreadsheetId: TEST_SHEET_ID,
      range: `${tabName}!A1:E210`
    });

    if (!data.data.values || data.data.values.length === 0) {
      console.log('   ⚠️  No data found in master tab\n');
      return;
    }

    console.log(`   ✓ Found ${data.data.values.length} rows of data\n`);

    // Check Row 206 specifically
    console.log('Row 206 Data:\n');

    if (data.data.values.length < 206) {
      console.log(`   ❌ Row 206 does not exist (only ${data.data.values.length} rows found)\n`);
    } else {
      const row206 = data.data.values[205]; // Zero-indexed

      if (!row206 || row206.length === 0) {
        console.log('   ⚠️  Row 206 exists but is completely empty\n');
      } else {
        console.log(`   Column A (Sim ID): ${row206[0] || '(empty)'}`);
        console.log(`   Column B: ${row206[1] || '(empty)'}`);
        console.log(`   Column C: ${row206[2] || '(empty)'}`);
        console.log(`   Column D: ${row206[3] || '(empty)'}`);
        console.log(`   Column E: ${row206[4] || '(empty)'}`);
        console.log('');
      }
    }

    // Check for logging/reporting tabs
    console.log('Checking for logging tabs...\n');

    const loggingTabs = metadata.data.sheets.filter(s =>
      s.properties.title.toLowerCase().includes('log') ||
      s.properties.title.toLowerCase().includes('report') ||
      s.properties.title.toLowerCase().includes('batch')
    );

    if (loggingTabs.length === 0) {
      console.log('   ⚠️  No logging/reporting tabs found\n');
    } else {
      console.log('   Found logging tabs:');
      loggingTabs.forEach(tab => {
        console.log(`      • ${tab.properties.title}`);
      });
      console.log('');

      // Check first logging tab for recent entries
      const firstLogTab = loggingTabs[0].properties.title;
      console.log(`Checking "${firstLogTab}" for recent logs...\n`);

      try {
        const logData = await sheets.spreadsheets.values.get({
          spreadsheetId: TEST_SHEET_ID,
          range: `${firstLogTab}!A:C`
        });

        if (!logData.data.values || logData.data.values.length === 0) {
          console.log(`   ℹ️  "${firstLogTab}" is empty\n`);
        } else {
          console.log(`   ✓ Found ${logData.data.values.length} log entries\n`);
          console.log('   Last 5 entries:\n');
          const lastFive = logData.data.values.slice(-5);
          lastFive.forEach((entry, idx) => {
            const timestamp = entry[0] || '';
            const message = entry[1] || '';
            console.log(`      ${idx + 1}. ${timestamp} | ${message}`);
          });
          console.log('');
        }
      } catch (error) {
        console.log(`   ⚠️  Could not read "${firstLogTab}": ${error.message}\n`);
      }
    }

    // Check Settings sheet
    console.log('Checking Settings sheet...\n');

    try {
      const settingsData = await sheets.spreadsheets.values.get({
        spreadsheetId: TEST_SHEET_ID,
        range: 'Settings!A:B'
      });

      if (!settingsData.data.values) {
        console.log('   ⚠️  No Settings sheet found\n');
      } else {
        console.log('   ✓ Settings sheet exists\n');
        console.log('   Settings entries:\n');
        settingsData.data.values.forEach(row => {
          const key = row[0] || '';
          const value = row[1] || '';
          const displayValue = key.toLowerCase().includes('key') || key.toLowerCase().includes('api')
            ? value.substring(0, 7) + '...' + value.slice(-4)
            : value;
          console.log(`      ${key} = ${displayValue}`);
        });
        console.log('');
      }
    } catch (error) {
      console.log(`   ⚠️  Could not read Settings: ${error.message}\n`);
    }

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 STRUCTURE INSPECTION SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`\nTotal Tabs: ${metadata.data.sheets.length}`);
    console.log(`Master Tab: "${tabName}"`);
    console.log(`Row 206 Status: Check output above`);
    console.log(`Logging Tabs: ${loggingTabs.length} found`);
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

inspectSpreadsheet().catch(error => {
  console.error('\nInspection failed:', error.message);
  process.exit(1);
});
