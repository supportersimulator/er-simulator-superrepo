#!/usr/bin/env node

/**
 * Comprehensive cache fix:
 * 1. Add missing testHello() function
 * 2. Add diagnostic function for cache testing
 * 3. Verify cache process doesn't timeout
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TEST_SCRIPT_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf';
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

async function fix() {
  console.log('\n🔧 FIXING CACHE DIAGNOSTICS\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    // Pull current files
    console.log('📥 Pulling current project files...\n');
    const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });
    const phase2File = project.data.files.find(f => f.name === 'Categories_Pathways_Feature_Phase2');
    const codeFile = project.data.files.find(f => f.name === 'Code');
    const manifestFile = project.data.files.find(f => f.name === 'appsscript');

    let phase2Code = phase2File.source;

    console.log(`   Phase 2 size: ${Math.round(phase2Code.length / 1024)} KB\n`);

    // Check if testHello exists
    const hasTestHello = phase2Code.includes('function testHello()');
    console.log(`   testHello() exists: ${hasTestHello ? '✅' : '❌'}\n`);

    if (!hasTestHello) {
      console.log('📝 Adding missing testHello() function...\n');

      const testHelloFunction = `

/**
 * ULTRA SIMPLE TEST: Just returns a hello message
 * Tests if google.script.run communication works at all
 */
function testHello() {
  Logger.log('👋 testHello() called');
  return {
    success: true,
    message: 'Hello from Apps Script backend!',
    timestamp: new Date().toISOString(),
    spreadsheetId: '${TEST_SPREADSHEET_ID}'
  };
}`;

      // Add after testCacheSimple function
      phase2Code = phase2Code.replace(
        /(function testCacheSimple\(\) \{[\s\S]*?\n\})/,
        '$1' + testHelloFunction
      );

      console.log('✅ Added testHello() function\n');
    }

    // Add comprehensive diagnostic function
    console.log('📝 Adding cache diagnostic function...\n');

    const diagnosticFunction = `

/**
 * COMPREHENSIVE CACHE DIAGNOSTIC
 * Tests each step of the cache process with detailed logging
 */
