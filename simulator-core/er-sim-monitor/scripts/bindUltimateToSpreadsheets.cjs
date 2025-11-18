#!/usr/bin/env node

/**
 * Bind Code_ULTIMATE_ATSR to BOTH spreadsheets as container-bound scripts
 * This ensures both MAIN and TEST have the correct, most current ATSR code
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const MAIN_SPREADSHEET_ID = '1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM';
const TEST_SPREADSHEET_ID = '1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI';

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

async function bindToSpreadsheet(auth, spreadsheetId, spreadsheetName, ultimateCode) {
  const script = google.script({ version: 'v1', auth });

  console.log(`\n📊 ${spreadsheetName}`);
  console.log(`   🆔 ${spreadsheetId}\n`);

  try {
    // Check if already has bound script
    let hasExisting = false;
    try {
      const existing = await script.projects.getContent({ scriptId: spreadsheetId });
      hasExisting = true;
      console.log(`   ⚠️  Already has container-bound script`);

      const existingATSR = existing.data.files.find(f =>
        f.source && f.source.includes('runATSRTitleGenerator')
      );

      if (existingATSR) {
        const size = Math.round(existingATSR.source.length / 1024);
        console.log(`      Current size: ${size} KB`);

        if (existingATSR.source === ultimateCode) {
          console.log(`      ✅ Already has ULTIMATE - no update needed\n`);
          return { success: true, action: 'already_up_to_date' };
        } else {
          console.log(`      🔄 Will update to ULTIMATE (134 KB)\n`);
        }
      }
    } catch (e) {
      console.log(`   ✅ No existing bound script - will create new one\n`);
    }

    // Create/Update bound script with ULTIMATE code
    console.log(`   🚀 ${hasExisting ? 'Updating' : 'Creating'} container-bound script...\n`);

    await script.projects.updateContent({
      scriptId: spreadsheetId,
      requestBody: {
        files: [
          {
            name: 'appsscript',
            type: 'JSON',
            source: JSON.stringify({
              timeZone: "America/New_York",
              dependencies: {},
              exceptionLogging: "STACKDRIVER"
            }, null, 2)
          },
          {
            name: 'Code',
            type: 'SERVER_JS',
            source: ultimateCode
          }
        ]
      }
    });

    console.log(`   ✅ Successfully ${hasExisting ? 'updated' : 'created'}!\n`);

    // Verify
    const updated = await script.projects.getContent({ scriptId: spreadsheetId });
    const codeFile = updated.data.files.find(f => f.name === 'Code');

    if (codeFile) {
      const size = Math.round(codeFile.source.length / 1024);
      const hasOnOpen = codeFile.source.includes('function onOpen()');
      const hasATSR = codeFile.source.includes('runATSRTitleGenerator');
      const hasTestMenu = codeFile.source.includes('TEST');
      const isUltimate = codeFile.source === ultimateCode;

      console.log(`   ═══════════════════════════════════════════════════`);
      console.log(`   ✅ VERIFICATION:`);
      console.log(`      Size: ${size} KB`);
      console.log(`      onOpen(): ${hasOnOpen ? '✅' : '❌'}`);
      console.log(`      TEST menu: ${hasTestMenu ? '✅' : '❌'}`);
      console.log(`      runATSRTitleGenerator: ${hasATSR ? '✅' : '❌'}`);
      console.log(`      ULTIMATE match: ${isUltimate ? '✅' : '❌'}`);
      console.log(`   ═══════════════════════════════════════════════════\n`);

      return {
        success: true,
        action: hasExisting ? 'updated' : 'created',
        verified: { size, hasOnOpen, hasATSR, hasTestMenu, isUltimate }
      };
    }

  } catch (e) {
    console.log(`   ❌ Error: ${e.message}\n`);
    return { success: false, error: e.message };
  }
}

async function bind() {
  console.log('\n🔗 BINDING CODE_ULTIMATE_ATSR TO BOTH SPREADSHEETS\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();

  // Load ULTIMATE code
  const ultimatePath = path.join(__dirname, 'Code_ULTIMATE_ATSR_FROM_DRIVE.gs');
  console.log('📥 Loading Code_ULTIMATE_ATSR.gs...\n');

  if (!fs.existsSync(ultimatePath)) {
    console.log('❌ Code_ULTIMATE_ATSR_FROM_DRIVE.gs not found!');
    console.log('   Run downloadUltimateATSR.cjs first.\n');
    return;
  }

  const ultimateCode = fs.readFileSync(ultimatePath, 'utf8');
  const ultimateSize = Math.round(ultimateCode.length / 1024);

  console.log(`   ✅ Loaded ULTIMATE ATSR (${ultimateSize} KB)\n`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Bind to MAIN spreadsheet
  console.log('📌 BINDING TO MAIN SPREADSHEET:\n');
  const mainResult = await bindToSpreadsheet(
    auth,
    MAIN_SPREADSHEET_ID,
    'Convert_Master_Sim_CSV_Template_with_Input (MAIN)',
    ultimateCode
  );

  console.log('═══════════════════════════════════════════════════════════════\n');

  // Bind to TEST spreadsheet
  console.log('📌 BINDING TO TEST SPREADSHEET:\n');
  const testResult = await bindToSpreadsheet(
    auth,
    TEST_SPREADSHEET_ID,
    'TEST_Convert_Master_Sim_CSV_Template_with_Input (TEST)',
    ultimateCode
  );

  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('📋 FINAL SUMMARY:\n');

  console.log(`MAIN Spreadsheet: ${mainResult.success ? '✅' : '❌'} ${mainResult.action || mainResult.error}`);
  console.log(`TEST Spreadsheet: ${testResult.success ? '✅' : '❌'} ${testResult.action || testResult.error}\n`);

  if (mainResult.success && testResult.success) {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎉 SUCCESS! Both spreadsheets now have ULTIMATE ATSR (134 KB)\n');
    console.log('🔄 Next Steps:\n');
    console.log('   1. Open MAIN spreadsheet: Convert_Master_Sim_CSV_Template_with_Input');
    console.log('   2. Refresh the page');
    console.log('   3. Look for 🧪 TEST menu');
    console.log('   4. Click "Titles Optimizer"\n');
    console.log('   5. Open TEST spreadsheet: TEST_Convert_Master_Sim_CSV_Template_with_Input');
    console.log('   6. Refresh the page');
    console.log('   7. Verify 🧪 TEST menu appears there too\n');
    console.log('Both spreadsheets are now fully functional with the same code!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
  } else {
    console.log('⚠️  Some operations failed. Review errors above.\n');
  }
}

bind().catch(console.error);
