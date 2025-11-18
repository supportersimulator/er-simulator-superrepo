#!/usr/bin/env node

/**
 * EMERGENCY: Restore ATSR_Title_Generator_Feature.gs to TEST
 * We accidentally removed it when deploying Phase2
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

async function restore() {
  console.log('\n🚨 EMERGENCY RESTORE: Adding ATSR back to TEST\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    // Read ATSR from backup
    const atsrPath = path.join(__dirname, '../backups/lost-and-found-20251105-203821/ATSR_Title_Generator_Feature.gs');
    console.log('📥 Reading ATSR from Lost and Found backup...\n');

    if (!fs.existsSync(atsrPath)) {
      console.log('❌ Backup not found! Trying apps-script-deployable...\n');
      const altPath = path.join(__dirname, '../apps-script-deployable/ATSR_Title_Generator_Feature.gs');
      if (fs.existsSync(altPath)) {
        atsrCode = fs.readFileSync(altPath, 'utf8');
      } else {
        console.log('❌ No ATSR backup found!\n');
        return;
      }
    }

    const atsrCode = fs.readFileSync(atsrPath, 'utf8');
    console.log(`   ✅ Found ATSR backup (${Math.round(atsrCode.length / 1024)} KB)\n`);

    // Get current project
    const currentProject = await script.projects.getContent({
      scriptId: TEST_SCRIPT_ID
    });

    // Preserve existing files and ADD ATSR
    const files = currentProject.data.files.map(f => ({
      name: f.name,
      type: f.type,
      source: f.source
    }));

    // Add ATSR (as "Code" for compatibility)
    files.push({
      name: 'Code',
      type: 'SERVER_JS',
      source: atsrCode
    });

    console.log('🚀 Deploying with both ATSR and Phase2...\n');
    console.log('   Files in deployment:');
    files.forEach(f => {
      console.log(`   • ${f.name} (${f.type})`);
    });
    console.log('');

    await script.projects.updateContent({
      scriptId: TEST_SCRIPT_ID,
      requestBody: { files: files }
    });

    console.log('✅ Successfully restored!\n');

    // Verify
    const updatedProject = await script.projects.getContent({
      scriptId: TEST_SCRIPT_ID
    });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📋 FILES NOW IN TEST PROJECT:\n');
    updatedProject.data.files.forEach(f => {
      const size = f.source ? Math.round(f.source.length / 1024) + ' KB' : '';
      console.log(`   • ${f.name} (${f.type}) ${size}`);
    });

    const hasATSR = updatedProject.data.files.some(f => f.name === 'Code');
    const hasPhase2 = updatedProject.data.files.some(f => f.name === 'Categories_Pathways_Feature_Phase2');

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(hasATSR && hasPhase2 ? '✅ BOTH FILES RESTORED!' : '⚠️  Something may be missing');
    console.log('');
    console.log(`   ${hasATSR ? '✅' : '❌'} ATSR (Code file with TEST Tools menu)`);
    console.log(`   ${hasPhase2 ? '✅' : '❌'} Categories & Pathways Phase2\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');
    if (e.stack) {
      console.log(e.stack);
    }
  }
}

restore().catch(console.error);
