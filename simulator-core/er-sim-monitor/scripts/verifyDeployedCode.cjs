/**
 * Verify Deployed Code vs Cached Version
 *
 * Downloads current deployed code and checks for known issues
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Verifying Deployed Code\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oAuth2Client });
  const scriptId = process.env.APPS_SCRIPT_ID;

  console.log('📥 Downloading current deployed version...\n');

  const project = await script.projects.getContent({ scriptId });
  const panelFile = project.data.files.find(f => f.name === 'Phase2_Enhanced_Categories_With_AI');

  if (!panelFile) {
    console.log('❌ Panel file not found\n');
    return;
  }

  console.log('✅ Found Phase2_Enhanced_Categories_With_AI.gs\n');
  console.log('📊 File size:', Math.round(panelFile.source.length / 1024), 'KB\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🔍 CHECKING FOR KNOWN ISSUES:\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  // Check 1: Template literal bug
  const hasTemplateLiteralBug = /if \(\$\{categorizationStats\.total\}/.test(panelFile.source);
  console.log('1. Template literal syntax error in script tag:');
  console.log('   Pattern: if (${categorizationStats.total}');
  console.log('   Status:', hasTemplateLiteralBug ? '❌ FOUND (BUG PRESENT)' : '✅ NOT FOUND (GOOD)');
  console.log('');

  // Check 2: Problematic inline script block
  const hasInlineScriptBlock = panelFile.source.includes('📝 Inline script defining runAICategorization');
  console.log('2. Problematic inline script block:');
  console.log('   Pattern: <!-- Inline script defining runAICategorization -->');
  console.log('   Status:', hasInlineScriptBlock ? '❌ FOUND (BUG PRESENT)' : '✅ NOT FOUND (GOOD)');
  console.log('');

  // Check 3: Function definition in setTimeout
  const hasFunctionInSetTimeout = /setTimeout\(function\(\) \{[\s\S]*?window\.runAICategorization = function/.test(panelFile.source);
  console.log('3. Function definition in setTimeout block:');
  console.log('   Pattern: setTimeout(...) with window.runAICategorization');
  console.log('   Status:', hasFunctionInSetTimeout ? '✅ FOUND (GOOD)' : '❌ NOT FOUND (MISSING)');
  console.log('');

  // Check 4: getCategorizationStats function
  const hasGetCategorizationStats = /function getCategorizationStats\(\)/.test(panelFile.source);
  console.log('4. getCategorizationStats() function:');
  console.log('   Pattern: function getCategorizationStats()');
  console.log('   Status:', hasGetCategorizationStats ? '✅ FOUND (GOOD)' : '❌ NOT FOUND (MISSING)');
  console.log('');

  // Check 5: Mode selector HTML
  const hasModeSelector = /<select id="aiCatMode">/.test(panelFile.source);
  console.log('5. Mode selector dropdown HTML:');
  console.log('   Pattern: <select id="aiCatMode">');
  console.log('   Status:', hasModeSelector ? '✅ FOUND (GOOD)' : '❌ NOT FOUND (MISSING)');
  console.log('');

  // Check 6: Specific rows input field
  const hasSpecificRowsInput = /<input[^>]*id="specificRowsInput"/.test(panelFile.source);
  console.log('6. Specific rows input field HTML:');
  console.log('   Pattern: <input id="specificRowsInput">');
  console.log('   Status:', hasSpecificRowsInput ? '✅ FOUND (GOOD)' : '❌ NOT FOUND (MISSING)');
  console.log('');

  console.log('══════════════════════════════════════════════════════════════\n');

  // Overall assessment
  const allGood = !hasTemplateLiteralBug && !hasInlineScriptBlock && hasFunctionInSetTimeout && hasGetCategorizationStats && hasModeSelector && hasSpecificRowsInput;

  if (allGood) {
    console.log('✅ DEPLOYED CODE IS CORRECT!\n');
    console.log('══════════════════════════════════════════════════════════════\n');
    console.log('🎯 DIAGNOSIS: Apps Script Caching Issue\n');
    console.log('The source code is correct, but Apps Script is serving an old');
    console.log('compiled/cached version. The browser is loading stale JavaScript.\n');
    console.log('SOLUTION: Force recompilation\n');
    console.log('══════════════════════════════════════════════════════════════\n');
    console.log('📋 MANUAL FIX REQUIRED:\n');
    console.log('1. Open Apps Script IDE:');
    console.log('   https://script.google.com/home/projects/' + scriptId + '/edit\n');
    console.log('2. Select ANY function from dropdown (e.g., buildCategoriesPathwaysMainMenu_)\n');
    console.log('3. Click RUN button (▶️)\n');
    console.log('4. Wait for execution to complete\n');
    console.log('5. Go back to Google Sheets\n');
    console.log('6. Hard refresh (Cmd+Shift+R)\n');
    console.log('7. Test the panel again\n');
    console.log('This forces Apps Script to recompile and serve the fresh version.\n');
  } else {
    console.log('⚠️  DEPLOYED CODE HAS ISSUES!\n');
    console.log('The code needs to be fixed before it will work.\n');
  }

  // Save current version for inspection
  fs.writeFileSync('/tmp/deployed_panel_current.gs', panelFile.source);
  console.log('💾 Saved current deployed version to: /tmp/deployed_panel_current.gs\n');
}

main().catch(console.error);
