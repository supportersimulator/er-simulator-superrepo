#!/usr/bin/env node

/**
 * DEPLOY ALL FILES TO TEST SPREADSHEET
 *
 * Deploys all three essential files:
 * 1. Code.gs (batch processing, original 61+ functions)
 * 2. Categories_Pathways_Feature_Phase2.gs (field selector + AI recommendations)
 * 3. ATSR_Title_Generator_Feature.gs (pathway chain builder)
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

console.log('\n🚀 DEPLOYING ALL FILES TO TEST\n');
console.log('═══════════════════════════════════════════════════════════════\n');

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

async function deploy() {
  try {
    // Authenticate with OAuth
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    // Pull current project to get Code.gs and manifest
    console.log('📥 Pulling current TEST project...\n');
    const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });

    // Get existing Code.gs from TEST
    const codeFile = project.data.files.find(f => f.name === 'Code');
    if (!codeFile) {
      console.error('❌ Code.gs not found in TEST project!');
      process.exit(1);
    }

    // Read Phase2 and ATSR from local
    const phase2Path = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs');
    const atsrPath = path.join(__dirname, '../apps-script-deployable/ATSR_Title_Generator_Feature.gs');

    const phase2Content = fs.readFileSync(phase2Path, 'utf8');
    const atsrContent = fs.readFileSync(atsrPath, 'utf8');

    const codeSizeKB = Math.round(codeFile.source.length / 1024);
    const phase2SizeKB = Math.round(phase2Content.length / 1024);
    const atsrSizeKB = Math.round(atsrContent.length / 1024);

    console.log('📋 Files to deploy:\n');
    console.log(`   1. Code.gs: ${codeSizeKB} KB (batch processing, from TEST - unchanged)`);
    console.log(`   2. Categories_Pathways_Feature_Phase2.gs: ${phase2SizeKB} KB (field selector + AI)`);
    console.log(`   3. ATSR_Title_Generator_Feature.gs: ${atsrSizeKB} KB (pathway chain builder - RESTORED)\n`);

    // Build updated files array
    const updatedFiles = [
      {
        name: 'Code',
        type: 'SERVER_JS',
        source: codeFile.source  // Preserve existing Code.gs unchanged
      },
      {
        name: 'Categories_Pathways_Feature_Phase2',
        type: 'SERVER_JS',
        source: phase2Content
      },
      {
        name: 'ATSR_Title_Generator_Feature',
        type: 'SERVER_JS',
        source: atsrContent
      }
    ];

    // Add appsscript.json manifest
    const manifestFile = project.data.files.find(f => f.name === 'appsscript');
    if (manifestFile) {
      updatedFiles.push(manifestFile);
    }

    console.log('🚀 Deploying to TEST...\n');

    // Deploy
    await script.projects.updateContent({
      scriptId: TEST_SCRIPT_ID,
      requestBody: {
        files: updatedFiles
      }
    });

    console.log('✅ DEPLOYMENT SUCCESSFUL!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎉 ALL FILES DEPLOYED TO TEST!\n');
    console.log('Deployed files:\n');
    console.log(`   • Code.gs: ${codeSizeKB} KB`);
    console.log(`   • Categories_Pathways_Feature_Phase2.gs: ${phase2SizeKB} KB`);
    console.log(`   • ATSR_Title_Generator_Feature.gs: ${atsrSizeKB} KB\n`);
    console.log('Next steps:\n');
    console.log('   1. Refresh TEST spreadsheet');
    console.log('   2. Try pathway chain builder (should work now)');
    console.log('   3. Try field selector with AI recommendations\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ DEPLOYMENT FAILED:', error.message);
    if (error.response) {
      console.error('   Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

deploy();
