#!/usr/bin/env node

/**
 * Comprehensive Comparison: Original vs Test Spreadsheet Code
 *
 * Compares function-by-function between monolithic original and feature-based test deployment
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const ORIGINAL_SHEET_ID = '1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM';
const TEST_SHEET_ID = '1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI';
const TEST_SCRIPT_ID = '1INZy2-kQNEfEWEipSQ_WCvrvEhGgAeW4G4TM61W2ajNp_63G39KLPm4Y';

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

function extractFunctions(code) {
  const functions = [];
  const functionRegex = /function\s+(\w+)\s*\([^)]*\)/g;
  let match;

  while ((match = functionRegex.exec(code)) !== null) {
    functions.push(match[1]);
  }

  return functions;
}

function extractFunctionCode(code, functionName) {
  const lines = code.split('\n');
  let startLine = -1;
  let endLine = -1;

  // Find function start
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(`function ${functionName}(`)) {
      startLine = i;
      break;
    }
  }

  if (startLine === -1) return null;

  // Find function end (matching braces)
  let braceCount = 0;
  let inFunction = false;

  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];
    for (let char of line) {
      if (char === '{') {
        braceCount++;
        inFunction = true;
      } else if (char === '}') {
        braceCount--;
        if (inFunction && braceCount === 0) {
          endLine = i + 1;
          break;
        }
      }
    }
    if (endLine !== -1) break;
  }

  if (endLine === -1) return null;

  return lines.slice(startLine, endLine).join('\n');
}

function compareCode(code1, code2) {
  // Normalize whitespace for comparison
  const normalize = (code) => code.replace(/\s+/g, ' ').trim();
  return normalize(code1) === normalize(code2);
}

async function compareDeployments() {
  console.log('\n🔍 COMPREHENSIVE COMPARISON: ORIGINAL VS TEST DEPLOYMENT\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });
  const drive = google.drive({ version: 'v3', auth });

  const comparison = {
    timestamp: new Date().toISOString(),
    original: {
      sheetId: ORIGINAL_SHEET_ID,
      functions: [],
      totalSize: 0
    },
    test: {
      sheetId: TEST_SHEET_ID,
      scriptId: TEST_SCRIPT_ID,
      files: [],
      functions: [],
      totalSize: 0
    },
    results: {
      identical: [],
      modified: [],
      missingInTest: [],
      newInTest: [],
      totalFunctions: 0
    }
  };

  // Step 1: Get Original Spreadsheet Code
  console.log('Step 1: Analyzing original spreadsheet code...\n');

  try {
    // Find original Apps Script project
    const originalSearch = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.script' and '${ORIGINAL_SHEET_ID}' in parents`,
      fields: 'files(id, name)'
    });

    if (originalSearch.data.files.length === 0) {
      console.log('   ❌ No Apps Script project found for original spreadsheet');
      console.log('   Cannot perform comparison\n');
      return;
    }

    const originalScriptId = originalSearch.data.files[0].id;
    console.log(`   ✓ Found original project: ${originalScriptId}`);

    const originalProject = await script.projects.getContent({ scriptId: originalScriptId });
    const originalFiles = originalProject.data.files;

    console.log(`   ✓ Original has ${originalFiles.length} files\n`);

    // Extract all functions from original
    const originalCode = originalFiles
      .filter(f => f.type === 'SERVER_JS')
      .map(f => f.source)
      .join('\n');

    comparison.original.totalSize = originalCode.length;
    comparison.original.functions = extractFunctions(originalCode);

    console.log(`   Functions in original: ${comparison.original.functions.length}`);
    console.log(`   Total size: ${(originalCode.length / 1024).toFixed(1)} KB\n`);

  } catch (error) {
    console.error('   ❌ Error reading original:', error.message);
    throw error;
  }

  // Step 2: Get Test Spreadsheet Code
  console.log('Step 2: Analyzing test spreadsheet code...\n');

  try {
    const testProject = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });
    const testFiles = testProject.data.files.filter(f => f.type === 'SERVER_JS');

    comparison.test.files = testFiles.map(f => ({
      name: f.name,
      size: f.source.length,
      functions: extractFunctions(f.source)
    }));

    console.log('   Test deployment structure:');
    comparison.test.files.forEach(file => {
      console.log(`      • ${file.name}: ${file.functions.length} functions, ${(file.size / 1024).toFixed(1)} KB`);
    });
    console.log('');

    // Extract all functions from test
    const testCode = testFiles.map(f => f.source).join('\n');
    comparison.test.totalSize = testCode.length;
    comparison.test.functions = extractFunctions(testCode);

    console.log(`   Functions in test: ${comparison.test.functions.length}`);
    console.log(`   Total size: ${(testCode.length / 1024).toFixed(1)} KB\n`);

  } catch (error) {
    console.error('   ❌ Error reading test deployment:', error.message);
    throw error;
  }

  // Step 3: Function-by-Function Comparison
  console.log('Step 3: Comparing functions...\n');

  const originalProject = await script.projects.getContent({
    scriptId: (await drive.files.list({
      q: `mimeType='application/vnd.google-apps.script' and '${ORIGINAL_SHEET_ID}' in parents`,
      fields: 'files(id)'
    })).data.files[0].id
  });

  const testProject = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });

  const originalCode = originalProject.data.files
    .filter(f => f.type === 'SERVER_JS')
    .map(f => f.source)
    .join('\n');

  const testCode = testProject.data.files
    .filter(f => f.type === 'SERVER_JS')
    .map(f => f.source)
    .join('\n');

  // Compare each function
  const allFunctions = [...new Set([...comparison.original.functions, ...comparison.test.functions])];
  comparison.results.totalFunctions = allFunctions.length;

  console.log('   Comparing functions:\n');

  for (const funcName of allFunctions.sort()) {
    const originalFunc = extractFunctionCode(originalCode, funcName);
    const testFunc = extractFunctionCode(testCode, funcName);

    if (originalFunc && testFunc) {
      if (compareCode(originalFunc, testFunc)) {
        comparison.results.identical.push(funcName);
        console.log(`      ✅ ${funcName} - IDENTICAL`);
      } else {
        comparison.results.modified.push({
          name: funcName,
          originalSize: originalFunc.length,
          testSize: testFunc.length
        });
        console.log(`      ⚠️  ${funcName} - MODIFIED (${originalFunc.length} → ${testFunc.length} chars)`);
      }
    } else if (originalFunc && !testFunc) {
      comparison.results.missingInTest.push(funcName);
      console.log(`      ❌ ${funcName} - MISSING IN TEST`);
    } else if (!originalFunc && testFunc) {
      comparison.results.newInTest.push(funcName);
      console.log(`      ➕ ${funcName} - NEW IN TEST`);
    }
  }

  console.log('');

  // Step 4: Feature Mapping
  console.log('Step 4: Mapping functions to features...\n');

  const featureMap = {
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
      'checkApiStatus',
      'readTwoTierHeaders_',
      'mergedKeysFromTwoTiers_',
      'cacheHeaders',
      'getCachedHeadersOrRead',
      'clearHeaderCache',
      'ensureBatchReportsSheet_'
    ],
    'Core_Processing_Engine': [
      'processOneInputRow_',
      'validateVitalsFields_',
      'applyClinicalDefaults_',
      'tryParseJSON'
    ]
  };

  console.log('   Feature completeness:\n');

  for (const [feature, expectedFuncs] of Object.entries(featureMap)) {
    const foundFuncs = expectedFuncs.filter(f => comparison.test.functions.includes(f));
    const missingFuncs = expectedFuncs.filter(f => !comparison.test.functions.includes(f));

    const completeness = (foundFuncs.length / expectedFuncs.length) * 100;

    console.log(`   ${feature}:`);
    console.log(`      ${foundFuncs.length}/${expectedFuncs.length} functions (${completeness.toFixed(0)}%)`);

    if (missingFuncs.length > 0) {
      console.log(`      Missing: ${missingFuncs.join(', ')}`);
    }
    console.log('');
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 COMPARISON SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Total Functions Analyzed: ${comparison.results.totalFunctions}`);
  console.log('');
  console.log(`✅ Identical: ${comparison.results.identical.length}`);
  console.log(`⚠️  Modified: ${comparison.results.modified.length}`);
  console.log(`❌ Missing in Test: ${comparison.results.missingInTest.length}`);
  console.log(`➕ New in Test: ${comparison.results.newInTest.length}`);
  console.log('');

  if (comparison.results.modified.length > 0) {
    console.log('Modified Functions:');
    comparison.results.modified.forEach(func => {
      console.log(`   • ${func.name} (${func.originalSize} → ${func.testSize} chars)`);
    });
    console.log('');
  }

  if (comparison.results.missingInTest.length > 0) {
    console.log('⚠️  Functions Missing in Test:');
    comparison.results.missingInTest.forEach(func => {
      console.log(`   • ${func}`);
    });
    console.log('');
  }

  if (comparison.results.newInTest.length > 0) {
    console.log('➕ New Functions in Test:');
    comparison.results.newInTest.forEach(func => {
      console.log(`   • ${func}`);
    });
    console.log('');
  }

  const functionalParity = (comparison.results.identical.length / comparison.results.totalFunctions) * 100;

  console.log('Functional Parity: ' + functionalParity.toFixed(1) + '%');
  console.log('');

  if (functionalParity >= 90) {
    console.log('✅ HIGH PARITY - Test deployment matches original well');
  } else if (functionalParity >= 70) {
    console.log('⚠️  MODERATE PARITY - Some differences found');
  } else {
    console.log('❌ LOW PARITY - Significant differences detected');
  }

  console.log('═══════════════════════════════════════════════════════════════\n');

  // Save report
  const reportPath = path.join(__dirname, '../docs/ORIGINAL_VS_TEST_COMPARISON.json');
  fs.writeFileSync(reportPath, JSON.stringify(comparison, null, 2));
  console.log(`📋 Full comparison saved: ${reportPath}\n`);

  return comparison;
}

compareDeployments().catch(error => {
  console.error('\n❌ Comparison failed:', error.message);
  process.exit(1);
});
