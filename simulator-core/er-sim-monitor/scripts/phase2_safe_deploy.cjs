#!/usr/bin/env node

/**
 * PHASE 2: SAFE DEPLOYMENT SCRIPT
 *
 * Steps:
 * 1. Download current production Code.gs
 * 2. Save backup to Google Drive with timestamp
 * 3. Show exact diff of what will change
 * 4. Wait for user approval
 * 5. Deploy Phase 2 files to Apps Script
 * 6. Verify deployment succeeded
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SCRIPT_ID = process.env.APPS_SCRIPT_ID;
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

// Files to deploy
const PHASE2_FILES = [
  'Phase2_AI_Scoring_Pathways.gs',
  'Phase2_Pathway_Discovery_UI.gs',
  'Phase2_Enhanced_Categories_Pathways_Panel.gs'
];

/**
 * Initialize Google Auth
 */
async function initAuth() {
  const credPath = path.join(__dirname, '../config/credentials.json');
  const tokenPath = path.join(__dirname, '../config/token.json');

  const credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);

  return oAuth2Client;
}

/**
 * Step 1: Download current production code
 */
async function downloadCurrentCode(auth) {
  console.log('\n📥 Step 1: Downloading current production code...\n');

  const script = google.script({ version: 'v1', auth });

  try {
    const response = await script.projects.getContent({
      scriptId: SCRIPT_ID
    });

    const files = response.data.files;
    console.log(`✅ Downloaded ${files.length} files from Apps Script project`);

    // Find Code.gs
    const codeFile = files.find(f => f.name === 'Code');
    if (!codeFile) {
      throw new Error('Code.gs not found in project');
    }

    console.log(`   📄 Code.gs: ${codeFile.source.length} characters\n`);

    return {
      allFiles: files,
      codeFile: codeFile
    };

  } catch (error) {
    console.error('❌ Error downloading code:', error.message);
    throw error;
  }
}

/**
 * Step 2: Save backup to Google Drive
 */
