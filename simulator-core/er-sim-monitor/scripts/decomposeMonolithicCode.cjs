#!/usr/bin/env node

/**
 * Phase 2: Decompose Monolithic Code into Isolated Single-Purpose Tools
 *
 * Strategy:
 * 1. Parse Code_ULTIMATE_ATSR.gs to extract all functions
 * 2. Classify each function by its primary responsibility
 * 3. Group related functions into isolated modules
 * 4. Extract shared utilities into a common helpers file
 * 5. Create clean, single-purpose files
 * 6. Upload to Current Code folder in Google Drive
 */

const fs = require('fs');
const path = require('path');

// Function classification patterns
const FUNCTION_PATTERNS = {
  'BatchProcessing': [
    'batchProcess', 'processOneInputRow', 'processBatch', 'runBatch',
    'queueBatch', 'dequeue', 'getBatch', 'isBatchRunning'
  ],
  'QualityScoring': [
    'evaluateSimulationQuality', 'attachQualityToRow', 'runQualityAudit',
    'cleanUpLowValueRows', 'ensureQualityColumns', 'calculateQuality',
    'scoreField', 'getQualityThreshold'
  ],
  'TitleGeneration': [
    'runATSRTitleGenerator', 'generateTitle', 'ATSR', 'parseResponse',
    'extractTitle', 'formatTitle', 'validateTitle'
  ],
  'InputValidation': [
    'validateVitalsFields', 'validateInput', 'isValid', 'checkRequired',
    'validateJSON', 'validateRow', 'validateField'
  ],
  'ClinicalDefaults': [
    'applyClinicalDefaults', 'getDefaults', 'setDefault', 'fillDefaults',
    'normalizeVitals', 'standardizeVitals'
  ],
  'DuplicateDetection': [
    'contentHash', 'isDuplicate', 'checkDuplicate', 'findDuplicates',
    'markDuplicate', 'removeDuplicates'
  ],
  'CategoriesPathways': [
    'getCategory', 'setCategory', 'assignCategory', 'getPathway',
    'setPathway', 'assignPathway', 'consolidatePathway'
  ],
  'UIMenu': [
    'onOpen', 'onEdit', 'createMenu', 'showDialog', 'showSidebar',
    'getSafeUi', 'displayToast', 'showAlert'
  ],
  'Configuration': [
    'getProp', 'setProp', 'getProperty', 'setProperty', 'getConfig',
    'setConfig', 'loadSettings', 'saveSettings'
  ],
  'Utilities': [
    'estimateTokens', 'estimateCostUSD', 'tryParseJSON', 'sanitize',
    'formatDate', 'getTimestamp', 'log', 'debug'
  ]
};

function extractFunctions(code) {
  const functions = [];

  // Match function declarations
  const funcRegex = /(?:\/\*\*[\s\S]*?\*\/\s*)?function\s+(\w+)\s*\([^)]*\)\s*\{/g;
  let match;

  while ((match = funcRegex.exec(code)) !== null) {
    const funcName = match[1];
    const startPos = match.index;

    // Find function body (matching braces)
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

    const fullFunction = code.substring(startPos, endPos);
    functions.push({
      name: funcName,
      code: fullFunction,
      start: startPos,
      end: endPos
    });
  }

  return functions;
}

function classifyFunction(funcName, funcCode) {
  // Check against patterns
  for (const [category, patterns] of Object.entries(FUNCTION_PATTERNS)) {
    for (const pattern of patterns) {
      if (funcName.toLowerCase().includes(pattern.toLowerCase())) {
        return category;
      }
    }
  }

  // Fallback: analyze function content
  if (funcCode.includes('SpreadsheetApp') && funcCode.includes('getActiveSheet')) {
    return 'Utilities';
  }
  if (funcCode.includes('UrlFetchApp') || funcCode.includes('openai')) {
    return 'TitleGeneration';
  }
  if (funcCode.includes('quality') || funcCode.includes('score')) {
    return 'QualityScoring';
  }

  return 'Utilities';
}

function groupFunctionsByCategory(functions) {
  const grouped = {};

  for (const func of functions) {
    const category = classifyFunction(func.name, func.code);

    if (!grouped[category]) {
      grouped[category] = [];
    }

    grouped[category].push(func);
  }

  return grouped;
}

