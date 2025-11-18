#!/usr/bin/env node

/**
 * FIND HTML SYNTAX ERRORS IN PANEL
 *
 * Looking for unmatched braces, quotes, or malformed template strings
 * in the buildCategoriesPathwaysMainMenu_ function
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, '..', 'config', 'credentials.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function findHTMLSyntaxErrors() {
  console.log('🔍 Searching for HTML/JavaScript syntax errors in panel code\n');

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
    const lines = content.split('\n');

    console.log('🔍 Scanning for potential HTML/JS issues...\n');

    // Extract the buildCategoriesPathwaysMainMenu_ function
    let inFunction = false;
    let functionStart = -1;
    let functionEnd = -1;
    let braceCount = 0;

    lines.forEach((line, idx) => {
      if (line.includes('function buildCategoriesPathwaysMainMenu_()')) {
        inFunction = true;
        functionStart = idx;
        braceCount = 0;
      }

      if (inFunction) {
        // Count braces
        const openBraces = (line.match(/\{/g) || []).length;
        const closeBraces = (line.match(/\}/g) || []).length;
        braceCount += openBraces - closeBraces;

        if (braceCount === 0 && idx > functionStart) {
          functionEnd = idx;
          inFunction = false;
        }
      }
    });

    console.log('📊 Function Analysis:');
    console.log('  Function starts at line:', functionStart + 1);
    console.log('  Function ends at line:', functionEnd + 1);
    console.log('  Function length:', functionEnd - functionStart + 1, 'lines\n');

    // Extract the function
    const functionLines = lines.slice(functionStart, functionEnd + 1);
    const functionContent = functionLines.join('\n');

    console.log('🔍 Checking for specific issues...\n');

    let issueCount = 0;

    // Check 1: Look for script blocks with potential issues
    console.log('1️⃣  Script Block Analysis:');

    const scriptBlocks = [];
    let inScriptBlock = false;
    let scriptStart = -1;

    functionLines.forEach((line, idx) => {
      const absoluteLineNum = functionStart + idx + 1;

      if (line.includes('<script>')) {
        inScriptBlock = true;
        scriptStart = absoluteLineNum;
      }

      if (line.includes('</script>')) {
        if (inScriptBlock) {
          scriptBlocks.push({
            start: scriptStart,
            end: absoluteLineNum,
            lines: absoluteLineNum - scriptStart + 1
          });
        }
        inScriptBlock = false;
      }
    });

    console.log('  Found', scriptBlocks.length, 'script blocks:');
    scriptBlocks.forEach((block, idx) => {
      console.log('    Block', idx + 1 + ':', 'Lines', block.start + '-' + block.end, '(' + block.lines, 'lines)');
    });
    console.log();

    // Check 2: Look for unmatched template literal backticks
    console.log('2️⃣  Template Literal Check:');

    const templateLiteralStart = functionContent.indexOf('return `');
    if (templateLiteralStart !== -1) {
      console.log('  ✅ Template literal starts at character', templateLiteralStart);

      // Count backticks (should be even)
      const backticks = (functionContent.match(/`/g) || []).length;
      console.log('  Backtick count:', backticks, backticks % 2 === 0 ? '(even ✅)' : '(odd ❌)');

      if (backticks % 2 !== 0) {
        console.log('  ❌ WARNING: Unmatched backticks detected!');
        issueCount++;
      }
    } else {
      console.log('  ⚠️  No template literal found (unexpected)');
    }
    console.log();

    // Check 3: Look for problematic escape sequences or nested quotes
    console.log('3️⃣  String/Quote Issues:');

    const problematicPatterns = [
      { pattern: /onclick="[^"]*"[^"]*"/, desc: 'Double quotes inside onclick attribute' },
      { pattern: /onclick='[^']*'[^']*'/, desc: 'Single quotes inside onclick attribute' },
      { pattern: /\$\{[^\}]*\$\{/, desc: 'Nested template literal expressions' },
      { pattern: /\\x3c\/script\\x3e/, desc: 'Escaped script tag (potential issue)' }
    ];

    problematicPatterns.forEach(({ pattern, desc }) => {
      const matches = functionContent.match(pattern);
      if (matches) {
        console.log('  ⚠️  Found:', desc);
        console.log('     ', matches[0].substring(0, 80) + '...');
        issueCount++;
      }
    });
    console.log();

    // Check 4: Look for the specific line causing the error
    console.log('4️⃣  Searching for "Unexpected token }" issue:');

    functionLines.forEach((line, idx) => {
      const absoluteLineNum = functionStart + idx + 1;

      // Look for standalone closing braces in strings
      if (line.match(/[^\\]"\s*\}/)) {
        console.log('  ⚠️  Line', absoluteLineNum + ':', 'Potential issue - closing brace after quote');
        console.log('     ', line.trim().substring(0, 100));
        issueCount++;
      }

      // Look for template literal issues
      if (line.includes('${') && !line.includes('}')) {
        console.log('  ⚠️  Line', absoluteLineNum + ':', 'Unclosed template expression');
        console.log('     ', line.trim().substring(0, 100));
        issueCount++;
      }

      // Look for the specific pattern from the screenshot
      if (line.includes('</script>') && line.includes('\\x3c')) {
        console.log('  ⚠️  Line', absoluteLineNum + ':', 'Escaped script tag (from Google internal code)');
        console.log('     ', line.trim().substring(0, 100));
        issueCount++;
      }
    });
    console.log();

    // Check 5: Extract and save the problematic section
    console.log('5️⃣  Extracting function for manual review...\n');

    const outputPath = path.join(__dirname, '..', 'backups', 'buildCategoriesPathwaysMainMenu_EXTRACTED.txt');
    fs.writeFileSync(outputPath, functionContent);
    console.log('  💾 Saved to:', outputPath);
    console.log();

    // Summary
    console.log('══════════════════════════════════════════════════════════════\n');
    console.log('📊 ANALYSIS SUMMARY:\n');
    console.log('  Total potential issues found:', issueCount);
    console.log('  Script blocks:', scriptBlocks.length);
    console.log('  Function size:', (functionContent.length / 1024).toFixed(2), 'KB\n');

    if (issueCount > 0) {
      console.log('⚠️  ISSUES DETECTED - Manual review recommended\n');
      console.log('📝 Next Steps:');
      console.log('  1. Review the extracted function in the backups folder');
      console.log('  2. Look for unmatched quotes, braces, or template expressions');
      console.log('  3. Check script blocks for malformed JavaScript');
      console.log('  4. Pay special attention to onclick handlers\n');
    } else {
      console.log('✅ No obvious issues detected in automated scan\n');
      console.log('⚠️  However, the browser is still showing a syntax error.');
      console.log('This might be a runtime issue with dynamic content.\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

findHTMLSyntaxErrors();
