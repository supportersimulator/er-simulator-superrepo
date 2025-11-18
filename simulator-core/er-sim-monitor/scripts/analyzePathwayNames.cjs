#!/usr/bin/env node

const fs = require('fs');
const pathways = JSON.parse(fs.readFileSync('AI_ENHANCED_PATHWAY_METADATA.json', 'utf8'));

console.log('');
console.log('═══════════════════════════════════════════════════');
console.log('  📊 PATHWAY NAME ANALYSIS');
console.log('═══════════════════════════════════════════════════');
console.log('');

const needsRefinement = [];
const goodNames = [];

Object.entries(pathways).forEach(([name, data]) => {
  const hasBulletproof = name.toLowerCase().includes('bulletproof');
  const hasLawsuit = name.toLowerCase().includes('lawsuit') || name.toLowerCase().includes('zero-lawsuit');
  const hasMastery = name.toLowerCase().includes('mastery');
  const isFoundational = data.foundationalCases > (data.scenarioCount * 0.5); // More than 50% foundational

  if (hasBulletproof || hasLawsuit) {
    needsRefinement.push({
      name,
      cases: data.scenarioCount,
      foundational: data.foundationalCases,
      issue: hasBulletproof ? '⚠️  Contains "Bulletproof"' : '⚠️  Contains "Lawsuit" language',
      tier: data.tier
    });
  } else if (hasMastery && !isFoundational) {
    needsRefinement.push({
      name,
      cases: data.scenarioCount,
      foundational: data.foundationalCases,
      issue: '⚠️  Uses "Mastery" but not foundational-focused',
      tier: data.tier
    });
  } else {
    goodNames.push({
      name,
      cases: data.scenarioCount,
      foundational: data.foundationalCases
    });
  }
});

console.log('✅ GOOD PATHWAY NAMES (' + goodNames.length + '):');
console.log('');
goodNames.forEach(p => {
  console.log('  • ' + p.name + ' (' + p.cases + ' cases, ' + p.foundational + ' foundational)');
});

console.log('');
console.log('');
console.log('⚠️  PATHWAY NAMES NEEDING REFINEMENT (' + needsRefinement.length + '):');
console.log('');

needsRefinement.forEach((p, idx) => {
  console.log((idx + 1) + '. ' + p.name);
  console.log('   ' + p.issue);
  console.log('   Cases: ' + p.cases + ' | Foundational: ' + p.foundational + ' | Tier: ' + p.tier);
  console.log('');
});

console.log('═══════════════════════════════════════════════════');
console.log('SUMMARY');
console.log('═══════════════════════════════════════════════════');
console.log('');
console.log('Total Pathways: ' + Object.keys(pathways).length);
console.log('✅ Good Names: ' + goodNames.length);
console.log('⚠️  Need Refinement: ' + needsRefinement.length);
console.log('');
console.log('💡 Next Step:');
console.log('   Run: node scripts/categoriesAndPathwaysTool.cjs');
console.log('   Use Option 4 to generate alternative names for pathways needing refinement');
console.log('');
