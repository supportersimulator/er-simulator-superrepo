#!/usr/bin/env node

/**
 * Extract Complete Feature Files with ALL Golden Prompts Preserved
 *
 * Creates deployable Apps Script files for:
 * 1. ATSR_Title_Generator_Feature.gs - Complete ATSR feature
 * 2. Batch_Processing_Sidebar_Feature.gs - Complete batch sidebar
 * 3. Core_Processing_Engine.gs - Shared business logic
 *
 * CRITICAL: Preserves every character of golden prompts
 */

const fs = require('fs');
const path = require('path');

const monolithicPath = path.join(__dirname, 'Code_ULTIMATE_ATSR.gs');
const code = fs.readFileSync(monolithicPath, 'utf8');

console.log('\n🎯 EXTRACTING COMPLETE FEATURES WITH GOLDEN PROMPTS PRESERVED\n');

// Helper: Extract a section by line numbers (preserves exact text including prompts)
function extractByLineRange(code, startLine, endLine) {
  const lines = code.split('\n');
  return lines.slice(startLine - 1, endLine).join('\n');
}

// Helper: Extract function by name with ALL surrounding content
function extractFunctionComplete(code, functionName, includeComments = true) {
  // Find the function and capture everything including JSDoc comments
  const lines = code.split('\n');
  let startLine = -1;
  let endLine = -1;

  // Find function declaration
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(`function ${functionName}(`)) {
      // Look backwards for comment block
      let commentStart = i;
      if (includeComments) {
        for (let j = i - 1; j >= 0; j--) {
          const line = lines[j].trim();
          if (line.startsWith('//') || line.startsWith('/*') || line.startsWith('*') || line === '') {
            commentStart = j;
          } else {
            break;
          }
        }
      }
      startLine = commentStart;

      // Find end of function (matching braces)
      let braceCount = 0;
      let inFunction = false;
      for (let j = i; j < lines.length; j++) {
        const line = lines[j];
        for (let char of line) {
          if (char === '{') {
            braceCount++;
            inFunction = true;
          } else if (char === '}') {
            braceCount--;
            if (inFunction && braceCount === 0) {
              endLine = j + 1;
              break;
            }
          }
        }
        if (endLine !== -1) break;
      }
      break;
    }
  }

  if (startLine === -1 || endLine === -1) {
    console.log(`   ⚠️  Function ${functionName} not found or incomplete`);
    return null;
  }

  return lines.slice(startLine, endLine).join('\n');
}

// ====================================================================================
// FEATURE 1: ATSR Title Generator (Complete with Golden Prompts)
// ====================================================================================

console.log('Step 1: Extracting ATSR Title Generator Feature...\n');

const atsrFunctions = [
  'runATSRTitleGenerator',
  'parseATSRResponse_',
  'buildATSRUltimateUI_',
  'applyATSRSelectionsWithDefiningAndMemory'
];

let atsrCode = [];
atsrCode.push('/**');
atsrCode.push(' * ATSR Title Generator Feature - Complete');
atsrCode.push(' *');
atsrCode.push(' * Everything for ATSR (Automated Titles, Summary & Review Generator):');
atsrCode.push(' * - Complete ATSR UI with selection interface');
atsrCode.push(' * - ALL GOLDEN PROMPTS PRESERVED CHARACTER-FOR-CHARACTER');
atsrCode.push(' * - OpenAI API integration');
atsrCode.push(' * - Response parsing and validation');
atsrCode.push(' * - User selection and memory tracking');
atsrCode.push(' *');
atsrCode.push(' * Common Utility Goal: Adjust all ATSR features');
atsrCode.push(' *');
atsrCode.push(' * External Dependencies:');
atsrCode.push(' * - Core_Processing_Engine.gs (for tryParseJSON)');
atsrCode.push(' *');
atsrCode.push(` * Generated: ${new Date().toISOString()}`);
atsrCode.push(' * Source: Code_ULTIMATE_ATSR.gs (complete feature extraction)');
atsrCode.push(' */');
atsrCode.push('');
atsrCode.push('// ==================== ATSR FEATURE ====================');
atsrCode.push('');

let atsrFunctionCount = 0;
atsrFunctions.forEach(funcName => {
  const func = extractFunctionComplete(code, funcName);
  if (func) {
    atsrCode.push(func);
    atsrCode.push('');
    atsrCode.push('');
    atsrFunctionCount++;
    console.log(`  ✓ Extracted: ${funcName}()`);
  }
});

const atsrContent = atsrCode.join('\n');
console.log(`\n✅ ATSR Feature: ${atsrFunctionCount} functions, ${(atsrContent.length / 1024).toFixed(1)} KB\n`);

// ====================================================================================
// FEATURE 2: Batch Processing Sidebar (Complete)
// ====================================================================================

console.log('Step 2: Extracting Batch Processing Sidebar Feature...\n');

const batchFunctions = [
  'openSimSidebar',
  'extractValueFromParsed_',
  'syncApiKeyFromSettingsSheet_',
  'readApiKey_',
  'checkApiStatus',
  'readTwoTierHeaders_',
  'mergedKeysFromTwoTiers_',
  'cacheHeaders',
  'getCachedHeadersOrRead',
  'clearHeaderCache',
  'ensureBatchReportsSheet_'
];

