#!/usr/bin/env node

/**
 * Analyzes scripts to identify monolithic files containing multiple intermixed tools
 *
 * Determines which files should be decomposed into isolated, single-purpose modules
 */

const fs = require('fs');
const path = require('path');

function analyzeScriptComplexity(filePath, fileName) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const stats = fs.statSync(filePath);

    // Count functions
    const functionMatches = content.match(/(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s+)?function|\w+\s*:\s*(?:async\s+)?function)/g);
    const functionCount = functionMatches ? functionMatches.length : 0;

    // Extract function names
    const functions = [];
    const funcRegex = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?function|(\w+)\s*:\s*(?:async\s+)?function)/g;
    let match;
    while ((match = funcRegex.exec(content)) !== null) {
      const funcName = match[1] || match[2] || match[3];
      if (funcName) functions.push(funcName);
    }

    // Calculate complexity metrics
    const sizeKB = (stats.size / 1024).toFixed(1);
    const lines = content.split('\n').length;
    const avgFunctionSize = functionCount > 0 ? Math.round(lines / functionCount) : 0;

    // Identify tool categories within file
    const categories = new Set();
    if (content.includes('batchProcess') || content.includes('processOneInputRow')) categories.add('Batch Processing');
    if (content.includes('qualityScore') || content.includes('calculateQuality')) categories.add('Quality Scoring');
    if (content.includes('generateTitle') || content.includes('ATSR')) categories.add('Title Generation');
    if (content.includes('validateVitals') || content.includes('validation')) categories.add('Input Validation');
    if (content.includes('clinical') || content.includes('defaults')) categories.add('Clinical Defaults');
    if (content.includes('duplicate') || content.includes('contentHash')) categories.add('Duplicate Detection');
    if (content.includes('category') || content.includes('pathway')) categories.add('Categories/Pathways');
    if (content.includes('backup') || content.includes('restore')) categories.add('Backup/Restore');
    if (content.includes('deploy') || content.includes('upload')) categories.add('Deployment');
    if (content.includes('test') || content.includes('verify')) categories.add('Testing');
    if (content.includes('analyze') || content.includes('compare')) categories.add('Analysis');
    if (content.includes('menu') || content.includes('onOpen')) categories.add('UI/Menu');
    if (content.includes('PropertiesService') || content.includes('getProperty')) categories.add('Configuration');

    // Determine if monolithic
    const isMonolithic = functionCount > 15 || categories.size > 3 || stats.size > 50000;

    return {
      fileName,
      sizeKB: parseFloat(sizeKB),
      sizeBytes: stats.size,
      lines,
      functionCount,
      avgFunctionSize,
      categories: Array.from(categories),
      categoryCount: categories.size,
      isMonolithic,
      functions: functions.slice(0, 10), // First 10 functions
      totalFunctions: functions.length
    };
  } catch (error) {
    return null;
  }
}

console.log('\n🔍 ANALYZING SCRIPTS FOR MONOLITHIC STRUCTURE\n');
console.log('Identifying files that contain multiple intermixed tools...\n');

const scriptsDir = path.join(__dirname);
const files = fs.readdirSync(scriptsDir)
  .filter(f => f.endsWith('.gs') || f.endsWith('.cjs') || f.endsWith('.js'))
  .filter(f => !f.includes('node_modules'));

const results = [];

for (const fileName of files) {
  const filePath = path.join(scriptsDir, fileName);
  const analysis = analyzeScriptComplexity(filePath, fileName);
  if (analysis) {
    results.push(analysis);
  }
}

// Sort by size (largest first)
results.sort((a, b) => b.sizeBytes - a.sizeBytes);

// Categorize results
const monolithicFiles = results.filter(r => r.isMonolithic);
const singlePurposeFiles = results.filter(r => !r.isMonolithic);

console.log('='.repeat(80));
console.log('🔴 MONOLITHIC FILES (Need Decomposition)');
console.log('='.repeat(80));
console.log(`Found ${monolithicFiles.length} monolithic files containing multiple intermixed tools:\n`);

