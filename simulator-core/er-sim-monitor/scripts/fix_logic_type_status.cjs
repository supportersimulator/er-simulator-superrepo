#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function fixLogicTypeStatus() {
  try {
    console.log('🔧 FIXING LOGIC TYPE STATUS COLUMN\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const credPath = path.join(__dirname, '../config/credentials.json');
    const tokenPath = path.join(__dirname, '../config/token.json');
    const credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    oAuth2Client.setCredentials(token);

    const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });
    const envPath = path.join(__dirname, '../.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const sheetIdMatch = envContent.match(/GOOGLE_SHEET_ID=(.+)/);
    const spreadsheetId = sheetIdMatch[1].trim();

    console.log('📊 Step 1: Reading current Logic_Type_Library data...\n');

    const data = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Logic_Type_Library!A1:J20'
    });

    const rows = data.data.values || [];
    console.log(`   Found ${rows.length - 1} logic types\n`);

    console.log('📝 Step 2: Setting all to "active" status...\n');

    // Update Status column (column H, index 7) for all data rows
    const updates = [];
    for (let i = 2; i <= rows.length; i++) {  // Start at row 2 (skip header)
      updates.push({
        range: `Logic_Type_Library!H${i}`,
        values: [['active']]
      });
    }

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'RAW',
        data: updates
      }
    });

    console.log(`   ✅ Updated ${updates.length} rows to "active"\n`);

    console.log('🔍 Step 3: Verifying updates...\n');

    const verify = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Logic_Type_Library!A1:J20'
    });

    const verifyRows = verify.data.values || [];
    const activeCount = verifyRows.slice(1).filter(row => row[7] === 'active').length;

    console.log(`   ✅ ${activeCount} logic types now active\n`);

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ STATUS FIX COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('📋 ACTIVE LOGIC TYPES:\n');
    verifyRows.slice(1).forEach((row, idx) => {
      if (row[7] === 'active') {
        console.log(`   ${idx + 1}. ${row[1]} (ID: ${row[0]})`);
      }
    });

    console.log('\n🧪 NOW TEST AGAIN:\n');
    console.log('1. Refresh Google Sheet (F5)');
    console.log('2. Open: 🧠 Sim Builder → 🧩 Categories & Pathways');
    console.log('3. Click: "🔍 AI Discovery" tab');
    console.log('4. Dropdown should now show all ' + activeCount + ' logic types!');
    console.log('5. Select one → button becomes clickable\n');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixLogicTypeStatus();
