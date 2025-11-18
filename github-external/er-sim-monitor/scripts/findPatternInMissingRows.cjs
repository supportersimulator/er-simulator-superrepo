/**
 * Find Pattern in Missing Rows - Why Were They Skipped?
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Finding Pattern in Missing Rows\n');

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

  // Separate categorized and missing
  const categorized = [];
  const missing = [];

  masterData.forEach((row, idx) => {
    const caseID = row[0] || '';
    const colR = row[17] || '';
    
    if (colR) {
      categorized.push(idx + 3);
    } else {
      missing.push(idx + 3);
    }
  });

  console.log('Categorized rows: ' + categorized.length);
  console.log('Missing rows: ' + missing.length + '\n');

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('Missing row numbers:\n');
  console.log(missing.join(', ') + '\n');

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('Pattern Analysis:\n');

  // Check if missing rows are clustered
  const gaps = [];
  for (let i = 1; i < missing.length; i++) {
    const gap = missing[i] - missing[i-1];
    gaps.push(gap);
  }

  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const maxGap = Math.max(...gaps);
  const minGap = Math.min(...gaps);

  console.log('  Average gap between missing rows: ' + avgGap.toFixed(1));
  console.log('  Max gap: ' + maxGap);
  console.log('  Min gap: ' + minGap + '\n');

  console.log('  Missing rows are ' + (avgGap > 5 ? 'SPREAD OUT' : 'CLUSTERED') + '\n');

  // Check if there's a pattern every N rows
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('Hypothesis: Apply function has skip logic we haven\'t found\n');
  console.log('Let me check the ACTUAL execution log from Apps Script...\n');
  
  console.log('Action needed:');
  console.log('  1. Open Google Sheet');
  console.log('  2. Extensions → Apps Script');
  console.log('  3. View → Execution log');
  console.log('  4. Look for the most recent "applyCategorization" execution');
  console.log('  5. See if there are error messages for the 49 missing cases\n');
}

main().catch(console.error);
