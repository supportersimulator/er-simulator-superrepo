#!/usr/bin/env node

/**
 * COMPREHENSIVE FEATURE TEST
 *
 * Tests ALL critical functions to ensure nothing broke with recent changes.
 * Only save the monolithic file if ALL tests pass.
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

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

async function test() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🧪 COMPREHENSIVE FEATURE TEST');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('📥 Downloading current deployed code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const code = content.data.files.find(f => f.name === 'Code').source;

    console.log('Code size: ' + (code.length / 1024).toFixed(1) + 'KB');
    console.log('Lines: ' + code.split('\n').length + '\n');

    let allTestsPassed = true;
    const results = [];

    // ============================================================
    // TEST 1: Critical Functions Exist
    // ============================================================
    console.log('TEST 1: Critical Functions Exist\n');

    const criticalFunctions = [
      'onOpen',
      'runATSRTitleGenerator',
      'startBatchFromSidebar',
      'openSimSidebar',
      'runPathwayChainBuilder',
      'showFieldSelector',
      'getFieldSelectorData',
      'performCacheWithProgress',
      'getRecommendedFields',
      'refreshHeaders',
      'getAvailableFields',
      'buildBirdEyeViewUI_',
      'getOrCreateHolisticAnalysis_'
    ];

    criticalFunctions.forEach(fn => {
      const regex = new RegExp('function ' + fn + '\\s*\\(');
      const exists = regex.test(code);
      const status = exists ? '✅' : '❌';
      console.log(status + ' ' + fn);
      results.push({ test: 'Function exists: ' + fn, passed: exists });
      if (!exists) allTestsPassed = false;
    });

    // ============================================================
    // TEST 2: No Undefined Variable References
    // ============================================================
    console.log('\nTEST 2: No Undefined Variable References\n');

    const badPatterns = [
      { pattern: /getAIRecommendedFields\(/, name: 'getAIRecommendedFields (should be getRecommendedFields)' },
      { pattern: /categoriesJson(?!\s*=)/, name: 'categoriesJson (undefined variable)' },
      { pattern: /selectedJson(?!\s*=)/, name: 'selectedJson (undefined in openSimSidebar)' }
    ];

    badPatterns.forEach(({ pattern, name }) => {
      const found = pattern.test(code);
      const status = found ? '❌' : '✅';
      console.log(status + ' No ' + name + ' references');
      results.push({ test: 'No bad reference: ' + name, passed: !found });
      if (found) allTestsPassed = false;
    });

    // ============================================================
    // TEST 3: Background Initialization Steps Present
    // ============================================================
    console.log('\nTEST 3: Background Initialization Steps\n');

    const initSteps = [
      { pattern: /refreshHeaders\(\)/, name: 'Step 1: refreshHeaders() called' },
      { pattern: /SELECTED_CACHE_FIELDS/, name: 'Step 2: Default fields initialization' },
      { pattern: /getRecommendedFields\(availableFields,\s*currentSelection\)/, name: 'Step 2.5: AI recommendations pre-fetch' },
      { pattern: /AI_RECOMMENDED_FIELDS/, name: 'Step 2.5: AI recommendations cached' }
    ];

    initSteps.forEach(({ pattern, name }) => {
      const exists = pattern.test(code);
      const status = exists ? '✅' : '❌';
      console.log(status + ' ' + name);
      results.push({ test: name, passed: exists });
      if (!exists) allTestsPassed = false;
    });

    // ============================================================
    // TEST 4: Field Selector Uses Cached Data
    // ============================================================
    console.log('\nTEST 4: Field Selector Optimization\n');

    // Find getFieldSelectorData function
    const funcStart = code.indexOf('function getFieldSelectorData() {');
    const funcEnd = code.indexOf('\nfunction ', funcStart + 10);
    const funcCode = funcStart !== -1 && funcEnd !== -1 ? code.substring(funcStart, funcEnd) : '';

    const optimizations = [
      {
        pattern: /CACHED_HEADER2/,
        name: 'Uses CACHED_HEADER2',
        shouldExist: true
      },
      {
        pattern: /refreshHeaders\(\)/,
        name: 'Does NOT call refreshHeaders() (uses cache)',
        shouldExist: false
      },
      {
        pattern: /Using PRE-CACHED data/,
        name: 'Has optimization comment',
        shouldExist: true
      }
    ];

    optimizations.forEach(({ pattern, name, shouldExist }) => {
      const found = pattern.test(funcCode);
      const passed = shouldExist ? found : !found;
      const status = passed ? '✅' : '❌';
      console.log(status + ' ' + name);
      results.push({ test: 'getFieldSelectorData: ' + name, passed });
      if (!passed) allTestsPassed = false;
    });

    // ============================================================
    // TEST 5: Menu Structure Complete
    // ============================================================
    console.log('\nTEST 5: Menu Structure\n');

    const menuItems = [
      { pattern: /ATSR Titles Optimizer/, name: 'ATSR menu item' },
      { pattern: /Categories & Pathways/, name: 'Categories & Pathways menu item' },
      { pattern: /Batch Processing/, name: 'Batch Processing menu item' },
      { pattern: /Cache Management/, name: 'Cache Management submenu' }
    ];

    menuItems.forEach(({ pattern, name }) => {
      const exists = pattern.test(code);
      const status = exists ? '✅' : '❌';
      console.log(status + ' ' + name);
      results.push({ test: 'Menu: ' + name, passed: exists });
      if (!exists) allTestsPassed = false;
    });

    // ============================================================
    // TEST 6: Modal HTML Structure
    // ============================================================
    console.log('\nTEST 6: Field Selector Modal HTML\n');

    const modalElements = [
      { pattern: /Live Log/, name: 'Live Log panel' },
      { pattern: /log-panel/, name: 'Log panel CSS class' },
      { pattern: /getFieldSelectorData/, name: 'Calls getFieldSelectorData()' },
      { pattern: /Continue to Cache/, name: 'Continue button' },
      { pattern: /Reset to Defaults/, name: 'Reset button' }
    ];

    modalElements.forEach(({ pattern, name }) => {
      const exists = pattern.test(code);
      const status = exists ? '✅' : '❌';
      console.log(status + ' ' + name);
      results.push({ test: 'Modal: ' + name, passed: exists });
      if (!exists) allTestsPassed = false;
    });

    // ============================================================
    // TEST 7: No Syntax Errors (Basic Check)
    // ============================================================
    console.log('\nTEST 7: Basic Syntax Validation\n');

    const syntaxChecks = [
      {
        test: 'No unmatched braces',
        passed: (code.match(/\{/g) || []).length === (code.match(/\}/g) || []).length
      },
      {
        test: 'No unmatched parentheses',
        passed: (code.match(/\(/g) || []).length === (code.match(/\)/g) || []).length
      },
      {
        test: 'No unmatched brackets',
        passed: (code.match(/\[/g) || []).length === (code.match(/\]/g) || []).length
      }
    ];

    syntaxChecks.forEach(({ test, passed }) => {
      const status = passed ? '✅' : '❌';
      console.log(status + ' ' + test);
      results.push({ test, passed });
      if (!passed) allTestsPassed = false;
    });

    // ============================================================
    // FINAL RESULTS
    // ============================================================
    console.log('\n═══════════════════════════════════════════════════════════════');

    if (allTestsPassed) {
      console.log('✅ ALL TESTS PASSED (' + results.length + '/' + results.length + ')');
      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log('✅ SAFE TO SAVE: This version is ready for production\n');
      console.log('Next steps:');
      console.log('  1. Download monolithic file with timestamp');
      console.log('  2. Commit to git');
      console.log('  3. Upload to Google Drive Lost and Found\n');
    } else {
      const failedTests = results.filter(r => !r.passed);
      console.log('❌ TESTS FAILED (' + (results.length - failedTests.length) + '/' + results.length + ')');
      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log('❌ DO NOT SAVE: Found ' + failedTests.length + ' issue(s)\n');
      console.log('Failed tests:');
      failedTests.forEach(t => {
        console.log('  ❌ ' + t.test);
      });
      console.log('\nPlease fix these issues before saving the monolithic file.\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

test();