async function saveBackupToDrive(auth, codeContent) {
  console.log('💾 Step 2: Saving backup to Google Drive...\n');

  const drive = google.drive({ version: 'v3', auth });

  try {
    // Find "lost and found" folder
    const folderSearch = await drive.files.list({
      q: "name='lost and found' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    let folderId;
    if (folderSearch.data.files.length > 0) {
      folderId = folderSearch.data.files[0].id;
      console.log(`   ✅ Found folder: lost and found (${folderId})`);
    } else {
      throw new Error('lost and found folder not found');
    }

    // Create timestamped filename
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const filename = `phase2-pre-deployment-backup-${timestamp}.gs`;

    // Upload backup
    const fileMetadata = {
      name: filename,
      parents: [folderId]
    };

    const media = {
      mimeType: 'text/plain',
      body: codeContent
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink'
    });

    console.log(`   ✅ Backup saved: ${filename}`);
    console.log(`   🔗 Link: ${file.data.webViewLink}\n`);

    return file.data;

  } catch (error) {
    console.error('❌ Error saving backup:', error.message);
    throw error;
  }
}

/**
 * Step 3: Analyze what will change
 */
function analyzeChanges(currentCode) {
  console.log('🔍 Step 3: Analyzing changes...\n');

  // Find the two functions we need to comment out
  const openPanelRegex = /function openCategoriesPathwaysPanel\(\) \{[\s\S]*?\n\}/m;
  const buildMenuRegex = /function buildCategoriesPathwaysMainMenu_\(\) \{[\s\S]*?(?=\n\/\/|function |$)/m;

  const openPanelMatch = currentCode.match(openPanelRegex);
  const buildMenuMatch = currentCode.match(buildMenuRegex);

  if (!openPanelMatch) {
    console.log('   ⚠️  Warning: openCategoriesPathwaysPanel() not found - may already be modified');
  } else {
    console.log(`   ✅ Found openCategoriesPathwaysPanel() at position ${currentCode.indexOf(openPanelMatch[0])}`);
  }

  if (!buildMenuMatch) {
    console.log('   ⚠️  Warning: buildCategoriesPathwaysMainMenu_() not found - may already be modified');
  } else {
    console.log(`   ✅ Found buildCategoriesPathwaysMainMenu_() at position ${currentCode.indexOf(buildMenuMatch[0])}`);
  }

  console.log('\n📊 Changes Summary:');
  console.log('   ➕ Add 3 new files (Phase2_AI_Scoring_Pathways, etc.)');
  console.log('   ✏️  Comment out 2 functions in Code.gs');
  console.log('   ✅ Preserve all other code (no deletions)\n');

  return {
    openPanelFound: !!openPanelMatch,
    buildMenuFound: !!buildMenuMatch,
    openPanelMatch: openPanelMatch ? openPanelMatch[0] : null,
    buildMenuMatch: buildMenuMatch ? buildMenuMatch[0] : null
  };
}

/**
 * Step 4: Show exact diff
 */
function showExactDiff(analysis) {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📋 EXACT CHANGES THAT WILL BE MADE TO Code.gs');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('BEFORE (Current Code):');
  console.log('─────────────────────────────────────────────────────────────');
  if (analysis.openPanelMatch) {
    console.log(analysis.openPanelMatch.substring(0, 200) + '...\n');
  }
  if (analysis.buildMenuMatch) {
    console.log(analysis.buildMenuMatch.substring(0, 200) + '...\n');
  }

  console.log('AFTER (Modified Code):');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('// ========== REPLACED BY Phase2_Enhanced_Categories_Pathways_Panel.gs ==========');
  console.log('// These functions are now provided by the new file with enhanced tabbed UI');
  console.log('/*');
  if (analysis.openPanelMatch) {
    console.log(analysis.openPanelMatch.substring(0, 200) + '...');
  }
  if (analysis.buildMenuMatch) {
    console.log(analysis.buildMenuMatch.substring(0, 200) + '...');
  }
  console.log('*/\n');

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📦 NEW FILES THAT WILL BE ADDED');
  console.log('═══════════════════════════════════════════════════════════════\n');

  PHASE2_FILES.forEach((filename, idx) => {
    const filepath = path.join(__dirname, '../apps-script-deployable', filename);
    const content = fs.readFileSync(filepath, 'utf8');
    const lines = content.split('\n').length;
    const size = (content.length / 1024).toFixed(1);
    console.log(`${idx + 1}. ${filename}`);
    console.log(`   Lines: ${lines} | Size: ${size} KB`);
  });

  console.log('\n═══════════════════════════════════════════════════════════════\n');
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 PHASE 2 SAFE DEPLOYMENT\n');
  console.log('This script will:');
  console.log('  1. Download current production code');
  console.log('  2. Save backup to Google Drive');
  console.log('  3. Show exact changes');
  console.log('  4. Wait for your approval');
  console.log('  5. Deploy Phase 2 (if approved)\n');

  try {
    // Initialize auth
    const auth = await initAuth();

    // Step 1: Download current code
    const { allFiles, codeFile } = await downloadCurrentCode(auth);

    // Step 2: Save backup
    const backup = await saveBackupToDrive(auth, codeFile.source);

    // Step 3: Analyze changes
    const analysis = analyzeChanges(codeFile.source);

    // Step 4: Show exact diff
    showExactDiff(analysis);

    console.log('✅ BACKUP COMPLETE');
    console.log(`   Backup saved: ${backup.name}`);
    console.log(`   Link: ${backup.webViewLink}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  DEPLOYMENT READY - WAITING FOR MANUAL APPROVAL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('Review the changes above.');
    console.log('To deploy, run: node scripts/phase2_execute_deploy.cjs\n');

    // Save deployment state for next script
    const deployState = {
      timestamp: new Date().toISOString(),
      backupFile: backup.name,
      backupLink: backup.webViewLink,
      scriptId: SCRIPT_ID,
      analysis: analysis,
      currentFiles: allFiles.map(f => ({ name: f.name, type: f.type }))
    };

    fs.writeFileSync(
      path.join(__dirname, '../data/phase2_deploy_state.json'),
      JSON.stringify(deployState, null, 2)
    );

    console.log('💾 Deployment state saved to data/phase2_deploy_state.json\n');

  } catch (error) {
    console.error('\n❌ Deployment preparation failed:', error.message);
    process.exit(1);
  }
}

main();
