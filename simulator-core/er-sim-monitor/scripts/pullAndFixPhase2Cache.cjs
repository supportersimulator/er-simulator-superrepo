#!/usr/bin/env node

/**
 * Pull, Fix, and Deploy Phase2 with 27-Field Cache + 25-Row Batching
 *
 * This script:
 * 1. Pulls current Categories_Pathways_Feature_Phase2.gs from TEST
 * 2. Creates backup
 * 3. Adds comprehensive 27-field mapping
 * 4. Implements 25-row batch processing
 * 5. Adds helper functions
 * 6. Deploys back to TEST
 * 7. Keeps Code.gs (ATSR menu) untouched
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TEST_SCRIPT_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf';

async function authorize() {
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const tokenPath = path.join(__dirname, '../config/token.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

async function main() {
  console.log('\n🔧 PHASE 2 CACHE FIX - 27 FIELDS + BATCH PROCESSING\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    // STEP 1: Pull current files from TEST
    console.log('📥 STEP 1: Pulling current files from TEST...\n');
    const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });

    const phase2File = project.data.files.find(f => f.name === 'Categories_Pathways_Feature_Phase2');
    const codeFile = project.data.files.find(f => f.name === 'Code');
    const manifestFile = project.data.files.find(f => f.name === 'appsscript');

    if (!phase2File) {
      throw new Error('Categories_Pathways_Feature_Phase2.gs not found in TEST!');
    }

    console.log(`✅ Found Phase2: ${Math.round(phase2File.source.length / 1024)} KB`);
    console.log(`✅ Found Code.gs: ${Math.round(codeFile.source.length / 1024)} KB (keeping untouched)`);
    console.log('');

    // STEP 2: Create backup
    console.log('💾 STEP 2: Creating backup...\n');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupDir = path.join(__dirname, `../backups/phase2-before-cache-fix-${timestamp}`);
    fs.mkdirSync(backupDir, { recursive: true });
    fs.writeFileSync(path.join(backupDir, 'Categories_Pathways_Feature_Phase2.gs'), phase2File.source, 'utf8');
    console.log(`✅ Backup saved to: ${backupDir}`);
    console.log('');

    // STEP 3: Apply fixes to Phase2
    console.log('🔧 STEP 3: Applying fixes to Phase2...\n');

    let fixedCode = phase2File.source;

    // Find the performHolisticAnalysis_() function
    const funcStart = fixedCode.indexOf('function performHolisticAnalysis_()');
    if (funcStart === -1) {
      throw new Error('Could not find performHolisticAnalysis_() function!');
    }

    console.log('   Found performHolisticAnalysis_() at position ' + funcStart);
    console.log('');

    // TODO: Apply the actual code changes here
    // For now, just save the current version
    console.log('⚠️  Code modification not yet implemented');
    console.log('   This script will be completed in next step');
    console.log('');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ PHASE 1 COMPLETE: Pull and Backup');
    console.log('');
    console.log('Next steps:');
    console.log('   1. Review backup at: ' + backupDir);
    console.log('   2. Implement code changes');
    console.log('   3. Deploy to TEST');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');
    if (e.stack) console.log(e.stack);
  }
}

main().catch(console.error);
