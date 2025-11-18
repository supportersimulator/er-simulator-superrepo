#!/usr/bin/env node

/**
 * Add a simple diagnostic function to test cache generation
 * This will help us see what's actually happening
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

async function addFunction() {
  console.log('\n🔧 ADDING SIMPLE CACHE DIAGNOSTIC\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    // Pull current Phase 2
    console.log('📥 Pulling Phase 2 file...\n');
    const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });
    const phase2File = project.data.files.find(f => f.name === 'Categories_Pathways_Feature_Phase2');
    const codeFile = project.data.files.find(f => f.name === 'Code');
    const manifestFile = project.data.files.find(f => f.name === 'appsscript');

    let code = phase2File.source;

    console.log(`   Current size: ${Math.round(code.length / 1024)} KB\n`);

    // Add diagnostic function at the end
    console.log('📝 Adding testCacheDiagnostic() function...\n');

    const diagnosticFunction = `

/**
 * DIAGNOSTIC: Test cache generation step-by-step
 * Shows exactly where it fails
 */
function testCacheDiagnostic() {
  const ui = SpreadsheetApp.getUi();

  try {
    Logger.log('🧪 STEP 1: Opening TEST spreadsheet...');
    const ss = SpreadsheetApp.openById('${TEST_SPREADSHEET_ID}');
    Logger.log('✅ STEP 1: Spreadsheet opened: ' + ss.getName());

    Logger.log('🧪 STEP 2: Getting active sheet...');
    const sheet = ss.getActiveSheet();
    Logger.log('✅ STEP 2: Sheet name: ' + sheet.getName());

    Logger.log('🧪 STEP 3: Getting data...');
    const data = sheet.getDataRange().getValues();
    Logger.log('✅ STEP 3: Got ' + data.length + ' rows');

    Logger.log('🧪 STEP 4: Checking headers...');
    if (data.length < 2) {
      throw new Error('Not enough rows for headers');
    }
    const headers = data[1];
    Logger.log('✅ STEP 4: Headers row has ' + headers.length + ' columns');
    Logger.log('   First 5 headers: ' + headers.slice(0, 5).join(', '));

    Logger.log('🧪 STEP 5: Counting data rows...');
    const dataRows = data.length - 2; // Subtract 2 header rows
    Logger.log('✅ STEP 5: Data rows: ' + dataRows);

    Logger.log('🧪 STEP 6: Testing refreshHeaders()...');
    const headerResult = refreshHeaders();
    if (!headerResult) {
      throw new Error('refreshHeaders() returned null');
    }
    Logger.log('✅ STEP 6: Headers refreshed, found ' + Object.keys(headerResult.map).length + ' mapped columns');

    Logger.log('🧪 STEP 7: Testing performHolisticAnalysis_()...');
    const analysis = performHolisticAnalysis_();
    Logger.log('✅ STEP 7: Analysis completed!');
    Logger.log('   Total cases: ' + analysis.totalCases);
    Logger.log('   Systems: ' + Object.keys(analysis.systemDistribution).length);
    Logger.log('   Unassigned: ' + analysis.unassignedCount);

    ui.alert(
      '✅ Cache Diagnostic PASSED!\\n\\n' +
      'Data rows: ' + dataRows + '\\n' +
      'Cases processed: ' + analysis.totalCases + '\\n' +
      'Systems found: ' + Object.keys(analysis.systemDistribution).length + '\\n\\n' +
      'Check Execution Log for details'
    );

    return {
      success: true,
      dataRows: dataRows,
      casesProcessed: analysis.totalCases
    };

  } catch (e) {
    Logger.log('❌ ERROR at diagnostic step');
    Logger.log('❌ Error: ' + e.message);
    Logger.log('❌ Stack: ' + e.stack);

    ui.alert(
      '❌ Cache Diagnostic FAILED\\n\\n' +
      'Error: ' + e.message + '\\n\\n' +
      'Check Execution Log for full details'
    );

    return {
      success: false,
      error: e.message,
      stack: e.stack
    };
  }
}`;

    // Append the function
    code += diagnosticFunction;

    console.log('✅ Function added\n');

    // Deploy
    console.log('🚀 Deploying to TEST...\n');

    const files = [manifestFile, codeFile, { name: 'Categories_Pathways_Feature_Phase2', type: 'SERVER_JS', source: code }];

    await script.projects.updateContent({
      scriptId: TEST_SCRIPT_ID,
      requestBody: { files }
    });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ DIAGNOSTIC FUNCTION ADDED!\n');
    console.log('📋 To test the cache:\n');
    console.log('   1. Refresh TEST spreadsheet');
    console.log('   2. Run: TEST Tools → 🧪 Test Cache Diagnostic');
    console.log('   3. Check execution logs for detailed output\n');
    console.log('This will show exactly where the cache process fails.\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');
    if (e.stack) console.log(e.stack);
  }
}

addFunction().catch(console.error);
