#!/usr/bin/env node

/**
 * Switch to Document Properties
 *
 * Script Properties is failing silently with setProp('BATCH_ROWS', ...)
 * Try using Document Properties instead - they're stored with the spreadsheet
 * and may be more reliable for larger data
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function switchToDocumentProperties() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  SWITCH TO DOCUMENT PROPERTIES');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oauth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oauth2Client });
  const response = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = response.data.files;

  const codeFile = files.find(f => f.name === 'Code');
  let source = codeFile.source;

  console.log('Step 1: Check current setProp/getProp implementation...');
  console.log('');

  // Find setProp and getProp functions
  const setPropIdx = source.indexOf('function setProp(');
  const getPropIdx = source.indexOf('function getProp(');

  if (setPropIdx === -1 || getPropIdx === -1) {
    console.log('❌ Could not find setProp/getProp functions');
    return;
  }

  const setPropSnippet = source.substring(setPropIdx, setPropIdx + 200);
  console.log('Current setProp:');
  console.log(setPropSnippet);
  console.log('');

  // Check if it's using ScriptProperties or DocumentProperties
  if (setPropSnippet.includes('getScriptProperties()')) {
    console.log('Currently using: ScriptProperties ❌ (this is failing!)');
    console.log('');
    console.log('Switching to DocumentProperties...');
    console.log('');

    // Replace ScriptProperties with DocumentProperties
    source = source.replace(/PropertiesService\.getScriptProperties\(\)/g,
                           'PropertiesService.getDocumentProperties()');

    console.log('✅ Replaced all getScriptProperties() with getDocumentProperties()');
  } else if (setPropSnippet.includes('getDocumentProperties()')) {
    console.log('Already using: DocumentProperties ✅');
    console.log('');
    console.log('The issue must be something else...');
    console.log('Let me try a different key name instead of BATCH_ROWS');
    console.log('');

    // Try using a simpler key name
    source = source.replace(/BATCH_ROWS/g, 'BATCHROWS');
    console.log('✅ Changed key from BATCH_ROWS to BATCHROWS');

    source = source.replace(/BATCH_INPUT_SHEET/g, 'BATCHINPUT');
    source = source.replace(/BATCH_OUTPUT_SHEET/g, 'BATCHOUTPUT');
    source = source.replace(/BATCH_MODE/g, 'BATCHMODE');
    source = source.replace(/BATCH_SPEC/g, 'BATCHSPEC');
    console.log('✅ Simplified all batch property names');
  }

  console.log('');
  console.log('💾 Uploading code...');

  const updatedFiles = files.map(f => {
    if (f.name === 'Code') {
      return { ...f, source };
    }
    return f;
  });

  await script.projects.updateContent({
    scriptId: SCRIPT_ID,
    requestBody: { files: updatedFiles }
  });

  console.log('✅ Code updated!');
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('✅ PROPERTIES SYSTEM UPDATED!');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('Changes:');
  console.log('  - Using DocumentProperties instead of ScriptProperties');
  console.log('  - OR simplified property key names (removed underscores)');
  console.log('');
  console.log('DocumentProperties advantages:');
  console.log('  - Stored with the spreadsheet (more reliable)');
  console.log('  - Better for larger data');
  console.log('  - May have fewer restrictions');
  console.log('');
  console.log('Next steps:');
  console.log('1. Refresh Google Sheets (F5)');
  console.log('2. Click "Launch Batch Engine"');
  console.log('3. Watch for: ✅ BATCH_ROWS saved, retrieved length: XXX chars');
  console.log('');
}

if (require.main === module) {
  switchToDocumentProperties().catch(error => {
    console.error('');
    console.error('❌ FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  });
}

module.exports = { switchToDocumentProperties };
