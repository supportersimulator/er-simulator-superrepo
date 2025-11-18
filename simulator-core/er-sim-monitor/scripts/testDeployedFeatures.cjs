#!/usr/bin/env node

/**
 * Automated Testing of Deployed Feature-Based Code
 *
 * Tests the feature files deployed to test spreadsheet via Apps Script API
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TEST_SHEET_ID = '1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI';
const SCRIPT_ID = '1INZy2-kQNEfEWEipSQ_WCvrvEhGgAeW4G4TM61W2ajNp_63G39KLPm4Y';

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

async function testDeployedFeatures() {
  console.log('\n🧪 AUTOMATED TESTING OF DEPLOYED FEATURES\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });
  const sheets = google.sheets({ version: 'v4', auth });

  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    passed: 0,
    failed: 0,
    warnings: 0
  };

  // Test 1: Verify Project Structure
  console.log('Test 1: Verifying Apps Script project structure...\n');

  try {
    const project = await script.projects.getContent({ scriptId: SCRIPT_ID });
    const files = project.data.files;

    const expectedFiles = [
      'ATSR_Title_Generator_Feature',
      'Batch_Processing_Sidebar_Feature',
      'Core_Processing_Engine',
      'appsscript'
    ];

    const foundFiles = files.map(f => f.name);
    const missingFiles = expectedFiles.filter(ef => !foundFiles.includes(ef));

    if (missingFiles.length === 0) {
      console.log('   ✅ All expected files present');
      results.tests.push({
        name: 'Project Structure',
        status: 'PASS',
        details: `Found all ${expectedFiles.length} expected files`
      });
      results.passed++;
    } else {
      console.log(`   ❌ Missing files: ${missingFiles.join(', ')}`);
      results.tests.push({
        name: 'Project Structure',
        status: 'FAIL',
        details: `Missing files: ${missingFiles.join(', ')}`
      });
      results.failed++;
    }

    // Check file types
    const fileTypes = files.map(f => ({ name: f.name, type: f.type }));
    console.log('\n   File Types:');
    fileTypes.forEach(ft => {
      console.log(`      • ${ft.name}: ${ft.type}`);
    });
    console.log('');

  } catch (error) {
    console.log(`   ❌ Error accessing project: ${error.message}\n`);
    results.tests.push({
      name: 'Project Structure',
      status: 'FAIL',
      details: error.message
    });
    results.failed++;
  }

  // Test 2: Verify Spreadsheet Access
  console.log('Test 2: Verifying test spreadsheet access...\n');

  try {
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: TEST_SHEET_ID
    });

    const sheetTitles = spreadsheet.data.sheets.map(s => s.properties.title);
    console.log(`   ✅ Spreadsheet accessible: ${spreadsheet.data.properties.title}`);
    console.log(`   ✅ Found ${sheetTitles.length} sheets:`);
    sheetTitles.forEach(title => {
      console.log(`      • ${title}`);
    });
    console.log('');

    results.tests.push({
      name: 'Spreadsheet Access',
      status: 'PASS',
      details: `Spreadsheet accessible with ${sheetTitles.length} sheets`
    });
    results.passed++;

  } catch (error) {
    console.log(`   ❌ Error accessing spreadsheet: ${error.message}\n`);
    results.tests.push({
      name: 'Spreadsheet Access',
      status: 'FAIL',
      details: error.message
    });
    results.failed++;
  }

  // Test 3: Verify Function Definitions
  console.log('Test 3: Verifying function definitions in feature files...\n');

  try {
    const project = await script.projects.getContent({ scriptId: SCRIPT_ID });
    const files = project.data.files;

    const expectedFunctions = {
      'ATSR_Title_Generator_Feature': [
        'runATSRTitleGenerator',
        'parseATSRResponse_',
        'buildATSRUltimateUI_',
        'applyATSRSelectionsWithDefiningAndMemory'
      ],
      'Batch_Processing_Sidebar_Feature': [
        'openSimSidebar',
        'extractValueFromParsed_',
        'syncApiKeyFromSettingsSheet_',
        'readApiKey_',
        'checkApiStatus'
      ],
      'Core_Processing_Engine': [
        'processOneInputRow_',
        'validateVitalsFields_',
        'applyClinicalDefaults_',
        'tryParseJSON'
      ]
    };

    let allFunctionsFound = true;

    for (const [fileName, expectedFuncs] of Object.entries(expectedFunctions)) {
      const file = files.find(f => f.name === fileName);

      if (!file) {
        console.log(`   ⚠️  File not found: ${fileName}`);
        allFunctionsFound = false;
        continue;
      }

      console.log(`   Checking ${fileName}:`);

      const missingFuncs = [];
      expectedFuncs.forEach(funcName => {
        const funcRegex = new RegExp(`function\\s+${funcName}\\s*\\(`);
        if (funcRegex.test(file.source)) {
          console.log(`      ✅ ${funcName}()`);
        } else {
          console.log(`      ❌ ${funcName}() - NOT FOUND`);
          missingFuncs.push(funcName);
          allFunctionsFound = false;
        }
      });

      if (missingFuncs.length > 0) {
        results.warnings++;
      }
      console.log('');
    }

    if (allFunctionsFound) {
      results.tests.push({
        name: 'Function Definitions',
        status: 'PASS',
        details: 'All expected functions found'
      });
      results.passed++;
    } else {
      results.tests.push({
        name: 'Function Definitions',
        status: 'FAIL',
        details: 'Some expected functions missing'
      });
      results.failed++;
    }

  } catch (error) {
    console.log(`   ❌ Error checking functions: ${error.message}\n`);
    results.tests.push({
      name: 'Function Definitions',
      status: 'FAIL',
      details: error.message
    });
    results.failed++;
  }

  // Test 4: Verify Golden Prompts
  console.log('Test 4: Verifying golden prompts preserved...\n');

  try {
    const project = await script.projects.getContent({ scriptId: SCRIPT_ID });
    const files = project.data.files;

    const atsrFile = files.find(f => f.name === 'ATSR_Title_Generator_Feature');

    if (!atsrFile) {
      console.log('   ❌ ATSR file not found\n');
      results.tests.push({
        name: 'Golden Prompts',
        status: 'FAIL',
        details: 'ATSR file not found'
      });
      results.failed++;
    } else {
      const goldenPhrases = [
        'Sim Mastery ATSR',
        'Automated Titles, Summary & Review Generator',
        'clinically accurate'
      ];

      let allFound = true;
      console.log('   Checking for golden prompt phrases:');

      goldenPhrases.forEach(phrase => {
        if (atsrFile.source.includes(phrase)) {
          console.log(`      ✅ Found: "${phrase}"`);
        } else {
          console.log(`      ❌ Missing: "${phrase}"`);
          allFound = false;
        }
      });
      console.log('');

      if (allFound) {
        results.tests.push({
          name: 'Golden Prompts',
          status: 'PASS',
          details: 'All golden prompt phrases found'
        });
        results.passed++;
      } else {
        results.tests.push({
          name: 'Golden Prompts',
          status: 'FAIL',
          details: 'Some golden prompt phrases missing'
        });
        results.failed++;
      }
    }

  } catch (error) {
    console.log(`   ❌ Error checking golden prompts: ${error.message}\n`);
    results.tests.push({
      name: 'Golden Prompts',
      status: 'FAIL',
      details: error.message
    });
    results.failed++;
  }

  // Test 5: Check File Sizes
  console.log('Test 5: Checking file sizes...\n');

  try {
    const project = await script.projects.getContent({ scriptId: SCRIPT_ID });
    const files = project.data.files;

    console.log('   File sizes:');
    files.forEach(file => {
      const sizeKB = (file.source.length / 1024).toFixed(1);
      console.log(`      • ${file.name}: ${sizeKB} KB`);
    });
    console.log('');

    const totalSize = files.reduce((sum, f) => sum + f.source.length, 0);
    console.log(`   ✅ Total project size: ${(totalSize / 1024).toFixed(1)} KB\n`);

    results.tests.push({
      name: 'File Sizes',
      status: 'PASS',
      details: `Total: ${(totalSize / 1024).toFixed(1)} KB`
    });
    results.passed++;

  } catch (error) {
    console.log(`   ❌ Error checking file sizes: ${error.message}\n`);
    results.tests.push({
      name: 'File Sizes',
      status: 'FAIL',
      details: error.message
    });
    results.failed++;
  }

  // Test 6: Verify Sheet Data Access
  console.log('Test 6: Verifying data access in Master Scenario Convert sheet...\n');

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: TEST_SHEET_ID,
      range: 'Master Scenario Convert!A1:C3'
    });

    const rows = response.data.values;

    if (rows && rows.length > 0) {
      console.log(`   ✅ Can read data: ${rows.length} rows found`);
      console.log('   First few cells:');
      rows.slice(0, 3).forEach((row, i) => {
        console.log(`      Row ${i + 1}: ${row.slice(0, 3).join(' | ')}`);
      });
      console.log('');

      results.tests.push({
        name: 'Sheet Data Access',
        status: 'PASS',
        details: `Can read ${rows.length} rows`
      });
      results.passed++;
    } else {
      console.log('   ⚠️  Sheet exists but no data found\n');
      results.tests.push({
        name: 'Sheet Data Access',
        status: 'WARN',
        details: 'No data found'
      });
      results.warnings++;
    }

  } catch (error) {
    console.log(`   ❌ Error reading sheet data: ${error.message}\n`);
    results.tests.push({
      name: 'Sheet Data Access',
      status: 'FAIL',
      details: error.message
    });
    results.failed++;
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Tests Run: ${results.tests.length}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️  Warnings: ${results.warnings}`);
  console.log('');

  const passRate = ((results.passed / results.tests.length) * 100).toFixed(1);
  console.log(`Pass Rate: ${passRate}%`);
  console.log('');

  if (results.failed === 0) {
    console.log('✅ ALL CRITICAL TESTS PASSED');
    console.log('   Feature-based code deployment verified successful');
    console.log('   Ready for manual functional testing');
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('   Review failures above before manual testing');
  }
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Save results
  const resultsPath = path.join(__dirname, '../docs/AUTOMATED_TEST_RESULTS.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`📋 Full results saved: ${resultsPath}\n`);

  return results;
}

testDeployedFeatures().catch(error => {
  console.error('\n❌ Testing failed:', error.message);
  process.exit(1);
});
