#!/usr/bin/env node

/**
 * Comprehensive Code Backup System for Google Drive
 *
 * Uploads all 187 script files organized by workflow phase (12 categories)
 * Creates folder structure: Backups → Code Backups → [Phase Folders]
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SHEET_ID = process.env.GOOGLE_SHEET_ID || '1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM';

// Workflow phase organization (matches WORKFLOW_TOOLS_MASTER.md)
const PHASE_ORGANIZATION = {
  'Phase 1 - Source Material Preparation': [
    'ecg-to-svg-converter.html',
    'ecg-save-server.cjs',
    'migrateWaveformNaming.cjs',
    'updateWaveformRegistry.cjs',
    'fetchVitalsFromSheetsOAuth.js',
    'fetchVitalsFromSheetsSecure.js',
    'GoogleSheetsAppsScript.js',
    'GoogleSheetsAppsScript_Enhanced.js',
    'syncVitalsToSheets.js',
    'liveSyncServer.js'
  ],
  'Phase 2 - Input Validation': [
    'validateVitalsJSON.cjs',
    'fetchSampleRows.cjs',
    'analyzeDuplicateScenarios.cjs'
  ],
  'Phase 3 - Scenario Generation': [
    'addClinicalDefaults.cjs',
    'addClinicalDefaultsToAppsScript.cjs',
    'testClinicalDefaults.cjs'
  ],
  'Phase 4 - Quality Scoring & Analysis': [
    'validateBatchQuality.cjs',
    'qualityProgressionAnalysis.cjs',
    'compareDataQuality.cjs',
    'analyzeLastThreeRows.cjs',
    'checkRowFields.cjs',
    'compareMultipleRows.cjs',
    'compareRows189and190.cjs',
    'compareWithBackup.cjs',
    'investigateInvalidWaveforms.cjs'
  ],
  'Phase 5 - Title & Metadata Enhancement': [
    'addCategoryColumn.cjs',
    'categoriesAndPathwaysTool.cjs',
    'consolidatePathways.cjs',
    'consolidateRowPathways.cjs',
    'addColorCoding.cjs',
    'enhanceTitleGeneration.cjs',
    'testATSRPrompt.cjs'
  ],
  'Phase 6 - Media Management': [
    'validateMediaURLs.cjs',
    'analyzeMediaURLsDetail.cjs'
  ],
  'Phase 7 - Batch Reports & Monitoring': [
    'createBatchReportsSheet.cjs',
    'checkBatchStatus.cjs',
    'verifyBatchTool.cjs',
    'checkBatchProgress.cjs',
    'checkLatestBatchDetails.cjs',
    'checkResults.cjs',
    'debugBatchQueue.cjs',
    'diagnoseLoggingSystem.cjs',
    'analyzeLiveLogging.cjs',
    'enableLogsForAllModes.cjs'
  ],
  'Phase 8 - Backup & Version Control': [
    'createComprehensiveBackup.cjs',
    'createLocalBackup.cjs',
    'restoreATSRComplete.cjs',
    'restoreOriginalATSR.cjs',
    'restorePreviousAppsScriptVersion.cjs',
    'backupAppsScriptProject.cjs',
    'backupAllVersions.cjs',
    'createVersionSnapshot.cjs',
    'backupMetadataConfig.cjs',
    'restoreMetadataConfig.cjs',
    'compareAppsScriptVersions.cjs',
    'trackCodeChanges.cjs',
    'rollbackToVersion.cjs'
  ],
  'Phase 9 - Deployment & Distribution': [
    'deployATSR.cjs',
    'deployATSRNoCaseID.cjs',
    'deployCategoriesPanel.cjs',
    'deployRestoredFinal.cjs',
    'deployUltimateFixed.cjs',
    'fetchCurrentAppsScript.cjs',
    'updateDeploymentVersion.cjs',
    'setupWebAppEndpoint.cjs',
    'deployScriptLibrary.cjs',
    'publishWebApp.cjs',
    'updateWebAppConfig.cjs',
    'testWebAppDeployment.cjs'
  ],
  'Phase 10 - Testing & Validation': [
    'testBatchProcessing.cjs',
    'verifySetup.cjs',
    'testAllWorkflowTools.cjs',
    'testATSREnhancements.cjs',
    'validateRowDetection.cjs',
    'testQualityScoring.cjs',
    'verifyDuplicateDetection.cjs',
    'testBatchReporting.cjs',
    'validateSystemIntegrity.cjs'
  ],
  'Phase 11 - Analytics & Dashboards': [
    'createDashboard.cjs',
    'generateAnalyticsDashboard.cjs',
    'createInteractiveDashboard.cjs',
    'analyzeSheetStructure.cjs',
    'exportDashboardHTML.cjs',
    'generateSystemMetrics.cjs'
  ],
  'Phase 12 - Optimization & Maintenance': [
    'standardizeAllVitals.cjs',
    'repairAllVitalsJSON.cjs',
    'findMissingVitals.cjs',
    'fixMalformedVitals.cjs',
    'validateAllVitals.cjs',
    'setOpenAIKey.cjs',
    'rotateAPIKeys.cjs',
    'enhanceRowDetection.cjs',
    'optimizeSheetPerformance.cjs',
    'cleanupDuplicateRows.cjs',
    'archiveOldBatches.cjs',
    'optimizeQualityScoring.cjs'
  ],
  'Apps Script Code Variants': [
    'Code_ULTIMATE_ATSR.gs',
    'Code_WITH_CATEGORIES_LIGHT.gs',
    'Code_ATSR_NO_CASEID.gs',
    'Code_ENHANCED.gs',
    'Code_LIGHTWEIGHT.gs',
    'Code_RESTORED_FINAL.gs',
    'Code_RESTORED_ORIGINAL.gs',
    'Code_WITH_SMART_DUPLICATION.gs',
    'Code_WITH_ENHANCED_TITLE_GEN.gs',
    'Code_WITH_PATHWAY_CONSOLIDATION.gs',
    'Code_WITH_COLOR_CODING.gs',
    'Code_MONOLITHIC.gs',
    'Code_MODULAR_BASE.gs'
  ],
  'System Builders & Code Generators': [
    'createFullProject.cjs',
    'buildFromScratch.cjs',
    'mergeAllCode.cjs',
    'generateAppsScriptBundle.cjs',
    'createToolsWorkflowSheet.cjs',
    'generateAllToolsDocs.cjs',
    'createProjectStructure.cjs'
  ],
  'Additional Tools & Utilities': [
    'importEmsimFinal.cjs',
    'run100percentIdealState.cjs',
    'setupDriveFolders.cjs',
    'organizeProjectFiles.cjs',
    'searchCodeFor.cjs',
    'findAllReferences.cjs',
    'deleteEmptyRows.cjs',
    'trimWhitespace.cjs',
    'normalizeLineEndings.cjs'
  ]
};

async function createPhaseFolder(drive, parentFolderId, phaseName) {
  console.log(`  📁 Creating folder: ${phaseName}`);

  // Check if folder already exists
  const searchResponse = await drive.files.list({
    q: `name='${phaseName}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive'
  });

  if (searchResponse.data.files.length > 0) {
    console.log(`     ✓ Folder exists: ${phaseName}`);
    return searchResponse.data.files[0].id;
  }

  // Create new folder
  const folderMetadata = {
    name: phaseName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentFolderId]
  };

  const folder = await drive.files.create({
    requestBody: folderMetadata,
    fields: 'id'
  });

  console.log(`     ✓ Created folder: ${phaseName}`);
  return folder.data.id;
}

async function uploadFile(drive, folderId, filePath, fileName) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`     ⚠️  File not found: ${fileName}`);
      return { status: 'not_found', fileName };
    }

    // Check if file already exists
    const searchResponse = await drive.files.list({
      q: `name='${fileName}' and '${folderId}' in parents and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const fileSize = Buffer.byteLength(fileContent, 'utf8');
    const mimeType = fileName.endsWith('.html') ? 'text/html' :
                     fileName.endsWith('.gs') ? 'text/plain' :
                     fileName.endsWith('.js') ? 'text/javascript' :
                     'text/plain';

    const media = {
      mimeType,
      body: fs.createReadStream(filePath)
    };

    if (searchResponse.data.files.length > 0) {
      // Update existing file
      const fileId = searchResponse.data.files[0].id;
      await drive.files.update({
        fileId,
        media,
        fields: 'id, name, size'
      });
      console.log(`     ✓ Updated: ${fileName} (${Math.round(fileSize / 1024)}KB)`);
      return { status: 'updated', fileName, size: fileSize };
    } else {
      // Create new file
      const requestBody = {
        name: fileName,
        parents: [folderId]
      };
      await drive.files.create({
        requestBody,
        media,
        fields: 'id, name, size'
      });
      console.log(`     ✓ Uploaded: ${fileName} (${Math.round(fileSize / 1024)}KB)`);
      return { status: 'created', fileName, size: fileSize };
    }
  } catch (error) {
    console.log(`     ❌ Error uploading ${fileName}: ${error.message}`);
    return { status: 'error', fileName, error: error.message };
  }
}

async function backupAllCodeToDrive() {
  console.log('\n📦 COMPREHENSIVE CODE BACKUP TO GOOGLE DRIVE\n');
  console.log('Uploading all 187 script files organized by workflow phase...\n');

  // Load credentials and authenticate
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const tokenPath = path.join(__dirname, '../config/token.json');
  const folderMapPath = path.join(__dirname, '../config/drive-folders.json');

  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const folderMap = JSON.parse(fs.readFileSync(folderMapPath, 'utf8'));

  const { client_id, client_secret } = credentials.installed || credentials.web;
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, 'http://localhost');
  oauth2Client.setCredentials(token);

  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  // Get Code Backups folder ID
  const codeBackupsFolderId = folderMap.structure['💾 Backups'].subfolders['Code Backups'];
  console.log(`Using Code Backups folder ID: ${codeBackupsFolderId}\n`);

  // Statistics
  let totalFiles = 0;
  let uploadedFiles = 0;
  let updatedFiles = 0;
  let notFoundFiles = 0;
  let errorFiles = 0;
  let totalSize = 0;
  const uploadResults = [];

  // Process each phase
  for (const [phaseName, files] of Object.entries(PHASE_ORGANIZATION)) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📂 ${phaseName}`);
    console.log(`${'='.repeat(60)}`);

    // Create phase folder
    const phaseFolderId = await createPhaseFolder(drive, codeBackupsFolderId, phaseName);

    // Upload all files in this phase
    for (const fileName of files) {
      totalFiles++;
      const filePath = path.join(__dirname, fileName);
      const result = await uploadFile(drive, phaseFolderId, filePath, fileName);

      uploadResults.push({ phase: phaseName, ...result });

      if (result.status === 'created') uploadedFiles++;
      else if (result.status === 'updated') updatedFiles++;
      else if (result.status === 'not_found') notFoundFiles++;
      else if (result.status === 'error') errorFiles++;

      if (result.size) totalSize += result.size;
    }
  }

  // Also backup additional unorganized scripts
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📂 Additional Scripts (Unorganized)`);
  console.log(`${'='.repeat(60)}`);

  const additionalFolderId = await createPhaseFolder(drive, codeBackupsFolderId, 'Additional Scripts');

  // Get all script files
  const allScripts = fs.readdirSync(path.join(__dirname))
    .filter(f => f.endsWith('.cjs') || f.endsWith('.js') || f.endsWith('.gs') || f.endsWith('.html'));

  // Find scripts not in any phase
  const organizedScripts = Object.values(PHASE_ORGANIZATION).flat();
  const unorganizedScripts = allScripts.filter(f => !organizedScripts.includes(f));

  console.log(`  Found ${unorganizedScripts.length} additional scripts to backup\n`);

  for (const fileName of unorganizedScripts) {
    totalFiles++;
    const filePath = path.join(__dirname, fileName);
    const result = await uploadFile(drive, additionalFolderId, filePath, fileName);

    uploadResults.push({ phase: 'Additional Scripts', ...result });

    if (result.status === 'created') uploadedFiles++;
    else if (result.status === 'updated') updatedFiles++;
    else if (result.status === 'not_found') notFoundFiles++;
    else if (result.status === 'error') errorFiles++;

    if (result.size) totalSize += result.size;
  }

  // Generate backup manifest
  console.log(`\n${'='.repeat(60)}`);
  console.log('📋 GENERATING BACKUP MANIFEST');
  console.log(`${'='.repeat(60)}\n`);

  const manifest = {
    backupDate: new Date().toISOString(),
    totalFiles,
    uploadedFiles,
    updatedFiles,
    notFoundFiles,
    errorFiles,
    totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    phases: Object.keys(PHASE_ORGANIZATION).length + 1,
    details: uploadResults
  };

  const manifestPath = path.join(__dirname, '../docs/CODE_BACKUP_MANIFEST.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`✅ Manifest saved to: ${manifestPath}`);

  // Upload manifest to Drive
  const manifestMedia = {
    mimeType: 'application/json',
    body: fs.createReadStream(manifestPath)
  };

  const manifestRequestBody = {
    name: `CODE_BACKUP_MANIFEST_${new Date().toISOString().split('T')[0]}.json`,
    parents: [codeBackupsFolderId]
  };

  await drive.files.create({
    requestBody: manifestRequestBody,
    media: manifestMedia
  });
  console.log(`✅ Manifest uploaded to Google Drive\n`);

  // Print summary
  console.log(`${'='.repeat(60)}`);
  console.log('📊 BACKUP SUMMARY');
  console.log(`${'='.repeat(60)}`);
  console.log(`  Total Files Processed:  ${totalFiles}`);
  console.log(`  ✅ New Uploads:          ${uploadedFiles}`);
  console.log(`  🔄 Updated Files:        ${updatedFiles}`);
  console.log(`  ⚠️  Files Not Found:     ${notFoundFiles}`);
  console.log(`  ❌ Upload Errors:        ${errorFiles}`);
  console.log(`  📦 Total Size:           ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`  📁 Phases Created:       ${Object.keys(PHASE_ORGANIZATION).length + 1}`);
  console.log(`${'='.repeat(60)}\n`);

  console.log('✅ COMPREHENSIVE CODE BACKUP COMPLETE!\n');
  console.log('📍 Location: Google Drive → ER Simulator Dev → Backups → Code Backups\n');

  return manifest;
}

// Run backup
backupAllCodeToDrive().catch(console.error);
