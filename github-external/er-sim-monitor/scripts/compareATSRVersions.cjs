#!/usr/bin/env node

/**
 * COMPARE ALL ATSR VERSIONS
 * Analyzes and compares different ATSR implementations to find the best one
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 ANALYZING ALL ATSR VERSIONS\n');
console.log('═══════════════════════════════════════════════════════════════\n');

const atsrVersions = [
  {
    name: 'Test1 (Current in Production)',
    path: path.join(__dirname, '../backups/all-projects-2025-11-06/test1-1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf/ATSR_Title_Generator_Feature.gs')
  },
  {
    name: 'Lost & Found - Standalone ATSR',
    path: path.join(__dirname, '../backups/lost-and-found-20251105-203821/ATSR_Title_Generator_Feature.gs')
  },
  {
    name: 'Lost & Found - Code ULTIMATE (from Drive)',
    path: path.join(__dirname, '../backups/lost-and-found-20251105-203821/Code_ULTIMATE_ATSR_FROM_DRIVE.gs')
  },
  {
    name: 'Lost & Found - Code (from backup)',
    path: path.join(__dirname, '../backups/lost-and-found-20251105-203821/Code_from_apps-script-backup.gs')
  }
];

const features = {
  'Memory Anchors system': /Memory_Anchors|Memory Anchors/,
  'Mystery regeneration button': /regenerateMoreMysterious|Make More Mysterious/,
  'Sim Mastery philosophy': /Sim Mastery ATSR|Sim Mastery Values/,
  'Enhanced prompt with quality criteria': /Quality Criteria|Quality Checklist/,
  'Spark Titles (Pre-Sim Mystery)': /Spark Titles.*Pre-Sim Mystery/,
  'Reveal Titles (Post-Sim)': /Reveal Titles.*Post-Sim/,
  'Defining Characteristics': /Defining_Characteristic_Options/,
  'Patient Summary clinical handoff style': /Patient_Summary.*CLINICAL HANDOFF STYLE/,
  'saveATSRData function': /function saveATSRData/,
  'generateMysteriousSparkTitles function': /function generateMysteriousSparkTitles/,
  'buildATSRUltimateUI_ function': /function buildATSRUltimateUI_/
};

console.log('📊 FEATURE COMPARISON:\n');

const results = [];

atsrVersions.forEach(version => {
  if (!fs.existsSync(version.path)) {
    console.log(`⚠️  ${version.name}: FILE NOT FOUND\n`);
    return;
  }

  const code = fs.readFileSync(version.path, 'utf8');
  const size = (code.length / 1024).toFixed(1);

  console.log(`\n📄 ${version.name}`);
  console.log(`   Size: ${size} KB`);
  console.log(`   Features:`);

  const foundFeatures = {};
  Object.keys(features).forEach(featureName => {
    const regex = features[featureName];
    const found = regex.test(code);
    foundFeatures[featureName] = found;
    console.log(`   ${found ? '✅' : '❌'} ${featureName}`);
  });

  results.push({
    name: version.name,
    path: version.path,
    size: parseFloat(size),
    features: foundFeatures,
    featureCount: Object.values(foundFeatures).filter(f => f).length
  });
});

console.log('\n═══════════════════════════════════════════════════════════════\n');
console.log('📊 SUMMARY:\n');

// Sort by feature count
results.sort((a, b) => b.featureCount - a.featureCount);

results.forEach((result, index) => {
  console.log(`${index + 1}. ${result.name}`);
  console.log(`   Size: ${result.size} KB`);
  console.log(`   Features: ${result.featureCount}/${Object.keys(features).length}`);
  console.log('');
});

console.log('═══════════════════════════════════════════════════════════════\n');

const best = results[0];
console.log(`🏆 BEST VERSION: ${best.name}\n`);
console.log(`   This version has the most complete feature set with ${best.featureCount}/${Object.keys(features).length} features.\n`);

if (best.name !== 'Test1 (Current in Production)') {
  console.log('⚠️  WARNING: The best version is NOT the one currently in production!\n');
  console.log(`   Current production uses: Test1 (Current in Production)`);
  console.log(`   Best version is: ${best.name}\n`);
  console.log(`   File path: ${best.path}\n`);
  console.log('   RECOMMENDATION: Replace production ATSR with the best version.\n');
} else {
  console.log('✅ The best version is already in production!\n');
}

console.log('═══════════════════════════════════════════════════════════════\n');

// Save detailed comparison
const reportPath = path.join(__dirname, '../backups/ATSR_VERSION_COMPARISON.md');
let report = '# ATSR Version Comparison Report\n\n';
report += `Generated: ${new Date().toLocaleString()}\n\n`;
report += '## Summary\n\n';
report += `**Best Version**: ${best.name} (${best.featureCount}/${Object.keys(features).length} features)\n\n`;
report += '## Detailed Comparison\n\n';

results.forEach((result, index) => {
  report += `### ${index + 1}. ${result.name}\n\n`;
  report += `- **Size**: ${result.size} KB\n`;
  report += `- **Features**: ${result.featureCount}/${Object.keys(features).length}\n`;
  report += `- **Path**: \`${result.path}\`\n\n`;
  report += '**Feature Breakdown**:\n\n';

  Object.keys(result.features).forEach(featureName => {
    report += `- ${result.features[featureName] ? '✅' : '❌'} ${featureName}\n`;
  });

  report += '\n';
});

fs.writeFileSync(reportPath, report, 'utf8');
console.log(`📄 Detailed report saved: ${reportPath}\n`);
