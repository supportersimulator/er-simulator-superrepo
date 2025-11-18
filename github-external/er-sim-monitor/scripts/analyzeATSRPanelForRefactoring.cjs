#!/usr/bin/env node

/**
 * ANALYZE ATSR PANEL FOR MENU EXTRACTION
 * Maps out what needs to be extracted vs. kept for microservices refactoring
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const ATSR_PANEL_ID = '1KBkujOTXGDmmhWOFm-ifxoMjXM5pRwwM5FpFBtPWK8eoE99fr4lla1OE'; // Project #5
const TEST_INTEGRATION_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf'; // Project #2

console.log('\n🔍 ANALYZING ATSR PANEL FOR MENU EXTRACTION\n');
console.log('═══════════════════════════════════════════════════════════════\n');

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

function extractFunction(source, functionName) {
  // Match function with nested braces
  const regex = new RegExp(`function ${functionName}\\s*\\([^)]*\\)\\s*\\{`, 'g');
  const match = regex.exec(source);

  if (!match) return null;

  const startIndex = match.index;
  let braceCount = 0;
  let endIndex = startIndex;
  let foundStart = false;

  for (let i = startIndex; i < source.length; i++) {
    if (source[i] === '{') {
      braceCount++;
      foundStart = true;
    } else if (source[i] === '}') {
      braceCount--;
      if (foundStart && braceCount === 0) {
        endIndex = i + 1;
        break;
      }
    }
  }

  return source.substring(startIndex, endIndex);
}

function findFunctionCalls(source, functionName) {
  const fnBody = extractFunction(source, functionName);
  if (!fnBody) return [];

  // Find all function calls in the body
  const callRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
  const calls = new Set();
  let match;

  while ((match = callRegex.exec(fnBody)) !== null) {
    const fnName = match[1];
    // Exclude built-in functions and common JS methods
    if (!['if', 'for', 'while', 'return', 'var', 'const', 'let', 'function', 'console', 'JSON', 'Array', 'Object', 'String', 'Number'].includes(fnName)) {
      calls.add(fnName);
    }
  }

  return Array.from(calls);
}

async function analyze() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    // Read ATSR Panel (Project #5)
    console.log('📥 Reading ATSR Panel (Project #5)...\n');
    const atsrProject = await script.projects.getContent({ scriptId: ATSR_PANEL_ID });

    console.log('📋 Files in ATSR Panel:\n');
    atsrProject.data.files.forEach((file, index) => {
      if (file.type === 'SERVER_JS') {
        const sizeKB = Math.round(file.source.length / 1024);
        console.log(`${index + 1}. ${file.name}.gs (${sizeKB} KB)`);
      }
    });

    console.log('\n═══════════════════════════════════════════════════════════════\n');
    console.log('🔍 ANALYZING MENU CODE:\n');

    // Find file with onOpen
    const atsrFile = atsrProject.data.files.find(f =>
      f.type === 'SERVER_JS' && f.name === 'ATSR_Title_Generator_Feature'
    );

    if (!atsrFile) {
      console.log('❌ ATSR_Title_Generator_Feature.gs not found!\n');
      return;
    }

    const atsrSource = atsrFile.source;

    // Extract onOpen function
    const onOpenFn = extractFunction(atsrSource, 'onOpen');

    if (!onOpenFn) {
      console.log('❌ onOpen() function not found in ATSR file!\n');
      return;
    }

    console.log('✅ Found onOpen() function:\n');
    console.log('```javascript');
    console.log(onOpenFn.substring(0, 800)); // Show first 800 chars
    if (onOpenFn.length > 800) {
      console.log('... (truncated)');
    }
    console.log('```\n');

    // Find menu items
    const menuItems = [];
    const itemRegex = /\.addItem\('([^']+)',\s*'([^']+)'\)/g;
    let match;

    while ((match = itemRegex.exec(onOpenFn)) !== null) {
      menuItems.push({
        label: match[1],
        functionName: match[2]
      });
    }

    console.log('📋 Menu items found:\n');
    menuItems.forEach((item, index) => {
      console.log(`${index + 1}. "${item.label}" → ${item.functionName}()`);
    });

    console.log('\n═══════════════════════════════════════════════════════════════\n');
    console.log('🔗 FUNCTION DEPENDENCY ANALYSIS:\n');

    // Analyze each menu function
    const functionAnalysis = {};

    menuItems.forEach(item => {
      const fnName = item.functionName;
      const fnExists = atsrSource.includes(`function ${fnName}`);
      const fnCalls = fnExists ? findFunctionCalls(atsrSource, fnName) : [];

      functionAnalysis[fnName] = {
        label: item.label,
        existsInATSR: fnExists,
        calls: fnCalls,
        size: fnExists ? extractFunction(atsrSource, fnName)?.length || 0 : 0
      };
    });

    // Categorize functions by their proper location
    const atsrFunctions = [];
    const pathwayFunctions = [];
    const batchFunctions = [];
    const sharedFunctions = [];

    Object.keys(functionAnalysis).forEach(fnName => {
      const analysis = functionAnalysis[fnName];

      console.log(`• ${fnName}()`);
      console.log(`  Label: "${analysis.label}"`);
      console.log(`  Exists in ATSR: ${analysis.existsInATSR ? '✅' : '❌'}`);
      console.log(`  Size: ${Math.round(analysis.size / 1024)} KB`);

      if (analysis.calls.length > 0) {
        console.log(`  Calls: ${analysis.calls.slice(0, 5).join(', ')}${analysis.calls.length > 5 ? '...' : ''}`);
      }

      // Categorize
      let category = '';
      if (fnName.includes('ATSR') || fnName === 'generateATSRTitle' || fnName === 'buildPathwayChain') {
        category = '→ ATSR Panel (keep here)';
        atsrFunctions.push(fnName);
      } else if (fnName.includes('Pathway') || fnName === 'runPathwayChainBuilder') {
        category = '→ Pathways Panel (Project #4)';
        pathwayFunctions.push(fnName);
      } else if (fnName.includes('Cache') || fnName === 'preCacheRichData') {
        category = '→ Pathways Panel (Project #4) - Cache system';
        pathwayFunctions.push(fnName);
      } else if (fnName.includes('Field') || fnName === 'showFieldSelector' || fnName === 'getRecommendedFields_') {
        category = '→ Pathways Panel (Project #4) - Field selector';
        pathwayFunctions.push(fnName);
      } else if (fnName.includes('Batch') || fnName.includes('Process')) {
        category = '→ Batch Panel (Project #6)';
        batchFunctions.push(fnName);
      } else {
        category = '→ Central Orchestration (shared utility)';
        sharedFunctions.push(fnName);
      }

      console.log(`  ${category}`);
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📊 REFACTORING STRATEGY:\n');

    console.log('🎯 CENTRAL ORCHESTRATION (Project #2) - Should contain:\n');
    console.log('   ✅ onOpen() function (creates TEST Tools menu)');
    console.log('   ✅ Shared utilities: readApiKey_(), getAvailableFields()');
    console.log('   ✅ Menu item launchers that call functions in other panels\n');

    console.log('🎯 ATSR PANEL (Project #5) - Keep only:\n');
    if (atsrFunctions.length > 0) {
      atsrFunctions.forEach(fn => console.log(`   ✅ ${fn}()`));
    } else {
      console.log('   ⚠️  No pure ATSR functions identified - need deeper analysis');
    }
    console.log('');

    console.log('🎯 PATHWAYS PANEL (Project #4) - Should have:\n');
    if (pathwayFunctions.length > 0) {
      pathwayFunctions.forEach(fn => console.log(`   ✅ ${fn}()`));
    } else {
      console.log('   ℹ️  Already properly isolated');
    }
    console.log('');

    console.log('🎯 BATCH PANEL (Project #6) - Should have:\n');
    if (batchFunctions.length > 0) {
      batchFunctions.forEach(fn => console.log(`   ✅ ${fn}()`));
    } else {
      console.log('   ℹ️  Need to analyze Core_Processing_Engine.gs');
    }
    console.log('');

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('⚠️  KEY FINDING:\n');
    console.log('The onOpen() menu in ATSR calls functions that belong in OTHER panels!\n');
    console.log('This means:\n');
    console.log('   1. Menu must move to Central Orchestration\n');
    console.log('   2. Each panel keeps only its own functions\n');
    console.log('   3. Menu items become launchers that open the correct panel\n');
    console.log('');

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📋 NEXT STEPS:\n');
    console.log('1. Read TEST Integration project (Project #2) to see current structure\n');
    console.log('2. Design CentralOrchestration.gs with proper menu\n');
    console.log('3. Create deployment script for safe menu extraction\n');
    console.log('4. Test that menu works from central location\n');
    console.log('');

    // Save detailed analysis
    const reportPath = path.join(__dirname, '../docs/ATSR_PANEL_ANALYSIS_REPORT.md');
    const report = `# ATSR PANEL MENU EXTRACTION ANALYSIS

Generated: ${new Date().toLocaleString()}

## Current State

### ATSR Panel (Project #5) Contents:
${atsrProject.data.files.filter(f => f.type === 'SERVER_JS').map(f => {
  const sizeKB = Math.round(f.source.length / 1024);
  return `- ${f.name}.gs (${sizeKB} KB)`;
}).join('\n')}

## Menu Code Analysis

### onOpen() Function:
\`\`\`javascript
${onOpenFn}
\`\`\`

### Menu Items:
${menuItems.map((item, i) => `${i + 1}. "${item.label}" → ${item.functionName}()`).join('\n')}

## Function Categorization

### Functions that should stay in ATSR Panel:
${atsrFunctions.length > 0 ? atsrFunctions.map(fn => `- ${fn}()`).join('\n') : '⚠️ None clearly identified - deeper analysis needed'}

### Functions that belong in Pathways Panel (Project #4):
${pathwayFunctions.length > 0 ? pathwayFunctions.map(fn => `- ${fn}()`).join('\n') : '✅ Already properly isolated'}

### Functions that belong in Batch Panel (Project #6):
${batchFunctions.length > 0 ? batchFunctions.map(fn => `- ${fn}()`).join('\n') : 'ℹ️ Need to analyze separately'}

### Shared utilities for Central Orchestration:
${sharedFunctions.length > 0 ? sharedFunctions.map(fn => `- ${fn}()`).join('\n') : 'None identified yet'}

## Refactoring Strategy

### Phase 1: Extract Menu to Central Orchestration
- Move onOpen() from ATSR_Title_Generator_Feature.gs to CentralOrchestration.gs
- Keep menu items but change them to launcher functions
- Add to Project #2 (TEST Menu Script)

### Phase 2: Create Tool Launchers
Each menu item becomes a launcher that:
1. Opens the appropriate panel (HTML sidebar or dialog)
2. Calls the function in that panel's isolated script
3. Handles cross-panel communication if needed

### Phase 3: Isolate ATSR Functions
Remove all non-ATSR code from Project #5:
- Remove pathway/cache functions (move to Project #4)
- Remove batch processing (move to Project #6)
- Keep only: generateATSRTitle, buildPathwayChain, formatATSROutput

## Implementation Plan

### Step 1: Backup Everything
✅ Already done - backups in Google Drive and local

### Step 2: Read Current TEST Project Structure
- Analyze what's currently in Project #2
- Determine best place for CentralOrchestration.gs

### Step 3: Design Central Menu
- Create onOpen() that works from Project #2
- Design launcher functions for each tool panel
- Plan shared utility functions

### Step 4: Test Menu Extraction
- Deploy CentralOrchestration.gs to Project #2
- Verify menu appears
- Test that launchers work

### Step 5: Clean ATSR Panel
- Remove menu code from ATSR
- Keep only ATSR-specific functions
- Test ATSR panel works independently

## Risk Mitigation

**Risk**: Menu doesn't appear after extraction
**Mitigation**: Keep Project #2 as integration test with all code together

**Risk**: Cross-panel function calls break
**Mitigation**: Use proper launcher pattern with HTML service for communication

**Risk**: Breaking existing functionality
**Mitigation**: Test each step incrementally, maintain backups
`;

    fs.writeFileSync(reportPath, report, 'utf8');
    console.log(`📄 Detailed report saved: ${reportPath}\n`);

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

analyze();
