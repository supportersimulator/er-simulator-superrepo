#!/usr/bin/env node

/**
 * TEST PANEL AFTER FIX
 *
 * This script provides testing guidance and can check the deployed code
 * to ensure the fix is working properly.
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, '..', 'config', 'credentials.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function testPanelAfterFix() {
  console.log('🧪 Testing Panel After Syntax Error Fix\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  try {
    // Load credentials
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Load token
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(token);

    const script = google.script({ version: 'v1', auth: oAuth2Client });

    // Get current project content
    console.log('📥 Fetching deployed code...\n');
    const projectResponse = await script.projects.getContent({ scriptId: SCRIPT_ID });
    const files = projectResponse.data.files;

    const phase2File = files.find(f => f.name === 'Phase2_Enhanced_Categories_With_AI');

    if (!phase2File) {
      console.error('❌ Phase2_Enhanced_Categories_With_AI file not found!');
      return;
    }

    const content = phase2File.source;

    console.log('✅ Code Analysis Results:\n');

    // Check 1: Syntax error removed
    const hasSyntaxError = content.includes('if (false) // DISABLED - was causing syntax errors {');
    console.log('1️⃣  Syntax Error Check:');
    if (hasSyntaxError) {
      console.log('   ❌ FAILED - Syntax error still present!');
    } else {
      console.log('   ✅ PASSED - Syntax error removed');
    }

    // Check 2: runAICategorization function exists
    const hasRunAIFunction = content.includes('window.runAICategorization = function()');
    console.log('\n2️⃣  Main Function Check:');
    if (hasRunAIFunction) {
      console.log('   ✅ PASSED - window.runAICategorization defined');
    } else {
      console.log('   ❌ FAILED - Main function not found!');
    }

    // Check 3: Mode selector logic exists
    const hasModeSelector = content.includes("getElementById('aiCatMode')");
    console.log('\n3️⃣  Mode Selector Check:');
    if (hasModeSelector) {
      console.log('   ✅ PASSED - Mode selector logic present');
    } else {
      console.log('   ⚠️  WARNING - Mode selector not found');
    }

    // Check 4: Button handlers exist
    const hasRetryButton = content.includes('retryFailedCategorization()');
    console.log('\n4️⃣  Button Handlers Check:');
    if (hasRetryButton) {
      console.log('   ✅ PASSED - Retry button handler exists');
    } else {
      console.log('   ⚠️  WARNING - Retry button handler not found');
    }

    // Check 5: No obvious JavaScript syntax errors
    console.log('\n5️⃣  Code Quality Scan:');
    const lines = content.split('\n');
    let warningCount = 0;

    lines.forEach((line, idx) => {
      // Check for common syntax issues
      if (line.match(/if\s*\([^)]*\)\s*\/\/.*\{/)) {
        console.log('   ⚠️  Line', idx + 1 + ': Potential if/comment issue');
        warningCount++;
      }
    });

    if (warningCount === 0) {
      console.log('   ✅ PASSED - No obvious syntax issues');
    } else {
      console.log('   ⚠️  Found', warningCount, 'potential issues');
    }

    console.log('\n══════════════════════════════════════════════════════════════\n');

    // Overall status
    const allPassed = !hasSyntaxError && hasRunAIFunction && hasModeSelector && hasRetryButton && warningCount === 0;

    if (allPassed) {
      console.log('🎉 ALL CHECKS PASSED!\n');
      console.log('✅ The panel code is fixed and ready to test.\n');
    } else {
      console.log('⚠️  SOME CHECKS FAILED OR WARNINGS PRESENT\n');
      console.log('Review the results above for details.\n');
    }

    // Provide testing instructions
    console.log('══════════════════════════════════════════════════════════════\n');
    console.log('📋 MANUAL TESTING INSTRUCTIONS:\n');
    console.log('1️⃣  Open Google Sheets');
    console.log('   → Navigate to: Convert_Master_Sim_CSV_Template_with_Input\n');

    console.log('2️⃣  Hard Refresh (Clear Cache)');
    console.log('   → Press F5 (or Cmd+Shift+R on Mac)');
    console.log('   → This ensures you get the latest code\n');

    console.log('3️⃣  Open Developer Console');
    console.log('   → Press F12 (or Cmd+Option+I on Mac)');
    console.log('   → Click "Console" tab');
    console.log('   → Keep it open to see any errors\n');

    console.log('4️⃣  Open the Panel');
    console.log('   → Go to: Extensions → Categories & Pathways');
    console.log('   → Panel should load without errors\n');

    console.log('5️⃣  Check Console for Errors');
    console.log('   → Look for RED error messages');
    console.log('   → Should see: "✅ window.runAICategorization defined"');
    console.log('   → Should see: "✅ Mode selector change listener attached"\n');

    console.log('6️⃣  Test Mode Selector');
    console.log('   → Click dropdown: "Mode: All Cases (207 total)"');
    console.log('   → Select "Specific Rows"');
    console.log('   → Input field should appear below');
    console.log('   → Button text should change\n');

    console.log('7️⃣  Test Run Button');
    console.log('   → Click "🚀 Run AI Categorization" button');
    console.log('   → Should show confirmation dialog');
    console.log('   → Button should change to "🔄 Categorizing..."');
    console.log('   → No JavaScript errors should appear\n');

    console.log('══════════════════════════════════════════════════════════════\n');
    console.log('🔍 WHAT TO LOOK FOR:\n');
    console.log('✅ GOOD SIGNS:');
    console.log('   • Panel opens without errors');
    console.log('   • Console shows "✅ window.runAICategorization defined"');
    console.log('   • Mode selector works (shows/hides input field)');
    console.log('   • Run button responds to clicks');
    console.log('   • No red error messages in console\n');

    console.log('❌ BAD SIGNS:');
    console.log('   • Red "SyntaxError" messages in console');
    console.log('   • Panel fails to load or shows blank');
    console.log('   • Buttons don\'t respond to clicks');
    console.log('   • "Uncaught ReferenceError" messages');
    console.log('   • Mode selector doesn\'t change display\n');

    console.log('══════════════════════════════════════════════════════════════\n');
    console.log('💡 TROUBLESHOOTING:\n');
    console.log('If you still see errors:');
    console.log('   1. Clear browser cache completely (Cmd+Shift+Delete)');
    console.log('   2. Close and reopen Google Sheets');
    console.log('   3. Try in incognito/private window');
    console.log('   4. Check that the fix was deployed (run verifyPanelFix.cjs)\n');

    console.log('══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testPanelAfterFix();
