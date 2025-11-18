#!/usr/bin/env node

/**
 * INSPECT CACHE STRUCTURE
 *
 * Shows the actual structure of the cached JSON
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

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

async function inspectCache() {
  console.log('\n🔍 INSPECTING CACHE STRUCTURE\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: TEST_SHEET_ID,
      range: 'Pathway_Analysis_Cache!A:B'
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) {
      console.log('❌ No cached data found\n');
      return;
    }

    const timestamp = rows[1][0];
    const analysisJson = rows[1][1];

    console.log(`📅 Timestamp: ${timestamp}\n`);

    const analysis = JSON.parse(analysisJson);

    console.log('📊 TOP-LEVEL KEYS IN CACHED JSON:\n');
    Object.keys(analysis).forEach(key => {
      const value = analysis[key];
      let typeInfo;

      if (Array.isArray(value)) {
        typeInfo = `Array (${value.length} items)`;
      } else if (typeof value === 'object' && value !== null) {
        typeInfo = `Object (${Object.keys(value).length} keys)`;
      } else {
        typeInfo = typeof value;
      }

      console.log(`   • ${key}: ${typeInfo}`);
    });

    console.log('\n═══════════════════════════════════════════════════════════════\n');

    // Save full JSON for inspection
    const outputPath = '/tmp/cache_structure.json';
    fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2), 'utf8');
    console.log(`💾 Full cache JSON saved to: ${outputPath}\n`);

    // Show a sample if there are any arrays
    for (const [key, value] of Object.entries(analysis)) {
      if (Array.isArray(value) && value.length > 0) {
        console.log(`\n📋 SAMPLE FROM "${key}" ARRAY (first item):\n`);
        const firstItem = value[0];
        if (typeof firstItem === 'object') {
          console.log(`   Fields: ${Object.keys(firstItem).length}`);
          Object.keys(firstItem).forEach(field => {
            console.log(`   • ${field}`);
          });
        } else {
          console.log(`   Type: ${typeof firstItem}`);
          console.log(`   Value: ${JSON.stringify(firstItem).substring(0, 100)}`);
        }
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');
  }
}

inspectCache().catch(console.error);
