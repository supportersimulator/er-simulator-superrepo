#!/usr/bin/env node

/**
 * Generate Feature-Based Modules
 *
 * Reorganizes code by user workflow feature rather than technical concern
 * Principle: "Common utility goal" - everything for one feature stays together
 */

const fs = require('fs');
const path = require('path');

const monolithicPath = path.join(__dirname, 'Code_ULTIMATE_ATSR.gs');
const code = fs.readFileSync(monolithicPath, 'utf8');

console.log('\n🎯 GENERATING FEATURE-BASED MODULES\n');
console.log('Principle: Group by common utility goal (user workflow feature)\n');

// Helper: Extract a function by name
function extractFunction(code, functionName) {
  const regex = new RegExp(`((?:\\/\\*\\*[\\s\\S]*?\\*\\/\\s*)?function\\s+${functionName}\\s*\\([^)]*\\)\\s*\\{)`, 'g');
  const match = regex.exec(code);

  if (!match) return null;

  const startPos = match.index;
  let braceCount = 0;
  let inFunction = false;
  let endPos = startPos;

  for (let i = startPos; i < code.length; i++) {
    if (code[i] === '{') {
      braceCount++;
      inFunction = true;
    } else if (code[i] === '}') {
      braceCount--;
      if (inFunction && braceCount === 0) {
        endPos = i + 1;
        break;
      }
    }
  }

  return code.substring(startPos, endPos);
}

// Feature 1: Batch Sidebar Feature (Complete)
console.log('Step 1: Extracting Batch Sidebar Feature...');

