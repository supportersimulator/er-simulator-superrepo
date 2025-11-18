#!/usr/bin/env node
/**
 * Export Google Sheets Tabs
 * Exports key tabs from Master Sim Sheet
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const OUTPUT_DIR = path.join(__dirname, '..', '..', '..', 'scenario-csv-raw', 'sheets-exports');

async function authenticateSheets() {
  const credentials = {
    installed: {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uris: ['http://localhost']
    }
  };

  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  if (!fs.existsSync(TOKEN_PATH)) {
    console.error('❌ Token file not found at:', TOKEN_PATH);
    process.exit(1);
  }

  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
  oAuth2Client.setCredentials(token);

  return oAuth2Client;
}

function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function arrayToCSV(data) {
  return data.map(row =>
    row.map(cell => escapeCSV(cell)).join(',')
  ).join('\n');
}

async function exportSheetTabs(auth) {
  console.log('📊 Exporting Google Sheets...\n');
  console.log(`Sheet ID: ${SHEET_ID}\n`);

  const sheets = google.sheets({ version: 'v4', auth });

  try {
    // Get sheet metadata
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SHEET_ID,
    });

    const title = spreadsheet.data.properties.title;
    const sheetsList = spreadsheet.data.sheets;

    console.log(`✅ Spreadsheet: "${title}"`);
    console.log(`📑 Found ${sheetsList.length} tabs\n`);

    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Export each tab
    const exportedTabs = [];
    for (const sheet of sheetsList) {
      const sheetTitle = sheet.properties.title;
      const sheetId = sheet.properties.sheetId;

      console.log(`📄 Exporting tab: "${sheetTitle}"...`);

      try {
        // Get tab data
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SHEET_ID,
          range: `'${sheetTitle}'`,
        });

        const values = response.data.values || [];

        if (values.length === 0) {
          console.log(`   ⚠️  Tab is empty, skipping`);
          continue;
        }

        // Convert to CSV
        const csvContent = arrayToCSV(values);

        // Save to file
        const sanitizedTitle = sheetTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
        const outputPath = path.join(OUTPUT_DIR, `${sanitizedTitle}.csv`);
        fs.writeFileSync(outputPath, csvContent, 'utf-8');

        console.log(`   ✅ Saved: ${sanitizedTitle}.csv (${values.length} rows)`);

        exportedTabs.push({
          title: sheetTitle,
          sheetId: sheetId,
          fileName: `${sanitizedTitle}.csv`,
          rowCount: values.length,
          columnCount: values[0]?.length || 0
        });

      } catch (error) {
        console.log(`   ❌ Error exporting "${sheetTitle}": ${error.message}`);
      }
    }

    // Save metadata
    const metadataPath = path.join(OUTPUT_DIR, '_sheets_metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify({
      spreadsheetTitle: title,
      spreadsheetId: SHEET_ID,
      exportTime: new Date().toISOString(),
      tabCount: sheetsList.length,
      exportedCount: exportedTabs.length,
      tabs: exportedTabs
    }, null, 2));

    console.log(`\n📋 Metadata saved: _sheets_metadata.json`);
    console.log(`\n🎉 Export complete! ${exportedTabs.length}/${sheetsList.length} tabs saved to:`);
    console.log(`   ${OUTPUT_DIR}\n`);

    return exportedTabs.length;

  } catch (error) {
    console.error('❌ Error exporting sheets:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const auth = await authenticateSheets();
    const tabCount = await exportSheetTabs(auth);
    console.log(`✅ Successfully exported ${tabCount} tabs from Google Sheets`);
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    process.exit(1);
  }
}

main();
