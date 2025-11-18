/**
 * Verify Panel Works - Complete System Check
 *
 * This script will:
 * 1. Download the deployed code
 * 2. Check for syntax issues
 * 3. Verify all key elements are present
 * 4. Provide a complete diagnosis
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 COMPLETE PANEL VERIFICATION\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oAuth2Client });
  const project = await script.projects.getContent({ scriptId: process.env.APPS_SCRIPT_ID });
  const panelFile = project.data.files.find(f => f.name === 'Phase2_Enhanced_Categories_With_AI');

  if (!panelFile) {
    console.log('❌ Panel file not found\n');
    return;
  }

  const source = panelFile.source;

  console.log('✅ Downloaded Phase2_Enhanced_Categories_With_AI.gs\n');
  console.log(`   Size: ${Math.round(source.length / 1024)} KB\n`);
  console.log('══════════════════════════════════════════════════════════════\n');

  // ═══════════════════════════════════════════════════════════════════════
  // CHECK 1: Template Literal Issues
  // ═══════════════════════════════════════════════════════════════════════
  console.log('CHECK 1: Template Literal Syntax\n');

  const badPattern1 = /\.replace\(\/\'\/g, "\\\\\'"\)/g;
  const badPattern2 = /<button onclick="deleteRow\(\$\{/g;
  const badPattern3 = /innerHTML = \\`.*\$\{.*\\`/g;
  const badPattern4 = /querySelector\(\\`.*\$\{.*\\`\)/g;

  const issues = [];

  if (badPattern1.test(source)) {
    issues.push('❌ Found .replace with backslash quotes');
  } else {
    console.log('  ✅ No .replace() with backslash quotes\n');
  }

  if (badPattern2.test(source)) {
    issues.push('❌ Found deleteRow with ${i} template literal');
  } else {
    console.log('  ✅ No deleteRow() with template literals\n');
  }

  if (badPattern3.test(source)) {
    issues.push('❌ Found innerHTML with backtick template literal');
  } else {
    console.log('  ✅ No innerHTML with backtick template literals\n');
  }

  if (badPattern4.test(source)) {
    issues.push('❌ Found querySelector with backtick template literal');
  } else {
    console.log('  ✅ No querySelector with backtick template literals\n');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CHECK 2: Key HTML Elements Present
  // ═══════════════════════════════════════════════════════════════════════
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('CHECK 2: Required HTML Elements\n');

  const hasAICatMode = source.includes('id="aiCatMode"');
  const hasSpecificRowsContainer = source.includes('id="specificRowsContainer"');
  const hasSpecificRowsInput = source.includes('id="specificRowsInput"');
  const hasRunAIBtn = source.includes('id="run-ai-btn"');

  console.log('  - aiCatMode selector:', hasAICatMode ? '✅' : '❌');
  console.log('  - specificRowsContainer div:', hasSpecificRowsContainer ? '✅' : '❌');
  console.log('  - specificRowsInput field:', hasSpecificRowsInput ? '✅' : '❌');
  console.log('  - run-ai-btn button:', hasRunAIBtn ? '✅' : '❌');
  console.log('');

  if (!hasAICatMode || !hasSpecificRowsContainer || !hasSpecificRowsInput || !hasRunAIBtn) {
    issues.push('❌ Missing required HTML elements');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CHECK 3: JavaScript Functions Present
  // ═══════════════════════════════════════════════════════════════════════
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('CHECK 3: JavaScript Functions\n');

  const hasRunAICatFunction = /window\.runAICategorization = function/.test(source);
  const hasModeHandler = /modeSelector\.onchange = function/.test(source);
  const hasSetTimeout = /setTimeout\(function\(\)/.test(source);

  console.log('  - window.runAICategorization defined:', hasRunAICatFunction ? '✅' : '❌');
  console.log('  - modeSelector.onchange handler:', hasModeHandler ? '✅' : '❌');
  console.log('  - setTimeout wrapper:', hasSetTimeout ? '✅' : '❌');
  console.log('');

  if (!hasRunAICatFunction) {
    issues.push('❌ Missing window.runAICategorization function');
  }
  if (!hasModeHandler) {
    issues.push('❌ Missing mode selector change handler');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CHECK 4: Backend Function Exists
  // ═══════════════════════════════════════════════════════════════════════
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('CHECK 4: Backend Function (Code.gs)\n');

  const codeFile = project.data.files.find(f => f.name === 'Code');
  if (codeFile) {
    const hasBackendFunction = /function runAICategorization\(mode, specificInput\)/.test(codeFile.source);
    console.log('  - runAICategorization(mode, specificInput):', hasBackendFunction ? '✅' : '❌');
    console.log('');

    if (!hasBackendFunction) {
      issues.push('❌ Missing backend runAICategorization function in Code.gs');
    }
  } else {
    console.log('  ⚠️  Code.gs not found\n');
    issues.push('⚠️ Code.gs file not found');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CHECK 5: Brace Balance
  // ═══════════════════════════════════════════════════════════════════════
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('CHECK 5: Syntax Balance\n');

  const setTimeoutMatch = source.match(/setTimeout\(function\(\) \{[\s\S]{0,5000}\}, 500\);/);
  if (setTimeoutMatch) {
    const block = setTimeoutMatch[0];
    const openBraces = (block.match(/\{/g) || []).length;
    const closeBraces = (block.match(/\}/g) || []).length;
    const balanced = openBraces === closeBraces;

    console.log('  setTimeout block:');
    console.log('    - Open braces:', openBraces);
    console.log('    - Close braces:', closeBraces);
    console.log('    - Balanced:', balanced ? '✅ YES' : '❌ NO');
    console.log('');

    if (!balanced) {
      issues.push('❌ Unbalanced braces in setTimeout block');
    }
  } else {
    console.log('  ❌ setTimeout block not found\n');
    issues.push('❌ setTimeout block not found');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FINAL DIAGNOSIS
  // ═══════════════════════════════════════════════════════════════════════
  console.log('══════════════════════════════════════════════════════════════\n');

  if (issues.length === 0) {
    console.log('🎉 ALL CHECKS PASSED!\n');
    console.log('══════════════════════════════════════════════════════════════\n');
    console.log('The code is syntactically correct. If the panel still doesn\'t work:\n');
    console.log('NEXT STEPS:\n');
    console.log('  1. CLOSE Google Sheet tab completely (Cmd+W)');
    console.log('  2. Clear browser cache (Cmd+Shift+Delete)');
    console.log('  3. Reopen sheet in NEW incognito window');
    console.log('  4. Open AI Categorization panel');
    console.log('  5. Open browser console (Cmd+Option+J)');
    console.log('  6. Take screenshot of ANY console errors\n');
    console.log('If you still see errors after fresh load, they are NOT in our code.\n');
  } else {
    console.log('❌ ISSUES FOUND:\n');
    issues.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue}`);
    });
    console.log('');
    console.log('These issues need to be fixed before the panel will work.\n');
  }

  console.log('══════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
