#!/usr/bin/env node

/**
 * TEST FIELD SELECTOR FLOW
 * Check if all required functions exist and trace the flow
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 TESTING FIELD SELECTOR FLOW\n');
console.log('═══════════════════════════════════════════════════════════════\n');

const code = fs.readFileSync('/Users/aarontjomsland/er-sim-monitor/backups/production-before-field-examples-2025-11-06.gs', 'utf8');

console.log('Checking required functions:\n');

const functions = [
  'preCacheRichData',
  'showFieldSelector',
  'refreshHeaders',
  'getAvailableFields',
  'loadFieldSelection',
  'getRecommendedFields_',
  'getStaticRecommendedFields_',
  'getDefaultFieldNames_',
  'saveFieldSelectionAndStartCache'
];

functions.forEach(fn => {
  const regex = new RegExp(`function ${fn}\\s*\\(`);
  const found = regex.test(code);
  console.log(`   ${found ? '✅' : '❌'} ${fn}()`);
});

console.log('\n📋 Flow trace:\n');
console.log('   1. User clicks "💾 Pre-Cache Rich Data" button');
console.log('   2. Calls: google.script.run.preCacheRichData()');
console.log('   3. preCacheRichData() → showFieldSelector()');
console.log('   4. showFieldSelector() → refreshHeaders()');
console.log('   5. refreshHeaders() → reads Row 2, caches headers');
console.log('   6. showFieldSelector() → getAvailableFields()');
console.log('   7. getAvailableFields() → returns field objects');
console.log('   8. showFieldSelector() → loadFieldSelection()');
console.log('   9. loadFieldSelection() → returns saved/default fields');
console.log('   10. showFieldSelector() → getRecommendedFields_()');
console.log('   11. getRecommendedFields_() → calls ChatGPT API');
console.log('   12. showFieldSelector() → builds HTML modal');
console.log('   13. Shows field selector with 3 sections\n');

// Check if showFieldSelector builds the HTML correctly
const showFieldSelectorMatch = code.match(/function showFieldSelector\(\)[^{]*\{([\s\S]*?)(?=\nfunction )/);
if (showFieldSelectorMatch) {
  const funcBody = showFieldSelectorMatch[1];

  console.log('🔍 Analyzing showFieldSelector():\n');

  const checks = [
    { name: 'Calls refreshHeaders()', pattern: /refreshHeaders\(\)/ },
    { name: 'Calls getAvailableFields()', pattern: /getAvailableFields\(\)/ },
    { name: 'Calls loadFieldSelection()', pattern: /loadFieldSelection\(\)/ },
    { name: 'Calls getRecommendedFields_()', pattern: /getRecommendedFields_\(\)/ },
    { name: 'Creates HTML modal', pattern: /const html =/ },
    { name: 'Shows modal dialog', pattern: /showModalDialog/ },
    { name: 'Has Categories container', pattern: /categories-container/ },
    { name: 'Has field rendering', pattern: /renderCategories/ },
    { name: 'Has section headers', pattern: /Selected Fields|Recommended to Consider|All Other Fields/ }
  ];

  checks.forEach(check => {
    const found = check.pattern.test(funcBody);
    console.log(`   ${found ? '✅' : '❌'} ${check.name}`);
  });
}

console.log('\n═══════════════════════════════════════════════════════════════\n');

// Check if there might be an error that's being caught silently
console.log('🔍 Checking for potential issues:\n');

if (!code.includes('function getAvailableFields')) {
  console.log('   ⚠️  getAvailableFields() is missing!');
  console.log('   This would cause showFieldSelector() to fail.\n');
}

if (!code.includes('function getDefaultFieldNames_')) {
  console.log('   ⚠️  getDefaultFieldNames_() is missing!');
  console.log('   This would cause loadFieldSelection() to fail.\n');
}

if (!code.includes('CACHED_MERGED_KEYS')) {
  console.log('   ⚠️  CACHED_MERGED_KEYS not referenced in code!');
  console.log('   refreshHeaders() might not be caching correctly.\n');
}

console.log('═══════════════════════════════════════════════════════════════\n');
