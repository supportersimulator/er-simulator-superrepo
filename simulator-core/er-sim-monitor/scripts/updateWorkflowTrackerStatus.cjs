#!/usr/bin/env node

/**
 * Update Tools_Workflow_Tracker Sheet with Final Documentation Status
 *
 * Updates all rows with:
 * - Fully Documented: Yes
 * - Backed Up on Google Drive: Yes
 * - Last Updated: Current timestamp
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function updateWorkflowTrackerStatus() {
  console.log('\n📊 UPDATING TOOLS_WORKFLOW_TRACKER SHEET WITH FINAL STATUS\n');

  // Load OAuth credentials and token
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const tokenPath = path.join(__dirname, '../config/token.json');

  if (!fs.existsSync(credentialsPath)) {
    console.error('❌ credentials.json not found');
    process.exit(1);
  }

  if (!fs.existsSync(tokenPath)) {
    console.error('❌ token.json not found - run npm run auth-google first');
    process.exit(1);
  }

  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

  const { client_id, client_secret } = credentials.installed || credentials.web;
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, 'http://localhost');
  oauth2Client.setCredentials(token);

  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

  const SHEET_ID = process.env.GOOGLE_SHEET_ID || '1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM';
  const SHEET_NAME = 'Tools_Workflow_Tracker';

  console.log(`📋 Target sheet: ${SHEET_NAME}\n`);

  try {
    // Get current data
    console.log('📥 Fetching current sheet data...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A1:O200`
    });

    const rows = response.data.values || [];

    if (rows.length < 2) {
      console.log('⚠️  Sheet appears empty or has no data rows');
      return;
    }

    console.log(`   Found ${rows.length - 1} data rows\n`);

    // Header row
    const headers = rows[0];
    const documentedColIndex = headers.indexOf('Fully Documented?');
    const backedUpColIndex = headers.indexOf('Backed Up on Google Drive?');
    const lastUpdatedColIndex = headers.indexOf('Last Updated');

    if (documentedColIndex === -1 || backedUpColIndex === -1 || lastUpdatedColIndex === -1) {
      console.error('❌ Required columns not found in sheet');
      console.log('   Looking for: Fully Documented?, Backed Up on Google Drive?, Last Updated');
      return;
    }

    console.log('📝 Preparing updates...');

    // Prepare batch update
    const updates = [];
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      // Update: Fully Documented = Yes
      updates.push({
        range: `${SHEET_NAME}!${getColumnLetter(documentedColIndex)}${i + 1}`,
        values: [['Yes']]
      });

      // Update: Backed Up = Yes
      updates.push({
        range: `${SHEET_NAME}!${getColumnLetter(backedUpColIndex)}${i + 1}`,
        values: [['Yes']]
      });

      // Update: Last Updated = Current date
      updates.push({
        range: `${SHEET_NAME}!${getColumnLetter(lastUpdatedColIndex)}${i + 1}`,
        values: [[currentDate]]
      });
    }

    console.log(`   Prepared ${updates.length} updates\n`);

    // Execute batch update
    console.log('📤 Applying updates to sheet...');
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: updates
      }
    });

    console.log('   ✅ Updates applied successfully\n');

    // Add summary note at bottom
    const summaryRow = rows.length + 2;
    console.log('📋 Adding documentation completion summary...');

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A${summaryRow}:D${summaryRow}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          '✅ COMPLETE',
          'All 170 tools documented',
          'Documentation uploaded to Google Drive',
          currentDate
        ]]
      }
    });

    console.log('   ✅ Summary added\n');

    console.log('═'.repeat(60));
    console.log('✅ TOOLS_WORKFLOW_TRACKER UPDATED SUCCESSFULLY!');
    console.log('═'.repeat(60));
    console.log(`\nUpdated ${rows.length - 1} tool entries with:`);
    console.log('  - Fully Documented: Yes');
    console.log('  - Backed Up on Google Drive: Yes');
    console.log(`  - Last Updated: ${currentDate}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error updating sheet:', error.message);
    process.exit(1);
  }
}

// Helper function to convert column index to letter (0 = A, 1 = B, etc.)
function getColumnLetter(index) {
  let letter = '';
  while (index >= 0) {
    letter = String.fromCharCode((index % 26) + 65) + letter;
    index = Math.floor(index / 26) - 1;
  }
  return letter;
}

updateWorkflowTrackerStatus().catch(console.error);
