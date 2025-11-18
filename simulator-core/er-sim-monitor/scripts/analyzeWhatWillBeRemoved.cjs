#!/usr/bin/env node

/**
 * DRY RUN: ANALYZE WHAT WILL BE REMOVED
 * Shows exactly which functions exist and what will be deleted
 * WITHOUT making any changes
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PROJECT_ID = '1KBkujOTXGDmmhWOFm-ifxoMjXM5pRwwM5FpFBtPWK8eoE99fr4lla1OE'; // ER Sim - ATSR Tool (Standalone)

console.log('\n🔍 DRY RUN: ANALYZING WHAT WILL BE REMOVED\n');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('⚠️  THIS IS A READ-ONLY ANALYSIS - NO CHANGES WILL BE MADE\n');
console.log('═══════════════════════════════════════════════════════════════\n');

// Functions we plan to remove
const FUNCTIONS_TO_REMOVE = [
  // ATSR functions
  'runATSRTitleGenerator',
  'parseATSRResponse_',
  'buildATSRUltimateUI_',
  'generateMysteriousSparkTitles',
  'saveATSRData',
  'applyATSRSelectionsWithDefiningAndMemory',

  // Pathways functions
  'runPathwayChainBuilder',
  'showFieldSelector',
  'getRecommendedFields_',
  'preCacheRichData',
  'analyzeCatalogWithMultiLayerCache_'
];

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

function findAllFunctions(code) {
  const functions = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^function\s+(\w+)\s*\(/);
    if (match) {
      functions.push({
        name: match[1],
        lineNumber: i + 1,
        line: line.trim()
      });
    }
  }

  return functions;
}

function getFunctionBody(code, functionName) {
  const lines = code.split('\n');
  let inFunction = false;
  let braceDepth = 0;
  let bodyLines = [];
  let startLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const funcMatch = line.match(/^function\s+(\w+)\s*\(/);
    if (funcMatch && funcMatch[1] === functionName) {
      inFunction = true;
      braceDepth = 0;
      startLine = i + 1;
      bodyLines.push(line);
      continue;
    }

    if (inFunction) {
      bodyLines.push(line);

      for (const char of line) {
        if (char === '{') braceDepth++;
        if (char === '}') braceDepth--;
      }

      if (braceDepth === 0 && bodyLines.length > 1) {
        return {
          startLine,
          endLine: i + 1,
          lineCount: bodyLines.length,
          preview: bodyLines.slice(0, 5).join('\n') + (bodyLines.length > 5 ? '\n   ...' : '')
        };
      }
    }
  }

  return null;
}

async function analyzeProject() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Reading project from Google Apps Script...\n');
    const project = await script.projects.getContent({ scriptId: PROJECT_ID });

    const files = project.data.files;
    console.log(`Found ${files.length} file(s)\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    let totalFunctionsFound = 0;
    let totalFunctionsToRemove = 0;
    let totalLinesToRemove = 0;

    files.forEach(file => {
      if (file.type !== 'SERVER_JS') {
        return; // Skip non-code files
      }

      console.log(`\n📄 FILE: ${file.name}.gs`);
      console.log(`   Size: ${(file.source.length / 1024).toFixed(1)} KB`);
      console.log('');

      const allFunctions = findAllFunctions(file.source);
      totalFunctionsFound += allFunctions.length;

      console.log(`   Total functions in file: ${allFunctions.length}`);
      console.log('');

      // Check which functions will be removed
      const toRemove = [];
      const toKeep = [];

      allFunctions.forEach(func => {
        if (FUNCTIONS_TO_REMOVE.includes(func.name)) {
          toRemove.push(func);
        } else {
          toKeep.push(func);
        }
      });

      if (toRemove.length > 0) {
        console.log(`   🗑️  WILL REMOVE (${toRemove.length} functions):\n`);
        toRemove.forEach(func => {
          const body = getFunctionBody(file.source, func.name);
          console.log(`      ❌ ${func.name}()`);
          console.log(`         Lines ${body.startLine}-${body.endLine} (${body.lineCount} lines)`);
          console.log(`         Preview:`);
          console.log(`         ${body.preview.split('\n').join('\n         ')}`);
          console.log('');
          totalLinesToRemove += body.lineCount;
        });
        totalFunctionsToRemove += toRemove.length;
      }

      if (toKeep.length > 0) {
        console.log(`   ✅ WILL KEEP (${toKeep.length} functions):\n`);
        toKeep.forEach(func => {
          console.log(`      ✓ ${func.name}()`);
        });
        console.log('');
      }

      console.log('─────────────────────────────────────────────────────────────');
    });

    console.log('\n═══════════════════════════════════════════════════════════════\n');
    console.log('📊 SUMMARY:\n');
    console.log(`   Total functions found: ${totalFunctionsFound}`);
    console.log(`   Functions to remove: ${totalFunctionsToRemove}`);
    console.log(`   Functions to keep: ${totalFunctionsFound - totalFunctionsToRemove}`);
    console.log(`   Total lines to remove: ~${totalLinesToRemove}`);
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎯 NEXT STEPS:\n');
    console.log('1. Review the functions marked for removal above');
    console.log('2. Verify you want to remove them');
    console.log('3. If okay, run: node scripts/cleanBatchProcessingFile.cjs');
    console.log('4. Or manually delete them in Apps Script editor\n');
    console.log('⚠️  This was a DRY RUN - no changes were made.\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

analyzeProject();
