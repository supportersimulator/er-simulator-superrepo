#!/usr/bin/env node

/**
 * TEMPORARILY USE STATIC RECOMMENDATIONS
 * Switch from ChatGPT API to static recommendations to unblock field selector
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🔧 TEMPORARILY USING STATIC RECOMMENDATIONS\n');
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

async function useStatic() {
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

    console.log('🔧 Finding call to getRecommendedFields_() in showFieldSelector()...\n');

    // Find where showFieldSelector calls getRecommendedFields_
    const callPattern = /const recommended = getRecommendedFields_\(availableFields, selected\);/;

    if (code.match(callPattern)) {
      code = code.replace(
        callPattern,
        'const recommended = getStaticRecommendedFields_(availableFields, selected); // TEMP: Using static instead of ChatGPT'
      );
      console.log('✅ Switched to getStaticRecommendedFields_() temporarily\n');
    } else {
      console.log('⚠️  Pattern not found, trying alternative...\n');

      // Try finding any call to getRecommendedFields_
      const altPattern = /getRecommendedFields_\(/g;
      if (code.match(altPattern)) {
        code = code.replace(altPattern, 'getStaticRecommendedFields_(');
        console.log('✅ Replaced all calls to getRecommendedFields_ with getStaticRecommendedFields_\n');
      }
    }

    // Backup
    const backupPath = path.join(__dirname, '../backups/production-before-static-recommendations-2025-11-06.gs');
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
    console.log('🎉 USING STATIC RECOMMENDATIONS TEMPORARILY!\n');
    console.log('Now when you click "Pre-Cache Rich Data":\n');
    console.log('   1. Field selector will load FAST (no API call)');
    console.log('   2. Recommendations come from static list');
    console.log('   3. All 3 sections will display immediately!\n');
    console.log('Close the current dialog and click "Pre-Cache Rich Data" again.\n');
    console.log('Once working, we can investigate ChatGPT API timeout separately.\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

useStatic();
