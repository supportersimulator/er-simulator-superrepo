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

async function updateSheetHeaders() {
  const auth = getOAuth2Client();
  const sheets = google.sheets({ version: 'v4', auth });

  console.log('📝 Updating AI_Categorization_Results headers for consistency...\n');

  const newHeaders = [
    'Case_Organization_Case_ID',
    'Case_Organization_Legacy_Case_ID',           // Changed: was 'Legacy_Case_ID'
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
    'Case_Organization_Final_Symptom_Code',       // Changed: was 'Final_Symptom_Code'
    'Case_Organization_Final_System_Code',        // Changed: was 'Final_System_Code'
    'Case_Organization_Final_Symptom_Name',       // Changed: was 'Final_Symptom_Name'
    'Case_Organization_Final_System_Name'         // Changed: was 'Final_System_Name'
  ];

  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'AI_Categorization_Results!A1:P1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [newHeaders]
      }
    });

    console.log('✅ Headers updated successfully!\n');
    console.log('Updated headers:');
    newHeaders.forEach((header, i) => {
      const col = String.fromCharCode(65 + i);
      console.log(`  ${col}: ${header}`);
    });

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('Now updating the deployed code to match...');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

updateSheetHeaders();
