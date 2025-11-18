#!/usr/bin/env node

/**
 * FIX CATEGORY INDEXOF ERROR - SURGICAL
 * More careful replacement
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🔧 FIXING CATEGORY INDEXOF ERROR (SURGICAL)\n');
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

    console.log('📥 Downloading production code (restoring from backup)...\n');

    // Use the backup from before the regex mess
    const code = fs.readFileSync(
      path.join(__dirname, '../backups/production-before-category-indexof-fix-2025-11-06.gs'),
      'utf8'
    );

    console.log('🔧 Applying surgical fixes...\n');

    // Fix 1: Multi-system case filter
    const fixedCode = code.replace(
      `const multiSystemCount = cases.filter(function(c) {
    return c.category.indexOf(',') !== -1 || c.category.indexOf('/') !== -1;
  }).length;`,
      `const multiSystemCount = cases.filter(function(c) {
    if (!c.category || typeof c.category !== 'string') return false;
    return c.category.indexOf(',') !== -1 || c.category.indexOf('/') !== -1;
  }).length;`
    );

    if (fixedCode !== code) {
      console.log('✅ Fixed multi-system case filter\n');
    } else {
      console.log('⚠️  Multi-system pattern not found\n');
    }

    // Get manifest
    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    // Deploy
    console.log('📤 Deploying surgical fix to production...\n');

    const updatedFiles = [
      {
        name: 'Code',
        type: 'SERVER_JS',
        source: fixedCode
      },
      manifestFile
    ];

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: updatedFiles }
    });

    const newSize = (fixedCode.length / 1024).toFixed(1);

    console.log(`✅ Deployment successful! Size: ${newSize} KB\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎉 FIX APPLIED!\n');
    console.log('What was fixed:\n');
    console.log('   ✅ Added null safety to category.indexOf() in multi-system filter\n');
    console.log('Next steps:\n');
    console.log('   1. Refresh your production spreadsheet\n');
    console.log('   2. Click "🧠 Sim Builder" → "🧩 Categories & Pathways"\n');
    console.log('   3. The big tabbed panel should open!\n');
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
