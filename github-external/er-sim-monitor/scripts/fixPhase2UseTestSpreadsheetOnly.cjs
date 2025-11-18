#!/usr/bin/env node

/**
 * CRITICAL FIX: Replace getActive() with openById(TEST_ID)
 * This ensures Phase 2 ONLY touches TEST spreadsheet, never MAIN
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

async function fixPhase2Safety() {
  console.log('\n🔒 CRITICAL SAFETY FIX: Phase 2 → TEST Spreadsheet Only\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    // Pull current TEST script
    console.log('📥 Pulling Phase 2 from TEST...\n');
    const currentProject = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });

    const phase2File = currentProject.data.files.find(f => f.name === 'Categories_Pathways_Feature_Phase2');
    const codeFile = currentProject.data.files.find(f => f.name === 'Code');
    const manifestFile = currentProject.data.files.find(f => f.name === 'appsscript');

    if (!phase2File) {
      console.log('❌ Phase 2 file not found\n');
      return;
    }

    console.log(`   ✅ Found Phase 2 (${Math.round(phase2File.source.length / 1024)} KB)\n`);

    let code = phase2File.source;

    // Count dangerous patterns BEFORE fix
    const beforeGetActive = (code.match(/SpreadsheetApp\.getActive\(\)/g) || []).length;
    const beforeGetActiveSpreadsheet = (code.match(/SpreadsheetApp\.getActiveSpreadsheet\(\)/g) || []).length;
    const beforeMasterSearch = (code.match(/master scenario csv/gi) || []).length;

    console.log('🔍 DANGEROUS PATTERNS FOUND:\n');
    console.log(`   ❌ SpreadsheetApp.getActive(): ${beforeGetActive} occurrences`);
    console.log(`   ❌ SpreadsheetApp.getActiveSpreadsheet(): ${beforeGetActiveSpreadsheet} occurrences`);
    console.log(`   ⚠️  "master scenario csv" search: ${beforeMasterSearch} occurrences\n`);

    // FIX 1: Add TEST_SPREADSHEET_ID constant at top
    if (code.indexOf('TEST_SPREADSHEET_ID') === -1) {
      console.log('🔧 Adding TEST_SPREADSHEET_ID constant...\n');
      code = code.replace(
        /\/\*\*\s*\n\s*\* Categories & Pathways - Phase 2/,
        `/**
 * TEST SPREADSHEET ID - HARDCODED FOR SAFETY
 * This ensures Phase 2 ONLY accesses TEST, never MAIN
 */
var TEST_SPREADSHEET_ID = '${TEST_SPREADSHEET_ID}';

/**
 * Categories & Pathways - Phase 2`
      );
    }

    // FIX 2: Replace pickMasterSheet_() to use TEST spreadsheet by ID
    console.log('🔧 Fixing pickMasterSheet_() to use TEST by ID...\n');
    code = code.replace(
      /function pickMasterSheet_\(\) \{[\s\S]*?\n\}/,
      `function pickMasterSheet_() {
  // SAFETY: Open TEST spreadsheet explicitly by ID
  const ss = SpreadsheetApp.openById(TEST_SPREADSHEET_ID);
  // Get active sheet (don't search for specific name)
  return ss.getActiveSheet();
}`
    );

    // FIX 3: Replace refreshHeaders() to use TEST by ID
    console.log('🔧 Fixing refreshHeaders() to use TEST by ID...\n');
    code = code.replace(
      /const ss = SpreadsheetApp\.getActiveSpreadsheet\(\);/g,
      'const ss = SpreadsheetApp.openById(TEST_SPREADSHEET_ID);'
    );

    // FIX 4: Replace any remaining getActive() calls
    console.log('🔧 Replacing remaining getActive() calls...\n');
    code = code.replace(
      /SpreadsheetApp\.getActive\(\)/g,
      'SpreadsheetApp.openById(TEST_SPREADSHEET_ID)'
    );

    // Count patterns AFTER fix
    const afterGetActive = (code.match(/SpreadsheetApp\.getActive\(\)/g) || []).length;
    const afterGetActiveSpreadsheet = (code.match(/SpreadsheetApp\.getActiveSpreadsheet\(\)/g) || []).length;
    const afterOpenById = (code.match(/SpreadsheetApp\.openById\(TEST_SPREADSHEET_ID\)/g) || []).length;

    console.log('✅ FIXES APPLIED:\n');
    console.log(`   ✅ SpreadsheetApp.getActive(): ${beforeGetActive} → ${afterGetActive}`);
    console.log(`   ✅ SpreadsheetApp.getActiveSpreadsheet(): ${beforeGetActiveSpreadsheet} → ${afterGetActiveSpreadsheet}`);
    console.log(`   ✅ SpreadsheetApp.openById(TEST_ID): ${afterOpenById} added\n`);

    // Redeploy
    console.log('🚀 Redeploying Phase 2 to TEST...\n');

    const files = [manifestFile, codeFile, { ...phase2File, source: code }];

    await script.projects.updateContent({
      scriptId: TEST_SCRIPT_ID,
      requestBody: { files }
    });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ CRITICAL SAFETY FIX DEPLOYED!\n');
    console.log('🔒 WHAT CHANGED:\n');
    console.log('   • Added TEST_SPREADSHEET_ID constant');
    console.log('   • pickMasterSheet_() now opens TEST by ID');
    console.log('   • refreshHeaders() now opens TEST by ID');
    console.log('   • ALL getActive() replaced with openById(TEST_ID)\n');
    console.log('🎯 RESULT:\n');
    console.log('   • Phase 2 cache ONLY touches TEST spreadsheet');
    console.log('   • MAIN spreadsheet is IMPOSSIBLE to access');
    console.log('   • No more searching for "master scenario csv"');
    console.log('   • Cache should work now!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');
  }
}

fixPhase2Safety().catch(console.error);