const batchSidebarFunctions = [
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

let batchSidebarCode = [];
batchSidebarCode.push('/**');
batchSidebarCode.push(' * Batch Sidebar Feature - Complete');
batchSidebarCode.push(' *');
batchSidebarCode.push(' * Everything needed for batch processing sidebar UI:');
batchSidebarCode.push(' * - HTML template with all UI controls');
batchSidebarCode.push(' * - Client-side button handlers (start, stop, refresh, etc.)');
batchSidebarCode.push(' * - Backend functions called by sidebar');
batchSidebarCode.push(' * - Supporting utilities (headers, API key, logging)');
batchSidebarCode.push(' *');
batchSidebarCode.push(' * External Dependencies:');
batchSidebarCode.push(' * - Core_Batch_Engine.gs (for processOneInputRow_)');
batchSidebarCode.push(' * - Title_Generation_Engine.gs (for title generation)');
batchSidebarCode.push(' *');
batchSidebarCode.push(' * Common Utility Goal: Batch processing via sidebar UI');
batchSidebarCode.push(' * ');
batchSidebarCode.push(` * Generated: ${new Date().toISOString()}`);
batchSidebarCode.push(' * Source: Code_ULTIMATE_ATSR.gs (feature extraction)');
batchSidebarCode.push(' */');
batchSidebarCode.push('');

let extractedCount = 0;
batchSidebarFunctions.forEach(funcName => {
  const func = extractFunction(code, funcName);
  if (func) {
    batchSidebarCode.push(func);
    batchSidebarCode.push('');
    extractedCount++;
  }
});

console.log(`  ✓ Extracted ${extractedCount} functions for Batch Sidebar Feature`);

// Feature 2: Core Batch Engine (Pure Logic, No UI)
console.log('Step 2: Extracting Core Batch Engine...');

const batchEngineFunctions = [
  'processOneInputRow_',
  'validateVitalsFields_',
  'applyClinicalDefaults_',
  'tryParseJSON'
];

let batchEngineCode = [];
batchEngineCode.push('/**');
batchEngineCode.push(' * Core Batch Engine - Pure Business Logic');
batchEngineCode.push(' *');
batchEngineCode.push(' * Pure batch processing logic with NO UI dependencies.');
batchEngineCode.push(' * Can be called from sidebar, API, CLI, or any other context.');
batchEngineCode.push(' *');
batchEngineCode.push(' * Functions:');
batchEngineCode.push(' * - processOneInputRow_(row, settings) - Main batch processing');
batchEngineCode.push(' * - validateVitalsFields_(vitals) - Input validation');
batchEngineCode.push(' * - applyClinicalDefaults_(row) - Clinical defaults application');
batchEngineCode.push(' * - tryParseJSON(str) - Safe JSON parsing');
batchEngineCode.push(' *');
batchEngineCode.push(' * No UI, no HTML, no button handlers - just pure logic.');
batchEngineCode.push(' *');
batchEngineCode.push(` * Generated: ${new Date().toISOString()}`);
batchEngineCode.push(' */');
batchEngineCode.push('');

extractedCount = 0;
batchEngineFunctions.forEach(funcName => {
  const func = extractFunction(code, funcName);
  if (func) {
    batchEngineCode.push(func);
    batchEngineCode.push('');
    extractedCount++;
  }
});

console.log(`  ✓ Extracted ${extractedCount} functions for Core Batch Engine`);

// Feature 3: Title Generation Engine (Pure Logic, No UI)
console.log('Step 3: Extracting Title Generation Engine...');

const titleEngineFunctions = [
  'runATSRTitleGenerator'
];

let titleEngineCode = [];
titleEngineCode.push('/**');
titleEngineCode.push(' * Title Generation Engine - AI Integration');
titleEngineCode.push(' *');
titleEngineCode.push(' * Pure AI title generation logic with NO UI dependencies.');
titleEngineCode.push(' * Handles OpenAI API integration, prompt construction, and response parsing.');
titleEngineCode.push(' *');
titleEngineCode.push(' * Reusable across:');
titleEngineCode.push(' * - Batch processing (called from Core_Batch_Engine)');
titleEngineCode.push(' * - Single row processing');
titleEngineCode.push(' * - API endpoints');
titleEngineCode.push(' * - Testing frameworks');
titleEngineCode.push(' *');
titleEngineCode.push(` * Generated: ${new Date().toISOString()}`);
titleEngineCode.push(' */');
titleEngineCode.push('');

extractedCount = 0;
titleEngineFunctions.forEach(funcName => {
  const func = extractFunction(code, funcName);
  if (func) {
    titleEngineCode.push(func);
    titleEngineCode.push('');
    extractedCount++;
  }
});

console.log(`  ✓ Extracted ${extractedCount} functions for Title Generation Engine`);

// Feature 4: Quality Scoring Engine (Pure Logic, No UI)
console.log('Step 4: Extracting Quality Scoring Engine...');

const qualityEngineFunctions = [
  'evaluateSimulationQuality'
];

let qualityEngineCode = [];
qualityEngineCode.push('/**');
qualityEngineCode.push(' * Quality Scoring Engine - Evaluation Logic');
qualityEngineCode.push(' *');
qualityEngineCode.push(' * Pure quality evaluation logic with NO UI dependencies.');
qualityEngineCode.push(' * Applies weighted rubric scoring to simulation scenarios.');
qualityEngineCode.push(' *');
qualityEngineCode.push(` * Generated: ${new Date().toISOString()}`);
qualityEngineCode.push(' */');
qualityEngineCode.push('');

extractedCount = 0;
qualityEngineFunctions.forEach(funcName => {
  const func = extractFunction(code, funcName);
  if (func) {
    qualityEngineCode.push(func);
    qualityEngineCode.push('');
    extractedCount++;
  }
});

console.log(`  ✓ Extracted ${extractedCount} functions for Quality Scoring Engine`);

// Create output directory
const outputDir = path.join(__dirname, '../isolated-tools/feature-based');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write feature modules
console.log('\nStep 5: Writing feature module files...\n');

const modules = [
  { name: 'Batch_Sidebar_Feature.gs', code: batchSidebarCode, category: 'features' },
  { name: 'Core_Batch_Engine.gs', code: batchEngineCode, category: 'engines' },
  { name: 'Title_Generation_Engine.gs', code: titleEngineCode, category: 'engines' },
  { name: 'Quality_Scoring_Engine.gs', code: qualityEngineCode, category: 'engines' }
];

const generatedModules = [];

modules.forEach(module => {
  const categoryDir = path.join(outputDir, module.category);
  if (!fs.existsSync(categoryDir)) {
    fs.mkdirSync(categoryDir, { recursive: true });
  }

  const filePath = path.join(categoryDir, module.name);
  const content = module.code.join('\n');

  fs.writeFileSync(filePath, content);

  const sizeKB = (content.length / 1024).toFixed(1);
  const functionCount = (content.match(/^function\s+\w+/gm) || []).length;

  generatedModules.push({
    name: module.name,
    category: module.category,
    sizeKB: parseFloat(sizeKB),
    functionCount,
    path: filePath
  });

  console.log(`  ✓ ${module.category}/${module.name} (${sizeKB} KB, ${functionCount} functions)`);
});

// Generate manifest
const manifest = {
  timestamp: new Date().toISOString(),
  approach: 'feature-based',
  principle: 'Group by common utility goal (user workflow feature)',
  source: 'Code_ULTIMATE_ATSR.gs',
  modulesCreated: generatedModules.length,
  categories: {
    features: generatedModules.filter(m => m.category === 'features').length,
    engines: generatedModules.filter(m => m.category === 'engines').length
  },
  modules: generatedModules
};

const manifestPath = path.join(outputDir, 'FEATURE_BASED_MANIFEST.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log('\n' + '='.repeat(70));
console.log('📊 FEATURE-BASED MODULES GENERATED');
console.log('='.repeat(70));
console.log(`Total Modules: ${generatedModules.length}`);
console.log(`  Features (UI + Logic): ${manifest.categories.features}`);
console.log(`  Engines (Pure Logic): ${manifest.categories.engines}`);
console.log(`Output Directory: ${outputDir}`);
console.log('');
console.log('Organization Principle:');
console.log('  ✓ Common utility goal - everything for one feature together');
console.log('  ✓ UI features include HTML + handlers + backend');
console.log('  ✓ Engines are pure logic (no UI) for reusability');
console.log('');
console.log('Benefits:');
console.log('  ✓ Modify batch sidebar? Open ONE file');
console.log('  ✓ All related code stays together');
console.log('  ✓ Easy to understand feature scope');
console.log('  ✓ Clean separation: features vs engines');
console.log('='.repeat(70) + '\n');
