#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function checkPathwaysMaster() {
  try {
    const credPath = path.join(__dirname, '../config/credentials.json');
    const tokenPath = path.join(__dirname, '../config/token.json');

    const credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    oAuth2Client.setCredentials(token);

    const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });
    const spreadsheetId = '1gSwT02UP1i28F0f3cnza3COURdod2SSkaGvhESlKnMo';

    // Get all sheets
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });

    console.log('📊 ALL SHEETS IN YOUR SPREADSHEET:\n');
    spreadsheet.data.sheets.forEach(sheet => {
      const name = sheet.properties.title;
      const isHidden = sheet.properties.hidden || false;
      const rowCount = sheet.properties.gridProperties.rowCount;
      const icon = isHidden ? '🔒' : '📄';
      const hiddenLabel = isHidden ? ' - HIDDEN' : '';
      console.log(`  ${icon} ${name} (${rowCount} rows)${hiddenLabel}`);
    });

    // Check if Pathways_Master exists
    const pathwaysMaster = spreadsheet.data.sheets.find(s => s.properties.title === 'Pathways_Master');

    if (pathwaysMaster) {
      console.log('\n✅ Pathways_Master sheet EXISTS!\n');
      const isHidden = pathwaysMaster.properties.hidden || false;

      if (isHidden) {
        console.log('⚠️  Sheet is HIDDEN\n');
        console.log('TO VIEW IT:');
        console.log('1. Go to your Google Sheet');
        console.log('2. Look at bottom tabs');
        console.log('3. Click the menu icon (≡) on the left');
        console.log('4. Find "Pathways_Master" and click the eye icon to unhide\n');
      } else {
        console.log('📍 LOCATION: Look for "Pathways_Master" tab at bottom of your Google Sheet\n');
      }

      // Get data from Pathways_Master
      const range = 'Pathways_Master!A1:R100';
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range
      });

      const rows = response.data.values || [];
      console.log(`📊 PATHWAYS DATA:\n`);
      console.log(`   Total rows: ${rows.length} (including header)\n`);

      if (rows.length > 0) {
        console.log(`   Columns: ${rows[0].slice(0, 8).join(', ')}...\n`);

        if (rows.length > 1) {
          console.log('   🎯 DISCOVERED PATHWAYS:\n');
          rows.slice(1, Math.min(11, rows.length)).forEach((row, idx) => {
            const pathwayName = row[1] || 'Unnamed';
            const logicType = row[2] || 'No logic type';
            const tier = row[7] || 'N/A';
            const score = row[6] || 'N/A';
            const category = row[3] || 'N/A';

            console.log(`   ${idx + 1}. ${pathwayName}`);
            console.log(`      Logic Type: ${logicType}`);
            console.log(`      Category: ${category}`);
            console.log(`      Score: ${score}/10 | Tier: ${tier}`);
            console.log('');
          });

          if (rows.length > 11) {
            console.log(`   ... and ${rows.length - 11} more pathways\n`);
          }
        } else {
          console.log('   ℹ️  No pathways discovered yet (only header row exists)\n');
        }
      }
    } else {
      console.log('\n❌ Pathways_Master sheet NOT FOUND\n');
      console.log('The sheet should have been created during Phase 1 deployment.');
      console.log('You may need to run the Phase 1 setup scripts.\n');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

checkPathwaysMaster();
