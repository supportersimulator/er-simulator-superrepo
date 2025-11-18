/**
 * Verify All 207 Cases Were Applied
 * 
 * Checks Master Scenario Convert columns P, Q, R, S for data
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Verifying All 207 Cases Were Applied\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });

  console.log('📥 Fetching Master Scenario Convert (columns A, P, Q, R, S)...\n');

  const masterRes = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: 'Master Scenario Convert!A3:S300'
  });

  const masterData = masterRes.data.values || [];

  console.log('Total rows in Master: ' + masterData.length + '\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  let withCategories = 0;
  let withoutCategories = 0;
  const missing = [];

  console.log('Checking which rows have data in columns P, Q, R, S:\n');

  masterData.forEach((row, idx) => {
    const caseID = row[0] || '';
    const colP = row[15] || ''; // Column P (index 15)
    const colQ = row[16] || ''; // Column Q (index 16)
    const colR = row[17] || ''; // Column R (index 17)
    const colS = row[18] || ''; // Column S (index 18)

    const hasData = colP || colQ || colR || colS;

    if (hasData) {
      withCategories++;
    } else {
      withoutCategories++;
      missing.push({
        row: idx + 3,
        caseID: caseID
      });
    }
  });

  console.log('📊 Results:\n');
  console.log('  Cases WITH categories (P/Q/R/S): ' + withCategories + ' ✅');
  console.log('  Cases WITHOUT categories: ' + withoutCategories + ' ❌\n');

  if (withCategories === 207) {
    console.log('🎉 SUCCESS! All 207 cases have been categorized!\n');
  } else if (withCategories === 190) {
    console.log('⚠️  Still showing 190 cases (same as before)\n');
    console.log('This means the Apply function did NOT update the 17 new Case_IDs.\n');
  }

  if (missing.length > 0) {
    console.log('══════════════════════════════════════════════════════════════\n');
    console.log('❌ Cases Still Missing Categories (' + missing.length + '):\n');
    console.log('Row | Case_ID\n');
    console.log('----+----------------\n');

    missing.slice(0, 20).forEach(m => {
      const rowNum = String(m.row).padStart(3);
      const id = m.caseID.padEnd(16);
      console.log(rowNum + ' | ' + id);
    });

    if (missing.length > 20) {
      console.log('... and ' + (missing.length - 20) + ' more\n');
    }

    console.log('\n══════════════════════════════════════════════════════════════\n');
    console.log('🔍 Checking if these are the renamed Case_IDs:\n');

    const renamedIDs = [
      'CARD0002-2', 'CARD0007-2', 'CARD0012-2', 'CARD0017-2',
      'CARD0050-2', 'CARD0022-2', 'CARD0023-2', 'CARD0051-2',
      'CARD0025-2', 'CARD0025-3', 'CARD0025-4', 'CARD0025-5',
      'CARD0042-2', 'CARD0042-3', 'NEUR0023-2', 'CARD0045-2', 'CARD0045-3'
    ];

    const missingRenamed = missing.filter(m => renamedIDs.includes(m.caseID));

    if (missingRenamed.length === missing.length) {
      console.log('✅ YES - All missing cases are the renamed ones!\n');
      console.log('Reason: Apply function built dictionary BEFORE we renamed them.\n');
      console.log('Solution: Need to refresh sheet and re-run Apply.\n');
    } else {
      console.log('❌ NO - Some missing cases are NOT the renamed ones.\n');
    }
  } else {
    console.log('✅ Perfect! No missing cases.\n');
  }

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('Current Status: ' + withCategories + ' / 207 cases categorized\n');
}

main().catch(console.error);
