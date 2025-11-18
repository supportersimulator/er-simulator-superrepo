#!/usr/bin/env node

/**
 * Fix Missing Utilities and Bind Apps Script to Test Spreadsheet
 *
 * 1. Add missing utility functions to Core_Processing_Engine.gs
 * 2. Bind the standalone Apps Script project to test spreadsheet
 * 3. Re-deploy with complete code
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TEST_SHEET_ID = '1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI';
const TEST_SCRIPT_ID = '1INZy2-kQNEfEWEipSQ_WCvrvEhGgAeW4G4TM61W2ajNp_63G39KLPm4Y';

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

async function fixAndBind() {
  console.log('\n🔧 FIXING MISSING UTILITIES AND BINDING APPS SCRIPT\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });
  const drive = google.drive({ version: 'v3', auth });

  try {
    // Step 1: Read current Core_Processing_Engine.gs
    console.log('Step 1: Reading current Core_Processing_Engine.gs...\n');

    const coreEnginePath = path.join(__dirname, '../apps-script-deployable/Core_Processing_Engine.gs');
    let coreEngineCode = fs.readFileSync(coreEnginePath, 'utf8');

    console.log(`   ✓ Current file size: ${(coreEngineCode.length / 1024).toFixed(1)} KB\n`);

    // Step 2: Add missing utility functions
    console.log('Step 2: Adding missing utility functions...\n');

    const utilityFunctions = `
// ==================== UTILITY FUNCTIONS ====================
// These functions are used by processOneInputRow_() and other core functions

function getProp(key, fallback) {
  const v = PropertiesService.getDocumentProperties().getProperty(key);
  return (v === null || v === undefined) ? fallback : v;
}

function setProp(key, val) {
  PropertiesService.getDocumentProperties().setProperty(key, val);
}

function hashText(text) {
  if (!text) return '';
  let hash = 0;
  for (let i=0; i<text.length; i++) {
    hash = (hash*31 + text.charCodeAt(i)) | 0;
  }
  return ('00000000' + (hash >>> 0).toString(16)).slice(-8);
}

function cleanDuplicateLines(text) {
  if (!text) return text;
  const lines = text.split('\\n');
  const out = [];
  let last = '', count = 0;
  for (const l of lines) {
    const t = l.trim();
    if (t === last) {
      count++;
      if (count < 3) out.push(t);
    } else {
      out.push(t);
      last = t; count = 0;
    }
  }
  return out.join('\\n');
}

function appendLogSafe(message) {
  try {
    const docProps = PropertiesService.getDocumentProperties();
    const oldLog = docProps.getProperty('Sidebar_Logs') || '';
    const newLog = \`\${oldLog}\\n\${new Date().toLocaleTimeString()} \${message}\`.trim();
    docProps.setProperty('Sidebar_Logs', newLog);
  } catch (err) {
    Logger.log('appendLogSafe error: ' + err);
  }
}

// ==================== END UTILITY FUNCTIONS ====================

`;

    // Check if utilities already exist
    if (coreEngineCode.includes('function getProp(')) {
      console.log('   ⚠️  Utility functions already present, skipping addition\n');
    } else {
      // Add utilities after the header comment, before the first function
      const insertPoint = coreEngineCode.indexOf('function processOneInputRow_');
      if (insertPoint === -1) {
        console.log('   ❌ Could not find insertion point\n');
        return;
      }

      coreEngineCode = coreEngineCode.slice(0, insertPoint) + utilityFunctions + coreEngineCode.slice(insertPoint);

      // Write updated file
      fs.writeFileSync(coreEnginePath, coreEngineCode);

      console.log('   ✅ Added 5 utility functions:');
      console.log('      • getProp()');
      console.log('      • setProp()');
      console.log('      • hashText()');
      console.log('      • cleanDuplicateLines()');
      console.log('      • appendLogSafe()');
      console.log(`   ✓ New file size: ${(coreEngineCode.length / 1024).toFixed(1)} KB\n`);
    }

    // Step 3: Re-deploy all files with updated code
    console.log('Step 3: Re-deploying all files to Apps Script project...\n');

    const scriptFiles = [];

    // Read all feature files
    const featureFiles = [
      'ATSR_Title_Generator_Feature.gs',
      'Batch_Processing_Sidebar_Feature.gs',
      'Core_Processing_Engine.gs'
    ];

    for (const filename of featureFiles) {
      const filePath = path.join(__dirname, '../apps-script-deployable', filename);
      const content = fs.readFileSync(filePath, 'utf8');
      const name = filename.replace('.gs', '');

      scriptFiles.push({
        name,
        type: 'SERVER_JS',
        source: content
      });

      console.log(`   ✓ Loaded ${filename} (${(content.length / 1024).toFixed(1)} KB)`);
    }

    // Add manifest
    scriptFiles.push({
      name: 'appsscript',
      type: 'JSON',
      source: JSON.stringify({
        timeZone: 'America/Los_Angeles',
        dependencies: {},
        exceptionLogging: 'STACKDRIVER',
        runtimeVersion: 'V8'
      }, null, 2)
    });

    console.log('   ✓ Added appsscript.json manifest\n');

    // Deploy
    await script.projects.updateContent({
      scriptId: TEST_SCRIPT_ID,
      requestBody: { files: scriptFiles }
    });

    console.log('   ✅ Deployment successful!\n');

    // Step 4: Bind the Apps Script project to the test spreadsheet
    console.log('Step 4: Binding Apps Script project to test spreadsheet...\n');

    // Move the script file to be a child of the spreadsheet
    try {
      await drive.files.update({
        fileId: TEST_SCRIPT_ID,
        addParents: TEST_SHEET_ID,
        fields: 'id, parents'
      });

      console.log('   ✅ Apps Script project bound to test spreadsheet\n');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('   ✓ Apps Script already bound (or binding not needed)\n');
      } else {
        console.log(`   ⚠️  Binding may have failed: ${error.message}`);
        console.log('   Note: Standalone projects may not support parent binding.\n');
      }
    }

    // Step 5: Verify deployment
    console.log('Step 5: Verifying deployment...\n');

    const verifyProject = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });
    const verifyFiles = verifyProject.data.files.filter(f => f.type === 'SERVER_JS');
    const verifyCode = verifyFiles.map(f => f.source).join('\\n');

    const checks = [
      { name: 'getProp', found: verifyCode.includes('function getProp(') },
      { name: 'hashText', found: verifyCode.includes('function hashText(') },
      { name: 'cleanDuplicateLines', found: verifyCode.includes('function cleanDuplicateLines(') },
      { name: 'appendLogSafe', found: verifyCode.includes('function appendLogSafe(') },
      { name: 'processOneInputRow_', found: verifyCode.includes('function processOneInputRow_(') }
    ];

    console.log('   Function verification:\n');
    checks.forEach(check => {
      console.log(`      ${check.found ? '✅' : '❌'} ${check.name}()`);
    });

    const allFound = checks.every(c => c.found);

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 COMPLETION SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (allFound) {
      console.log('✅ SUCCESS - All utilities deployed and verified');
      console.log('✅ Core_Processing_Engine.gs updated with utility functions');
      console.log('✅ Apps Script project re-deployed');
      console.log('✅ All 5 critical functions present in deployed code\n');

      console.log('Next Steps:');
      console.log('   1. Test spreadsheet should now have working batch processing');
      console.log('   2. Try processing Row 206 again');
      console.log('   3. Check for "hashText is not defined" error (should be fixed)\n');
    } else {
      console.log('⚠️  Some functions still missing - manual review needed\n');
    }

    console.log('Test Spreadsheet URL:');
    console.log(`   https://docs.google.com/spreadsheets/d/${TEST_SHEET_ID}/edit\n`);

    console.log('Apps Script Project URL:');
    console.log(`   https://script.google.com/home/projects/${TEST_SCRIPT_ID}\n`);

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

fixAndBind().catch(error => {
  console.error('\nFix and bind failed:', error.message);
  process.exit(1);
});
