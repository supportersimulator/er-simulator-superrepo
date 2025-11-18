#!/usr/bin/env node

/**
 * Comprehensive Comparison: Monolithic Code vs Test Deployment
 *
 * Compares local monolithic Code_ULTIMATE_ATSR.gs with deployed test features
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const MONOLITHIC_PATH = path.join(__dirname, 'Code_ULTIMATE_ATSR.gs');
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
  console.log('\n🔍 COMPREHENSIVE TOOL-BY-TOOL COMPARISON\n');
  console.log('Monolithic Code_ULTIMATE_ATSR.gs vs Test Deployment\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const comparison = {
    timestamp: new Date().toISOString(),
    monolithic: {
      path: MONOLITHIC_PATH,
      functions: [],
      totalSize: 0
    },
    test: {
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

  // Step 1: Read Monolithic Code
  console.log('Step 1: Analyzing monolithic code (Code_ULTIMATE_ATSR.gs)...\n');

  if (!fs.existsSync(MONOLITHIC_PATH)) {
    console.log(`   ❌ Monolithic file not found: ${MONOLITHIC_PATH}\n`);
    return;
  }

  const monolithicCode = fs.readFileSync(MONOLITHIC_PATH, 'utf8');
  comparison.monolithic.totalSize = monolithicCode.length;
  comparison.monolithic.functions = extractFunctions(monolithicCode);

  console.log(`   ✓ Functions found: ${comparison.monolithic.functions.length}`);
  console.log(`   ✓ Total size: ${(monolithicCode.length / 1024).toFixed(1)} KB\n`);

  // Step 2: Read Test Deployment
  console.log('Step 2: Analyzing test deployment...\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    const testProject = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });
    const testFiles = testProject.data.files.filter(f => f.type === 'SERVER_JS');

    comparison.test.files = testFiles.map(f => ({
      name: f.name,
      size: f.source.length,
      functions: extractFunctions(f.source)
    }));

    console.log('   Test deployment files:');
    comparison.test.files.forEach(file => {
      console.log(`      • ${file.name}:`);
      console.log(`        ${file.functions.length} functions, ${(file.size / 1024).toFixed(1)} KB`);
      console.log(`        Functions: ${file.functions.join(', ')}`);
    });
    console.log('');

    // Combine all test code
    const testCode = testFiles.map(f => f.source).join('\n');
    comparison.test.totalSize = testCode.length;
    comparison.test.functions = extractFunctions(testCode);

    console.log(`   ✓ Total test functions: ${comparison.test.functions.length}`);
    console.log(`   ✓ Total test size: ${(testCode.length / 1024).toFixed(1)} KB\n`);

    // Step 3: Function-by-Function Comparison
    console.log('Step 3: Detailed function comparison...\n');

    const allFunctions = [...new Set([...comparison.monolithic.functions, ...comparison.test.functions])].sort();
    comparison.results.totalFunctions = allFunctions.length;

    console.log(`   Total unique functions: ${allFunctions.length}\n`);
    console.log('   Function-by-function analysis:\n');

    for (const funcName of allFunctions) {
      const monolithicFunc = extractFunctionCode(monolithicCode, funcName);
      const testFunc = extractFunctionCode(testCode, funcName);

      if (monolithicFunc && testFunc) {
        if (compareCode(monolithicFunc, testFunc)) {
          comparison.results.identical.push(funcName);
          console.log(`      ✅ ${funcName}`);
          console.log(`         Status: IDENTICAL`);
          console.log(`         Size: ${monolithicFunc.length} chars`);
        } else {
          const sizeDiff = testFunc.length - monolithicFunc.length;
          const sizeDiffStr = sizeDiff > 0 ? `+${sizeDiff}` : `${sizeDiff}`;

          comparison.results.modified.push({
            name: funcName,
            monolithicSize: monolithicFunc.length,
            testSize: testFunc.length,
            difference: sizeDiff
          });
          console.log(`      ⚠️  ${funcName}`);
          console.log(`         Status: MODIFIED`);
          console.log(`         Monolithic: ${monolithicFunc.length} chars`);
          console.log(`         Test: ${testFunc.length} chars (${sizeDiffStr})`);
        }
      } else if (monolithicFunc && !testFunc) {
        comparison.results.missingInTest.push(funcName);
        console.log(`      ❌ ${funcName}`);
        console.log(`         Status: MISSING IN TEST`);
        console.log(`         Original size: ${monolithicFunc.length} chars`);
      } else if (!monolithicFunc && testFunc) {
        comparison.results.newInTest.push(funcName);
        console.log(`      ➕ ${funcName}`);
        console.log(`         Status: NEW IN TEST`);
        console.log(`         Test size: ${testFunc.length} chars`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('   ❌ Error reading test deployment:', error.message);
    throw error;
  }

  // Step 4: Feature Completeness Check
  console.log('Step 4: Feature completeness analysis...\n');

  const featureMap = {
    'ATSR Feature (Title Generation)': [
      'runATSRTitleGenerator',
      'parseATSRResponse_',
      'buildATSRUltimateUI_',
      'applyATSRSelectionsWithDefiningAndMemory'
    ],
    'Batch Processing Sidebar': [
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
    'Core Processing Engine': [
      'processOneInputRow_',
      'validateVitalsFields_',
      'applyClinicalDefaults_',
      'tryParseJSON'
    ]
  };

  let totalExpected = 0;
  let totalFound = 0;

  for (const [featureName, expectedFuncs] of Object.entries(featureMap)) {
    const foundFuncs = expectedFuncs.filter(f => comparison.test.functions.includes(f));
    const missingFuncs = expectedFuncs.filter(f => !comparison.test.functions.includes(f));
    const completeness = (foundFuncs.length / expectedFuncs.length) * 100;

    totalExpected += expectedFuncs.length;
    totalFound += foundFuncs.length;

    console.log(`   ${featureName}:`);
    console.log(`      Completeness: ${foundFuncs.length}/${expectedFuncs.length} (${completeness.toFixed(0)}%)`);

    if (completeness === 100) {
      console.log(`      Status: ✅ COMPLETE`);
    } else if (completeness >= 75) {
      console.log(`      Status: ⚠️  MOSTLY COMPLETE`);
    } else {
      console.log(`      Status: ❌ INCOMPLETE`);
    }

    if (missingFuncs.length > 0) {
      console.log(`      Missing: ${missingFuncs.join(', ')}`);
    }

    // Show which file contains these functions in test
    const testFile = comparison.test.files.find(file =>
      foundFuncs.some(f => file.functions.includes(f))
    );

    if (testFile) {
      console.log(`      Test file: ${testFile.name}`);
    }

    console.log('');
  }

  const overallCompleteness = (totalFound / totalExpected) * 100;
  console.log(`   Overall Feature Completeness: ${totalFound}/${totalExpected} (${overallCompleteness.toFixed(1)}%)\n`);

  // Summary
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 COMPARISON SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('Code Size:');
  console.log(`   Monolithic: ${(comparison.monolithic.totalSize / 1024).toFixed(1)} KB`);
  console.log(`   Test Deployment: ${(comparison.test.totalSize / 1024).toFixed(1)} KB`);
  const sizeDiff = ((comparison.test.totalSize - comparison.monolithic.totalSize) / comparison.monolithic.totalSize) * 100;
  console.log(`   Difference: ${sizeDiff > 0 ? '+' : ''}${sizeDiff.toFixed(1)}%`);
  console.log('');

  console.log('Function Count:');
  console.log(`   Monolithic: ${comparison.monolithic.functions.length} functions`);
  console.log(`   Test Deployment: ${comparison.test.functions.length} functions`);
  console.log(`   Total Unique: ${comparison.results.totalFunctions} functions`);
  console.log('');

  console.log('Function Status:');
  console.log(`   ✅ Identical: ${comparison.results.identical.length} (${((comparison.results.identical.length / comparison.results.totalFunctions) * 100).toFixed(1)}%)`);
  console.log(`   ⚠️  Modified: ${comparison.results.modified.length} (${((comparison.results.modified.length / comparison.results.totalFunctions) * 100).toFixed(1)}%)`);
  console.log(`   ❌ Missing in Test: ${comparison.results.missingInTest.length}`);
  console.log(`   ➕ New in Test: ${comparison.results.newInTest.length}`);
  console.log('');

  if (comparison.results.missingInTest.length > 0) {
    console.log('⚠️  CRITICAL - Functions Missing in Test:');
    comparison.results.missingInTest.forEach(func => {
      console.log(`      • ${func}`);
    });
    console.log('');
  }

  if (comparison.results.modified.length > 0) {
    console.log('⚠️  Modified Functions (may need review):');
    comparison.results.modified.forEach(func => {
      const diffStr = func.difference > 0 ? `+${func.difference}` : `${func.difference}`;
      console.log(`      • ${func.name}: ${func.monolithicSize} → ${func.testSize} chars (${diffStr})`);
    });
    console.log('');
  }

  const functionalParity = (comparison.results.identical.length / comparison.results.totalFunctions) * 100;

  console.log('Functional Parity Score: ' + functionalParity.toFixed(1) + '%');
  console.log('');

  if (functionalParity >= 95) {
    console.log('✅ EXCELLENT PARITY - Test deployment highly matches monolithic code');
  } else if (functionalParity >= 85) {
    console.log('✅ GOOD PARITY - Test deployment mostly matches monolithic code');
  } else if (functionalParity >= 70) {
    console.log('⚠️  MODERATE PARITY - Some differences found, review recommended');
  } else {
    console.log('❌ LOW PARITY - Significant differences detected, thorough review required');
  }

  console.log('═══════════════════════════════════════════════════════════════\n');

  // Save detailed report
  const reportPath = path.join(__dirname, '../docs/MONOLITHIC_VS_TEST_COMPARISON.json');
  fs.writeFileSync(reportPath, JSON.stringify(comparison, null, 2));
  console.log(`📋 Full comparison report saved: ${reportPath}\n`);

  return comparison;
}

compareDeployments().catch(error => {
  console.error('\n❌ Comparison failed:', error.message);
  console.error(error.stack);
  process.exit(1);
});
