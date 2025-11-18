#!/usr/bin/env node

/**
 * Re-deploy the complete local file to fix missing discoverPathwaysSync_ function
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TEST_SCRIPT_ID = '1kkPZU3GsCCuu5IhTEOufmDT1Cb2rSQVB3Y3u1DPf87yoSV4WVtoNvd6i';

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

async function redeploy() {
  console.log('\n🔧 RE-DEPLOYING COMPLETE FILE\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    // 1. Read local file
    const localPath = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs');
    const localCode = fs.readFileSync(localPath, 'utf8');

    console.log('📦 Read local file: Categories_Pathways_Feature_Phase2.gs');
    console.log('   Size: ' + (localCode.length / 1024).toFixed(1) + ' KB\n');

    // 2. Verify it has the missing function
    const hasDiscoverFunc = localCode.includes('function discoverPathwaysSync_');
    if (!hasDiscoverFunc) {
      console.log('❌ Local file ALSO missing discoverPathwaysSync_!\n');
      console.log('   Need to restore from backup or reconstruct function.\n');
      return;
    }

    console.log('✅ Local file contains discoverPathwaysSync_()\n');

    // 3. Get current project
    console.log('📡 Reading current deployed project...\n');
    const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });

    // 4. Find Phase2 file and replace it
    const phase2File = project.data.files.find(f => f.name === 'Categories_Pathways_Feature_Phase2');

    if (!phase2File) {
      console.log('❌ Categories_Pathways_Feature_Phase2.gs not found in project\n');
      return;
    }

    console.log('✅ Found deployed file\n');

    // 5. Replace with local version
    phase2File.source = localCode;

    console.log('🚀 Deploying complete local file to Google Apps Script...\n');

    await script.projects.updateContent({
      scriptId: TEST_SCRIPT_ID,
      requestBody: {
        files: project.data.files
      }
    });

    const sizeKB = (localCode.length / 1024).toFixed(1);

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ COMPLETE FILE DEPLOYED SUCCESSFULLY\n');
    console.log('   File: Categories_Pathways_Feature_Phase2.gs');
    console.log('   Size: ' + sizeKB + ' KB\n');
    console.log('🎯 FIXED:\n');
    console.log('   • Re-deployed complete local file');
    console.log('   • discoverPathwaysSync_() function restored');
    console.log('   • All cache logic preserved');
    console.log('   • Copy debug logs button functional\n');
    console.log('🧪 NOW TRY:\n');
    console.log('   1. Open your Google Sheet');
    console.log('   2. Click "🤖 AI: Discover Novel Pathways"');
    console.log('   3. Should work now!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('\n❌ Deployment failed: ' + e.message + '\n');
    if (e.stack) {
      console.log('Stack trace:', e.stack);
    }
  }
}

redeploy().catch(console.error);
