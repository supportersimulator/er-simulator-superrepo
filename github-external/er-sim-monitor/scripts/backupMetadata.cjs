#!/usr/bin/env node

/**
 * Backup System Metadata
 *
 * Creates timestamped backup of all critical system metadata:
 * - AI_ENHANCED_CASE_ID_MAPPING.json
 * - AI_ENHANCED_PATHWAY_METADATA.json
 * - AI_CASE_OVERVIEWS.json
 *
 * Backups saved to /backups/{timestamp}/
 */

const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const FILES_TO_BACKUP = [
  'AI_ENHANCED_CASE_ID_MAPPING.json',
  'AI_ENHANCED_PATHWAY_METADATA.json',
  'AI_CASE_OVERVIEWS.json'
];

function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}_${hour}-${minute}-${second}`;
}

async function backupMetadata() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  💾 BACKUP SYSTEM METADATA');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  try {
    // Step 1: Create backup directory
    const timestamp = getTimestamp();
    const backupPath = path.join(BACKUP_DIR, timestamp);

    console.log('1️⃣ Creating backup directory...');
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR);
      console.log('   ✅ Created /backups/ directory');
    }
    fs.mkdirSync(backupPath);
    console.log(`   ✅ Created backup directory: ${timestamp}`);
    console.log('');

    // Step 2: Copy files
    console.log('2️⃣ Backing up files...');
    let totalSize = 0;
    const backedUpFiles = [];

    FILES_TO_BACKUP.forEach(filename => {
      const sourcePath = path.join(__dirname, '..', filename);
      const destPath = path.join(backupPath, filename);

      if (!fs.existsSync(sourcePath)) {
        console.log(`   ⚠️  ${filename} not found - skipping`);
        return;
      }

      fs.copyFileSync(sourcePath, destPath);
      const stats = fs.statSync(destPath);
      const sizeKB = (stats.size / 1024).toFixed(1);
      totalSize += stats.size;

      console.log(`   ✅ ${filename} (${sizeKB} KB)`);
      backedUpFiles.push({
        filename,
        size: stats.size,
        sizeKB
      });
    });

    console.log('');

    // Step 3: Create manifest
    console.log('3️⃣ Creating backup manifest...');
    const manifest = {
      timestamp,
      createdAt: new Date().toISOString(),
      files: backedUpFiles,
      totalSize,
      totalSizeKB: (totalSize / 1024).toFixed(1),
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
    };

    fs.writeFileSync(
      path.join(backupPath, 'MANIFEST.json'),
      JSON.stringify(manifest, null, 2)
    );
    console.log('   ✅ Manifest created');
    console.log('');

    // Step 4: Clean old backups (keep last 10)
    console.log('4️⃣ Managing old backups...');
    const allBackups = fs.readdirSync(BACKUP_DIR)
      .filter(name => /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/.test(name))
      .sort()
      .reverse();

    if (allBackups.length > 10) {
      const toDelete = allBackups.slice(10);
      toDelete.forEach(oldBackup => {
        const oldPath = path.join(BACKUP_DIR, oldBackup);
        fs.rmSync(oldPath, { recursive: true, force: true });
        console.log(`   🗑️  Deleted old backup: ${oldBackup}`);
      });
    } else {
      console.log(`   ✅ ${allBackups.length}/10 backups kept`);
    }
    console.log('');

    // Success summary
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ BACKUP COMPLETE');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log(`📦 Backup Details:`);
    console.log(`   • Location: /backups/${timestamp}/`);
    console.log(`   • Files: ${backedUpFiles.length} backed up`);
    console.log(`   • Total Size: ${manifest.totalSizeMB} MB`);
    console.log('');
    console.log('📁 Backed Up Files:');
    backedUpFiles.forEach(file => {
      console.log(`   • ${file.filename} (${file.sizeKB} KB)`);
    });
    console.log('');
    console.log('💡 To restore from this backup:');
    console.log(`   npm run restore-metadata ${timestamp}`);
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ ERROR during backup:');
    console.error(error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  backupMetadata();
}

module.exports = { backupMetadata };
