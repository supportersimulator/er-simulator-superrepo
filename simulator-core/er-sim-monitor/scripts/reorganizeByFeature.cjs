#!/usr/bin/env node

/**
 * Reorganize Isolated Tools by Feature Boundary
 *
 * Strategy: Group code by UI/user workflow feature rather than technical concern
 *
 * Principle: "Everything a user needs to work with one feature should be together"
 *
 * Example: Batch Sidebar = HTML + button handlers + backend functions + logging
 */

const fs = require('fs');
const path = require('path');

console.log('\n🎯 REORGANIZING BY FEATURE BOUNDARY\n');
console.log('Principle: Keep UI features and their supporting code together\n');

// Read the original monolithic file to identify HTML sections and their related functions
const monolithicPath = path.join(__dirname, 'Code_ULTIMATE_ATSR.gs');
const code = fs.readFileSync(monolithicPath, 'utf8');

// Identify HTML sections (these define feature boundaries)
const htmlSections = [];

// Pattern 1: HtmlService.createHtmlOutput with template literals
const htmlOutputPattern = /function\s+(\w+)\s*\([^)]*\)\s*\{[\s\S]*?return\s+HtmlService\.createHtmlOutput\(`([\s\S]*?)`\)/g;
let match;

while ((match = htmlOutputPattern.exec(code)) !== null) {
  const functionName = match[1];
  const htmlContent = match[2];

  // Extract JavaScript function names from the HTML (onclick handlers, etc.)
  const jsHandlers = [];
  const handlerPattern = /(?:onclick|onchange|onsubmit)=["'](\w+)\([^)]*\)/g;
  let handlerMatch;

  while ((handlerMatch = handlerPattern.exec(htmlContent)) !== null) {
    jsHandlers.push(handlerMatch[1]);
  }

  // Also look for google.script.run calls
  const scriptRunPattern = /google\.script\.run\.(\w+)/g;
  let scriptMatch;

  while ((scriptMatch = scriptRunPattern.exec(htmlContent)) !== null) {
    jsHandlers.push(scriptMatch[1]);
  }

  htmlSections.push({
    entryFunction: functionName,
    htmlContent,
    handlers: [...new Set(jsHandlers)], // unique handlers
    size: htmlContent.length
  });
}

console.log('📋 Feature Boundaries Identified:\n');

htmlSections.forEach((section, idx) => {
  console.log(`${idx + 1}. ${section.entryFunction}()`);
  console.log(`   HTML Size: ${(section.size / 1024).toFixed(1)} KB`);
  console.log(`   UI Handlers: ${section.handlers.length}`);
  if (section.handlers.length > 0) {
    console.log(`   Functions: ${section.handlers.join(', ')}`);
  }
  console.log('');
});

// Proposed feature-based organization
const FEATURE_MODULES = {
  'Batch_Sidebar_Feature': {
    description: 'Complete batch processing sidebar UI and logic',
    entryFunctions: ['openSimSidebar'],
    relatedFunctions: [
      // UI handlers (from HTML)
      'start', 'stop', 'refreshLogs', 'clearLogs', 'copyLogs',
      'persistBasics', 'loopStep', 'saveSidebarBasics',
      // Backend support
      'openSimSidebar', 'appendLog', 'setStatus',
      // Logging for this UI
      'logLong'
    ],
    includeHTML: true
  },

  'Settings_Panel_Feature': {
    description: 'Settings and configuration UI',
    entryFunctions: ['openSettingsPanel'],
    relatedFunctions: [
      'openSettingsPanel',
      'checkApiStatus',
      'syncApiKeyFromSettingsSheet_',
      'readApiKey_'
    ],
    includeHTML: true
  },

  'Image_Sync_Feature': {
    description: 'Media URL synchronization UI',
    entryFunctions: ['openImageSyncDefaults'],
    relatedFunctions: [
      'openImageSyncDefaults',
      'imgSync'
    ],
    includeHTML: true
  },

  'Core_Batch_Engine': {
    description: 'Pure batch processing logic (no UI)',
    entryFunctions: ['processOneInputRow_'],
    relatedFunctions: [
      'processOneInputRow_',
      'validateVitalsFields_',
      'applyClinicalDefaults_',
      'tryParseJSON'
    ],
    includeHTML: false
  },

  'Title_Generation_Engine': {
    description: 'AI title generation logic (no UI)',
    entryFunctions: ['runATSRTitleGenerator'],
    relatedFunctions: [
      'runATSRTitleGenerator',
      // ... other title generation functions
    ],
    includeHTML: false
  },

  'Quality_Scoring_Engine': {
    description: 'Quality evaluation logic (no UI)',
    entryFunctions: ['evaluateSimulationQuality'],
    relatedFunctions: [
      'evaluateSimulationQuality'
    ],
    includeHTML: false
  },

  'Sheet_Infrastructure': {
    description: 'Shared infrastructure (headers, caching, utilities)',
    relatedFunctions: [
      'readTwoTierHeaders_',
      'mergedKeysFromTwoTiers_',
      'cacheHeaders',
      'getCachedHeadersOrRead',
      'clearHeaderCache',
      'ensureBatchReportsSheet_',
      'extractValueFromParsed_'
    ],
    includeHTML: false
  }
};

console.log('=' .repeat(70));
console.log('📊 PROPOSED FEATURE-BASED ORGANIZATION');
console.log('='.repeat(70));

Object.entries(FEATURE_MODULES).forEach(([moduleName, config]) => {
  console.log(`\n${moduleName}`);
  console.log(`  Description: ${config.description}`);
  console.log(`  Entry Points: ${config.entryFunctions.join(', ')}`);
  console.log(`  Includes HTML: ${config.includeHTML ? 'Yes' : 'No'}`);
  console.log(`  Related Functions: ${config.relatedFunctions.length}`);
});

console.log('\n' + '='.repeat(70));
console.log('💡 KEY INSIGHT');
console.log('='.repeat(70));
console.log(`
Feature-based modules keep everything a developer needs to work on
one UI feature together:

✅ Batch Sidebar Module contains:
   - HTML template for the sidebar
   - All button click handlers (start, stop, refresh)
   - Backend functions those buttons call
   - Logging functions that UI uses

✅ Settings Panel Module contains:
   - HTML template for settings
   - Settings form handlers
   - API key management
   - Configuration persistence

This is BETTER than technical separation because:
- Developer working on sidebar UI has everything in one file
- No hunting across files for "where's the stop button handler?"
- Feature can be tested as complete unit
- Easier to understand what code belongs to what UI

Technical "engine" modules (batch processing, title generation) stay
separate because they're reusable logic without UI coupling.
`);

console.log('\n📋 Next Step: Should I generate these feature-based modules?');
console.log('   This will replace the current technical decomposition.\n');
