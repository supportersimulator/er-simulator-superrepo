/**
 * Show Master Scenario Convert Headers
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
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
    range: 'Master Scenario Convert!1:2'
  });

  const headers = masterRes.data.values || [];

  console.log('Master Scenario Convert Headers:\n');
  
  if (headers.length >= 2) {
    console.log('Row 1 (Tier 1):');
    headers[0].forEach((h, i) => {
      console.log('  ' + String(i).padStart(2) + ': ' + (h || '(empty)'));
    });
    
    console.log('\nRow 2 (Tier 2):');
    headers[1].forEach((h, i) => {
      console.log('  ' + String(i).padStart(2) + ': ' + (h || '(empty)'));
    });
  }
}

main().catch(console.error);
