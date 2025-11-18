#!/usr/bin/env node

/**
 * ADD COMPREHENSIVE ERROR LOGGING
 * Wrap entire showFieldSelector() in try-catch with detailed logging
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🔧 ADDING COMPREHENSIVE ERROR LOGGING\n');
console.log('═══════════════════════════════════════════════════════════════\n');

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

async function addLogging() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading production code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('🔧 Adding try-catch around recommendedFields call...\n');

    // Wrap the recommendedFields line in try-catch
    const oldLine = `  const recommendedFields = getStaticRecommendedFields_(availableFields, selectedFields);`;
    const newLines = `  let recommendedFields = [];
  try {
    Logger.log('📋 Step 3: Getting recommended fields...');
    Logger.log('   availableFields.length: ' + availableFields.length);
    Logger.log('   selectedFields.length: ' + selectedFields.length);
    recommendedFields = getStaticRecommendedFields_(availableFields, selectedFields);
    Logger.log('✅ Step 3 complete: ' + recommendedFields.length + ' recommended');
  } catch (recError) {
    Logger.log('❌ getStaticRecommendedFields_() ERROR: ' + recError.toString());
    Logger.log('   Stack: ' + recError.stack);
    // Continue with empty recommendations
  }`;

    if (code.includes(oldLine)) {
      code = code.replace(oldLine, newLines);
      console.log('✅ Added try-catch around recommendedFields\n');
    } else {
      console.log('⚠️  Pattern not found\n');
    }

    // Add logging before HTML creation
    const htmlStart = `  const html =`;
    const newHtmlStart = `  Logger.log('📋 Step 4: Building HTML modal...');
  Logger.log('   categoriesJson length: ' + categoriesJson.length);
  Logger.log('   selectedJson length: ' + selectedJson.length);
  Logger.log('   recommendedFields: ' + JSON.stringify(recommendedFields));
  const html =`;

    if (code.includes(htmlStart)) {
      code = code.replace(htmlStart, newHtmlStart);
      console.log('✅ Added logging before HTML creation\n');
    }

    // Backup
    const backupPath = path.join(__dirname, '../backups/production-before-error-logging-2025-11-06.gs');
    fs.writeFileSync(backupPath, codeFile.source, 'utf8');
    console.log(`💾 Backed up to: ${backupPath}\n`);

    // Deploy
    console.log('📤 Deploying to production...\n');

    const updatedFiles = [
      {
        name: 'Code',
        type: 'SERVER_JS',
        source: code
      },
      manifestFile
    ];

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: updatedFiles }
    });

    const newSize = (code.length / 1024).toFixed(1);

    console.log(`✅ Deployment successful! Size: ${newSize} KB\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎉 ERROR LOGGING ADDED!\n');
    console.log('Now when you click "Pre-Cache Rich Data":\n');
    console.log('   1. Logs will show exactly where it fails');
    console.log('   2. Check Apps Script → Executions tab for logs\n');
    console.log('Try clicking the button and then share what you see in:\n');
    console.log('Extensions → Apps Script → Executions (left sidebar)\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

addLogging();
