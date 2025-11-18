#!/usr/bin/env node

/**
 * RESTORE AND FIX MODAL
 * Restore from last good state (build3SectionUI) then make modal bigger and simpler fixes only
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

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

async function restore() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading current (broken) code for backup...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    // Backup the broken version
    const backupPath = path.join(__dirname, '../backups/production-broken-syntax-2025-11-07.gs');
    fs.writeFileSync(backupPath, codeFile.source, 'utf8');
    console.log('💾 Backed up broken version\n');

    // Read the last good backup (before our changes today)
    const restorePath = path.join(__dirname, '../backups/production-before-all-underscores-fixed-2025-11-06.gs');
    let code = fs.readFileSync(restorePath, 'utf8');

    console.log('📦 Loaded last good backup (from Nov 6)\n');
    console.log('🔧 Now applying ONLY safe, tested fixes...\n');

    // Fix 1: Remove trailing underscores (we know this works)
    code = code.replace(/function getFieldSelectorData_\(\)/g, 'function getFieldSelectorData()');
    code = code.replace(/getFieldSelectorData_\(\)/g, 'getFieldSelectorData()');
    code = code.replace(/function getStaticRecommendedFields_\(/g, 'function getStaticRecommendedFields(');
    code = code.replace(/getStaticRecommendedFields_\(/g, 'getStaticRecommendedFields(');
    code = code.replace(/function getDefaultFieldNames_\(\)/g, 'function getDefaultFieldNames()');
    code = code.replace(/getDefaultFieldNames_\(\)/g, 'getDefaultFieldNames()');
    console.log('✅ Fixed trailing underscores\n');

    // Fix 2: Make modal bigger (simple find/replace)
    if (code.includes('.setWidth(900)')) {
      code = code.replace('.setWidth(900)', '.setWidth(1100)');
      console.log('✅ Increased width to 1100\n');
    }
    if (code.includes('.setHeight(750)')) {
      code = code.replace('.setHeight(750)', '.setHeight(800)');
      console.log('✅ Increased height to 800\n');
    }

    // Deploy
    console.log('📤 Deploying restored + fixed code...\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🔄 RESTORED TO WORKING STATE + BIGGER MODAL\n');
    console.log('Changes:\n');
    console.log('  ✅ Restored from last known good backup (Nov 6)\n');
    console.log('  ✅ Re-applied trailing underscore fixes (tested, working)\n');
    console.log('  ✅ Made modal bigger: 1100x800\n');
    console.log('\nTry "Pre-Cache Rich Data" - should work again!\n');
    console.log('We can iterate on layout improvements from this stable base.\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

restore();
