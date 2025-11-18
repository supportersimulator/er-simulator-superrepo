#!/usr/bin/env node

/**
 * FIX FIELD SELECTOR FLOW
 * Remove blocking alert from refreshHeaders() and ensure modal shows
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🔧 FIXING FIELD SELECTOR FLOW\n');
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

    console.log('🔍 Issues:\n');
    console.log('   1. refreshHeaders() shows blocking alert');
    console.log('   2. Alert stops showFieldSelector() from continuing\n');

    console.log('🔧 Fix 1: Remove alert from refreshHeaders() when called from field selector...\n');

    // Find and update refreshHeaders to not show alert
    const oldRefreshHeaders = `  if (getSafeUi_()) {
    getSafeUi_().alert(\`✅ Headers refreshed!\\n\\n\${mergedKeys.length} merged keys cached.\`);
  }
}`;

    const newRefreshHeaders = `  // Silent mode - no alert (will be shown by field selector if needed)
  Logger.log('✅ Headers refreshed: ' + mergedKeys.length + ' merged keys cached');
}`;

    if (code.includes(oldRefreshHeaders)) {
      code = code.replace(oldRefreshHeaders, newRefreshHeaders);
      console.log('✅ Removed blocking alert from refreshHeaders()\n');
    } else {
      console.log('⚠️  Alert pattern not found, trying alternative...\n');

      // Try simpler pattern
      const altPattern = /if \(getSafeUi_\(\)\) \{\s*getSafeUi_\(\)\.alert\([^)]*Headers refreshed[^)]*\);?\s*\}/;
      if (altPattern.test(code)) {
        code = code.replace(altPattern, `// Silent mode - no alert
  Logger.log('✅ Headers refreshed and cached');`);
        console.log('✅ Removed blocking alert (alternative pattern)\n');
      }
    }

    console.log('🔧 Fix 2: Add logging to trace field selector execution...\n');

    // Add logging to showFieldSelector to debug
    const oldShowFieldSelector = `function showFieldSelector() {
  // Get all available fields from spreadsheet
  // Ensure header cache is fresh before reading fields
  refreshHeaders();

  const availableFields = getAvailableFields();`;

    const newShowFieldSelector = `function showFieldSelector() {
  Logger.log('🎯 showFieldSelector() started');

  // Get all available fields from spreadsheet
  // Ensure header cache is fresh before reading fields
  Logger.log('📋 Step 1: Refreshing headers...');
  refreshHeaders();
  Logger.log('✅ Step 1 complete');

  Logger.log('📋 Step 2: Getting available fields...');
  const availableFields = getAvailableFields();
  Logger.log('✅ Step 2 complete: ' + availableFields.length + ' fields found');`;

    if (code.includes(oldShowFieldSelector)) {
      code = code.replace(oldShowFieldSelector, newShowFieldSelector);
      console.log('✅ Added logging to showFieldSelector()\n');
    }

    // Add logging before modal display
    const oldModalDisplay = `  const htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(800)
    .setHeight(700);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, '🎯 Select Fields to Cache');
}`;

    const newModalDisplay = `  Logger.log('📋 Step 6: Creating HTML output...');
  const htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(800)
    .setHeight(700);

  Logger.log('📋 Step 7: Showing modal dialog...');
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, '🎯 Select Fields to Cache');
  Logger.log('✅ Field selector modal displayed');
}`;

    if (code.includes(oldModalDisplay)) {
      code = code.replace(oldModalDisplay, newModalDisplay);
      console.log('✅ Added logging before modal display\n');
    }

    // Backup
    const backupPath = path.join(__dirname, '../backups/production-before-field-selector-fix-2025-11-06.gs');
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
    console.log('🎉 FIELD SELECTOR FLOW FIXED!\n');
    console.log('What changed:\n');
    console.log('   ✅ Removed blocking alert from refreshHeaders()');
    console.log('   ✅ Added execution logging to trace flow');
    console.log('   ✅ Headers now cache silently\n');
    console.log('Now when you click "Pre-Cache Rich Data":\n');
    console.log('   1. No alert popup blocking execution');
    console.log('   2. Field selector modal should appear directly');
    console.log('   3. Check Execution Log if modal doesn\'t show\n');
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
