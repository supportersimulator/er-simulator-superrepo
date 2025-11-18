#!/usr/bin/env node

/**
 * ADD SIMPLE FIELD SELECTOR TEST
 * Create a minimal version that definitely works, then build up from there
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🔧 ADDING SIMPLE FIELD SELECTOR TEST\n');
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

async function add() {
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

    console.log('🔧 Adding simple test function...\n');

    const testFunction = `
/**
 * TEST: Simple field selector to verify flow works
 */
function testSimpleFieldSelector() {
  try {
    Logger.log('🎯 TEST: Simple field selector started');

    const html =
      '<!DOCTYPE html>' +
      '<html>' +
      '<head><style>' +
      'body { font-family: Arial; padding: 20px; }' +
      'h2 { color: #667eea; }' +
      '</style></head>' +
      '<body>' +
      '<h2>🎯 Field Selector Test</h2>' +
      '<p>If you can see this modal, the flow is working!</p>' +
      '<p>Now we need to debug why the real field selector fails.</p>' +
      '<button onclick="google.script.host.close()">Close</button>' +
      '</body>' +
      '</html>';

    const htmlOutput = HtmlService.createHtmlOutput(html)
      .setWidth(600)
      .setHeight(400);

    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Test Modal');
    Logger.log('✅ TEST: Modal displayed successfully');

  } catch (error) {
    Logger.log('❌ TEST ERROR: ' + error.toString());
    SpreadsheetApp.getUi().alert('Test Error: ' + error.message);
  }
}
`;

    // Add after preCacheRichData
    const preCacheMatch = code.match(/function preCacheRichData\(\) \{[\s\S]*?\n\}/);
    if (preCacheMatch) {
      const insertPos = preCacheMatch.index + preCacheMatch[0].length;
      code = code.slice(0, insertPos) + '\n' + testFunction + code.slice(insertPos);
      console.log('✅ Added testSimpleFieldSelector() after preCacheRichData()\n');
    }

    // Update preCacheRichData temporarily to call test function
    const oldPreCache = `function preCacheRichData() {
  showFieldSelector();
}`;

    const newPreCache = `function preCacheRichData() {
  // TEMPORARY: Testing with simple modal first
  try {
    Logger.log('🚀 preCacheRichData() called');
    Logger.log('🔧 Calling testSimpleFieldSelector() first...');
    testSimpleFieldSelector();
    // Once test works, we'll switch back to: showFieldSelector();
  } catch (error) {
    Logger.log('❌ preCacheRichData ERROR: ' + error.toString());
    SpreadsheetApp.getUi().alert('Error: ' + error.message);
  }
}`;

    if (code.includes(oldPreCache)) {
      code = code.replace(oldPreCache, newPreCache);
      console.log('✅ Updated preCacheRichData() to call test function first\n');
    }

    // Backup
    const backupPath = path.join(__dirname, '../backups/production-before-simple-test-2025-11-06.gs');
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
    console.log('🧪 SIMPLE TEST DEPLOYED!\n');
    console.log('Next steps:\n');
    console.log('   1. Click "Pre-Cache Rich Data" button');
    console.log('   2. You should see a simple "Field Selector Test" modal');
    console.log('   3. If you see it: The flow works, issue is in showFieldSelector()');
    console.log('   4. If you don\'t: Check Execution Log for errors\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

add();
