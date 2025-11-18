#!/usr/bin/env node

/**
 * Interactive Analytics Dashboard
 *
 * Enhanced dashboard with actionable insights:
 * - View comprehensive analytics (from generateDashboard.cjs)
 * - Address specific coverage gaps interactively
 * - Refine pathway names with AI suggestions
 * - Rebalance pathway case counts
 * - Auto-flag foundational cases
 * - Consolidate small pathways
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { generateDashboard } = require('./generateDashboard.cjs');
const { autoFlagFoundational } = require('./autoFlagFoundationalCases.cjs');

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

async function showMainMenu() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  📊 INTERACTIVE ANALYTICS DASHBOARD');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('📈 Dashboard Actions:');
  console.log('');
  console.log('1. 📊 View Full Analytics Dashboard');
  console.log('2. ⚠️  Address Coverage Gaps');
  console.log('3. ✍️  Refine Pathway Names');
  console.log('4. 📐 Rebalance Pathway Case Counts');
  console.log('5. 🎓 Auto-Flag Foundational Cases');
  console.log('6. 🔗 Consolidate Small Pathways');
  console.log('7. 💾 Backup Current State');
  console.log('8. 🔄 Refresh Data & Recalculate');
  console.log('9. ❌ Exit');
  console.log('');

  const choice = await promptUser('Select action (1-9): ');
  return parseInt(choice, 10);
}

async function action1_viewDashboard() {
  console.log('');
  console.log('Generating full analytics dashboard...');
  console.log('');
  await generateDashboard();
}

async function action2_addressCoverageGaps() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  ⚠️  ADDRESS COVERAGE GAPS');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const pathways = loadJSON(PATHWAY_METADATA_PATH);
  const cases = loadJSON(CASE_MAPPING_PATH);

  if (!pathways || !cases) {
    console.log('❌ Could not load data files');
    return;
  }

  // Analyze gaps
  const gaps = [];

  // Small pathways (< 5 cases)
  Object.entries(pathways).forEach(([name, data]) => {
    if (data.scenarioCount < 5) {
      gaps.push({
        type: 'Small Pathway',
        name,
        count: data.scenarioCount,
        action: 'expand-or-merge'
      });
    }
  });

  // Underrepresented categories (< 3 cases)
  const categoryCount = {};
  cases.forEach(c => {
    const system = c.system || 'UNKNOWN';
    categoryCount[system] = (categoryCount[system] || 0) + 1;
  });

  Object.entries(categoryCount).forEach(([system, count]) => {
    if (count < 3) {
      gaps.push({
        type: 'Underrepresented Category',
        name: system,
        count,
        action: 'add-cases'
      });
    }
  });

  // Low foundational ratio (< 30% in large pathways)
  Object.entries(pathways).forEach(([name, data]) => {
    const pathwayCases = cases.filter(c => c.pathwayName === name);
    const foundationalCount = pathwayCases.filter(c => c.isFoundational).length;
    const foundationalPercent = (foundationalCount / data.scenarioCount * 100);

    if (foundationalPercent < 30 && data.scenarioCount > 10) {
      gaps.push({
        type: 'Low Foundational Ratio',
        name,
        count: foundationalCount,
        total: data.scenarioCount,
        percent: foundationalPercent.toFixed(0),
        action: 'add-foundational'
      });
    }
  });

  if (gaps.length === 0) {
    console.log('✅ No coverage gaps found!');
    console.log('');
    return;
  }

  console.log(`Found ${gaps.length} coverage gaps:\\n`);

  gaps.forEach((gap, idx) => {
    console.log(`${idx + 1}. ${gap.type}: ${gap.name}`);
    if (gap.count !== undefined) {
      if (gap.total) {
        console.log(`   Current: ${gap.count}/${gap.total} (${gap.percent}%)`);
      } else {
        console.log(`   Current: ${gap.count} cases`);
      }
    }
    console.log('');
  });

  console.log('💡 Recommendations:');
  console.log('   • Small pathways: Run "npm run consolidate-pathways" to merge');
  console.log('   • Underrepresented categories: Add more cases for these systems');
  console.log('   • Low foundational ratio: Run "npm run auto-flag-foundational" to recalculate');
  console.log('');

  const proceed = await promptUser('Would you like to run auto-consolidation? (y/n): ');
  if (proceed.toLowerCase() === 'y') {
    console.log('');
    console.log('💡 Run: npm run consolidate-pathways');
    console.log('   This will guide you through merging small pathways.');
    console.log('');
  }
}

async function action3_refinePathwayNames() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  ✍️  REFINE PATHWAY NAMES');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  console.log('💡 This action will launch the Categories & Pathways Tool');
  console.log('   in naming refinement mode.');
  console.log('');
  console.log('From there, you can:');
  console.log('   • Generate 10 alternative names for any pathway');
  console.log('   • Select the best option');
  console.log('   • Apply naming guidelines automatically');
  console.log('');

  const proceed = await promptUser('Launch Categories & Pathways Tool? (y/n): ');
  if (proceed.toLowerCase() === 'y') {
    console.log('');
    console.log('🚀 Launching: npm run categories-pathways');
    console.log('   Select Option 4 to generate alternative pathway names.');
    console.log('');
  }
}

async function action4_rebalancePathways() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  📐 REBALANCE PATHWAY CASE COUNTS');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const pathways = loadJSON(PATHWAY_METADATA_PATH);
  const cases = loadJSON(CASE_MAPPING_PATH);

  if (!pathways || !cases) {
    console.log('❌ Could not load data files');
    return;
  }

  // Analyze pathway sizes
  const pathwayStats = Object.entries(pathways)
    .map(([name, data]) => ({
      name,
      count: data.scenarioCount
    }))
    .sort((a, b) => b.count - a.count);

  console.log('📊 Current Pathway Distribution:\\n');

  const largest = pathwayStats.slice(0, 5);
  const smallest = pathwayStats.slice(-5).reverse();

  console.log('Largest Pathways:');
  largest.forEach((p, idx) => {
    console.log(`   ${idx + 1}. ${p.name}: ${p.count} cases`);
  });
  console.log('');

  console.log('Smallest Pathways:');
  smallest.forEach((p, idx) => {
    console.log(`   ${idx + 1}. ${p.name}: ${p.count} cases`);
  });
  console.log('');

  console.log('💡 Rebalancing Strategies:');
  console.log('   • Move cases from large pathways to related smaller ones');
  console.log('   • Split mega-pathways (>50 cases) into focused sub-pathways');
  console.log('   • Merge micro-pathways (<5 cases) into related pathways');
  console.log('');

  console.log('🚀 Use: npm run categories-pathways');
  console.log('   Then select Option 7 to move cases between pathways.');
  console.log('');
}

async function action5_autoFlagFoundational() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  🎓 AUTO-FLAG FOUNDATIONAL CASES');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  console.log('This will automatically identify foundational cases based on:');
  console.log('   • Priority >= 8 (high priority)');
  console.log('   • Complexity <= 3 (low to moderate complexity)');
  console.log('');

  const proceed = await promptUser('Run auto-flagging? (y/n): ');
  if (proceed.toLowerCase() === 'y') {
    console.log('');
    await autoFlagFoundational();
    console.log('');
    console.log('✅ Foundational cases updated!');
    console.log('   Run dashboard again to see updated analytics.');
    console.log('');
  }
}

async function action6_consolidatePathways() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  🔗 CONSOLIDATE SMALL PATHWAYS');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  console.log('💡 This action will launch the Pathway Consolidation Tool');
  console.log('   to help you merge small pathways into larger related ones.');
  console.log('');

  console.log('From there, you can:');
  console.log('   • View all pathways with < 5 cases');
  console.log('   • See suggested merge targets');
  console.log('   • Execute merges with one command');
  console.log('');

  const proceed = await promptUser('Launch consolidation tool? (y/n): ');
  if (proceed.toLowerCase() === 'y') {
    console.log('');
    console.log('🚀 Launching: npm run consolidate-pathways');
    console.log('');
  }
}

async function action7_backupState() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  💾 BACKUP CURRENT STATE');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const { backupMetadata } = require('./backupMetadata.cjs');

  await backupMetadata();
}

async function action8_refreshData() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  🔄 REFRESH DATA & RECALCULATE');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  console.log('This will:');
  console.log('   1. Recalculate foundational flags');
  console.log('   2. Update pathway metadata');
  console.log('   3. Regenerate dashboard analytics');
  console.log('');

  const proceed = await promptUser('Proceed? (y/n): ');
  if (proceed.toLowerCase() === 'y') {
    console.log('');
    console.log('Running auto-flag foundational...');
    await autoFlagFoundational();
    console.log('');
    console.log('Regenerating dashboard...');
    await generateDashboard();
    console.log('');
    console.log('✅ Data refreshed!');
    console.log('');
  }
}

async function main() {
  let running = true;

  while (running) {
    const choice = await showMainMenu();

    switch (choice) {
      case 1:
        await action1_viewDashboard();
        break;
      case 2:
        await action2_addressCoverageGaps();
        break;
      case 3:
        await action3_refinePathwayNames();
        break;
      case 4:
        await action4_rebalancePathways();
        break;
      case 5:
        await action5_autoFlagFoundational();
        break;
      case 6:
        await action6_consolidatePathways();
        break;
      case 7:
        await action7_backupState();
        break;
      case 8:
        await action8_refreshData();
        break;
      case 9:
        console.log('');
        console.log('✅ Exiting Interactive Dashboard');
        console.log('');
        running = false;
        break;
      default:
        console.log('');
        console.log('❌ Invalid choice. Please select 1-9.');
        console.log('');
    }

    if (running && choice !== 9) {
      await promptUser('Press Enter to return to main menu...');
    }
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('❌ Dashboard error:', err.message);
    process.exit(1);
  });
}

module.exports = { main };
