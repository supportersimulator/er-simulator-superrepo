#!/usr/bin/env node

/**
 * CREATE PATHWAYS FOUNDATION SHEETS
 *
 * Creates Logic_Type_Library and Pathways_Master sheets
 * with auto-activate safety to prevent sheet switching bug
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function createPathwaysSheets() {
  try {
    console.log('🚀 PHASE 1: Creating Pathways Foundation Sheets\n');

    // Load credentials
    const credPath = path.join(__dirname, '../config/credentials.json');
    const tokenPath = path.join(__dirname, '../config/token.json');

    const credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    oAuth2Client.setCredentials(token);

    const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });

    // Get spreadsheet ID from .env
    const envPath = path.join(__dirname, '../.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const sheetIdMatch = envContent.match(/GOOGLE_SHEET_ID=(.+)/);
    const spreadsheetId = sheetIdMatch ? sheetIdMatch[1].trim() : null;

    if (!spreadsheetId) {
      console.log('❌ No GOOGLE_SHEET_ID found in .env');
      process.exit(1);
    }

    console.log('📊 Checking for existing Pathways sheets...\n');

    // Get existing sheets
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const existingSheets = spreadsheet.data.sheets.map(s => s.properties.title);

    console.log('Current sheets:', existingSheets.join(', '));
    console.log('');

    // Create Logic_Type_Library if doesn't exist
    if (!existingSheets.includes('Logic_Type_Library')) {
      console.log('📝 Creating Logic_Type_Library sheet...');

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: 'Logic_Type_Library',
                hidden: false, // Visible during development
                gridProperties: {
                  rowCount: 100,
                  columnCount: 10
                }
              }
            }
          }]
        }
      });

      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Logic_Type_Library!A1:J1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            'Logic_Type_ID',
            'Logic_Type_Name',
            'Description',
            'AI_Persona',
            'Full_Prompt',
            'Intelligence_Type',
            'Date_Created',
            'Times_Used',
            'Avg_Quality',
            'Status'
          ]]
        }
      });

      console.log('✅ Logic_Type_Library created with headers\n');
    } else {
      console.log('✅ Logic_Type_Library already exists\n');
    }

    // Create Pathways_Master if doesn't exist
    if (!existingSheets.includes('Pathways_Master')) {
      console.log('📝 Creating Pathways_Master sheet...');

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: 'Pathways_Master',
                hidden: false, // Visible during development
                gridProperties: {
                  rowCount: 500,
                  columnCount: 18
                }
              }
            }
          }]
        }
      });

      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Pathways_Master!A1:R1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            'Pathway_ID',
            'Pathway_Name',
            'Logic_Type_Used',
            'Category_Accronym',
            'Educational_Score',
            'Novelty_Score',
            'Market_Score',
            'Composite_Score',
            'Tier',
            'Case_IDs',
            'Case_Sequence',
            'Target_Learner',
            'AI_Persuasion',
            'Learning_Outcomes',
            'Discovery_Date',
            'User_Rating',
            'Status',
            'Notes'
          ]]
        }
      });

      console.log('✅ Pathways_Master created with headers\n');
    } else {
      console.log('✅ Pathways_Master already exists\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎉 PHASE 1 FOUNDATION COMPLETE!\n');
    console.log('✅ Logic_Type_Library → Ready for 7 initial logic types');
    console.log('✅ Pathways_Master → Ready for pathway suggestions\n');
    console.log('Next Steps:');
    console.log('1. Populate 7 initial logic types');
    console.log('2. Build dynamic dropdown UI');
    console.log('3. Test "Create New Logic Type" flow\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

createPathwaysSheets();
