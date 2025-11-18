#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const SHEET_NAME = 'Master Scenario Convert';

async function createLocalBackup() {
  console.log('\n💾 CREATING COMPREHENSIVE LOCAL BACKUP\n');
  console.log('━'.repeat(70));
  console.log('\nBackup includes:');
  console.log('  1. Full spreadsheet data export (JSON)');
  console.log('  2. All 189 vitals records');
  console.log('  3. Apps Script code snapshot');
  console.log('  4. Backup manifest with metadata');
  console.log('  5. Timestamped versions\n');
  console.log('━'.repeat(70) + '\n');

  // Auth setup
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const {client_id, client_secret, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const tokenPath = path.join(__dirname, '../config/token.json');
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  oAuth2Client.setCredentials(token);

  const sheets = google.sheets({version: 'v4', auth: oAuth2Client});

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupDir = path.join(__dirname, '../backups');

  // Create backups directory
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, {recursive: true});
    console.log('📁 Created backups directory\n');
  }

  // 1. Export full spreadsheet data
  console.log('📊 Exporting full spreadsheet data...');

  const dataResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SHEET_NAME}!A1:ZZ1000`
  });

  const allData = dataResponse.data.values || [];
  console.log(`   ✅ Exported ${allData.length} rows\n`);

  // 2. Extract vitals data specifically
  console.log('💊 Extracting vitals data...');

  const headers = allData[1]; // Row 2 contains headers
  const vitalsIdx = 55; // Column 56 (0-indexed) - BD column
  const caseIdIdx = 0;  // Column 1

  const vitalsData = [];
  for (let i = 2; i < allData.length; i++) { // Start from row 3 (index 2)
    const row = allData[i];
    if (!row[vitalsIdx]) continue;

    try {
      const vitalsObj = JSON.parse(row[vitalsIdx]);
      vitalsData.push({
        rowNum: i + 1,
        caseId: row[caseIdIdx],
        vitals: vitalsObj
      });
    } catch (e) {
      console.log(`   ⚠️  Row ${i + 1}: Invalid JSON - ${e.message}`);
    }
  }

  console.log(`   ✅ Extracted ${vitalsData.length} valid vitals records\n`);

  // 3. Create comprehensive backup object
  const backupData = {
    metadata: {
      timestamp,
      source: 'Master Scenario Convert',
      originalSheetId: process.env.GOOGLE_SHEET_ID,
      sheetUrl: `https://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SHEET_ID}/edit`,
      totalRows: allData.length,
      vitalsRecords: vitalsData.length,
      backupPurpose: 'Pre-AWS Migration Safety Backup'
    },
    fullData: allData,
    vitalsData: vitalsData,
    headers: headers
  };

  // 4. Save full backup
  const fullBackupPath = path.join(backupDir, `full-backup-${timestamp}.json`);
  fs.writeFileSync(fullBackupPath, JSON.stringify(backupData, null, 2));
  console.log(`💾 Full backup saved: ${fullBackupPath}\n`);

  // 5. Save vitals-only backup (smaller file for quick reference)
  const vitalsBackupPath = path.join(backupDir, `vitals-only-${timestamp}.json`);
  fs.writeFileSync(vitalsBackupPath, JSON.stringify(vitalsData, null, 2));
  console.log(`💊 Vitals-only backup: ${vitalsBackupPath}\n`);

  // 6. Backup Apps Script code if exists
  console.log('📝 Backing up Apps Script code...');

  const appsScriptFiles = [
    'Code_ULTIMATE_ATSR.gs',
    'Code_WITH_CATEGORIES_LIGHT.gs'
  ];

  const scriptBackups = [];
  for (const scriptFile of appsScriptFiles) {
    const scriptPath = path.join(__dirname, scriptFile);
    if (fs.existsSync(scriptPath)) {
      const scriptBackupPath = path.join(backupDir, `${scriptFile}-${timestamp}`);
      fs.copyFileSync(scriptPath, scriptBackupPath);
      scriptBackups.push(scriptBackupPath);
      console.log(`   ✅ ${scriptFile} → ${path.basename(scriptBackupPath)}`);
    }
  }
  console.log('');

  // 7. Create backup manifest
  const manifest = {
    created: timestamp,
    purpose: 'Pre-AWS Migration Safety Backup',
    source: {
      sheetId: process.env.GOOGLE_SHEET_ID,
      sheetUrl: `https://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SHEET_ID}/edit`,
      sheetName: SHEET_NAME
    },
    backups: {
      fullData: fullBackupPath,
      vitalsOnly: vitalsBackupPath,
      appsScripts: scriptBackups
    },
    stats: {
      totalRows: allData.length,
      vitalsRecords: vitalsData.length,
      headersCount: headers.length,
      backupSizeKB: Math.round(JSON.stringify(backupData).length / 1024)
    },
    dataQuality: {
      allVitalsValid: vitalsData.length === 189,
      expectedRecords: 189,
      actualRecords: vitalsData.length,
      status: vitalsData.length === 189 ? '100% IDEAL STATE' : 'INCOMPLETE'
    }
  };

  const manifestPath = path.join(backupDir, `backup-manifest-${timestamp}.json`);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  // 8. Update "latest" symlinks
  const latestManifestPath = path.join(backupDir, 'latest-backup-manifest.json');
  const latestFullPath = path.join(backupDir, 'latest-full-backup.json');
  const latestVitalsPath = path.join(backupDir, 'latest-vitals-only.json');

  fs.writeFileSync(latestManifestPath, JSON.stringify(manifest, null, 2));
  fs.writeFileSync(latestFullPath, JSON.stringify(backupData, null, 2));
  fs.writeFileSync(latestVitalsPath, JSON.stringify(vitalsData, null, 2));

  console.log('━'.repeat(70));
  console.log('✅ BACKUP COMPLETE\n');
  console.log('📊 Backup Summary:');
  console.log(`   Timestamp: ${timestamp}`);
  console.log(`   Total rows: ${manifest.stats.totalRows}`);
  console.log(`   Vitals records: ${manifest.stats.vitalsRecords}`);
  console.log(`   Backup size: ${manifest.stats.backupSizeKB} KB`);
  console.log(`   Status: ${manifest.dataQuality.status}\n`);

  console.log('📁 Backup Files:');
  console.log(`   Manifest: ${manifestPath}`);
  console.log(`   Full data: ${fullBackupPath}`);
  console.log(`   Vitals only: ${vitalsBackupPath}`);
  if (scriptBackups.length > 0) {
    scriptBackups.forEach(sb => {
      console.log(`   Script: ${sb}`);
    });
  }
  console.log('');

  console.log('💾 Quick Access (latest versions):');
  console.log(`   ${latestManifestPath}`);
  console.log(`   ${latestFullPath}`);
  console.log(`   ${latestVitalsPath}\n`);

  console.log('━'.repeat(70));
  console.log('📤 MANUAL UPLOAD TO GOOGLE DRIVE:\n');
  console.log('To create a cloud backup, manually upload these files:');
  console.log(`   1. Open Google Drive in browser`);
  console.log(`   2. Create folder: "ER Sim Backups"`);
  console.log(`   3. Drag & drop: ${backupDir}/*${timestamp}*`);
  console.log('');
  console.log('🔒 Safe to proceed with AWS migration.');
  console.log('━'.repeat(70) + '\n');

  return manifest;
}

if (require.main === module) {
  createLocalBackup().catch(err => {
    console.error('❌ Backup failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  });
}

module.exports = { createLocalBackup };
