const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Detailed Duplicate Analysis\n');

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
    range: 'Master Scenario Convert!A3:IA300'
  });

  const masterData = masterRes.data.values || [];

  const duplicates = [
    { id: 'CARD0025', rows: [116, 192, 194, 197, 205] },
    { id: 'CARD0042', rows: [177, 193, 198] }
  ];

  let accidental = 0;
  let intentional = 0;

  for (const dup of duplicates) {
    console.log('══════════════════════════════════════\n');
    console.log(dup.id + ' (appears ' + dup.rows.length + ' times)\n');

    const data = [];
    for (const rowNum of dup.rows) {
      const row = masterData[rowNum - 3];
      if (!row) continue;

      data.push({
        row: rowNum,
        patient: row[67] || '',
        complaint: row[72] || '',
        media1: row[121] || '',
        cme: row[197] || '',
        hash: row[213] || ''
      });
    }

    // Compare
    const first = data[0];
    let same = true;
    for (let i = 1; i < data.length; i++) {
      if (data[i].patient !== first.patient ||
          data[i].complaint !== first.complaint ||
          data[i].media1 !== first.media1 ||
          data[i].hash !== first.hash) {
        same = false;
        break;
      }
    }

    // Display
    data.forEach(d => {
      console.log('Row ' + d.row + ':');
      console.log('  Patient: ' + d.patient.substring(0, 30));
      console.log('  Complaint: ' + d.complaint.substring(0, 40));
      console.log('  Media: ' + d.media1.substring(0, 30));
      console.log('  Hash: ' + d.hash.substring(0, 15));
      console.log('');
    });

    if (same) {
      console.log('VERDICT: ACCIDENTAL DUPLICATE\n');
      accidental++;
    } else {
      console.log('VERDICT: INTENTIONAL VARIATION\n');
      intentional++;
    }
  }

  console.log('══════════════════════════════════════\n');
  console.log('Accidental: ' + accidental);
  console.log('Intentional: ' + intentional + '\n');
}

main().catch(console.error);
