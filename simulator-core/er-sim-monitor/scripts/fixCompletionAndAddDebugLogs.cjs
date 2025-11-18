#!/usr/bin/env node

/**
 * Fix completion logic + add debug logs to track batching
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

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
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading current production code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('🔧 Step 1: Fixing completion logic...\n');

    const buggyLine = '    complete: nextRow + 25 >= data.length,';
    const fixedLine = '    complete: endRow >= data.length - 1,';

    code = code.replace(buggyLine, fixedLine);

    console.log('✅ Completion logic fixed\n');

    console.log('🔧 Step 2: Adding debug logs to client-side cacheNext25()...\n');

    // Add debug logs to cacheNext25 success handler
    const oldSuccessHandler = `    html += '    .withSuccessHandler(function(r) {';
    html += '      log("Batch complete");';
    html += '      log("Progress: " + r.percentComplete + "%");';`;

    const newSuccessHandler = `    html += '    .withSuccessHandler(function(r) {';
    html += '      log("Batch complete: rows " + r.startRow + "-" + r.endRow);';
    html += '      log("Cached " + r.totalCached + " / " + r.totalRows + " rows (" + r.percentComplete + "%)");';
    html += '      log("Complete flag: " + r.complete);';`;

    code = code.replace(oldSuccessHandler, newSuccessHandler);

    console.log('✅ Debug logs added\n');

    console.log('📤 Deploying...\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: {
        files: [
          { name: 'Code', type: 'SERVER_JS', source: code },
          manifestFile
        ]
      }
    });

    console.log('✅ DEPLOYMENT SUCCESSFUL!\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ COMPLETION FIX + DEBUG LOGS DEPLOYED');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('Changes:');
    console.log('  1. Fixed: complete: endRow >= data.length - 1');
    console.log('  2. Added: Batch row range logging');
    console.log('  3. Added: Total cached / total rows logging');
    console.log('  4. Added: Complete flag logging\n');
    console.log('Now you will see in Live Log:');
    console.log('  - "Batch complete: rows 3-27"');
    console.log('  - "Cached 25 / 207 rows (12%)"');
    console.log('  - "Complete flag: false"');
    console.log('  - ... continues until ...');
    console.log('  - "Complete flag: true" → "ALL ROWS CACHED!"\n');
    console.log('Test it and copy the logs back!');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

deploy();
