#!/usr/bin/env node

/**
 * ADD BROWSER CONSOLE LOGGING
 * Add console.log statements to JavaScript to debug in browser console
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🔧 ADDING BROWSER CONSOLE LOGGING\n');
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

    console.log('🔧 Adding console.log statements to browser JavaScript...\n');

    // Add logging right after <script> tag
    const scriptStart = `'<script>' +`;
    const scriptWithLogging = `'<script>' +
    'console.log("🎯 Field Selector JavaScript loaded");' +
    'console.log("categoriesData:", ' + 'categoriesData' + ');' +
    'console.log("selectedFields:", ' + 'selectedFields' + ');' +
    'console.log("recommendedFieldNames:", ' + 'recommendedFieldNames' + ');' +`;

    if (code.includes(scriptStart)) {
      code = code.replace(scriptStart, scriptWithLogging);
      console.log('✅ Added console logging after <script> tag\n');
    }

    // Add logging at start of renderCategories()
    const renderStart = `'function renderCategories() {' +`;
    const renderWithLogging = `'function renderCategories() {' +
    '  console.log("📋 renderCategories() called");' +
    '  console.log("  categoriesData keys:", Object.keys(categoriesData));' +
    '  console.log("  selectedFields length:", selectedFields.length);' +`;

    if (code.includes(renderStart)) {
      code = code.replace(renderStart, renderWithLogging);
      console.log('✅ Added logging to renderCategories()\n');
    }

    // Add logging before renderCategories() call
    const renderCall = `'renderCategories();' +`;
    const renderCallWithLogging = `'console.log("🚀 About to call renderCategories()...");' +
    'try {' +
    '  renderCategories();' +
    '  console.log("✅ renderCategories() completed successfully");' +
    '} catch (error) {' +
    '  console.error("❌ renderCategories() ERROR:", error);' +
    '  console.error("  Message:", error.message);' +
    '  console.error("  Stack:", error.stack);' +
    '  document.getElementById("count").textContent = "Error: " + error.message;' +
    '}' +`;

    if (code.includes(renderCall)) {
      code = code.replace(renderCall, renderCallWithLogging);
      console.log('✅ Added try-catch around renderCategories() call\n');
    }

    // Backup
    const backupPath = path.join(__dirname, '../backups/production-before-browser-logging-2025-11-06.gs');
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
    console.log('🎉 BROWSER CONSOLE LOGGING ADDED!\n');
    console.log('Now when you click "Pre-Cache Rich Data":\n');
    console.log('   1. Open browser console (F12 → Console tab)');
    console.log('   2. Click the button');
    console.log('   3. Check console for error messages!\n');
    console.log('Look for red ❌ ERROR messages showing the exact issue.\n');
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
