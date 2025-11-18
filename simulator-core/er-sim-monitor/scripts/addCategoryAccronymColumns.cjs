/**
 * Add Category_Symptom and Category_System accronym columns
 * AND rename Case_Organization columns to include prefix
 *
 * Task 1: Rename columns M-Q (Tier 2) to add Case_Organization_ prefix
 * Task 2: Insert 2 new columns after Q for Category_Symptom and Category_System accronyms
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  // Auth setup
  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });
  const spreadsheetId = process.env.SHEET_ID;

  // Get sheet ID for Master Scenario Convert
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const masterSheet = spreadsheet.data.sheets.find(s => s.properties.title === 'Master Scenario Convert');

  if (!masterSheet) {
    console.error('❌ Master Scenario Convert sheet not found');
    return;
  }

  const sheetId = masterSheet.properties.sheetId;
  console.log('✅ Found Master Scenario Convert (Sheet ID:', sheetId, ')');
  console.log('');

  // ============================================================================
  // TASK 1: Rename columns M-Q to add Case_Organization_ prefix
  // ============================================================================

  console.log('📝 Task 1: Renaming Case_Organization columns...');
  console.log('');

  const currentNames = [
    'Is_Foundational',
    'Pathway_ID',
    'Pathway_Name',
    'Category_Symptom_Name',
    'Category_System_Name'
  ];

  const newNames = [
    'Case_Organization_Is_Foundational',
    'Case_Organization_Pathway_ID',
    'Case_Organization_Pathway_Name',
    'Case_Organization_Category_Symptom_Name',
    'Case_Organization_Category_System_Name'
  ];

  // Update Tier 2 headers (Row 2, Columns M-Q)
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Master Scenario Convert!M2:Q2',
    valueInputOption: 'RAW',
    requestBody: {
      values: [newNames]
    }
  });

  console.log('✅ Renamed Tier 2 headers:');
  currentNames.forEach((old, idx) => {
    const col = String.fromCharCode(77 + idx); // M = 77
    console.log(`   Column ${col}: "${old}" → "${newNames[idx]}"`);
  });
  console.log('');

  // ============================================================================
  // TASK 2: Insert 2 new columns after Q for accronyms
  // ============================================================================

  console.log('📝 Task 2: Adding Category_Symptom and Category_System accronym columns...');
  console.log('');

  // Insert 2 columns after column Q (index 16, 0-indexed)
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          insertDimension: {
            range: {
              sheetId: sheetId,
              dimension: 'COLUMNS',
              startIndex: 17, // After column Q (0-indexed)
              endIndex: 19    // Insert 2 columns
            },
            inheritFromBefore: false
          }
        }
      ]
    }
  });

  console.log('✅ Inserted 2 new columns after Column Q');
  console.log('   New columns: R, S (pushed previous R-Z right by 2)');
  console.log('');

  // Set Tier 1 headers for new columns (use Case_Organization group)
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Master Scenario Convert!R1:S1',
    valueInputOption: 'RAW',
    requestBody: {
      values: [['Case_Organization', 'Case_Organization']]
    }
  });

  // Set Tier 2 headers for new columns
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Master Scenario Convert!R2:S2',
    valueInputOption: 'RAW',
    requestBody: {
      values: [['Case_Organization_Category_Symptom', 'Case_Organization_Category_System']]
    }
  });

  console.log('✅ Set headers for new columns:');
  console.log('   Column R (Tier 1): Case_Organization');
  console.log('   Column R (Tier 2): Case_Organization_Category_Symptom');
  console.log('   Column S (Tier 1): Case_Organization');
  console.log('   Column S (Tier 2): Case_Organization_Category_System');
  console.log('');

  // Format new headers to match existing style
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        // Tier 1 header formatting
        {
          repeatCell: {
            range: {
              sheetId: sheetId,
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: 17,
              endColumnIndex: 19
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.16, green: 0.19, blue: 0.25 },
                textFormat: {
                  foregroundColor: { red: 0.91, green: 0.92, blue: 0.94 },
                  bold: true
                },
                horizontalAlignment: 'CENTER'
              }
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
          }
        },
        // Tier 2 header formatting
        {
          repeatCell: {
            range: {
              sheetId: sheetId,
              startRowIndex: 1,
              endRowIndex: 2,
              startColumnIndex: 17,
              endColumnIndex: 19
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.16, green: 0.19, blue: 0.25 },
                textFormat: {
                  foregroundColor: { red: 0.91, green: 0.92, blue: 0.94 },
                  bold: true
                },
                horizontalAlignment: 'CENTER'
              }
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
          }
        }
      ]
    }
  });

  console.log('✅ Applied formatting to new columns');
  console.log('');

  // ============================================================================
  // SUMMARY
  // ============================================================================

  console.log('🎉 All updates complete!');
  console.log('');
  console.log('📊 Summary:');
  console.log('   ✅ Renamed columns M-Q with Case_Organization_ prefix');
  console.log('   ✅ Added 2 new columns (R, S) for accronyms');
  console.log('   ✅ Total columns now: 648 (was 646)');
  console.log('');
  console.log('📋 Case_Organization Group (Columns M-S):');
  console.log('   Column M: Case_Organization_Is_Foundational');
  console.log('   Column N: Case_Organization_Pathway_ID');
  console.log('   Column O: Case_Organization_Pathway_Name');
  console.log('   Column P: Case_Organization_Category_Symptom_Name');
  console.log('   Column Q: Case_Organization_Category_System_Name');
  console.log('   Column R: Case_Organization_Category_Symptom (NEW - accronym)');
  console.log('   Column S: Case_Organization_Category_System (NEW - accronym)');
  console.log('');
  console.log('⚠️  NOTE: Image Sync columns (formerly R-Y) are now T-AA');
}

main().catch(console.error);
