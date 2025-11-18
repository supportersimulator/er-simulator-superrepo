#!/usr/bin/env node

/**
 * Check which standalone Apps Script projects are linked to the spreadsheets
 * via Extensions menu or document properties
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Known standalone projects
const STANDALONE_PROJECTS = [
  {
    name: 'ER Sim - ATSR Tool (Standalone)',
    id: '1Bkbm2MNA-YmXQEoMsIlC-VgEgHiQHO2EuMXR-yyxy9lYWl3eNcEHk_S-'
  },
  {
    name: 'TEST Script (Categories & Cache)',
    id: '1kkPZU3GsCCuu5IhTEOufmDT1Cb2rSQVB3Y3u1DPf87yoSV4WVtoNvd6i'
  }
];

// Known spreadsheets
const SPREADSHEETS = [
  {
    name: 'Convert_Master_Sim_CSV_Template_with_Input (MAIN)',
    id: '1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM'
  },
  {
    name: 'TEST_Convert_Master_Sim_CSV_Template_with_Input (TEST)',
    id: '1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI'
  }
];

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

async function check() {
  console.log('\n🔗 CHECKING SPREADSHEET-TO-SCRIPT LINKS\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  // Load ULTIMATE code for comparison
  const ultimatePath = path.join(__dirname, 'Code_ULTIMATE_ATSR_FROM_DRIVE.gs');
  const ultimateCode = fs.existsSync(ultimatePath) ? fs.readFileSync(ultimatePath, 'utf8') : null;

  try {
    console.log('📊 ANALYZING SPREADSHEETS:\n');

    for (const sheet of SPREADSHEETS) {
      console.log(`📄 ${sheet.name}`);
      console.log(`   🆔 ${sheet.id}\n`);

      // Try to find linked scripts by checking if the spreadsheet ID works as a script ID
      // (This happens with container-bound scripts)
      try {
        const project = await script.projects.getContent({ scriptId: sheet.id });
        console.log(`   ✅ Has container-bound script:`);

        const atsrFile = project.data.files.find(f =>
          f.source && f.source.includes('runATSRTitleGenerator')
        );

        if (atsrFile) {
          const codeSize = Math.round(atsrFile.source.length / 1024);
          console.log(`      💾 Size: ${codeSize} KB`);

          if (ultimateCode && atsrFile.source === ultimateCode) {
            console.log(`      🎯 EXACT MATCH with ULTIMATE!`);
          } else if (ultimateCode) {
            console.log(`      ⚠️  Different from ULTIMATE (${Math.round(ultimateCode.length / 1024)} KB)`);
          }
        } else {
          console.log(`      ❌ No ATSR code`);
        }

      } catch (e) {
        console.log(`   ❌ No container-bound script`);
        console.log(`      (Spreadsheet might use standalone project instead)`);
      }

      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📜 ANALYZING STANDALONE PROJECTS:\n');

    for (const proj of STANDALONE_PROJECTS) {
      console.log(`📦 ${proj.name}`);
      console.log(`   🆔 ${proj.id}\n`);

      try {
        const project = await script.projects.getContent({ scriptId: proj.id });

        console.log(`   📋 Files:`);
        project.data.files.forEach(f => console.log(`      • ${f.name}`));
        console.log('');

        const atsrFile = project.data.files.find(f =>
          f.source && f.source.includes('runATSRTitleGenerator')
        );

        if (atsrFile) {
          const codeSize = Math.round(atsrFile.source.length / 1024);
          const hasTestMenu = atsrFile.source.includes('TEST') && atsrFile.source.includes('createMenu');

          console.log(`   ✅ Contains ATSR:`);
          console.log(`      💾 Size: ${codeSize} KB`);
          console.log(`      🧪 TEST menu: ${hasTestMenu ? 'Yes' : 'No'}`);

          // Compare with ULTIMATE
          if (ultimateCode) {
            if (atsrFile.source === ultimateCode) {
              console.log(`      🎯 EXACT MATCH with ULTIMATE!`);
              console.log(`\n      ═══════════════════════════════════════════════════════`);
              console.log(`      ✅ THIS IS THE ULTIMATE ATSR PROJECT!`);
              console.log(`      ═══════════════════════════════════════════════════════\n`);
            } else {
              const ultimateSize = Math.round(ultimateCode.length / 1024);
              const diff = codeSize - ultimateSize;
              console.log(`      ⚠️  Different from ULTIMATE:`);
              console.log(`         This: ${codeSize} KB`);
              console.log(`         ULTIMATE: ${ultimateSize} KB`);
              console.log(`         Difference: ${diff > 0 ? '+' : ''}${diff} KB`);
            }
          }
        } else {
          console.log(`   ❌ No ATSR code (has other features)`);
        }

      } catch (e) {
        console.log(`   ❌ Error accessing project: ${e.message}`);
      }

      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🔍 RECOMMENDATION:\n');
    console.log('If none of the projects above match ULTIMATE, the code may be in:');
    console.log('  1. A project you have not shared script ID for yet');
    console.log('  2. A different Google account');
    console.log('  3. The Drive file Code_ULTIMATE_ATSR.gs is not deployed anywhere\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');
    if (e.stack) {
      console.log(e.stack);
    }
  }
}

check().catch(console.error);
