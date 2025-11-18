#!/usr/bin/env node

/**
 * ADD BACKGROUND PREP TO runPathwayChainBuilder()
 *
 * When user clicks "Categories & Pathways", we need to:
 * 1. Refresh header cache (CACHED_MERGED_KEYS)
 * 2. Initialize 35 defaults if not saved
 * 3. THEN show the Pathway UI
 *
 * This ensures everything is ready when they click the cache button
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

    console.log('📥 Downloading current production...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('🔧 Finding runPathwayChainBuilder()...\n');

    // Find runPathwayChainBuilder function
    const funcStart = code.indexOf('function runPathwayChainBuilder() {');
    if (funcStart === -1) {
      console.log('❌ Could not find runPathwayChainBuilder()\n');
      process.exit(1);
    }

    // Find end of function
    let funcEnd = funcStart;
    let braceCount = 0;
    let foundStart = false;

    for (let i = funcStart; i < code.length; i++) {
      if (code[i] === '{') {
        braceCount++;
        foundStart = true;
      } else if (code[i] === '}') {
        braceCount--;
        if (foundStart && braceCount === 0) {
          funcEnd = i + 1;
          break;
        }
      }
    }

    console.log('✅ Found function\n');
    console.log('🔧 Adding background prep steps...\n');

    // New version with background prep
    const newFunction = `function runPathwayChainBuilder() {
  const ui = getSafeUi_();
  if (!ui) {
    Logger.log('No UI context available');
    return;
  }

  try {
    Logger.log('🔧 STEP 1: Background prep - Refresh header cache');
    refreshHeaders(); // Ensure CACHED_MERGED_KEYS is fresh
    Logger.log('✅ STEP 1 complete');

    Logger.log('🔧 STEP 2: Background prep - Initialize defaults');
    getFieldSelectorRoughDraft(); // This will set 35 defaults if not saved
    Logger.log('✅ STEP 2 complete');

    Logger.log('🔧 STEP 3: Get or create holistic analysis');
    const analysis = getOrCreateHolisticAnalysis_();
    Logger.log('✅ STEP 3 complete');

    Logger.log('🔧 STEP 4: Build and show Pathway UI');
    const html = buildBirdEyeViewUI_(analysis);
    const htmlOutput = HtmlService.createHtmlOutput(html)
      .setWidth(1920)
      .setHeight(1000);

    ui.showModalDialog(htmlOutput, '🧩 Pathway Chain Builder - AI-Powered Design System');
    Logger.log('✅ Pathway UI displayed - all background prep complete');

  } catch (error) {
    ui.alert('Error loading Pathway Chain Builder: ' + error.toString());
    Logger.log('Pathway Chain Builder Error: ' + error.toString());
  }
}`;

    // Replace the function
    code = code.substring(0, funcStart) + newFunction + code.substring(funcEnd);

    console.log('✅ Function updated\n');
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

    console.log('✅ Deployed!\n');
    console.log('New size:', (code.length / 1024).toFixed(1), 'KB\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ ADDED BACKGROUND PREP TO runPathwayChainBuilder()!\n');
    console.log('\nNow when you click "Categories & Pathways":\n');
    console.log('1. ✅ Header cache refreshes (CACHED_MERGED_KEYS)');
    console.log('2. ✅ 35 defaults initialize if not saved');
    console.log('3. ✅ Holistic analysis loads');
    console.log('4. ✅ Pathway UI displays\n');
    console.log('Everything will be ready when you click the cache button!\n');
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
