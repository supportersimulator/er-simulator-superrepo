#!/usr/bin/env node

/**
 * Backup Comparison Tool
 *
 * Compares two backup timestamps to show what changed:
 * - Cases that moved pathways
 * - Pathway name changes
 * - Overview content changes
 * - Foundational flag changes
 * - Category reassignments
 * - Complexity/priority score changes
 *
 * Usage:
 *   npm run compare-backups                           # Interactive: shows list
 *   npm run compare-backups 2025-11-02_14-30-15       # Compare with current
 *   npm run compare-backups timestamp1 timestamp2     # Compare two backups
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const CURRENT_CASE_MAPPING = path.join(__dirname, '..', 'AI_ENHANCED_CASE_ID_MAPPING.json');
const CURRENT_PATHWAY_METADATA = path.join(__dirname, '..', 'AI_ENHANCED_PATHWAY_METADATA.json');
const CURRENT_OVERVIEWS = path.join(__dirname, '..', 'AI_CASE_OVERVIEWS.json');

function getAllBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    return [];
  }

  return fs.readdirSync(BACKUP_DIR)
    .filter(name => /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/.test(name))
    .sort()
    .reverse();
}

function loadBackupData(timestamp) {
  const backupPath = path.join(BACKUP_DIR, timestamp);

  if (!fs.existsSync(backupPath)) {
    return null;
  }

  const caseMappingPath = path.join(backupPath, 'AI_ENHANCED_CASE_ID_MAPPING.json');
  const pathwayMetadataPath = path.join(backupPath, 'AI_ENHANCED_PATHWAY_METADATA.json');
  const overviewsPath = path.join(backupPath, 'AI_CASE_OVERVIEWS.json');

  try {
    return {
      timestamp,
      caseMapping: fs.existsSync(caseMappingPath) ? JSON.parse(fs.readFileSync(caseMappingPath, 'utf8')) : null,
      pathwayMetadata: fs.existsSync(pathwayMetadataPath) ? JSON.parse(fs.readFileSync(pathwayMetadataPath, 'utf8')) : null,
      overviews: fs.existsSync(overviewsPath) ? JSON.parse(fs.readFileSync(overviewsPath, 'utf8')) : null
    };
  } catch (error) {
    console.error(`❌ Error loading backup ${timestamp}:`, error.message);
    return null;
  }
}

function loadCurrentData() {
  try {
    return {
      timestamp: 'CURRENT',
      caseMapping: fs.existsSync(CURRENT_CASE_MAPPING) ? JSON.parse(fs.readFileSync(CURRENT_CASE_MAPPING, 'utf8')) : null,
      pathwayMetadata: fs.existsSync(CURRENT_PATHWAY_METADATA) ? JSON.parse(fs.readFileSync(CURRENT_PATHWAY_METADATA, 'utf8')) : null,
      overviews: fs.existsSync(CURRENT_OVERVIEWS) ? JSON.parse(fs.readFileSync(CURRENT_OVERVIEWS, 'utf8')) : null
    };
  } catch (error) {
    console.error('❌ Error loading current data:', error.message);
    return null;
  }
}

async function promptUserChoice(backups) {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  🔍 COMPARE BACKUPS');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('📦 Available Backups:');
  console.log('');
  console.log(' 0. CURRENT STATE');

  backups.forEach((backup, idx) => {
    const num = String(idx + 1).padStart(2, ' ');
    const date = backup.replace('_', ' at ');
    console.log(`${num}. ${date}`);
  });

  console.log('');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Select FIRST backup (or 0 for current): ', (answer1) => {
      const choice1 = parseInt(answer1, 10);

      rl.question('Select SECOND backup (or 0 for current): ', (answer2) => {
        rl.close();
        const choice2 = parseInt(answer2, 10);

        if (isNaN(choice1) || isNaN(choice2)) {
          resolve(null);
          return;
        }

        if (choice1 < 0 || choice1 > backups.length || choice2 < 0 || choice2 > backups.length) {
          resolve(null);
          return;
        }

        const backup1 = choice1 === 0 ? 'CURRENT' : backups[choice1 - 1];
        const backup2 = choice2 === 0 ? 'CURRENT' : backups[choice2 - 1];

        resolve({ backup1, backup2 });
      });
    });
  });
}

function compareData(data1, data2) {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  COMPARISON: ${data1.timestamp} → ${data2.timestamp}`);
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const changes = {
    pathwayMoves: [],
    pathwayNameChanges: [],
    foundationalChanges: [],
    categoryChanges: [],
    scoreChanges: [],
    overviewChanges: []
  };

  // Compare case mapping
  if (data1.caseMapping && data2.caseMapping) {
    const caseMap1 = new Map();
    const caseMap2 = new Map();

    data1.caseMapping.forEach(c => caseMap1.set(c.newId || c.oldId, c));
    data2.caseMapping.forEach(c => caseMap2.set(c.newId || c.oldId, c));

    caseMap1.forEach((case1, caseId) => {
      const case2 = caseMap2.get(caseId);
      if (!case2) return;

      // Check pathway moves
      if (case1.pathwayName !== case2.pathwayName) {
        changes.pathwayMoves.push({
          caseId,
          from: case1.pathwayName,
          to: case2.pathwayName
        });
      }

      // Check foundational flag changes
      if (case1.isFoundational !== case2.isFoundational) {
        changes.foundationalChanges.push({
          caseId,
          from: case1.isFoundational,
          to: case2.isFoundational
        });
      }

      // Check category changes
      if (case1.system !== case2.system) {
        changes.categoryChanges.push({
          caseId,
          from: case1.system,
          to: case2.system
        });
      }

      // Check score changes
      if (case1.complexity !== case2.complexity || case1.priority !== case2.priority) {
        changes.scoreChanges.push({
          caseId,
          complexity: { from: case1.complexity, to: case2.complexity },
          priority: { from: case1.priority, to: case2.priority }
        });
      }
    });
  }

  // Compare pathway names
  if (data1.pathwayMetadata && data2.pathwayMetadata) {
    const pathways1 = new Set(Object.keys(data1.pathwayMetadata));
    const pathways2 = new Set(Object.keys(data2.pathwayMetadata));

    pathways1.forEach(name => {
      if (!pathways2.has(name)) {
        // Check if it was renamed
        const possibleRename = Array.from(pathways2).find(newName => {
          const cases1 = data1.caseMapping ? data1.caseMapping.filter(c => c.pathwayName === name) : [];
          const cases2 = data2.caseMapping ? data2.caseMapping.filter(c => c.pathwayName === newName) : [];
          return cases1.length > 0 && cases2.length > 0 &&
            cases1.some(c1 => cases2.some(c2 => (c1.newId || c1.oldId) === (c2.newId || c2.oldId)));
        });

        if (possibleRename) {
          changes.pathwayNameChanges.push({
            from: name,
            to: possibleRename
          });
        }
      }
    });
  }

  // Compare overviews
  if (data1.overviews && data2.overviews) {
    const overviewMap1 = new Map();
    const overviewMap2 = new Map();

    data1.overviews.forEach(o => overviewMap1.set(o.caseId, o));
    data2.overviews.forEach(o => overviewMap2.set(o.caseId, o));

    overviewMap1.forEach((overview1, caseId) => {
      const overview2 = overviewMap2.get(caseId);
      if (!overview2) return;

      // Check if pre-sim changed
      const preSimChanged = JSON.stringify(overview1.preSimOverview) !== JSON.stringify(overview2.preSimOverview);
      const postSimChanged = JSON.stringify(overview1.postSimOverview) !== JSON.stringify(overview2.postSimOverview);

      if (preSimChanged || postSimChanged) {
        changes.overviewChanges.push({
          caseId,
          preSimChanged,
          postSimChanged
        });
      }
    });
  }

  // Display changes
  console.log('📊 CHANGE SUMMARY');
  console.log('');
  console.log(`   • ${changes.pathwayMoves.length} cases moved pathways`);
  console.log(`   • ${changes.pathwayNameChanges.length} pathway names changed`);
  console.log(`   • ${changes.foundationalChanges.length} foundational flags changed`);
  console.log(`   • ${changes.categoryChanges.length} categories reassigned`);
  console.log(`   • ${changes.scoreChanges.length} complexity/priority scores changed`);
  console.log(`   • ${changes.overviewChanges.length} overviews modified`);
  console.log('');

  // Detailed breakdowns
  if (changes.pathwayMoves.length > 0) {
    console.log('─────────────────────────────────────────');
    console.log('🔀 PATHWAY MOVES');
    console.log('─────────────────────────────────────────');
    console.log('');
    changes.pathwayMoves.slice(0, 10).forEach(move => {
      console.log(`   ${move.caseId}:`);
      console.log(`      FROM: ${move.from}`);
      console.log(`      TO:   ${move.to}`);
      console.log('');
    });
    if (changes.pathwayMoves.length > 10) {
      console.log(`   ... and ${changes.pathwayMoves.length - 10} more`);
      console.log('');
    }
  }

  if (changes.pathwayNameChanges.length > 0) {
    console.log('─────────────────────────────────────────');
    console.log('✍️  PATHWAY NAME CHANGES');
    console.log('─────────────────────────────────────────');
    console.log('');
    changes.pathwayNameChanges.forEach(change => {
      console.log(`   FROM: ${change.from}`);
      console.log(`   TO:   ${change.to}`);
      console.log('');
    });
  }

  if (changes.foundationalChanges.length > 0) {
    console.log('─────────────────────────────────────────');
    console.log('🎓 FOUNDATIONAL FLAG CHANGES');
    console.log('─────────────────────────────────────────');
    console.log('');

    const nowFoundational = changes.foundationalChanges.filter(c => c.to === true).length;
    const nowAdvanced = changes.foundationalChanges.filter(c => c.to === false).length;

    console.log(`   ${nowFoundational} cases → Foundational`);
    console.log(`   ${nowAdvanced} cases → Advanced`);
    console.log('');

    changes.foundationalChanges.slice(0, 5).forEach(change => {
      console.log(`   ${change.caseId}: ${change.from ? 'Foundational' : 'Advanced'} → ${change.to ? 'Foundational' : 'Advanced'}`);
    });
    if (changes.foundationalChanges.length > 5) {
      console.log(`   ... and ${changes.foundationalChanges.length - 5} more`);
    }
    console.log('');
  }

  if (changes.categoryChanges.length > 0) {
    console.log('─────────────────────────────────────────');
    console.log('📂 CATEGORY REASSIGNMENTS');
    console.log('─────────────────────────────────────────');
    console.log('');
    changes.categoryChanges.slice(0, 5).forEach(change => {
      console.log(`   ${change.caseId}: ${change.from} → ${change.to}`);
    });
    if (changes.categoryChanges.length > 5) {
      console.log(`   ... and ${changes.categoryChanges.length - 5} more`);
    }
    console.log('');
  }

  if (changes.scoreChanges.length > 0) {
    console.log('─────────────────────────────────────────');
    console.log('📊 COMPLEXITY/PRIORITY CHANGES');
    console.log('─────────────────────────────────────────');
    console.log('');
    changes.scoreChanges.slice(0, 5).forEach(change => {
      const complexityChanged = change.complexity.from !== change.complexity.to;
      const priorityChanged = change.priority.from !== change.priority.to;

      console.log(`   ${change.caseId}:`);
      if (complexityChanged) {
        console.log(`      Complexity: ${change.complexity.from} → ${change.complexity.to}`);
      }
      if (priorityChanged) {
        console.log(`      Priority: ${change.priority.from} → ${change.priority.to}`);
      }
      console.log('');
    });
    if (changes.scoreChanges.length > 5) {
      console.log(`   ... and ${changes.scoreChanges.length - 5} more`);
    }
  }

  if (changes.overviewChanges.length > 0) {
    console.log('─────────────────────────────────────────');
    console.log('📖 OVERVIEW MODIFICATIONS');
    console.log('─────────────────────────────────────────');
    console.log('');
    const preSimChanges = changes.overviewChanges.filter(c => c.preSimChanged).length;
    const postSimChanges = changes.overviewChanges.filter(c => c.postSimChanged).length;

    console.log(`   ${preSimChanges} pre-sim overviews modified`);
    console.log(`   ${postSimChanges} post-sim overviews modified`);
    console.log('');
  }

  if (Object.values(changes).every(arr => arr.length === 0)) {
    console.log('✅ NO CHANGES DETECTED');
    console.log('   The two backups are identical.');
    console.log('');
  }
}

async function main() {
  const args = process.argv.slice(2);

  let data1, data2;

  if (args.length === 0) {
    // Interactive mode
    const backups = getAllBackups();

    if (backups.length === 0) {
      console.log('');
      console.log('❌ No backups found in /backups/ directory');
      console.log('');
      console.log('💡 Create a backup first:');
      console.log('   npm run backup-metadata');
      console.log('');
      process.exit(1);
    }

    const selection = await promptUserChoice(backups);

    if (!selection) {
      console.log('');
      console.log('❌ Invalid selection');
      console.log('');
      process.exit(1);
    }

    data1 = selection.backup1 === 'CURRENT' ? loadCurrentData() : loadBackupData(selection.backup1);
    data2 = selection.backup2 === 'CURRENT' ? loadCurrentData() : loadBackupData(selection.backup2);

  } else if (args.length === 1) {
    // Compare backup with current
    data1 = loadBackupData(args[0]);
    data2 = loadCurrentData();

  } else {
    // Compare two backups
    data1 = loadBackupData(args[0]);
    data2 = loadBackupData(args[1]);
  }

  if (!data1 || !data2) {
    console.log('');
    console.log('❌ Could not load backup data');
    console.log('');
    process.exit(1);
  }

  compareData(data1, data2);
}

if (require.main === module) {
  main().catch(err => {
    console.error('❌ Comparison failed:', err.message);
    process.exit(1);
  });
}

module.exports = { compareData, loadBackupData, loadCurrentData };
