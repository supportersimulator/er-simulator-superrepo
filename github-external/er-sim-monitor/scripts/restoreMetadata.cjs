#!/usr/bin/env node

/**
 * Restore System Metadata
 *
 * Restores metadata from a timestamped backup.
 *
 * Usage:
 *   npm run restore-metadata                    # Interactive: shows list of backups
 *   npm run restore-metadata 2025-11-02_14-30-15  # Direct: restore specific backup
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');

function getAllBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    return [];
  }

  return fs.readdirSync(BACKUP_DIR)
    .filter(name => /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/.test(name))
    .sort()
    .reverse()
    .map(timestamp => {
      const backupPath = path.join(BACKUP_DIR, timestamp);
      const manifestPath = path.join(backupPath, 'MANIFEST.json');

      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        return {
          timestamp,
          manifest,
          path: backupPath
        };
      }

      return {
        timestamp,
        path: backupPath,
        manifest: null
      };
    });
}

async function promptUserChoice(backups) {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  🔄 RESTORE SYSTEM METADATA');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('📦 Available Backups:');
  console.log('');

  backups.forEach((backup, idx) => {
    const num = String(idx + 1).padStart(2, ' ');
    const date = backup.timestamp.replace('_', ' at ');

    if (backup.manifest) {
      console.log(`${num}. ${date} (${backup.manifest.totalSizeMB} MB, ${backup.manifest.files.length} files)`);
    } else {
      console.log(`${num}. ${date} (manifest missing)`);
    }
  });

  console.log('');
  console.log(' 0. Cancel');
  console.log('');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Select backup to restore: ', (answer) => {
      rl.close();
      const choice = parseInt(answer, 10);

      if (choice === 0 || isNaN(choice)) {
        resolve(null);
      } else if (choice >= 1 && choice <= backups.length) {
        resolve(backups[choice - 1]);
      } else {
        console.log('');
        console.log('❌ Invalid choice');
        resolve(null);
      }
    });
  });
}

async function restoreFromBackup(backup) {
  console.log('');
  console.log(`🔄 Restoring from: ${backup.timestamp}`);
  console.log('');

  try {
    // Step 1: Verify backup integrity
    console.log('1️⃣ Verifying backup integrity...');
    const backupFiles = fs.readdirSync(backup.path).filter(f => f !== 'MANIFEST.json');

    if (backupFiles.length === 0) {
      console.error('   ❌ Backup directory is empty!');
      process.exit(1);
    }

    console.log(`   ✅ Found ${backupFiles.length} files`);
    console.log('');

    // Step 2: Create backup of current state before restoring
    console.log('2️⃣ Creating safety backup of current state...');
    const { backupMetadata } = require('./backupMetadata.cjs');
    await backupMetadata();
    console.log('   ✅ Current state backed up');
    console.log('');

    // Step 3: Restore files
    console.log('3️⃣ Restoring files...');
    const restoredFiles = [];

    backupFiles.forEach(filename => {
      const sourcePath = path.join(backup.path, filename);
      const destPath = path.join(__dirname, '..', filename);

      fs.copyFileSync(sourcePath, destPath);
      const stats = fs.statSync(destPath);
      const sizeKB = (stats.size / 1024).toFixed(1);

      console.log(`   ✅ ${filename} (${sizeKB} KB)`);
      restoredFiles.push({
        filename,
        size: stats.size,
        sizeKB
      });
    });

    console.log('');

    // Step 4: Validate restored data
    console.log('4️⃣ Validating restored data...');

    const caseMappingPath = path.join(__dirname, '..', 'AI_ENHANCED_CASE_ID_MAPPING.json');
    const pathwayMetadataPath = path.join(__dirname, '..', 'AI_ENHANCED_PATHWAY_METADATA.json');
    const overviewsPath = path.join(__dirname, '..', 'AI_CASE_OVERVIEWS.json');

    let validationErrors = [];

    // Validate case mapping
    if (fs.existsSync(caseMappingPath)) {
      try {
        const caseMapping = JSON.parse(fs.readFileSync(caseMappingPath, 'utf8'));
        if (!Array.isArray(caseMapping)) {
          validationErrors.push('Case mapping is not an array');
        } else {
          console.log(`   ✅ Case mapping: ${caseMapping.length} cases`);
        }
      } catch (e) {
        validationErrors.push(`Case mapping JSON invalid: ${e.message}`);
      }
    }

    // Validate pathway metadata
    if (fs.existsSync(pathwayMetadataPath)) {
      try {
        const pathways = JSON.parse(fs.readFileSync(pathwayMetadataPath, 'utf8'));
        if (typeof pathways !== 'object') {
          validationErrors.push('Pathway metadata is not an object');
        } else {
          console.log(`   ✅ Pathway metadata: ${Object.keys(pathways).length} pathways`);
        }
      } catch (e) {
        validationErrors.push(`Pathway metadata JSON invalid: ${e.message}`);
      }
    }

    // Validate overviews
    if (fs.existsSync(overviewsPath)) {
      try {
        const overviews = JSON.parse(fs.readFileSync(overviewsPath, 'utf8'));
        if (!Array.isArray(overviews)) {
          validationErrors.push('Overviews is not an array');
        } else {
          console.log(`   ✅ Overviews: ${overviews.length} cases`);
        }
      } catch (e) {
        validationErrors.push(`Overviews JSON invalid: ${e.message}`);
      }
    }

    console.log('');

    if (validationErrors.length > 0) {
      console.error('❌ VALIDATION ERRORS:');
      validationErrors.forEach(err => console.error(`   • ${err}`));
      console.log('');
      console.log('⚠️  Restore completed but data may be corrupt.');
      console.log('    Consider restoring from a different backup.');
      console.log('');
      process.exit(1);
    }

    // Success summary
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ RESTORE COMPLETE');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log(`📦 Restored from: ${backup.timestamp}`);
    console.log(`   • Files: ${restoredFiles.length} restored`);
    console.log('');
    console.log('📁 Restored Files:');
    restoredFiles.forEach(file => {
      console.log(`   • ${file.filename} (${file.sizeKB} KB)`);
    });
    console.log('');
    console.log('💡 Next Steps:');
    console.log('   • Run: npm run validate-system');
    console.log('   • Run: npm run sync-overviews (if needed)');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ ERROR during restore:');
    console.error(error.message);
    process.exit(1);
  }
}

async function main() {
  // Check if timestamp provided as argument
  const timestamp = process.argv[2];

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

  let selectedBackup;

  if (timestamp) {
    // Direct restore
    selectedBackup = backups.find(b => b.timestamp === timestamp);

    if (!selectedBackup) {
      console.log('');
      console.log(`❌ Backup not found: ${timestamp}`);
      console.log('');
      console.log('Available backups:');
      backups.forEach(b => console.log(`   • ${b.timestamp}`));
      console.log('');
      process.exit(1);
    }
  } else {
    // Interactive selection
    selectedBackup = await promptUserChoice(backups);

    if (!selectedBackup) {
      console.log('');
      console.log('❌ Restore cancelled');
      console.log('');
      process.exit(0);
    }
  }

  await restoreFromBackup(selectedBackup);
}

if (require.main === module) {
  main().catch(err => {
    console.error('❌ Restore failed:', err.message);
    process.exit(1);
  });
}

module.exports = { restoreFromBackup, getAllBackups };
