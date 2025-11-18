#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SPREADSHEET_ID = '1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI';

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

async function inspectCache() {
  console.log('\n🔍 INSPECTING CACHE SHEET\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    // 1. Check if sheet exists
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      fields: 'sheets.properties'
    });

    const cacheSheet = spreadsheet.data.sheets.find(
      sheet => sheet.properties.title === 'Pathway_Analysis_Cache'
    );

    if (!cacheSheet) {
      console.log('❌ Cache sheet "Pathway_Analysis_Cache" NOT FOUND\n');
      console.log('Available sheets:');
      spreadsheet.data.sheets.forEach(sh => {
        console.log('   • ' + sh.properties.title);
      });
      console.log('\n');
      return;
    }

    console.log('✅ Cache sheet EXISTS\n');
    console.log('   Sheet ID:', cacheSheet.properties.sheetId);
    console.log('   Hidden:', cacheSheet.properties.hidden ? 'Yes' : 'No');
    console.log('');

    // 2. Read cache data
    const cacheData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Pathway_Analysis_Cache!A1:B10'
    });

    if (!cacheData.data.values || cacheData.data.values.length === 0) {
      console.log('❌ Cache sheet is EMPTY\n');
      return;
    }

    console.log('📊 Cache sheet has', cacheData.data.values.length, 'rows\n');

    // 3. Check header row
    if (cacheData.data.values.length > 0) {
      console.log('Row 1 (Header):');
      console.log('   A1:', cacheData.data.values[0][0]);
      console.log('   B1:', cacheData.data.values[0][1]);
      console.log('');
    }

    // 4. Check data row
    if (cacheData.data.values.length > 1) {
      const timestamp = cacheData.data.values[1][0];
      const jsonData = cacheData.data.values[1][1];

      console.log('Row 2 (Data):');
      console.log('   A2 (Timestamp):', timestamp);
      console.log('   A2 Type:', typeof timestamp);

      if (timestamp) {
        try {
          const date = new Date(timestamp);
          console.log('   A2 as Date:', date.toString());
          const now = new Date();
          const hoursOld = ((now - date) / (1000 * 60 * 60)).toFixed(1);
          console.log('   Cache age:', hoursOld, 'hours');
          console.log('   Valid (<24h)?:', hoursOld < 24 ? '✅ YES' : '❌ NO');
        } catch (e) {
          console.log('   ❌ Cannot parse timestamp:', e.message);
        }
      }

      console.log('');
      console.log('   B2 (JSON Data):');
      console.log('   B2 length:', jsonData ? jsonData.length : 0, 'characters');

      if (jsonData) {
        console.log('   First 200 chars:', jsonData.substring(0, 200));
        console.log('   Last 100 chars:', jsonData.substring(jsonData.length - 100));

        try {
          const parsed = JSON.parse(jsonData);
          console.log('   ✅ JSON is VALID');
          console.log('   Keys:', Object.keys(parsed).join(', '));

          if (parsed.allCases) {
            console.log('   allCases array length:', parsed.allCases.length);
            if (parsed.allCases.length > 0) {
              const firstCase = parsed.allCases[0];
              console.log('   First case keys:', Object.keys(firstCase).join(', '));
              console.log('   Field count:', Object.keys(firstCase).length);
            }
          } else {
            console.log('   ❌ NO allCases property!');
          }
        } catch (e) {
          console.log('   ❌ JSON PARSE FAILED:', e.message);
        }
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('❌ Error:', e.message, '\n');
  }
}

inspectCache().catch(console.error);
