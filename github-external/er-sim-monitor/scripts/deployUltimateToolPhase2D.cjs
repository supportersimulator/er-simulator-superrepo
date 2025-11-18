#!/usr/bin/env node

/**
 * Deploy Ultimate Categorization Tool - Phase 2D
 * Apply to Master, Export Results, Clear Results functionality
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, '..', 'config', 'credentials.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;
const SOURCE_FILE = path.join(__dirname, '..', 'apps-script-deployable', 'Ultimate_Categorization_Tool.gs');

async function deployPhase2D() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🚀 DEPLOYING ULTIMATE CATEGORIZATION TOOL - PHASE 2D');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('📦 Phase 2D Features:');
  console.log('   ✅ Apply to Master - Transfer Final columns to Master sheet');
  console.log('   💾 Export Results - Download results as CSV');
  console.log('   🗑️  Clear Results - Wipe results sheet with confirmation\n');

  try {
    // Load credentials
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(token);

    const script = google.script({ version: 'v1', auth: oAuth2Client });

    // Read Ultimate_Categorization_Tool.gs
    console.log('📖 Reading source file...');
    const sourceContent = fs.readFileSync(SOURCE_FILE, 'utf8');
    console.log(`   ✅ Loaded ${sourceContent.length} characters\n`);

    // Get current project
    console.log('🔍 Fetching current Apps Script project...');
    const projectResponse = await script.projects.getContent({ scriptId: SCRIPT_ID });
    const files = projectResponse.data.files;
    console.log(`   ✅ Found ${files.length} files in project\n`);

    // Find or create Ultimate_Categorization_Tool file
    let toolFileIndex = files.findIndex(f => f.name === 'Ultimate_Categorization_Tool');

    if (toolFileIndex === -1) {
      console.log('⚠️  Ultimate_Categorization_Tool.gs not found, adding new file...');
      files.push({
        name: 'Ultimate_Categorization_Tool',
        type: 'SERVER_JS',
        source: sourceContent
      });
      toolFileIndex = files.length - 1;
    } else {
      console.log('✅ Found existing Ultimate_Categorization_Tool.gs, updating...');
      files[toolFileIndex].source = sourceContent;
    }

    // Verify Phase 2D functions exist
    console.log('\n🔍 Verifying Phase 2D functions...');
    const hasApply = sourceContent.includes('function applyUltimateCategorizationToMaster()');
    const hasExport = sourceContent.includes('function exportUltimateCategorizationResults()');
    const hasClear = sourceContent.includes('function clearUltimateCategorizationResults()');

    console.log('   ' + (hasApply ? '✅' : '❌') + ' applyUltimateCategorizationToMaster()');
    console.log('   ' + (hasExport ? '✅' : '❌') + ' exportUltimateCategorizationResults()');
    console.log('   ' + (hasClear ? '✅' : '❌') + ' clearUltimateCategorizationResults()');

    if (!hasApply || !hasExport || !hasClear) {
      throw new Error('Phase 2D functions not found in source file!');
    }

    console.log('\n🚀 Deploying to Apps Script...\n');

    // Deploy
    await script.projects.updateContent({
      scriptId: SCRIPT_ID,
      requestBody: { files: files }
    });

    console.log('✅ DEPLOYMENT SUCCESSFUL!\n');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🧪 TESTING INSTRUCTIONS\n');

    console.log('1️⃣  Open Google Sheet and refresh (F5)');
    console.log('2️⃣  Open: Sim Builder > 🤖 Ultimate Categorization Tool');
    console.log('3️⃣  Test Apply to Master:');
    console.log('   • Click "✅ Apply to Master" button');
    console.log('   • Confirm dialog');
    console.log('   • Watch live logs show:');
    console.log('      - Loading AI_Categorization_Results sheet');
    console.log('      - Loading Master Scenario Convert sheet');
    console.log('      - Mapping column indices');
    console.log('      - Building Case_ID lookup map');
    console.log('      - Applying Final_Symptom and Final_System');
    console.log('      - Summary: Cases updated count');
    console.log('   • Verify Master sheet updated correctly\n');

    console.log('4️⃣  Test Export Results:');
    console.log('   • Click "💾 Export Results" button');
    console.log('   • Watch live logs show:');
    console.log('      - Loading sheet data');
    console.log('      - Converting to CSV format');
    console.log('      - Export complete message');
    console.log('   • Verify CSV file downloads (AI_Categorization_Results_2025-XX-XX.csv)');
    console.log('   • Open CSV in spreadsheet app to verify data\n');

    console.log('5️⃣  Test Clear Results:');
    console.log('   • Click "🗑️ Clear Results" button');
    console.log('   • Confirm double-warning dialog');
    console.log('   • Watch live logs show:');
    console.log('      - Loading sheet');
    console.log('      - Deleting data rows');
    console.log('      - Clearing logs');
    console.log('      - Summary: Rows deleted count');
    console.log('   • Verify AI_Categorization_Results sheet now has only headers\n');

    console.log('6️⃣  Test Complete Workflow:');
    console.log('   • Run AI Categorization (All Cases mode)');
    console.log('   • Review results in logs');
    console.log('   • Export results as backup CSV');
    console.log('   • Apply to Master sheet');
    console.log('   • Verify Master sheet updated');
    console.log('   • Clear results');
    console.log('   • Re-run categorization (should write all rows as new)\n');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 EXPECTED LIVE LOG OUTPUT\n');

    console.log('Example Apply to Master logs:');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ APPLY TO MASTER - STARTING');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('📊 Loading AI_Categorization_Results sheet...');
    console.log('   ✅ Sheet found: AI_Categorization_Results');
    console.log('   ✅ Loading results (rows 3-209)...');
    console.log('   ✅ Loaded 207 result rows');
    console.log('');
    console.log('📊 Loading Master Scenario Convert sheet...');
    console.log('   ✅ Sheet found: Master Scenario Convert');
    console.log('   ✅ Headers loaded: 45 columns');
    console.log('');
    console.log('🔍 Mapping column indices...');
    console.log('   Case_ID column: Column A');
    console.log('   Symptom column: Column C');
    console.log('   System column: Column D');
    console.log('   ✅ All required columns found');
    console.log('');
    console.log('🗺️  Building Case_ID lookup map...');
    console.log('   ✅ Mapped 207 Case IDs');
    console.log('');
    console.log('✍️  Applying results to Master sheet...');
    console.log('');
    console.log('   ✅ Updated row 3 (CARD0001):');
    console.log('      Symptom: CP');
    console.log('      System: Cardiovascular');
    console.log('   ✅ Updated row 4 (CARD0002):');
    console.log('      Symptom: CP');
    console.log('      System: Cardiovascular');
    console.log('   ... (205 more)');
    console.log('');
    console.log('   📊 Apply Summary:');
    console.log('      ✅ Cases updated: 207');
    console.log('      ⏭️  Skipped (not found): 0');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎉 APPLY TO MASTER COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎯 NEXT STEPS\n');

    console.log('After successful Phase 2D testing:');
    console.log('   ✅ Core workflow complete (Categorize → Review → Apply)');
    console.log('   🚧 Phase 2E: Build Browse by Symptom/System tabs');
    console.log('   🚧 Phase 2F: Build Settings tab with category editors');
    console.log('   🚧 Phase 2G: Build AI-powered category suggestions\n');

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ DEPLOYMENT ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

deployPhase2D();