function testCacheDiagnostic() {
  const startTime = new Date().getTime();
  Logger.log('');
  Logger.log('╔═══════════════════════════════════════════════════════════════╗');
  Logger.log('║           🧪 CACHE DIAGNOSTIC TEST STARTED                   ║');
  Logger.log('╚═══════════════════════════════════════════════════════════════╝');
  Logger.log('');

  try {
    // STEP 1: Open TEST spreadsheet
    Logger.log('🧪 STEP 1: Opening TEST spreadsheet by ID...');
    const ss = SpreadsheetApp.openById('${TEST_SPREADSHEET_ID}');
    Logger.log('✅ STEP 1: Opened: ' + ss.getName());
    Logger.log('   Spreadsheet ID: ' + ss.getId());
    Logger.log('');

    // STEP 2: Get active sheet
    Logger.log('🧪 STEP 2: Getting active sheet...');
    const sheet = ss.getActiveSheet();
    Logger.log('✅ STEP 2: Sheet name: ' + sheet.getName());
    Logger.log('');

    // STEP 3: Get data
    Logger.log('🧪 STEP 3: Getting all data...');
    const data = sheet.getDataRange().getValues();
    Logger.log('✅ STEP 3: Got ' + data.length + ' total rows');
    Logger.log('   Data rows (excluding headers): ' + (data.length - 2));
    Logger.log('');

    // STEP 4: Check headers
    Logger.log('🧪 STEP 4: Checking headers...');
    if (data.length < 2) {
      throw new Error('Sheet does not have enough rows for headers');
    }
    const headers = data[1];
    Logger.log('✅ STEP 4: Headers row has ' + headers.length + ' columns');
    Logger.log('   First 10 headers: ' + headers.slice(0, 10).join(', '));
    Logger.log('');

    // STEP 5: Test refreshHeaders()
    Logger.log('🧪 STEP 5: Testing refreshHeaders()...');
    const headerResult = refreshHeaders();
    if (!headerResult) {
      throw new Error('refreshHeaders() returned null');
    }
    Logger.log('✅ STEP 5: refreshHeaders() succeeded');
    Logger.log('   Mapped columns: ' + Object.keys(headerResult.map).length);
    Logger.log('');

    // STEP 6: Test holistic analysis (this is the heavy operation)
    Logger.log('🧪 STEP 6: Testing performHolisticAnalysis_()...');
    Logger.log('   This processes ALL rows - may take time...');
    const analysisStart = new Date().getTime();
    const analysis = performHolisticAnalysis_();
    const analysisTime = ((new Date().getTime() - analysisStart) / 1000).toFixed(1);
    Logger.log('✅ STEP 6: performHolisticAnalysis_() completed in ' + analysisTime + 's');
    Logger.log('   Total cases: ' + analysis.totalCases);
    Logger.log('   Systems found: ' + Object.keys(analysis.systemDistribution).length);
    Logger.log('   Pathways found: ' + Object.keys(analysis.pathwayDistribution).length);
    Logger.log('   Unassigned: ' + analysis.unassignedCount);
    Logger.log('');

    // STEP 7: Test cache sheet creation/update
    Logger.log('🧪 STEP 7: Testing cache sheet access...');
    let cacheSheet = ss.getSheetByName('Pathway_Analysis_Cache');
    if (!cacheSheet) {
      Logger.log('   Creating Pathway_Analysis_Cache sheet...');
      cacheSheet = ss.insertSheet('Pathway_Analysis_Cache');
      cacheSheet.hideSheet();
      cacheSheet.appendRow(['timestamp', 'analysis_json']);
    }
    Logger.log('✅ STEP 7: Cache sheet ready');
    Logger.log('');

    const totalTime = ((new Date().getTime() - startTime) / 1000).toFixed(1);

    Logger.log('╔═══════════════════════════════════════════════════════════════╗');
    Logger.log('║           ✅ ALL DIAGNOSTICS PASSED                          ║');
    Logger.log('╚═══════════════════════════════════════════════════════════════╝');
    Logger.log('');
    Logger.log('📊 SUMMARY:');
    Logger.log('   • Total time: ' + totalTime + 's');
    Logger.log('   • Analysis time: ' + analysisTime + 's');
    Logger.log('   • Data rows: ' + (data.length - 2));
    Logger.log('   • Cases processed: ' + analysis.totalCases);
    Logger.log('');

    SpreadsheetApp.getUi().alert(
      '✅ Cache Diagnostic PASSED!\\n\\n' +
      'Total time: ' + totalTime + 's\\n' +
      'Analysis time: ' + analysisTime + 's\\n' +
      'Data rows: ' + (data.length - 2) + '\\n' +
      'Cases processed: ' + analysis.totalCases + '\\n\\n' +
      'Check Execution Log (Ctrl+Enter) for full details'
    );

    return {
      success: true,
      totalTime: totalTime,
      analysisTime: analysisTime,
      dataRows: data.length - 2,
      casesProcessed: analysis.totalCases
    };

  } catch (e) {
    Logger.log('');
    Logger.log('╔═══════════════════════════════════════════════════════════════╗');
    Logger.log('║           ❌ DIAGNOSTIC FAILED                               ║');
    Logger.log('╚═══════════════════════════════════════════════════════════════╝');
    Logger.log('');
    Logger.log('❌ Error: ' + e.message);
    Logger.log('❌ Stack trace:');
    Logger.log(e.stack);
    Logger.log('');

    SpreadsheetApp.getUi().alert(
      '❌ Cache Diagnostic FAILED\\n\\n' +
      'Error: ' + e.message + '\\n\\n' +
      'Check Execution Log (Ctrl+Enter) for full stack trace'
    );

    return {
      success: false,
      error: e.message,
      stack: e.stack
    };
  }
}`;

    // Check if diagnostic already exists
    if (phase2Code.includes('function testCacheDiagnostic()')) {
      console.log('⚠️  testCacheDiagnostic() already exists, replacing it...\n');
      // Remove old version
      phase2Code = phase2Code.replace(/function testCacheDiagnostic\(\) \{[\s\S]*?\n\}\n?/g, '');
    }

    // Append diagnostic function at the end
    phase2Code += diagnosticFunction;

    console.log('✅ Added testCacheDiagnostic() function\n');
    console.log(`   New Phase 2 size: ${Math.round(phase2Code.length / 1024)} KB\n`);

    // Deploy
    console.log('🚀 Deploying to TEST...\n');

    const files = [
      manifestFile,
      codeFile,
      { name: 'Categories_Pathways_Feature_Phase2', type: 'SERVER_JS', source: phase2Code }
    ];

    await script.projects.updateContent({
      scriptId: TEST_SCRIPT_ID,
      requestBody: { files }
    });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ CACHE DIAGNOSTICS FIXED!\n');
    console.log('📋 What was added:\n');
    console.log('   • testHello() - Makes TEST HELLO button work');
    console.log('   • testCacheDiagnostic() - Comprehensive cache testing\n');
    console.log('🧪 To test the cache:\n');
    console.log('   1. Refresh TEST spreadsheet');
    console.log('   2. Click: 🧠 Sim Builder → 📂 Categories & Pathways');
    console.log('   3. Click: 👋 TEST HELLO button (should work now)');
    console.log('   4. Click: 🧪 TEST COMMUNICATION button');
    console.log('   5. If both work, the cache process should work too\n');
    console.log('OR run from TEST Tools menu:\n');
    console.log('   • TEST Tools → Test Cache Diagnostic (shows detailed step-by-step)\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');
    if (e.stack) console.log(e.stack);
  }
}

fix().catch(console.error);
