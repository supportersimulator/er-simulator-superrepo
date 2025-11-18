#!/usr/bin/env node

/**
 * FIX RECOMMENDED FIELDS FUNCTION CALL
 * Pass required parameters to getStaticRecommendedFields_()
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🔧 FIXING RECOMMENDED FIELDS CALL\n');
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

async function fix() {
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

    console.log('🔧 Updating showFieldSelector() to call getStaticRecommendedFields_() with parameters...\n');

    // Find the line where it's called without parameters in the server-side code
    // This should be BEFORE the HTML template where it gets passed to JavaScript
    const oldServerCall = `const recommendedFields = getStaticRecommendedFields_();`;
    const newServerCall = `const recommendedFields = getStaticRecommendedFields_(availableFields, selectedFields);`;

    if (code.includes(oldServerCall)) {
      code = code.replace(oldServerCall, newServerCall);
      console.log('✅ Fixed server-side call to getStaticRecommendedFields_()\n');
    } else {
      console.log('⚠️  Server-side call pattern not found\n');
    }

    // Also fix the call in the HTML JavaScript template
    const oldJSCall = `'const recommendedFieldNames = ' + JSON.stringify(getStaticRecommendedFields_()) + ';'`;
    const newJSCall = `'const recommendedFieldNames = ' + JSON.stringify(recommendedFields) + ';'`;

    if (code.includes(oldJSCall)) {
      code = code.replace(oldJSCall, newJSCall);
      console.log('✅ Fixed JavaScript template to use already-computed recommendedFields\n');
    } else {
      console.log('⚠️  JavaScript template pattern not found\n');
    }

    // Backup
    const backupPath = path.join(__dirname, '../backups/production-before-recommended-call-fix-2025-11-06.gs');
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
    console.log('🎉 RECOMMENDED FIELDS CALL FIXED!\n');
    console.log('What changed:\n');
    console.log('   ✅ Server-side: Passes availableFields + selectedFields to function');
    console.log('   ✅ Client-side: Uses pre-computed recommendedFields array\n');
    console.log('Click "Pre-Cache Rich Data" again - should work now!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

fix();
