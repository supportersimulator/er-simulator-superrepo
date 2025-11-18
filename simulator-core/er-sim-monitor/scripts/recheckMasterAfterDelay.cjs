/**
 * Recheck Master Sheet After 10 Second Delay
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Rechecking Master Sheet (after delay)...\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });

  const masterRes = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: 'Master Scenario Convert!A3:S300'
  });

  const masterData = masterRes.data.values || [];

  let withCategories = 0;

  masterData.forEach(row => {
    const colP = row[15] || '';
    const colR = row[17] || '';
    if (colP || colR) withCategories++;
  });

  console.log('Cases with categories: ' + withCategories + ' / ' + masterData.length + '\n');

  if (withCategories === 207) {
    console.log('🎉 SUCCESS! All 207 cases now have categories!');
  } else {
    console.log('⚠️  Still missing ' + (207 - withCategories) + ' cases\n');
  }
}

main().catch(console.error);
