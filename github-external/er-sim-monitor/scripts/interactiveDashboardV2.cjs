#!/usr/bin/env node

/**
 * Interactive Analytics Dashboard V2 - Production Grade
 *
 * Fully interactive dashboard that EXECUTES actions directly:
 * - Spawns child processes for tools
 * - Shows real-time progress
 * - Handles errors gracefully
 * - Non-blocking execution
 * - Clean terminal output
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { spawn } = require('child_process');
const { generateDashboard } = require('./generateDashboard.cjs');
const { autoFlagFoundational } = require('./autoFlagFoundationalCases.cjs');
const { backupMetadata } = require('./backupMetadata.cjs');

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

async function executeCommand(command, args = [], description = '') {
  return new Promise((resolve, reject) => {
    console.log('');
    console.log(`🚀 ${description}`);
    console.log('─'.repeat(55));
    console.log('');

    const child = spawn(command, args, {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      console.log('');
      if (code === 0) {
        console.log(`✅ ${description} completed successfully`);
        resolve(code);
      } else {
        console.log(`⚠️  ${description} exited with code ${code}`);
        resolve(code); // Don't reject, just note the exit code
      }
    });

    child.on('error', (error) => {
      console.error(`❌ ${description} failed:`, error.message);
      reject(error);
    });
  });
}

async function showMainMenu() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  📊 INTERACTIVE ANALYTICS DASHBOARD V2');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('📈 Dashboard Actions (Direct Execution):');
  console.log('');
  console.log('1. 📊 View Full Analytics Dashboard');
  console.log('2. ⚠️  Address Coverage Gaps');
  console.log('3. ✍️  Refine Pathway Names (Launch Tool)');
  console.log('4. 📐 Rebalance Pathway Case Counts');
  console.log('5. 🎓 Auto-Flag Foundational Cases');
  console.log('6. 🔗 Consolidate Small Pathways (Launch Tool)');
  console.log('7. 💾 Backup Current State');
  console.log('8. 🔄 Refresh Data & Recalculate');
  console.log('9. 📤 Export Analytics Data');
  console.log('10. 🧪 Run System Tests');
  console.log('11. ❌ Exit');
  console.log('');

  const choice = await promptUser('Select action (1-11): ');
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

  console.log(`Found ${gaps.length} coverage gaps:\n`);

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
  console.log('   • Small pathways: Use Action 6 to consolidate');
  console.log('   • Low foundational ratio: Use Action 5 to recalculate');
  console.log('');

  const proceed = await promptUser('Would you like to consolidate small pathways now? (y/n): ');
  if (proceed.toLowerCase() === 'y') {
    await executeCommand('node', ['scripts/consolidatePathways.cjs'], 'Consolidate Small Pathways');
  }
}

async function action3_refinePathwayNames() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  ✍️  REFINE PATHWAY NAMES');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const proceed = await promptUser('Launch Categories & Pathways Tool? (y/n): ');
  if (proceed.toLowerCase() === 'y') {
    await executeCommand('node', ['scripts/categoriesAndPathwaysTool.cjs'], 'Categories & Pathways Tool');
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

  console.log('📊 Current Pathway Distribution:\n');

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

  console.log('💡 Rebalancing available via Categories & Pathways Tool');
  console.log('');

  const proceed = await promptUser('Launch Categories & Pathways Tool? (y/n): ');
  if (proceed.toLowerCase() === 'y') {
    await executeCommand('node', ['scripts/categoriesAndPathwaysTool.cjs'], 'Categories & Pathways Tool');
  }
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
    await autoFlagFoundational();
    console.log('');
    console.log('✅ Foundational cases updated!');
    console.log('');
  }
}

async function action6_consolidatePathways() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  🔗 CONSOLIDATE SMALL PATHWAYS');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const proceed = await promptUser('Launch consolidation tool? (y/n): ');
  if (proceed.toLowerCase() === 'y') {
    await executeCommand('node', ['scripts/consolidatePathways.cjs'], 'Consolidate Pathways Tool');
  }
}

async function action7_backupState() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  💾 BACKUP CURRENT STATE');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

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

async function action9_exportData() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  📤 EXPORT ANALYTICS DATA');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  console.log('Select export format:');
  console.log('1. CSV only');
  console.log('2. JSON only');
  console.log('3. Both (CSV + JSON)');
  console.log('');

  const choice = await promptUser('Select format (1-3): ');

  let args = ['scripts/exportDashboardData.cjs'];
  if (choice === '1') args.push('--format=csv');
  else if (choice === '2') args.push('--format=json');
  else args.push('--format=both');

  await executeCommand('node', args, 'Export Analytics Data');
}

async function action10_runTests() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  🧪 RUN SYSTEM TESTS');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  console.log('Select test suite:');
  console.log('1. Full test suite (20 tests)');
  console.log('2. Enhanced validation');
  console.log('3. Both');
  console.log('');

  const choice = await promptUser('Select test (1-3): ');

  if (choice === '1' || choice === '3') {
    await executeCommand('node', ['scripts/testSuite.cjs'], 'Full Test Suite');
  }

  if (choice === '2' || choice === '3') {
    await executeCommand('node', ['scripts/enhancedValidation.cjs'], 'Enhanced Validation');
  }
}

async function main() {
  let running = true;

  while (running) {
    try {
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
          await action9_exportData();
          break;
        case 10:
          await action10_runTests();
          break;
        case 11:
          console.log('');
          console.log('✅ Exiting Interactive Dashboard V2');
          console.log('');
          running = false;
          break;
        default:
          console.log('');
          console.log('❌ Invalid choice. Please select 1-11.');
          console.log('');
      }

      if (running && choice !== 11) {
        await promptUser('\nPress Enter to return to main menu...');
      }
    } catch (error) {
      console.error('');
      console.error('❌ Error:', error.message);
      console.error('');
      await promptUser('Press Enter to continue...');
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