monolithicFiles.forEach((file, idx) => {
  console.log(`${idx + 1}. ${file.fileName}`);
  console.log(`   Size: ${file.sizeKB} KB | Lines: ${file.lines} | Functions: ${file.functionCount}`);
  console.log(`   Categories: ${file.categories.join(', ')}`);
  console.log(`   Avg Function Size: ${file.avgFunctionSize} lines`);
  if (file.totalFunctions > 10) {
    console.log(`   Functions: ${file.functions.join(', ')}... (+${file.totalFunctions - 10} more)`);
  } else {
    console.log(`   Functions: ${file.functions.join(', ')}`);
  }
  console.log('');
});

console.log('='.repeat(80));
console.log('✅ SINGLE-PURPOSE FILES (Already Isolated)');
console.log('='.repeat(80));
console.log(`Found ${singlePurposeFiles.length} files that are already single-purpose:\n`);

singlePurposeFiles.slice(0, 20).forEach((file, idx) => {
  console.log(`${idx + 1}. ${file.fileName} (${file.sizeKB} KB, ${file.functionCount} functions)`);
});

if (singlePurposeFiles.length > 20) {
  console.log(`   ... and ${singlePurposeFiles.length - 20} more single-purpose files\n`);
}

// Generate decomposition plan
console.log('\n' + '='.repeat(80));
console.log('📋 DECOMPOSITION RECOMMENDATIONS');
console.log('='.repeat(80));

const decompositionPlan = [];

monolithicFiles.forEach(file => {
  const plan = {
    fileName: file.fileName,
    sizeKB: file.sizeKB,
    functionCount: file.functionCount,
    categories: file.categories,
    recommendedSplit: []
  };

  // Generate split recommendations based on categories
  file.categories.forEach(category => {
    plan.recommendedSplit.push({
      category,
      targetFileName: `${category.replace(/[\/\s]/g, '')}_extracted.gs`
    });
  });

  decompositionPlan.push(plan);
});

decompositionPlan.forEach((plan, idx) => {
  console.log(`\n${idx + 1}. ${plan.fileName} (${plan.sizeKB} KB)`);
  console.log(`   Contains: ${plan.categories.join(', ')}`);
  console.log(`   Recommended Split:`);
  plan.recommendedSplit.forEach(split => {
    console.log(`      → ${split.targetFileName} (${split.category})`);
  });
});

// Summary statistics
console.log('\n' + '='.repeat(80));
console.log('📊 SUMMARY');
console.log('='.repeat(80));
console.log(`Total Scripts Analyzed: ${results.length}`);
console.log(`🔴 Monolithic Files (Need Decomposition): ${monolithicFiles.length}`);
console.log(`✅ Single-Purpose Files (Already Isolated): ${singlePurposeFiles.length}`);
console.log(`\nTotal Functions Across All Scripts: ${results.reduce((sum, r) => sum + r.functionCount, 0)}`);
console.log(`Average Functions per Monolithic File: ${Math.round(monolithicFiles.reduce((sum, r) => sum + r.functionCount, 0) / monolithicFiles.length)}`);
console.log(`Average Functions per Single-Purpose File: ${Math.round(singlePurposeFiles.reduce((sum, r) => sum + r.functionCount, 0) / singlePurposeFiles.length)}`);

// Save detailed report
const reportPath = path.join(__dirname, '../docs/MONOLITHIC_SCRIPTS_ANALYSIS.json');
fs.writeFileSync(reportPath, JSON.stringify({
  timestamp: new Date().toISOString(),
  totalScripts: results.length,
  monolithicCount: monolithicFiles.length,
  singlePurposeCount: singlePurposeFiles.length,
  monolithicFiles: monolithicFiles.map(f => ({
    fileName: f.fileName,
    sizeKB: f.sizeKB,
    functionCount: f.functionCount,
    categories: f.categories,
    functions: f.functions
  })),
  singlePurposeFiles: singlePurposeFiles.map(f => ({
    fileName: f.fileName,
    sizeKB: f.sizeKB,
    functionCount: f.functionCount
  })),
  decompositionPlan
}, null, 2));

console.log(`\n✅ Detailed analysis saved to: ${reportPath}\n`);
