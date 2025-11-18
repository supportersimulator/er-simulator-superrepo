#!/usr/bin/env node

/**
 * Create Progress Tracking Sheet
 *
 * Creates a dedicated sheet tab for tracking batch processing progress
 * Enables checkpoint/resume and real-time monitoring
 *
 * Usage:
 *   node scripts/createProgressTracker.cjs
 */

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

async function createProgressTracker() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('       CREATE BATCH PROGRESS TRACKING SHEET');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const sheets = createSheetsClient();

  // Check if Progress sheet already exists
  console.log('📖 Checking for existing Progress sheet...');

  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID
  });

  const existingSheet = spreadsheet.data.sheets.find(
    s => s.properties.title === 'Batch_Progress'
  );

  let sheetId;

  if (existingSheet) {
    console.log('✅ Found existing Batch_Progress sheet');
    sheetId = existingSheet.properties.sheetId;
    console.log(`   Sheet ID: ${sheetId}`);
  } else {
    console.log('📝 Creating new Batch_Progress sheet...');

    const addSheetResponse = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [{
          addSheet: {
            properties: {
              title: 'Batch_Progress',
              gridProperties: {
                rowCount: 1000,
                columnCount: 15
              },
              tabColor: {
                red: 0.2,
                green: 0.6,
                blue: 1.0
              }
            }
          }
        }]
      }
    });

    sheetId = addSheetResponse.data.replies[0].addSheet.properties.sheetId;
    console.log(`✅ Created sheet with ID: ${sheetId}`);
  }

  console.log('');
  console.log('📋 Setting up progress tracking columns...');

  // Header row
  const headers = [
    ['Batch_ID', 'Row_Number', 'Case_ID', 'Status', 'Started_At', 'Completed_At',
     'Duration_Sec', 'Retry_Count', 'Error_Message', 'OpenAI_Tokens',
     'Cost_USD', 'Vitals_Added', 'Warnings', 'Last_Updated', 'Checkpoint']
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: 'Batch_Progress!A1:O1',
    valueInputOption: 'RAW',
    requestBody: {
      values: headers
    }
  });

  console.log('✅ Headers created');

  // Format header row
  console.log('🎨 Formatting sheet...');

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [
        // Bold and freeze header row
        {
          repeatCell: {
            range: {
              sheetId: sheetId,
              startRowIndex: 0,
              endRowIndex: 1
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.2, green: 0.2, blue: 0.2 },
                textFormat: {
                  foregroundColor: { red: 1, green: 1, blue: 1 },
                  bold: true
                },
                horizontalAlignment: 'CENTER'
              }
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
          }
        },
        // Freeze header row
        {
          updateSheetProperties: {
            properties: {
              sheetId: sheetId,
              gridProperties: {
                frozenRowCount: 1
              }
            },
            fields: 'gridProperties.frozenRowCount'
          }
        },
        // Set column widths
        {
          updateDimensionProperties: {
            range: {
              sheetId: sheetId,
              dimension: 'COLUMNS',
              startIndex: 0,
              endIndex: 15
            },
            properties: {
              pixelSize: 120
            },
            fields: 'pixelSize'
          }
        }
      ]
    }
  });

  console.log('✅ Formatting complete');
  console.log('');

  // Add data validation for Status column
  console.log('📝 Adding status validation...');

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [{
        setDataValidation: {
          range: {
            sheetId: sheetId,
            startRowIndex: 1,
            startColumnIndex: 3, // Status column (D)
            endColumnIndex: 4
          },
          rule: {
            condition: {
              type: 'ONE_OF_LIST',
              values: [
                { userEnteredValue: 'PENDING' },
                { userEnteredValue: 'PROCESSING' },
                { userEnteredValue: 'COMPLETED' },
                { userEnteredValue: 'FAILED' },
                { userEnteredValue: 'SKIPPED' },
                { userEnteredValue: 'RETRYING' }
              ]
            },
            showCustomUi: true,
            strict: true
          }
        }
      }]
    }
  });

  console.log('✅ Status validation added');
  console.log('');

  console.log('═══════════════════════════════════════════════════');
  console.log('✅ PROGRESS TRACKER CREATED');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('📊 Sheet Structure:');
  console.log('   - Batch_ID: Unique identifier for each batch run');
  console.log('   - Row_Number: Input sheet row being processed');
  console.log('   - Case_ID: Scenario case identifier');
  console.log('   - Status: PENDING → PROCESSING → COMPLETED/FAILED');
  console.log('   - Started_At: Processing start timestamp');
  console.log('   - Completed_At: Processing end timestamp');
  console.log('   - Duration_Sec: Processing time in seconds');
  console.log('   - Retry_Count: Number of retry attempts');
  console.log('   - Error_Message: Failure details');
  console.log('   - OpenAI_Tokens: Token usage per row');
  console.log('   - Cost_USD: Processing cost per row');
  console.log('   - Vitals_Added: Clinical defaults applied');
  console.log('   - Warnings: Quality check warnings');
  console.log('   - Last_Updated: Most recent update timestamp');
  console.log('   - Checkpoint: Resume point for failed batches');
  console.log('');
  console.log('📋 Next Steps:');
  console.log('   1. Update Apps Script to log progress');
  console.log('   2. Create checkpoint/resume script');
  console.log('   3. Add monitoring dashboard');
  console.log('');
  console.log('🔗 View sheet:');
  console.log(`   https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=${sheetId}`);
  console.log('');
}

if (require.main === module) {
  createProgressTracker().catch(error => {
    console.error('');
    console.error('❌ CREATION FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');
    process.exit(1);
  });
}

module.exports = { createProgressTracker };
