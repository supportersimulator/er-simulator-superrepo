#!/usr/bin/env node

/**
 * Phase 2B: Refine Decomposition - Further Break Down Large Modules
 *
 * Takes the initial decomposition and further isolates:
 * 1. Split Utilities into sub-categories
 * 2. Extract HTML/JS sidebar code into separate files
 * 3. Create truly single-purpose modules
 */

const fs = require('fs');
const path = require('path');

// Refined function classification
const REFINED_PATTERNS = {
  'API_Management': [
    'syncApiKey', 'readApiKey', 'checkApiStatus', 'validateApiKey'
  ],
  'Header_Caching': [
    'readTwoTierHeaders', 'mergedKeys', 'cacheHeaders', 'getCachedHeaders', 'clearHeaderCache'
  ],
  'Sheet_Operations': [
    'ensureBatchReports', 'ensureSheet', 'getOrCreateSheet', 'findSheet'
  ],
  'Sidebar_Backend': [
    'openSimSidebar', 'openSettings', 'saveSidebarBasics', 'persistBasics'
  ],
  'Logging_Utilities': [
    'logLong', 'appendLog', 'clearLogs', 'copyLogs', 'refreshLogs'
  ],
  'HTML_Sidebar_UI': [
    // HTML content - will be extracted separately
  ],
  'Value_Extraction': [
    'extractValue', 'parseValue', 'getValue', 'tryParse'
  ]
};

function refineUtilities() {
  console.log('\n🔧 PHASE 2B: REFINING DECOMPOSITION\n');
  console.log('Further breaking down Utilities.gs into single-purpose modules...\n');

  const utilitiesPath = path.join(__dirname, '../isolated-tools/Utilities.gs');

  if (!fs.existsSync(utilitiesPath)) {
    console.error('❌ Utilities.gs not found in isolated-tools/');
    process.exit(1);
  }

  const content = fs.readFileSync(utilitiesPath, 'utf8');

  // Extract HTML sections
  console.log('Step 1: Extracting embedded HTML/JS code...');

  const htmlMatches = content.match(/return HtmlService\.createHtmlOutput\(`([\s\S]*?)`\)/g);

  if (htmlMatches) {
    htmlMatches.forEach((match, idx) => {
      const htmlContent = match.match(/`([\s\S]*?)`/)[1];
      const htmlFileName = `Sidebar_UI_${idx + 1}.html`;
      const htmlPath = path.join(__dirname, '../isolated-tools/html', htmlFileName);

      // Create html subdirectory if it doesn't exist
      const htmlDir = path.dirname(htmlPath);
      if (!fs.existsSync(htmlDir)) {
        fs.mkdirSync(htmlDir, { recursive: true });
      }

      fs.writeFileSync(htmlPath, htmlContent);
      console.log(`  ✓ Extracted: ${htmlFileName} (${(htmlContent.length / 1024).toFixed(1)} KB)`);
    });
  }

  console.log('\nStep 2: Categorizing utility functions...');

  // Extract individual functions
  const funcRegex = /(?:\/\*\*[\s\S]*?\*\/\s*)?function\s+(\w+)\s*\([^)]*\)\s*\{/g;
  const functions = [];
  let match;

  while ((match = funcRegex.exec(content)) !== null) {
    const funcName = match[1];
    const startPos = match.index;

    // Find function body
    let braceCount = 0;
    let inFunction = false;
    let endPos = startPos;

    for (let i = startPos; i < content.length; i++) {
      if (content[i] === '{') {
        braceCount++;
        inFunction = true;
      } else if (content[i] === '}') {
        braceCount--;
        if (inFunction && braceCount === 0) {
          endPos = i + 1;
          break;
        }
      }
    }

    const fullFunction = content.substring(startPos, endPos);

    // Classify function
    let category = 'General_Utilities';
    for (const [cat, patterns] of Object.entries(REFINED_PATTERNS)) {
      for (const pattern of patterns) {
        if (funcName.toLowerCase().includes(pattern.toLowerCase())) {
          category = cat;
          break;
        }
      }
      if (category !== 'General_Utilities') break;
    }

    functions.push({
      name: funcName,
      code: fullFunction,
      category
    });
  }

  // Group by refined category
  const grouped = {};
  functions.forEach(func => {
    if (!grouped[func.category]) {
      grouped[func.category] = [];
    }
    grouped[func.category].push(func);
  });

  console.log('\nRefined Categories:');
  Object.entries(grouped).forEach(([cat, funcs]) => {
    console.log(`  ${cat}: ${funcs.length} functions`);
  });

  console.log('\nStep 3: Generating refined module files...');

  const refinedDir = path.join(__dirname, '../isolated-tools/refined');
  if (!fs.existsSync(refinedDir)) {
    fs.mkdirSync(refinedDir, { recursive: true });
  }

  const generatedFiles = [];

  for (const [category, funcs] of Object.entries(grouped)) {
    const fileName = `${category}.gs`;
    const filePath = path.join(refinedDir, fileName);

    const lines = [];
    lines.push('/**');
    lines.push(` * ${category.replace(/_/g, ' ')} Module`);
    lines.push(' *');
    lines.push(` * Isolated single-purpose module containing ${funcs.length} functions`);
    lines.push(` * Generated: ${new Date().toISOString()}`);
    lines.push(' * Source: Utilities.gs (refined from monolithic code)');
    lines.push(' */');
    lines.push('');

    funcs.forEach((func, idx) => {
      if (idx > 0) lines.push('');
      lines.push(func.code);
    });

    fs.writeFileSync(filePath, lines.join('\n'));
    generatedFiles.push({ category, fileName, functionCount: funcs.length });
    console.log(`  ✓ Created: ${fileName} (${funcs.length} functions, ${(lines.join('\n').length / 1024).toFixed(1)} KB)`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 REFINED DECOMPOSITION COMPLETE');
  console.log('='.repeat(60));
  console.log(`Original Utilities.gs: 67 functions`);
  console.log(`Refined Modules Created: ${Object.keys(grouped).length}`);
  console.log(`HTML Files Extracted: ${htmlMatches ? htmlMatches.length : 0}`);
  console.log(`Output Directory: ${refinedDir}`);
  console.log('='.repeat(60) + '\n');

  // Generate refined manifest
  const manifest = {
    timestamp: new Date().toISOString(),
    source: 'Utilities.gs',
    originalFunctionCount: 67,
    refinedModules: generatedFiles.length,
    htmlFilesExtracted: htmlMatches ? htmlMatches.length : 0,
    modules: generatedFiles
  };

  const manifestPath = path.join(refinedDir, 'REFINED_MANIFEST.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  return { generatedFiles, manifest };
}

refineUtilities().catch(console.error);
