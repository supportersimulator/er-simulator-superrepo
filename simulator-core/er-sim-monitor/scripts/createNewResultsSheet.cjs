const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SPREADSHEET_ID = '1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM';

function getOAuth2Client() {
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const tokenPath = path.join(__dirname, '../config/token.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const { client_id, client_secret, redirect_uris } = credentials.installed;
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oauth2Client.setCredentials(token);
  return oauth2Client;
}

async function createNewResultsSheet() {
  const auth = getOAuth2Client();
  const sheets = google.sheets({ version: 'v4', auth });

  console.log('📋 Creating new AI_Categorization_Results sheet...\n');

  try {
    // Check if sheet already exists
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID
    });

    const existingSheet = metadata.data.sheets.find(
      s => s.properties.title === 'AI_Categorization_Results'
    );

    if (existingSheet) {
      console.log('⚠️  AI_Categorization_Results sheet already exists!');
      console.log('   Delete it first or use a different name.\n');
      return;
    }

    // Create new sheet
    const addSheetResponse = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: 'AI_Categorization_Results',
                gridProperties: {
                  rowCount: 1000,
                  columnCount: 16,
                  frozenRowCount: 1
                }
              }
            }
          }
        ]
      }
    });

    console.log('✅ Sheet created successfully!\n');

    // Add headers
    const headers = [
      'Case_Organization_Case_ID',
      'Legacy_Case_ID',
      'Row_Index',
      'Case_Organization_Spark_Title',
      'Case_Organization_Reveal_Title',
      'Suggested_Symptom_Code',
      'Suggested_Symptom_Name',
      'Suggested_System_Code',
      'Suggested_System_Name',
      'AI_Reasoning',
      'Status',
      'User_Decision',
      'Final_Symptom_Code',
      'Final_System_Code',
      'Final_Symptom_Name',
      'Final_System_Name'
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'AI_Categorization_Results!A1:P1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [headers]
      }
    });

    console.log('✅ Headers added!\n');

    // Format the header row
    const sheetId = addSheetResponse.data.replies[0].addSheet.properties.sheetId;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 16
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: {
                    red: 0.2,
                    green: 0.2,
                    blue: 0.2
                  },
                  textFormat: {
                    foregroundColor: {
                      red: 1.0,
                      green: 1.0,
                      blue: 1.0
                    },
                    fontSize: 10,
                    bold: true
                  },
                  horizontalAlignment: 'CENTER'
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
            }
          },
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId: sheetId,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: 16
              }
            }
          }
        ]
      }
    });

    console.log('✅ Formatting applied!\n');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('SUCCESS! AI_Categorization_Results sheet created');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('Sheet structure (16 columns):');
    headers.forEach((header, i) => {
      const col = String.fromCharCode(65 + i);
      console.log(`  ${col}: ${header}`);
    });

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('READY TO TEST!');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('1. Open your spreadsheet');
    console.log('2. Run Ultimate Categorization Tool');
    console.log('3. Process 5-10 cases');
    console.log('4. Verify columns D, E, G, I have data');
    console.log('5. Check debug logs for ChatGPT response');
    console.log('6. Apply to Master when ready\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
  }
}

createNewResultsSheet();
