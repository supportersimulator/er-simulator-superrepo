#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function finalCheck() {
  try {
    const credPath = path.join(__dirname, '../config/credentials.json');
    const tokenPath = path.join(__dirname, '../config/token.json');

    const credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    oAuth2Client.setCredentials(token);

    const script = google.script({ version: 'v1', auth: oAuth2Client });
    const scriptId = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

    console.log('🎯 FINAL DISCOVERY SYSTEM CHECK\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const content = await script.projects.getContent({ scriptId });
    const codeFile = content.data.files.find(f => f.name === 'Code');
    const discoveryUIFile = content.data.files.find(f => f.name === 'Phase2_Pathway_Discovery_UI');

    let allGood = true;

    console.log('📋 CODE.GS CHECKLIST:\n');

    // 1. buildAIDiscoveryTabHTML_() function
    const hasBuildFunction = codeFile.source.includes('function buildAIDiscoveryTabHTML_() {');
    console.log('   ' + (hasBuildFunction ? '✅' : '❌') + ' buildAIDiscoveryTabHTML_() function defined');
    if (!hasBuildFunction) allGood = false;

    // 2. Calls getLogicTypesForDropdown()
    const callsGetLogicTypes = codeFile.source.includes('const logicTypes = getLogicTypesForDropdown();');
    console.log('   ' + (callsGetLogicTypes ? '✅' : '❌') + ' Calls getLogicTypesForDropdown()');
    if (!callsGetLogicTypes) allGood = false;

    // 3. discoveryTabHTML variable
    const hasDiscoveryVar = codeFile.source.includes('const discoveryTabHTML = buildAIDiscoveryTabHTML_();');
    console.log('   ' + (hasDiscoveryVar ? '✅' : '❌') + ' buildBirdEyeViewUI_() calls buildAIDiscoveryTabHTML_()');
    if (!hasDiscoveryVar) allGood = false;

    // 4. Discovery tab button
    const hasTabButton = codeFile.source.includes('id="discovery-tab-btn"');
    console.log('   ' + (hasTabButton ? '✅' : '❌') + ' Discovery tab button HTML');
    if (!hasTabButton) allGood = false;

    // 5. Discover button
    const hasDiscoverBtn = codeFile.source.includes('id="discover-btn"') && 
                           codeFile.source.includes('onclick="discoverPathways()"');
    console.log('   ' + (hasDiscoverBtn ? '✅' : '❌') + ' Discover Pathways button with onclick');
    if (!hasDiscoverBtn) allGood = false;

    // 6. JavaScript function discoverPathways()
    const hasDiscoverJS = codeFile.source.includes('function discoverPathways() {');
    console.log('   ' + (hasDiscoverJS ? '✅' : '❌') + ' discoverPathways() JavaScript function');
    if (!hasDiscoverJS) allGood = false;

    // 7. google.script.run call
    const hasAPICall = codeFile.source.includes('google.script.run') && 
                       codeFile.source.includes('.discoverPathwaysWithLogicType(logicTypeId)');
    console.log('   ' + (hasAPICall ? '✅' : '❌') + ' google.script.run API call to server');
    if (!hasAPICall) allGood = false;

    console.log('\n📋 PHASE2_PATHWAY_DISCOVERY_UI.GS CHECKLIST:\n');

    // 8. Server-side function
    const hasServerFunction = discoveryUIFile.source.includes('function discoverPathwaysWithLogicType(logicTypeId)');
    console.log('   ' + (hasServerFunction ? '✅' : '❌') + ' discoverPathwaysWithLogicType() server function');
    if (!hasServerFunction) allGood = false;

    // 9. getLogicTypesForDropdown()
    const hasGetLogicTypesFunc = discoveryUIFile.source.includes('function getLogicTypesForDropdown()');
    console.log('   ' + (hasGetLogicTypesFunc ? '✅' : '❌') + ' getLogicTypesForDropdown() function');
    if (!hasGetLogicTypesFunc) allGood = false;

    console.log('\n═══════════════════════════════════════════════════════════════');

    if (allGood) {
      console.log('✅ ALL SYSTEMS GO - DISCOVERY BUTTON SHOULD WORK!\n');
      console.log('🧪 NEXT STEP:\n');
      console.log('   1. Refresh Google Sheet (F5)');
      console.log('   2. Open: 🧠 Sim Builder → 🧩 Categories & Pathways');
      console.log('   3. Click "🔍 AI Discovery" tab');
      console.log('   4. Select a logic type (e.g., "Cognitive Bias Exposure")');
      console.log('   5. Click "🤖 Discover Pathways" button');
      console.log('   6. Watch for "Discovering..." and results display\n');
    } else {
      console.log('❌ ISSUES DETECTED - See checklist above\n');
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

finalCheck();
