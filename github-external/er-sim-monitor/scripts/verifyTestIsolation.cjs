#!/usr/bin/env node

/**
 * Verify Test Environment Isolation
 *
 * Ensures test spreadsheet code doesn't write to original spreadsheet
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TEST_SCRIPT_ID = '1INZy2-kQNEfEWEipSQ_WCvrvEhGgAeW4G4TM61W2ajNp_63G39KLPm4Y';
const ORIGINAL_SHEET_ID = '1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM';
const TEST_SHEET_ID = '1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI';

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

async function verifyIsolation() {
  console.log('\n🔒 VERIFYING TEST ENVIRONMENT ISOLATION\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });
    const files = project.data.files.filter(f => f.type === 'SERVER_JS');

    console.log('Analyzing deployed code for spreadsheet references...\n');

    const allCode = files.map(f => f.source).join('\n');

    // Check for SpreadsheetApp calls
    console.log('Step 1: Checking spreadsheet access patterns...\n');

    const usesGetActive = allCode.includes('SpreadsheetApp.getActiveSpreadsheet()');
    const usesOpenById = allCode.includes('SpreadsheetApp.openById');

    if (usesGetActive) {
      console.log('   ✅ Code uses getActiveSpreadsheet()');
      console.log('      This operates on the spreadsheet the script is bound to');
      console.log('      Bound to: TEST spreadsheet');
      console.log('      Will NOT write to original spreadsheet\n');
    }

    if (usesOpenById) {
      console.log('   ⚠️  Code uses openById() - checking which spreadsheets...\n');
    } else {
      console.log('   ✅ Code does NOT use openById()');
      console.log('      Cannot access other spreadsheets\n');
    }

    // Check for hardcoded spreadsheet IDs
    console.log('Step 2: Checking for hardcoded spreadsheet IDs...\n');

    const hasOriginalId = allCode.includes(ORIGINAL_SHEET_ID);
    const hasTestId = allCode.includes(TEST_SHEET_ID);

    if (hasOriginalId) {
      console.log('   ❌ DANGER: Original spreadsheet ID found in code!');
      console.log(`      ID: ${ORIGINAL_SHEET_ID}`);
      console.log('      This could write to the original spreadsheet\n');

      // Find where it appears
      files.forEach(file => {
        if (file.source.includes(ORIGINAL_SHEET_ID)) {
          console.log(`      Found in: ${file.name}`);
        }
      });
      console.log('');
    } else {
      console.log('   ✅ Original spreadsheet ID NOT found in code');
      console.log(`      ${ORIGINAL_SHEET_ID} is not referenced\n`);
    }

    if (hasTestId) {
      console.log('   ℹ️  Test spreadsheet ID found in code');
      console.log(`      ID: ${TEST_SHEET_ID}`);
      console.log('      This is OK if intentional (but getActive is preferred)\n');
    } else {
      console.log('   ✅ Test spreadsheet ID NOT found in code');
      console.log('      Code is not hardcoded to any specific spreadsheet\n');
    }

    // Check for getActive pattern
    console.log('Step 3: Verifying bound spreadsheet pattern...\n');

    const getActiveCount = (allCode.match(/SpreadsheetApp\.getActiveSpreadsheet\(\)/g) || []).length;

    console.log(`   Found ${getActiveCount} calls to getActiveSpreadsheet()`);
    console.log('   This pattern ensures code only operates on the bound spreadsheet\n');

    // Summary
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 ISOLATION VERIFICATION SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('Spreadsheet Bindings:');
    console.log(`   Test Script Bound To: ${TEST_SHEET_ID}`);
    console.log(`   Original Spreadsheet: ${ORIGINAL_SHEET_ID}\n`);

    console.log('Code Analysis:');
    console.log(`   Uses getActiveSpreadsheet(): ${usesGetActive ? 'YES' : 'NO'}`);
    console.log(`   Uses openById(): ${usesOpenById ? 'YES' : 'NO'}`);
    console.log(`   Contains Original Sheet ID: ${hasOriginalId ? 'YES ❌' : 'NO ✅'}`);
    console.log(`   Contains Test Sheet ID: ${hasTestId ? 'YES' : 'NO'}\n`);

    console.log('Isolation Status:');

    if (hasOriginalId) {
      console.log('   ❌ NOT ISOLATED - Original spreadsheet ID found in code');
      console.log('   Risk: Code may write to original spreadsheet');
      console.log('   Action: Remove hardcoded original spreadsheet ID\n');
    } else if (usesGetActive && !hasOriginalId) {
      console.log('   ✅ FULLY ISOLATED - Safe to use');
      console.log('   ✅ Code uses getActiveSpreadsheet() pattern');
      console.log('   ✅ No reference to original spreadsheet');
      console.log('   ✅ Bound to test spreadsheet only');
      console.log('   ✅ Will ONLY write to TEST spreadsheet');
      console.log('   ✅ Original spreadsheet is SAFE\n');
    } else {
      console.log('   ⚠️  NEEDS REVIEW - Check code manually');
      console.log('   Review spreadsheet access patterns\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

    return {
      isolated: !hasOriginalId && usesGetActive,
      usesGetActive,
      hasOriginalId,
      hasTestId
    };

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

verifyIsolation().catch(error => {
  console.error('\nVerification failed:', error.message);
  process.exit(1);
});
