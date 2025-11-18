#!/usr/bin/env node

/**
 * ADD GLOBAL ERROR HANDLER TO MODAL
 * Catch any JavaScript errors that might be preventing execution
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

async function fix() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading current code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('🔧 Adding global error handler to script section...\n');

    // Find the script tag start
    const scriptStart = code.indexOf("      '<script>' +");

    if (scriptStart === -1) {
      console.log('❌ Could not find script tag\n');
      return;
    }

    // Find where the log function ends (after copyLogs function)
    const copyLogsEnd = code.indexOf("      'function copyLogs()", scriptStart);
    const copyLogsEndLine = code.indexOf("'}' +", copyLogsEnd);

    if (copyLogsEndLine === -1) {
      console.log('❌ Could not find copyLogs end\n');
      return;
    }

    // Insert global error handler right after copyLogs
    const insertPos = copyLogsEndLine + 7; // After '}' +\n

    const errorHandler = `      'window.onerror = function(msg, url, line, col, error) {' +
      '  var errMsg = "💥 JS ERROR: " + msg + " (line " + line + ")";' +
      '  if (error && error.stack) errMsg += "\\\\n" + error.stack;' +
      '  log(errMsg);' +
      '  return false;' +
      '};' +
      'window.addEventListener("unhandledrejection", function(e) {' +
      '  log("💥 UNHANDLED PROMISE: " + e.reason);' +
      '});' +
      `;

    code = code.substring(0, insertPos) + errorHandler + code.substring(insertPos);

    console.log('✅ Added error handlers\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ GLOBAL ERROR HANDLER ADDED!\n');
    console.log('\nNow when you click "Cache All Layers":\n');
    console.log('  ✅ Any JavaScript errors will appear in Live Log');
    console.log('  ✅ Uncaught exceptions will be logged');
    console.log('  ✅ Promise rejections will be logged\n');
    console.log('This will tell us exactly what\'s breaking!\n');
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
