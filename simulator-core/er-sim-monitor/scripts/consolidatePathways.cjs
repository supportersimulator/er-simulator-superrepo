#!/usr/bin/env node

/**
 * Pathway Consolidation Helper Tool
 *
 * Helps merge small pathways into larger related ones:
 * - Identifies pathways with < 5 cases
 * - Suggests merge targets based on medical system similarity
 * - Executes merges with automatic metadata updates
 * - Maintains data integrity throughout
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const PATHWAY_METADATA_PATH = path.join(__dirname, '..', 'AI_ENHANCED_PATHWAY_METADATA.json');
const CASE_MAPPING_PATH = path.join(__dirname, '..', 'AI_ENHANCED_CASE_ID_MAPPING.json');

function loadJSON(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return null;
  }
}

function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function findSimilarPathways(sourcePathway, pathways, cases, minSize = 5) {
  const sourceCases = cases.filter(c => c.pathwayName === sourcePathway);
  const sourceSystems = new Set(sourceCases.map(c => c.system));

  const similarities = [];

  Object.keys(pathways).forEach(targetPathway => {
    if (targetPathway === sourcePathway) return;
    if (pathways[targetPathway].scenarioCount < minSize) return; // Only suggest pathways with enough cases

    const targetCases = cases.filter(c => c.pathwayName === targetPathway);
    const targetSystems = new Set(targetCases.map(c => c.system));

    // Calculate system overlap
    const overlapCount = Array.from(sourceSystems).filter(s => targetSystems.has(s)).length;
    const unionCount = new Set([...sourceSystems, ...targetSystems]).size;
    const similarity = overlapCount / unionCount;

    if (similarity > 0) {
      similarities.push({
        name: targetPathway,
        similarity: (similarity * 100).toFixed(0),
        caseCount: pathways[targetPathway].scenarioCount,
        commonSystems: Array.from(sourceSystems).filter(s => targetSystems.has(s))
      });
    }
  });

  return similarities.sort((a, b) => b.similarity - a.similarity);
}

async function mergePathways(sourceName, targetName, cases, pathways) {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  🔗 MERGING: ${sourceName} → ${targetName}`);
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  // Move all cases from source to target
  let movedCount = 0;
  cases.forEach(c => {
    if (c.pathwayName === sourceName) {
      c.pathwayName = targetName;
      movedCount++;
    }
  });

  console.log(`   ✅ Moved ${movedCount} cases`);

  // Update pathway metadata
  pathways[targetName].scenarioCount += movedCount;
  delete pathways[sourceName];

  console.log(`   ✅ Updated pathway metadata`);
  console.log('');

  // Save changes
  fs.writeFileSync(CASE_MAPPING_PATH, JSON.stringify(cases, null, 2));
  fs.writeFileSync(PATHWAY_METADATA_PATH, JSON.stringify(pathways, null, 2));

  console.log('✅ Merge complete!');
  console.log('');
}

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  🔗 PATHWAY CONSOLIDATION TOOL');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const pathways = loadJSON(PATHWAY_METADATA_PATH);
  const cases = loadJSON(CASE_MAPPING_PATH);

  if (!pathways || !cases) {
    console.log('❌ Could not load data files');
    process.exit(1);
  }

  // Find small pathways
  const smallPathways = Object.entries(pathways)
    .filter(([name, data]) => data.scenarioCount < 5)
    .map(([name, data]) => ({
      name,
      count: data.scenarioCount,
      systemFocus: data.systemFocus
    }))
    .sort((a, b) => a.count - b.count);

  if (smallPathways.length === 0) {
    console.log('✅ No small pathways found!');
    console.log('   All pathways have >= 5 cases.');
    console.log('');
    process.exit(0);
  }

  console.log(`Found ${smallPathways.length} pathways with < 5 cases:\\n`);

  smallPathways.forEach((p, idx) => {
    console.log(`${idx + 1}. ${p.name}: ${p.count} case(s) [${p.systemFocus}]`);
  });

  console.log('');
  console.log('💡 These pathways may benefit from consolidation.');
  console.log('');

  const choice = await promptUser(`Select pathway to consolidate (1-${smallPathways.length}) or 0 to exit: `);
  const selectedIndex = parseInt(choice, 10) - 1;

  if (selectedIndex < 0 || selectedIndex >= smallPathways.length) {
    console.log('');
    console.log('✅ Exiting');
    console.log('');
    process.exit(0);
  }

  const sourcePathway = smallPathways[selectedIndex];

  console.log('');
  console.log(`Selected: ${sourcePathway.name} (${sourcePathway.count} cases)`);
  console.log('');
  console.log('Finding similar pathways to merge with...');
  console.log('');

  const suggestions = findSimilarPathways(sourcePathway.name, pathways, cases);

  if (suggestions.length === 0) {
    console.log('⚠️  No similar pathways found.');
    console.log('   You may need to manually choose a target.');
    console.log('');
    process.exit(0);
  }

  console.log('📊 Suggested Merge Targets (by similarity):\\n');

  suggestions.slice(0, 5).forEach((s, idx) => {
    console.log(`${idx + 1}. ${s.name}`);
    console.log(`   Cases: ${s.caseCount} | Similarity: ${s.similarity}% | Common systems: ${s.commonSystems.join(', ')}`);
    console.log('');
  });

  const targetChoice = await promptUser(`Select target pathway (1-${Math.min(5, suggestions.length)}) or 0 to cancel: `);
  const targetIndex = parseInt(targetChoice, 10) - 1;

  if (targetIndex < 0 || targetIndex >= suggestions.length) {
    console.log('');
    console.log('❌ Cancelled');
    console.log('');
    process.exit(0);
  }

  const targetPathway = suggestions[targetIndex].name;

  console.log('');
  console.log(`Merge: ${sourcePathway.name} (${sourcePathway.count}) → ${targetPathway} (${suggestions[targetIndex].caseCount})`);
  console.log('');

  const confirm = await promptUser('Proceed with merge? (y/n): ');

  if (confirm.toLowerCase() !== 'y') {
    console.log('');
    console.log('❌ Cancelled');
    console.log('');
    process.exit(0);
  }

  // Create backup first
  console.log('');
  console.log('Creating backup before merge...');
  const { backupMetadata } = require('./backupMetadata.cjs');
  await backupMetadata();

  // Execute merge
  await mergePathways(sourcePathway.name, targetPathway, cases, pathways);

  console.log('═══════════════════════════════════════════════════');
  console.log('✅ CONSOLIDATION COMPLETE');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('Summary:');
  console.log(`   • Merged: ${sourcePathway.name} → ${targetPathway}`);
  console.log(`   • Cases moved: ${sourcePathway.count}`);
  console.log(`   • New ${targetPathway} size: ${suggestions[targetIndex].caseCount + sourcePathway.count} cases`);
  console.log('');
  console.log('💡 Next Steps:');
  console.log('   • Run: npm run validate-system (verify integrity)');
  console.log('   • Run: npm run dashboard (see updated analytics)');
  console.log('');
}

if (require.main === module) {
  main().catch(err => {
    console.error('❌ Consolidation failed:', err.message);
    process.exit(1);
  });
}

module.exports = { main, findSimilarPathways, mergePathways };
