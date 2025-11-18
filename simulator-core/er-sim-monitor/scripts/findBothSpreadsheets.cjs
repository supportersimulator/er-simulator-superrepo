#!/usr/bin/env node

/**
 * Find BOTH spreadsheets - main working CSV and test CSV
 * Each should have its own bound Apps Script project with ATSR
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function authorize() {
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const tokenPath = path.join(__dirname, '../config/token.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

async function findBoth() {
  console.log('\n🔍 FINDING BOTH SPREADSHEETS (MAIN + TEST)\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const drive = google.drive({ version: 'v3', auth });
  const script = google.script({ version: 'v1', auth });

  // Load ULTIMATE code for comparison
  const ultimatePath = path.join(__dirname, 'Code_ULTIMATE_ATSR_FROM_DRIVE.gs');
  const ultimateCode = fs.existsSync(ultimatePath) ? fs.readFileSync(ultimatePath, 'utf8') : null;

  try {
    // Search for ALL spreadsheets related to ER Sim
    console.log('📂 Searching for ER Sim spreadsheets...\n');

    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
      fields: 'files(id, name, modifiedTime, createdTime)',
      orderBy: 'modifiedTime desc',
      pageSize: 50
    });

    console.log(`✅ Found ${response.data.files.length} total spreadsheets\n`);
    console.log('Checking each for bound Apps Script with ATSR...\n');

    const spreadsheetsWithATSR = [];

    for (const file of response.data.files) {
      const modifiedDate = new Date(file.modifiedTime);

      console.log(`📊 ${file.name}`);
      console.log(`   📅 Modified: ${modifiedDate.toLocaleString()}`);
      console.log(`   🆔 ${file.id}`);

      // Try to access bound script (spreadsheet ID = script ID for container-bound)
      try {
        const project = await script.projects.getContent({ scriptId: file.id });

        // Check for ATSR
        const atsrFile = project.data.files.find(f =>
          f.source && (f.source.includes('runATSRTitleGenerator') || f.name.includes('ATSR'))
        );

        if (atsrFile) {
          const codeSize = Math.round(atsrFile.source.length / 1024);
          const hasTestMenu = atsrFile.source.includes('TEST') && atsrFile.source.includes('createMenu');

          console.log(`   ✅ Has bound script with ATSR!`);
          console.log(`   📜 ATSR file: ${atsrFile.name}`);
          console.log(`   💾 Size: ${codeSize} KB`);
          console.log(`   ${hasTestMenu ? '✅' : '❌'} TEST menu`);

          // Compare with ULTIMATE
          let matchStatus = 'UNKNOWN';
          if (ultimateCode) {
            if (atsrFile.source === ultimateCode) {
              matchStatus = '🎯 EXACT MATCH with ULTIMATE';
            } else {
              const ultimateSize = Math.round(ultimateCode.length / 1024);
              matchStatus = `Different (ULTIMATE is ${ultimateSize} KB)`;
            }
          }
          console.log(`   ${matchStatus}`);

          spreadsheetsWithATSR.push({
            name: file.name,
            id: file.id,
            modified: modifiedDate,
            codeSize,
            hasTestMenu,
            isUltimate: matchStatus.includes('EXACT MATCH')
          });
        } else {
          console.log(`   ❌ No ATSR in bound script`);
        }

      } catch (e) {
        console.log(`   ❌ No container-bound script`);
      }

      console.log('');
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`\n📋 SUMMARY: Found ${spreadsheetsWithATSR.length} spreadsheet(s) with ATSR\n`);

    if (spreadsheetsWithATSR.length === 0) {
      console.log('⚠️  No spreadsheets found with ATSR code.\n');
      console.log('The ULTIMATE ATSR may be in a standalone project not bound to a sheet.\n');
    } else if (spreadsheetsWithATSR.length === 1) {
      console.log('⚠️  Only found 1 spreadsheet with ATSR.\n');
      console.log('Expected to find 2: main working project + test project.\n');
      console.log('Details:\n');
      spreadsheetsWithATSR.forEach(s => {
        console.log(`   📊 ${s.name}`);
        console.log(`      Size: ${s.codeSize} KB`);
        console.log(`      TEST menu: ${s.hasTestMenu ? 'Yes' : 'No'}`);
        console.log(`      ULTIMATE match: ${s.isUltimate ? 'YES' : 'No'}\n`);
      });
    } else if (spreadsheetsWithATSR.length === 2) {
      console.log('✅ Found 2 spreadsheets with ATSR!\n');

      spreadsheetsWithATSR.forEach((s, i) => {
        console.log(`${i + 1}. 📊 ${s.name}`);
        console.log(`   🆔 ${s.id}`);
        console.log(`   💾 ${s.codeSize} KB`);
        console.log(`   📅 Modified: ${s.modified.toLocaleString()}`);
        console.log(`   🧪 TEST menu: ${s.hasTestMenu ? 'Yes' : 'No'}`);
        console.log(`   🎯 ULTIMATE code: ${s.isUltimate ? 'YES' : 'No'}\n`);
      });

      // Try to identify which is which
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('\n🔍 IDENTIFYING MAIN vs TEST:\n');

      if (spreadsheetsWithATSR[0].name.toLowerCase().includes('test') || spreadsheetsWithATSR[0].name.toLowerCase().includes('TEST')) {
        console.log(`✅ TEST PROJECT: ${spreadsheetsWithATSR[0].name}`);
        console.log(`✅ MAIN PROJECT: ${spreadsheetsWithATSR[1].name}\n`);
      } else if (spreadsheetsWithATSR[1].name.toLowerCase().includes('test') || spreadsheetsWithATSR[1].name.toLowerCase().includes('TEST')) {
        console.log(`✅ MAIN PROJECT: ${spreadsheetsWithATSR[0].name}`);
        console.log(`✅ TEST PROJECT: ${spreadsheetsWithATSR[1].name}\n`);
      } else {
        console.log('⚠️  Cannot auto-identify from names.\n');
        console.log('Most recently modified is likely the active working project:\n');
        console.log(`   ${spreadsheetsWithATSR[0].name} (${spreadsheetsWithATSR[0].modified.toLocaleString()})\n`);
      }
    } else {
      console.log(`⚠️  Found ${spreadsheetsWithATSR.length} spreadsheets with ATSR.\n`);
      console.log('Expected 2 (main + test). Here are all found:\n');
      spreadsheetsWithATSR.forEach((s, i) => {
        console.log(`${i + 1}. ${s.name} (${s.codeSize} KB, ULTIMATE: ${s.isUltimate ? 'YES' : 'No'})`);
      });
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');
    if (e.stack) {
      console.log(e.stack);
    }
  }
}

findBoth().catch(console.error);
