#!/usr/bin/env node

/**
 * Auto-Flag Foundational Cases
 *
 * Automatically identifies and flags foundational cases based on:
 * - Complexity Score <= 3 (low to moderate complexity)
 * - Priority Score >= 4 (high priority for learning)
 *
 * Logic: Cases that are high priority but low complexity are foundational
 * building blocks that should be mastered before advancing.
 *
 * Updates:
 * - AI_ENHANCED_CASE_ID_MAPPING.json (adds foundational: true/false)
 * - AI_ENHANCED_PATHWAY_METADATA.json (recalculates foundationalCases count)
 */

const fs = require('fs');
const path = require('path');

const CASE_MAPPING_PATH = path.join(__dirname, '..', 'AI_ENHANCED_CASE_ID_MAPPING.json');
const PATHWAY_METADATA_PATH = path.join(__dirname, '..', 'AI_ENHANCED_PATHWAY_METADATA.json');

function isFoundational(complexity, priority) {
  // Foundational = High priority + Low/moderate complexity
  // Priority scale: 1-10 (10 = highest priority)
  // Complexity scale: 1-5 (1 = simplest)
  // Logic: Priority >= 8 AND Complexity <= 3 = Foundational
  return priority >= 8 && complexity <= 3;
}

async function autoFlagFoundational() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  🎓 AUTO-FLAG FOUNDATIONAL CASES');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  try {
    // Step 0: Create automatic backup before modifying data
    console.log('0️⃣ Creating automatic backup...');
    const { backupMetadata } = require('./backupMetadata.cjs');
    await backupMetadata();
    console.log('');

    // Step 1: Load case mapping
    console.log('1️⃣ Loading case mapping data...');
    if (!fs.existsSync(CASE_MAPPING_PATH)) {
      console.error('❌ Case mapping file not found!');
      process.exit(1);
    }

    const cases = JSON.parse(fs.readFileSync(CASE_MAPPING_PATH, 'utf8'));
    console.log(`   ✅ Loaded ${cases.length} cases`);
    console.log('');

    // Step 2: Analyze current state
    console.log('2️⃣ Analyzing current foundational flags...');
    const currentFoundational = cases.filter(c => c.isFoundational === true).length;
    const hasComplexityData = cases.filter(c => c.complexity !== undefined).length;
    const hasPriorityData = cases.filter(c => c.priority !== undefined).length;

    console.log(`   Current isFoundational: ${currentFoundational}/${cases.length}`);
    console.log(`   With complexity data: ${hasComplexityData}/${cases.length}`);
    console.log(`   With priority data: ${hasPriorityData}/${cases.length}`);
    console.log('');

    if (hasComplexityData === 0 || hasPriorityData === 0) {
      console.log('⚠️  WARNING: No complexity/priority data found!');
      console.log('');
      console.log('💡 Recommendation:');
      console.log('   Run AI-Enhanced Discovery first to generate scores:');
      console.log('   npm run ai-enhanced');
      console.log('');
      process.exit(1);
    }

    // Step 3: Apply auto-flagging logic
    console.log('3️⃣ Applying foundational flagging logic...');
    console.log('   Rule: Priority >= 8 AND Complexity <= 3');
    console.log('');

    let foundationalCount = 0;
    let advancedCount = 0;
    let changedCount = 0;
    let unchangedCount = 0;
    let missingDataCount = 0;

    const scoreDistribution = {
      foundational: [],
      advanced: [],
      missingData: []
    };

    cases.forEach(c => {
      const complexity = c.complexity;
      const priority = c.priority;

      if (complexity === undefined || priority === undefined) {
        c.isFoundational = false;
        missingDataCount++;
        scoreDistribution.missingData.push(c.newId || c.oldId);
        return;
      }

      const shouldBeFoundational = isFoundational(complexity, priority);
      const wasFoundational = c.isFoundational === true;

      c.isFoundational = shouldBeFoundational;

      if (shouldBeFoundational) {
        foundationalCount++;
        scoreDistribution.foundational.push({
          caseId: c.newId || c.oldId,
          complexity,
          priority
        });
      } else {
        advancedCount++;
        scoreDistribution.advanced.push({
          caseId: c.newId || c.oldId,
          complexity,
          priority
        });
      }

      if (shouldBeFoundational !== wasFoundational) {
        changedCount++;
      } else {
        unchangedCount++;
      }
    });

    console.log(`   ✅ Flagged ${foundationalCount} foundational cases`);
    console.log(`   ✅ Flagged ${advancedCount} advanced cases`);
    console.log(`   ⚠️  ${missingDataCount} cases missing score data`);
    console.log(`   🔄 ${changedCount} cases changed, ${unchangedCount} unchanged`);
    console.log('');

    // Step 4: Show score distribution
    console.log('4️⃣ Score distribution analysis...');
    console.log('');
    console.log('📊 Foundational Cases (Priority >= 8, Complexity <= 3):');

    const foundationalByComplexity = {};
    scoreDistribution.foundational.forEach(item => {
      const key = `C${item.complexity}P${item.priority}`;
      foundationalByComplexity[key] = (foundationalByComplexity[key] || 0) + 1;
    });

    Object.entries(foundationalByComplexity)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([key, count]) => {
        console.log(`   ${key}: ${count} cases`);
      });
    console.log('');

    console.log('📊 Advanced Cases (Other combinations):');

    const advancedByComplexity = {};
    scoreDistribution.advanced.forEach(item => {
      const key = `C${item.complexity}P${item.priority}`;
      advancedByComplexity[key] = (advancedByComplexity[key] || 0) + 1;
    });

    Object.entries(advancedByComplexity)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([key, count]) => {
        console.log(`   ${key}: ${count} cases`);
      });
    console.log('');

    // Step 5: Update pathway metadata
    console.log('5️⃣ Updating pathway metadata...');

    if (!fs.existsSync(PATHWAY_METADATA_PATH)) {
      console.log('   ⚠️  Pathway metadata not found - skipping');
    } else {
      const pathways = JSON.parse(fs.readFileSync(PATHWAY_METADATA_PATH, 'utf8'));

      Object.keys(pathways).forEach(pathwayName => {
        const pathwayCases = cases.filter(c => c.pathwayName === pathwayName);
        const foundationalInPathway = pathwayCases.filter(c => c.isFoundational === true).length;

        pathways[pathwayName].foundationalCases = foundationalInPathway;
      });

      fs.writeFileSync(PATHWAY_METADATA_PATH, JSON.stringify(pathways, null, 2));
      console.log('   ✅ Pathway foundational counts updated');
    }
    console.log('');

    // Step 6: Save updated case mapping
    console.log('6️⃣ Saving updated case mapping...');
    fs.writeFileSync(CASE_MAPPING_PATH, JSON.stringify(cases, null, 2));
    console.log('   ✅ Case mapping saved');
    console.log('');

    // Step 7: Summary by pathway
    console.log('7️⃣ Foundational cases by pathway...');
    console.log('');

    const pathwayStats = {};
    cases.forEach(c => {
      const pathway = c.pathwayName || 'Unknown';
      if (!pathwayStats[pathway]) {
        pathwayStats[pathway] = {
          total: 0,
          foundational: 0
        };
      }
      pathwayStats[pathway].total++;
      if (c.isFoundational) {
        pathwayStats[pathway].foundational++;
      }
    });

    const sortedPathways = Object.entries(pathwayStats)
      .map(([name, stats]) => ({
        name,
        total: stats.total,
        foundational: stats.foundational,
        percent: (stats.foundational / stats.total * 100).toFixed(0)
      }))
      .sort((a, b) => b.foundational - a.foundational);

    sortedPathways.slice(0, 10).forEach(p => {
      const bar = '█'.repeat(Math.round(p.foundational / 10));
      console.log(`   ${p.name.substring(0, 30).padEnd(30, ' ')} ${String(p.foundational).padStart(3, ' ')}/${String(p.total).padStart(3, ' ')} (${p.percent}%) ${bar}`);
    });
    console.log('');

    // Success summary
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ AUTO-FLAGGING COMPLETE');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('📊 Results:');
    console.log(`   • ${foundationalCount} foundational cases (${(foundationalCount / cases.length * 100).toFixed(1)}%)`);
    console.log(`   • ${advancedCount} advanced cases (${(advancedCount / cases.length * 100).toFixed(1)}%)`);
    console.log(`   • ${missingDataCount} cases missing data`);
    console.log('');
    console.log('💡 Next Steps:');
    console.log('   • Run: npm run dashboard (see updated analytics)');
    console.log('   • Run: npm run validate-system (verify integrity)');
    console.log('   • Run: npm run backup-metadata (save this state)');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ ERROR during auto-flagging:');
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  autoFlagFoundational();
}

module.exports = { autoFlagFoundational, isFoundational };