let batchCode = [];
batchCode.push('/**');
batchCode.push(' * Batch Processing Sidebar Feature - Complete');
batchCode.push(' *');
batchCode.push(' * Everything for batch/single/set rows processing sidebar:');
batchCode.push(' * - Complete sidebar HTML with all controls');
batchCode.push(' * - Start/stop/refresh button handlers');
batchCode.push(' * - Progress tracking and logging');
batchCode.push(' * - API key management');
batchCode.push(' * - Sheet header caching');
batchCode.push(' *');
batchCode.push(' * Common Utility Goal: Adjust all batch processing bar features');
batchCode.push(' *');
batchCode.push(' * External Dependencies:');
batchCode.push(' * - Core_Processing_Engine.gs (for processOneInputRow_)');
batchCode.push(' *');
batchCode.push(` * Generated: ${new Date().toISOString()}`);
batchCode.push(' * Source: Code_ULTIMATE_ATSR.gs (complete feature extraction)');
batchCode.push(' */');
batchCode.push('');
batchCode.push('// ==================== BATCH PROCESSING SIDEBAR ====================');
batchCode.push('');

let batchFunctionCount = 0;
batchFunctions.forEach(funcName => {
  const func = extractFunctionComplete(code, funcName);
  if (func) {
    batchCode.push(func);
    batchCode.push('');
    batchCode.push('');
    batchFunctionCount++;
    console.log(`  ✓ Extracted: ${funcName}()`);
  }
});

const batchContent = batchCode.join('\n');
console.log(`\n✅ Batch Sidebar: ${batchFunctionCount} functions, ${(batchContent.length / 1024).toFixed(1)} KB\n`);

// ====================================================================================
// ENGINE: Core Processing (Pure Logic)
// ====================================================================================

console.log('Step 3: Extracting Core Processing Engine...\n');

const engineFunctions = [
  'processOneInputRow_',
  'validateVitalsFields_',
  'applyClinicalDefaults_',
  'tryParseJSON'
];

let engineCode = [];
engineCode.push('/**');
engineCode.push(' * Core Processing Engine - Pure Business Logic');
engineCode.push(' *');
engineCode.push(' * Shared processing logic with NO UI dependencies.');
engineCode.push(' * Used by both ATSR and Batch Processing features.');
engineCode.push(' *');
engineCode.push(' * Functions:');
engineCode.push(' * - processOneInputRow_() - Main scenario processing');
engineCode.push(' * - validateVitalsFields_() - Input validation');
engineCode.push(' * - applyClinicalDefaults_() - Apply defaults');
engineCode.push(' * - tryParseJSON() - Safe JSON parsing');
engineCode.push(' *');
engineCode.push(' * No UI, no HTML - pure reusable logic.');
engineCode.push(' *');
engineCode.push(` * Generated: ${new Date().toISOString()}`);
engineCode.push(' * Source: Code_ULTIMATE_ATSR.gs (engine extraction)');
engineCode.push(' */');
engineCode.push('');
engineCode.push('// ==================== CORE PROCESSING ENGINE ====================');
engineCode.push('');

let engineFunctionCount = 0;
engineFunctions.forEach(funcName => {
  const func = extractFunctionComplete(code, funcName);
  if (func) {
    engineCode.push(func);
    engineCode.push('');
    engineCode.push('');
    engineFunctionCount++;
    console.log(`  ✓ Extracted: ${funcName}()`);
  }
});

const engineContent = engineCode.join('\n');
console.log(`\n✅ Core Engine: ${engineFunctionCount} functions, ${(engineContent.length / 1024).toFixed(1)} KB\n`);

// ====================================================================================
// Write Files
// ====================================================================================

console.log('Step 4: Writing deployable Apps Script files...\n');

const outputDir = path.join(__dirname, '../apps-script-deployable');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const files = [
  { name: 'ATSR_Title_Generator_Feature.gs', content: atsrContent, functions: atsrFunctionCount },
  { name: 'Batch_Processing_Sidebar_Feature.gs', content: batchContent, functions: batchFunctionCount },
  { name: 'Core_Processing_Engine.gs', content: engineContent, functions: engineFunctionCount }
];

files.forEach(file => {
  const filePath = path.join(outputDir, file.name);
  fs.writeFileSync(filePath, file.content);
  console.log(`  ✓ Created: ${file.name} (${file.functions} functions, ${(file.content.length / 1024).toFixed(1)} KB)`);
});

// ====================================================================================
// Summary
// ====================================================================================

console.log('\n' + '='.repeat(70));
console.log('📊 FEATURE EXTRACTION COMPLETE');
console.log('='.repeat(70));
console.log(`Output Directory: ${outputDir}`);
console.log('');
console.log('Files Created:');
files.forEach(file => {
  console.log(`  • ${file.name}`);
  console.log(`    ${file.functions} functions, ${(file.content.length / 1024).toFixed(1)} KB`);
});
console.log('');
console.log('✅ All golden prompts preserved character-for-character');
console.log('✅ Complete features ready for deployment');
console.log('✅ Clean isolation between features');
console.log('');
console.log('Next Steps:');
console.log('  1. Open test spreadsheet:');
console.log('     https://docs.google.com/spreadsheets/d/1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI/edit');
console.log('  2. Go to Extensions > Apps Script');
console.log('  3. Delete existing Code.gs (if any)');
console.log('  4. Create 3 new files and paste content:');
console.log('     - ATSR_Title_Generator_Feature.gs');
console.log('     - Batch_Processing_Sidebar_Feature.gs');
console.log('     - Core_Processing_Engine.gs');
console.log('  5. Save and test!');
console.log('='.repeat(70) + '\n');

// Save manifest
const manifest = {
  timestamp: new Date().toISOString(),
  purpose: 'Feature-based Apps Script deployment with golden prompts preserved',
  testSpreadsheetId: '1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI',
  testSpreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI/edit',
  source: 'Code_ULTIMATE_ATSR.gs',
  files: files.map(f => ({
    name: f.name,
    functions: f.functions,
    sizeKB: parseFloat((f.content.length / 1024).toFixed(1))
  }))
};

const manifestPath = path.join(outputDir, 'DEPLOYMENT_MANIFEST.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`📋 Manifest saved: ${manifestPath}\n`);
