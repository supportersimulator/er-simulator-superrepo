import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SERVICE_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

const auth = new google.auth.JWT(
  SERVICE_EMAIL,
  null,
  PRIVATE_KEY,
  ['https://www.googleapis.com/auth/spreadsheets.readonly']
);

const sheets = google.sheets({ version: 'v4', auth });

async function fetchVitals() {
  try {
    const range = 'Sheet1!A2:F'; // adjust if your sheet has different range or headers
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range,
    });

    const rows = res.data.values || [];
    const data = rows.map((r) => ({
      hr: Number(r[0]) || 0,
      spo2: Number(r[1]) || 0,
      bp: { sys: Number(r[2]) || 0, dia: Number(r[3]) || 0 },
      etco2: Number(r[4]) || 0,
      waveform: r[5] || 'sinus_ecg',
    }));

    const outPath = path.resolve('./data/vitals.json');
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2));

    console.log(`✅ Synced ${data.length} rows from Google Sheets → data/vitals.json`);
  } catch (err) {
    console.error('❌ Error fetching vitals:', err.message);
  }
}

fetchVitals();
