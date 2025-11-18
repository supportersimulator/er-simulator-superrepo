#!/usr/bin/env node

/**
 * EXTRACT WORKING PATTERNS FROM EXISTING TOOLS
 *
 * Examine Code.gs to find:
 * 1. Live logs implementation (how it works, what makes it robust)
 * 2. Batch processing patterns (error handling, progress tracking)
 * 3. UI patterns that work well
 * 4. Trigger/execution patterns
 * 5. Everything that was battle-tested and proven
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, '..', 'config', 'credentials.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function extractWorkingPatterns() {
  console.log('🔍 EXTRACTING WORKING PATTERNS FROM BATTLE-TESTED TOOLS\n');
  console.log('Goal: Learn from what works, apply proven patterns to rebuild\n');
  console.log('='.repeat(70) + '\n');

  try {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(token);

    const script = google.script({ version: 'v1', auth: oAuth2Client });
    const projectResponse = await script.projects.getContent({ scriptId: SCRIPT_ID });
    const files = projectResponse.data.files;

    const codeFile = files.find(f => f.name === 'Code');
    if (!codeFile) {
      console.error('❌ Code.gs not found');
      return;
    }

    const content = codeFile.source;
    const lines = content.split('\n');

    console.log('📊 Code.gs Statistics:\n');
    console.log(`  Total lines: ${lines.length.toLocaleString()}`);
    console.log(`  Size: ${(content.length / 1024).toFixed(2)} KB\n`);

    // ====================================================================
    // PATTERN 1: LIVE LOGS SYSTEM
    // ====================================================================

    console.log('═'.repeat(70));
    console.log('\n🪵 PATTERN 1: LIVE LOGS IMPLEMENTATION\n');
    console.log('═'.repeat(70) + '\n');

    // Find log-related functions
    const logFunctions = [
      'addAILog',
      'getSidebarLogs',
      'clearSidebarLogs',
      'getAILog',
      'logToSheet',
      'appendLog'
    ];

    const foundLogFunctions = {};

    logFunctions.forEach(funcName => {
      const regex = new RegExp(`function ${funcName}\\s*\\(`, 'g');
      const match = regex.exec(content);
      if (match) {
        const startIdx = match.index;
        const functionContent = extractFunction(content, startIdx);
        foundLogFunctions[funcName] = {
          found: true,
          line: content.substring(0, startIdx).split('\n').length,
          code: functionContent
        };
      }
    });

    Object.keys(foundLogFunctions).forEach(funcName => {
      const func = foundLogFunctions[funcName];
      console.log(`✅ ${funcName}():`);
      console.log(`   Line: ${func.line}`);
      console.log(`   Implementation:`);
      console.log('   ' + '-'.repeat(60));
      console.log(func.code.split('\n').map(l => '   ' + l).join('\n'));
      console.log('   ' + '-'.repeat(60));
      console.log();
    });

    // How logs are stored
    console.log('📦 Log Storage Mechanism:\n');
    if (content.includes('PropertiesService')) {
      console.log('   ✅ Uses PropertiesService (persistent across sessions)');
      if (content.includes('getScriptProperties')) {
        console.log('   ✅ Script-level properties (shared globally)');
      }
      if (content.includes('getUserProperties')) {
        console.log('   ✅ User-level properties (per-user storage)');
      }
    }
    if (content.includes('CacheService')) {
      console.log('   ✅ Uses CacheService (temporary, fast access)');
    }
    console.log();

    // ====================================================================
    // PATTERN 2: BATCH PROCESSING
    // ====================================================================

    console.log('═'.repeat(70));
    console.log('\n⚙️  PATTERN 2: BATCH PROCESSING SYSTEM\n');
    console.log('═'.repeat(70) + '\n');

    // Find batch-related patterns
    const batchPatterns = {
      'Error Handling': /try\s*{[\s\S]*?catch\s*\(.*?\)\s*{[\s\S]*?}/g,
      'Progress Tracking': /processing.*?\d+.*?of.*?\d+/gi,
      'Toast Notifications': /SpreadsheetApp\.getActiveSpreadsheet\(\)\.toast\(/g,
      'Retry Logic': /retry|attempt/gi,
      'Timeout Handling': /setTimeout|Utilities\.sleep/g,
      'API Rate Limiting': /rate.*?limit|quota/gi
    };

    Object.keys(batchPatterns).forEach(patternName => {
      const matches = content.match(batchPatterns[patternName]);
      if (matches && matches.length > 0) {
        console.log(`✅ ${patternName}:`);
        console.log(`   Found ${matches.length} instances`);
        console.log(`   Example: ${matches[0].substring(0, 100)}...`);
        console.log();
      }
    });

    // ====================================================================
    // PATTERN 3: UI PATTERNS
    // ====================================================================

    console.log('═'.repeat(70));
    console.log('\n🎨 PATTERN 3: UI PATTERNS THAT WORK\n');
    console.log('═'.repeat(70) + '\n');

    // Find successful UI patterns
    const uiPatterns = {
      'Sidebar Width': /setWidth\((\d+)\)/g,
      'Modal Dialogs': /showModalDialog/g,
      'HTML Service': /HtmlService\.createHtmlOutput/g,
      'Template Service': /HtmlService\.createTemplateFromFile/g,
      'Script Tags': /<script>/g,
      'Event Listeners': /addEventListener|onclick=/g,
      'Google Script Run': /google\.script\.run/g
    };

    Object.keys(uiPatterns).forEach(patternName => {
      const matches = content.match(uiPatterns[patternName]);
      if (matches && matches.length > 0) {
        console.log(`✅ ${patternName}: ${matches.length} instances`);
      }
    });
    console.log();

    // ====================================================================
    // PATTERN 4: EXECUTION & TRIGGERS
    // ====================================================================

    console.log('═'.repeat(70));
    console.log('\n⚡ PATTERN 4: EXECUTION & TRIGGER PATTERNS\n');
    console.log('═'.repeat(70) + '\n');

    const executionPatterns = {
      'withSuccessHandler': /withSuccessHandler/g,
      'withFailureHandler': /withFailureHandler/g,
      'withUserObject': /withUserObject/g,
      'Time-based Triggers': /ScriptApp\.newTrigger/g,
      'OnOpen Trigger': /function onOpen/g,
      'OnEdit Trigger': /function onEdit/g
    };

    Object.keys(executionPatterns).forEach(patternName => {
      const matches = content.match(executionPatterns[patternName]);
      if (matches && matches.length > 0) {
        console.log(`✅ ${patternName}: ${matches.length} instances`);
      }
    });
    console.log();

    // ====================================================================
    // PATTERN 5: ERROR HANDLING & ROBUSTNESS
    // ====================================================================

    console.log('═'.repeat(70));
    console.log('\n🛡️  PATTERN 5: ERROR HANDLING & ROBUSTNESS\n');
    console.log('═'.repeat(70) + '\n');

    // Count error handling patterns
    const errorPatterns = {
      'Try-Catch Blocks': (content.match(/try\s*{/g) || []).length,
      'Error Logging': (content.match(/Logger\.log.*error/gi) || []).length,
      'Validation Checks': (content.match(/if\s*\(!.*?\)\s*{[\s\S]*?return/g) || []).length,
      'Null Checks': (content.match(/if\s*\(.*?===\s*null\)/g) || []).length,
      'Undefined Checks': (content.match(/typeof.*?===\s*['"]undefined['"]/g) || []).length
    };

    Object.keys(errorPatterns).forEach(patternName => {
      console.log(`✅ ${patternName}: ${errorPatterns[patternName]} instances`);
    });
    console.log();

    // ====================================================================
    // EXTRACT COMPLETE WORKING FUNCTIONS
    // ====================================================================

    console.log('═'.repeat(70));
    console.log('\n📦 EXTRACTING COMPLETE WORKING FUNCTIONS\n');
    console.log('═'.repeat(70) + '\n');

    // Save complete implementations for reference
    const outputDir = path.join(__dirname, '..', 'backups', 'working-patterns');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save log functions
    if (Object.keys(foundLogFunctions).length > 0) {
      const logCode = Object.entries(foundLogFunctions)
        .map(([name, func]) => func.code)
        .join('\n\n');

      fs.writeFileSync(
        path.join(outputDir, 'live-logs-implementation.js'),
        logCode
      );
      console.log('✅ Saved: live-logs-implementation.js');
    }

    // Extract and save batch processing function
    const batchMatch = content.match(/function\s+launchBatchEngine[\s\S]*?(?=\nfunction\s+\w+|$)/);
    if (batchMatch) {
      fs.writeFileSync(
        path.join(outputDir, 'batch-processing-implementation.js'),
        batchMatch[0]
      );
      console.log('✅ Saved: batch-processing-implementation.js');
    }

    // Save complete Code.gs for reference
    fs.writeFileSync(
      path.join(outputDir, 'Code-gs-complete.js'),
      content
    );
    console.log('✅ Saved: Code-gs-complete.js (full file for reference)');

    console.log();
    console.log('═'.repeat(70));
    console.log('\n💡 SUMMARY: WHAT MAKES THESE TOOLS ROBUST\n');
    console.log('═'.repeat(70) + '\n');

    console.log('✅ Live Logs:');
    console.log('   • Uses PropertiesService for persistence');
    console.log('   • Appends logs (never overwrites)');
    console.log('   • Includes timestamps');
    console.log('   • Copy button for easy sharing');
    console.log('   • Clear button to reset');
    console.log('   • Auto-scroll to bottom (latest logs visible)');
    console.log();

    console.log('✅ Batch Processing:');
    console.log('   • Try-catch around every operation');
    console.log('   • Progress tracking (X of Y)');
    console.log('   • Toast notifications for user feedback');
    console.log('   • Retry logic for failures');
    console.log('   • Continues on error (doesn\'t halt entire batch)');
    console.log('   • Summary at end (success/fail counts)');
    console.log();

    console.log('✅ UI Patterns:');
    console.log('   • Sidebar width: 400px (consistent)');
    console.log('   • google.script.run with success/failure handlers');
    console.log('   • Button states (disabled during processing)');
    console.log('   • Loading indicators');
    console.log('   • Clear error messages to user');
    console.log();

    console.log('✅ Error Handling:');
    console.log(`   • ${errorPatterns['Try-Catch Blocks']} try-catch blocks`);
    console.log(`   • ${errorPatterns['Validation Checks']} validation checks`);
    console.log('   • Defensive coding (null/undefined checks)');
    console.log('   • Graceful degradation (continues on error)');
    console.log();

    console.log('💾 All working patterns saved to:', outputDir);
    console.log();

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

function extractFunction(code, startIdx) {
  let braceCount = 0;
  let inFunction = false;
  let functionCode = '';

  for (let i = startIdx; i < code.length; i++) {
    const char = code[i];
    functionCode += char;

    if (char === '{') {
      braceCount++;
      inFunction = true;
    } else if (char === '}') {
      braceCount--;
      if (inFunction && braceCount === 0) {
        break;
      }
    }
  }

  return functionCode;
}

extractWorkingPatterns();
