#!/usr/bin/env node

/**
 * DEPLOY FIELD SELECTOR TO GOOGLE APPS SCRIPT
 *
 * Uses Apps Script API to deploy the integrated Phase2 file
 */

const {google} = require('googleapis');
const fs = require('fs');
const path = require('path');

const SCRIPT_ID = '1_mAQF84mD0hBF6IkUjpq6j82U6UcdnmZ1gUvdSWp_nxvj8t16vq4Y2Dc';

async function deploy() {
  console.log('\n🚀 DEPLOYING FIELD SELECTOR TO GOOGLE APPS SCRIPT\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Load credentials
  console.log('📖 Loading credentials...\n');
  const credentials = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/credentials.json'), 'utf8'));
  const token = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/token.json'), 'utf8'));

  // Create auth client
  const auth = new google.auth.OAuth2(
    credentials.installed.client_id,
    credentials.installed.client_secret,
    credentials.installed.redirect_uris[0]
  );
  auth.setCredentials(token);

  const script = google.script({version: 'v1', auth});

  // Read integrated file
  console.log('📖 Reading integrated Phase2 file...\n');
  const integratedCode = fs.readFileSync(
    path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs'),
    'utf8'
  );

  console.log(`✅ Read ${(integratedCode.length / 1024).toFixed(1)} KB\n`);

  // Get current project
  console.log('🔍 Fetching current project...\n');
  const {data: project} = await script.projects.getContent({
    scriptId: SCRIPT_ID
  });

  console.log(`✅ Found project with ${project.files.length} files\n`);

  // Find the Code file
  const codeFile = project.files.find(f => f.name === 'Categories_Pathways_Feature_Phase2');

  if (!codeFile) {
    console.error('❌ Could not find Categories_Pathways_Feature_Phase2 file!');
    process.exit(1);
  }

  console.log('📝 Updating file...\n');

  // Update the file
  codeFile.source = integratedCode;

  // Push to Apps Script
  console.log('☁️  Pushing to Google Apps Script...\n');

  await script.projects.updateContent({
    scriptId: SCRIPT_ID,
    requestBody: {
      files: project.files
    }
  });

  console.log('✅ Deployment successful!\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('✅ FIELD SELECTOR DEPLOYED!\n');
  console.log('Next steps:');
  console.log('  1. Open Google Sheet');
  console.log('  2. Click TEST Tools → 💾 Pre-Cache Rich Data');
  console.log('  3. Field selector modal should appear');
  console.log('  4. Select fields and test cache\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

deploy().catch(console.error);
