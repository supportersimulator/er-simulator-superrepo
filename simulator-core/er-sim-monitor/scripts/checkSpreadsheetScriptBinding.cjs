#!/usr/bin/env node

/**
 * Check spreadsheet for script binding via Developer Metadata or other means
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SPREADSHEET_ID = '1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI';
const TEST_SCRIPT_ID = '1kkPZU3GsCCuu5IhTEOufmDT1Cb2rSQVB3Y3u1DPf87yoSV4WVtoNvd6i';
const STANDALONE_SCRIPT_ID = '1Bkbm2MNA-YmXQEoMsIlC-VgEgHiQHO2EuMXR-yyxy9lYWl3eNcEHk_S-';

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

async function checkBinding() {
  console.log('\n🔍 CHECKING SPREADSHEET SCRIPT BINDING\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const sheets = google.sheets({ version: 'v4', auth });
  const script = google.script({ version: 'v1', auth });

  try {
    // Get spreadsheet metadata
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID
    });

    console.log(`📊 Spreadsheet: ${spreadsheet.data.properties.title}\n`);

    // Try to check if TEST script works with this spreadsheet
    console.log('🔍 Checking known script projects:\n');

    const scriptsToCheck = [
      { name: 'TEST Script', id: TEST_SCRIPT_ID },
      { name: 'Standalone ATSR Script', id: STANDALONE_SCRIPT_ID }
    ];

    for (const scriptInfo of scriptsToCheck) {
      console.log(`\n📄 ${scriptInfo.name} (${scriptInfo.id})`);

      try {
        const project = await script.projects.getContent({ scriptId: scriptInfo.id });

        console.log(`   📋 Files: ${project.data.files.map(f => f.name).join(', ')}`);

        // Check for TEST menu
        const codeFile = project.data.files.find(f => f.name === 'Code' || f.name.includes('ATSR'));
        if (codeFile) {
          const hasOnOpen = codeFile.source.includes('function onOpen()');
          const hasTestMenu = codeFile.source.includes('TEST') && codeFile.source.includes('createMenu');

          console.log(`   onOpen(): ${hasOnOpen ? '✅' : '❌'}`);
          console.log(`   TEST menu: ${hasTestMenu ? '✅' : '❌'}`);

          if (hasTestMenu) {
            // Extract menu code
            const menuMatch = codeFile.source.match(/createMenu\(['"].*TEST.*['"][\s\S]{0,300}addToUi/i);
            if (menuMatch) {
              console.log(`\n   📝 Menu code found:`);
              console.log(menuMatch[0].substring(0, 200) + '...');
            }
          }
        }

      } catch (e) {
        console.log(`   ❌ Error accessing: ${e.message}`);
      }
    }

    console.log('\n\n═══════════════════════════════════════════════════════════════');
    console.log('💡 RECOMMENDATION:\n');
    console.log('Since we cannot auto-detect the bound script, try this:\n');
    console.log('1. Open the spreadsheet in browser');
    console.log('2. Go to Extensions → Apps Script');
    console.log('3. Check the Script ID in the URL (after /d/)');
    console.log('4. That\'s the actual bound script ID\n');
    console.log('Alternatively, if spreadsheet has NO bound script:');
    console.log('- Create one via Extensions → Apps Script → New');
    console.log('- Copy TEST menu code into it');
    console.log('- Deploy and test\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');
    if (e.stack) {
      console.log(e.stack);
    }
  }
}

checkBinding().catch(console.error);
