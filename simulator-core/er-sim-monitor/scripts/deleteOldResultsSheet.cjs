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

async function deleteOldResultsSheet() {
  const auth = getOAuth2Client();
  const sheets = google.sheets({ version: 'v4', auth });

  console.log('🗑️  Deleting old AI_Categorization_Results sheet...\n');

  try {
    // Get spreadsheet metadata to find the sheet ID
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID
    });

    const resultsSheet = metadata.data.sheets.find(
      s => s.properties.title === 'AI_Categorization_Results'
    );

    if (!resultsSheet) {
      console.log('✅ AI_Categorization_Results sheet does not exist (already deleted or never created)');
      console.log('   The next run of Ultimate Categorization Tool will create a fresh 16-column sheet.\n');
      return;
    }

    const sheetId = resultsSheet.properties.sheetId;
    console.log('✅ Found AI_Categorization_Results sheet (ID: ' + sheetId + ')');
    console.log('   Deleting...\n');

    // Delete the sheet
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            deleteSheet: {
              sheetId: sheetId
            }
          }
        ]
      }
    });

    console.log('✅ SUCCESS! Old sheet deleted.\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('NEXT STEPS:');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('1. Open your spreadsheet');
    console.log('2. Run the Ultimate Categorization Tool');
    console.log('3. Process 5-10 cases as a test');
    console.log('4. Verify the new sheet has 16 columns with these headers:');
    console.log('   A: Case_Organization_Case_ID');
    console.log('   B: Legacy_Case_ID');
    console.log('   C: Row_Index');
    console.log('   D: Case_Organization_Spark_Title');
    console.log('   E: Case_Organization_Reveal_Title');
    console.log('   F: Suggested_Symptom_Code');
    console.log('   G: Suggested_Symptom_Name');
    console.log('   H: Suggested_System_Code');
    console.log('   I: Suggested_System_Name');
    console.log('   J: AI_Reasoning');
    console.log('   K: Status');
    console.log('   L: User_Decision');
    console.log('   M: Final_Symptom_Code');
    console.log('   N: Final_System_Code');
    console.log('   O: Final_Symptom_Name');
    console.log('   P: Final_System_Name');
    console.log('\n═══════════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
  }
}

deleteOldResultsSheet();
