#!/usr/bin/env node

/**
 * Final Test Environment Verification
 *
 * Checks complete test environment status and recommends next steps
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TEST_SHEET_ID = '1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI';
const BOUND_SCRIPT_ID = '1kkPZU3GsCCuu5IhTEOufmDT1Cb2rSQVB3Y3u1DPf87yoSV4WVtoNvd6i';

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

async function finalCheck() {
  console.log('\n🔍 FINAL TEST ENVIRONMENT VERIFICATION\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    const checks = [];

    // Check 1: Bound Apps Script Project
    console.log('Check 1: Verifying bound Apps Script project...\n');

    try {
      const projectContent = await script.projects.getContent({ scriptId: BOUND_SCRIPT_ID });
      const files = projectContent.data.files.filter(f => f.type === 'SERVER_JS');

      checks.push({
        name: 'Bound Apps Script Project',
        status: '✅ ACTIVE',
        details: `${files.length} feature files deployed`
      });

      console.log(`   ✅ Bound project active (${files.length} files)\n`);

      // Verify critical functions
      const allCode = files.map(f => f.source).join('\n');
      const criticalFunctions = [
        'getProp',
        'hashText',
        'cleanDuplicateLines',
        'appendLogSafe',
        'processOneInputRow_',
        'openSimSidebar',
        'runATSRTitleGenerator'
      ];

      const missingFunctions = criticalFunctions.filter(fn => !allCode.includes(`function ${fn}`));

      if (missingFunctions.length === 0) {
        checks.push({
          name: 'Critical Functions',
          status: '✅ ALL PRESENT',
          details: `${criticalFunctions.length}/7 functions verified`
        });
        console.log(`   ✅ All 7 critical functions present\n`);
      } else {
        checks.push({
          name: 'Critical Functions',
          status: '❌ MISSING',
          details: `Missing: ${missingFunctions.join(', ')}`
        });
        console.log(`   ❌ Missing functions: ${missingFunctions.join(', ')}\n`);
      }

    } catch (error) {
      checks.push({
        name: 'Bound Apps Script Project',
        status: '❌ ERROR',
        details: error.message
      });
      console.log(`   ❌ Error: ${error.message}\n`);
    }

    // Check 2: OpenAI API Key
    console.log('Check 2: Verifying OpenAI API configuration...\n');

    try {
      const settingsData = await sheets.spreadsheets.values.get({
        spreadsheetId: TEST_SHEET_ID,
        range: 'Settings!A1:B2'
      });

      const apiKey = settingsData.data.values?.[1]?.[1];

      if (apiKey && apiKey.startsWith('sk-proj')) {
        checks.push({
          name: 'OpenAI API Key',
          status: '✅ CONFIGURED',
          details: `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`
        });
        console.log(`   ✅ API key configured: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}\n`);
      } else {
        checks.push({
          name: 'OpenAI API Key',
          status: '⚠️ MISSING',
          details: 'No valid API key found'
        });
        console.log(`   ⚠️ API key not configured\n`);
      }
    } catch (error) {
      checks.push({
        name: 'OpenAI API Key',
        status: '❌ ERROR',
        details: error.message
      });
      console.log(`   ❌ Error: ${error.message}\n`);
    }

    // Check 3: Test Data Availability
    console.log('Check 3: Checking test data availability...\n');

    try {
      // Get Input tab data
      const inputData = await sheets.spreadsheets.values.get({
        spreadsheetId: TEST_SHEET_ID,
        range: 'Input!A:A'
      });

      const inputRows = inputData.data.values ? inputData.data.values.length - 2 : 0; // Subtract 2-tier headers

      checks.push({
        name: 'Input Data Rows',
        status: inputRows > 0 ? '✅ AVAILABLE' : '⚠️ EMPTY',
        details: `${inputRows} data rows (excluding headers)`
      });

      console.log(`   ✅ ${inputRows} data rows available\n`);

      // Check if Row 206 exists
      if (inputRows >= 206) {
        const row206 = await sheets.spreadsheets.values.get({
          spreadsheetId: TEST_SHEET_ID,
          range: 'Input!A206:B206'
        });

        const hasData = row206.data.values && row206.data.values.length > 0;
        checks.push({
          name: 'Row 206 (Test Row)',
          status: hasData ? '✅ EXISTS' : '⚠️ EMPTY',
          details: hasData ? 'Ready for testing' : 'No data in Row 206'
        });

        if (hasData) {
          console.log(`   ✅ Row 206 exists and has data\n`);
        } else {
          console.log(`   ⚠️ Row 206 is empty\n`);
        }
      } else {
        checks.push({
          name: 'Row 206 (Test Row)',
          status: '❌ DOES NOT EXIST',
          details: `Only ${inputRows} rows in spreadsheet`
        });
        console.log(`   ❌ Row 206 does not exist (only ${inputRows} rows)\n`);
      }

    } catch (error) {
      checks.push({
        name: 'Test Data',
        status: '❌ ERROR',
        details: error.message
      });
      console.log(`   ❌ Error: ${error.message}\n`);
    }

    // Check 4: Logging Tabs
    console.log('Check 4: Verifying logging infrastructure...\n');

    try {
      const sheetMetadata = await sheets.spreadsheets.get({
        spreadsheetId: TEST_SHEET_ID
      });

      const sheetNames = sheetMetadata.data.sheets.map(s => s.properties.title);
      const hasReports = sheetNames.includes('Batch_Reports');
      const hasProgress = sheetNames.includes('Batch_Progress');

      if (hasReports && hasProgress) {
        checks.push({
          name: 'Logging Tabs',
          status: '✅ PRESENT',
          details: 'Batch_Reports & Batch_Progress configured'
        });
        console.log(`   ✅ Logging tabs present (Batch_Reports, Batch_Progress)\n`);
      } else {
        checks.push({
          name: 'Logging Tabs',
          status: '⚠️ INCOMPLETE',
          details: `Reports: ${hasReports}, Progress: ${hasProgress}`
        });
        console.log(`   ⚠️ Missing logging tabs (Reports: ${hasReports}, Progress: ${hasProgress})\n`);
      }

    } catch (error) {
      checks.push({
        name: 'Logging Tabs',
        status: '❌ ERROR',
        details: error.message
      });
      console.log(`   ❌ Error: ${error.message}\n`);
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 VERIFICATION SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const passedChecks = checks.filter(c => c.status.includes('✅'));
    const warningChecks = checks.filter(c => c.status.includes('⚠️'));
    const failedChecks = checks.filter(c => c.status.includes('❌'));

    checks.forEach(check => {
      console.log(`${check.status.padEnd(12)} ${check.name}`);
      console.log(`${''.padEnd(12)} ${check.details}\n`);
    });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`✅ ${passedChecks.length} checks passed`);
    console.log(`⚠️  ${warningChecks.length} warnings`);
    console.log(`❌ ${failedChecks.length} failures\n`);

    // Recommendations
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎯 RECOMMENDED NEXT STEPS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (failedChecks.length === 0 && warningChecks.length === 0) {
      console.log('✅ System is FULLY READY for testing!\n');
      console.log('Recommended Testing Steps:');
      console.log('   1. Open test spreadsheet');
      console.log('   2. Extensions → Apps Script (verify 3 feature files visible)');
      console.log('   3. Select a row with data (1-205)');
      console.log('   4. Run batch processing or ATSR feature');
      console.log('   5. Verify processing completes successfully\n');
    } else if (failedChecks.some(c => c.name === 'Row 206 (Test Row)')) {
      console.log('⚠️  Row 206 does not exist in test spreadsheet\n');
      console.log('Options:');
      console.log('   Option 1 (Recommended): Test with existing rows (1-205)');
      console.log('      • All functionality works the same');
      console.log('      • No need to add Row 206');
      console.log('      • Simply select any row with data\n');
      console.log('   Option 2: Add Row 206 data');
      console.log('      • Copy Row 206 from original spreadsheet');
      console.log('      • Or create test data in Row 206');
      console.log('      • Then re-test processing\n');
    } else if (failedChecks.length > 0) {
      console.log('❌ Critical issues detected - resolve before testing:\n');
      failedChecks.forEach(check => {
        console.log(`   • ${check.name}: ${check.details}`);
      });
      console.log('');
    } else if (warningChecks.length > 0) {
      console.log('⚠️  Non-critical warnings detected:\n');
      warningChecks.forEach(check => {
        console.log(`   • ${check.name}: ${check.details}`);
      });
      console.log('\nSystem should still work, but verify these items.\n');
    }

    // URLs
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔗 QUICK ACCESS LINKS');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('Test Spreadsheet:');
    console.log(`   https://docs.google.com/spreadsheets/d/${TEST_SHEET_ID}/edit\n`);
    console.log('Bound Apps Script Project:');
    console.log(`   https://script.google.com/home/projects/${BOUND_SCRIPT_ID}\n`);
    console.log('Apps Script Editor (from spreadsheet):');
    console.log(`   Extensions → Apps Script in test spreadsheet\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Verification Error:', error.message);
    throw error;
  }
}

finalCheck().catch(error => {
  console.error('\nVerification failed:', error.message);
  process.exit(1);
});