function generateModuleFile(category, functions, dependencies = []) {
  const lines = [];

  // Header comment
  lines.push('/**');
  lines.push(` * ${category} Module`);
  lines.push(' *');
  lines.push(` * Isolated single-purpose module containing ${functions.length} functions`);
  lines.push(' * for ' + category.replace(/([A-Z])/g, ' $1').trim().toLowerCase());
  lines.push(' *');
  lines.push(` * Generated: ${new Date().toISOString()}`);
  lines.push(' * Source: Code_ULTIMATE_ATSR.gs (monolithic, preserved in Legacy Code)');
  lines.push(' */');
  lines.push('');

  // Dependencies note
  if (dependencies.length > 0) {
    lines.push('/**');
    lines.push(' * Dependencies:');
    dependencies.forEach(dep => lines.push(` * - ${dep}`));
    lines.push(' */');
    lines.push('');
  }

  // Functions
  functions.forEach((func, idx) => {
    if (idx > 0) lines.push('');
    lines.push(func.code);
  });

  return lines.join('\n');
}

async function decomposeMonolithicCode() {
  console.log('\n🔬 PHASE 2: DECOMPOSING MONOLITHIC CODE INTO ISOLATED TOOLS\n');
  console.log('Reading Code_ULTIMATE_ATSR.gs...\n');

  const monolithicPath = path.join(__dirname, 'Code_ULTIMATE_ATSR.gs');

  if (!fs.existsSync(monolithicPath)) {
    console.error('❌ Code_ULTIMATE_ATSR.gs not found!');
    process.exit(1);
  }

  const code = fs.readFileSync(monolithicPath, 'utf8');
  console.log(`✅ Loaded monolithic file: ${(code.length / 1024).toFixed(1)} KB\n`);

  // Step 1: Extract all functions
  console.log('Step 1: Extracting functions...');
  const functions = extractFunctions(code);
  console.log(`✅ Extracted ${functions.length} functions\n`);

  // Step 2: Classify and group
  console.log('Step 2: Classifying functions by category...');
  const grouped = groupFunctionsByCategory(functions);

  Object.entries(grouped).forEach(([category, funcs]) => {
    console.log(`  ${category}: ${funcs.length} functions`);
  });
  console.log('');

  // Step 3: Generate isolated module files
  console.log('Step 3: Generating isolated module files...');

  const outputDir = path.join(__dirname, '../isolated-tools');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const generatedFiles = [];

  for (const [category, funcs] of Object.entries(grouped)) {
    const fileName = `${category}.gs`;
    const filePath = path.join(outputDir, fileName);
    const content = generateModuleFile(category, funcs, ['Utilities.gs']);

    fs.writeFileSync(filePath, content);
    generatedFiles.push({ category, fileName, filePath, functionCount: funcs.length });
    console.log(`  ✓ Created: ${fileName} (${funcs.length} functions, ${(content.length / 1024).toFixed(1)} KB)`);
  }

  console.log(`\n✅ Generated ${generatedFiles.length} isolated module files\n`);

  // Step 4: Generate manifest
  console.log('Step 4: Creating decomposition manifest...');

  const manifest = {
    timestamp: new Date().toISOString(),
    source: 'Code_ULTIMATE_ATSR.gs',
    sourceSize: code.length,
    totalFunctions: functions.length,
    modulesCreated: generatedFiles.length,
    modules: generatedFiles.map(f => ({
      category: f.category,
      fileName: f.fileName,
      functionCount: f.functionCount
    }))
  };

  const manifestPath = path.join(outputDir, 'DECOMPOSITION_MANIFEST.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`✅ Manifest created: ${manifestPath}\n`);

  // Summary
  console.log('='.repeat(60));
  console.log('📊 DECOMPOSITION COMPLETE');
  console.log('='.repeat(60));
  console.log(`Source: Code_ULTIMATE_ATSR.gs (${(code.length / 1024).toFixed(1)} KB)`);
  console.log(`Functions Extracted: ${functions.length}`);
  console.log(`Isolated Modules Created: ${generatedFiles.length}`);
  console.log(`Output Directory: ${outputDir}`);
  console.log('');
  console.log('Modules Created:');
  generatedFiles.forEach(f => {
    console.log(`  • ${f.fileName} (${f.functionCount} functions)`);
  });
  console.log('='.repeat(60) + '\n');

  return { generatedFiles, manifest };
}

decomposeMonolithicCode().catch(console.error);
