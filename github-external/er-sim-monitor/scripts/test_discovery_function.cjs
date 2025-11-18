#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function testDiscoveryFunction() {
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

    console.log('🔍 Checking Discovery System Components\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const content = await script.projects.getContent({ scriptId });

    // Check Phase2_Pathway_Discovery_UI.gs for server-side function
    const discoveryUIFile = content.data.files.find(f => f.name === 'Phase2_Pathway_Discovery_UI');
    console.log('📄 Phase2_Pathway_Discovery_UI.gs:\n');
    
    if (discoveryUIFile) {
      const hasDiscoverFunction = discoveryUIFile.source.includes('function discoverPathwaysWithLogicType(logicTypeId)');
      const hasGetLogicTypes = discoveryUIFile.source.includes('function getLogicTypesForDropdown()');
      const hasManageLogicTypes = discoveryUIFile.source.includes('function manageLogicTypes()');
      const hasViewPathways = discoveryUIFile.source.includes('function viewPathwaysMaster()');
      
      console.log('  ' + (hasDiscoverFunction ? '✅' : '❌') + ' discoverPathwaysWithLogicType() - Main discovery function');
      console.log('  ' + (hasGetLogicTypes ? '✅' : '❌') + ' getLogicTypesForDropdown() - Dropdown data');
      console.log('  ' + (hasManageLogicTypes ? '✅' : '❌') + ' manageLogicTypes() - Navigate to library');
      console.log('  ' + (hasViewPathways ? '✅' : '❌') + ' viewPathwaysMaster() - Navigate to master');
    } else {
      console.log('  ❌ FILE NOT FOUND!');
    }

    // Check Phase2_Modal_Integration.gs for HTML
    console.log('\n📄 Phase2_Modal_Integration.gs:\n');
    const modalFile = content.data.files.find(f => f.name === 'Phase2_Modal_Integration');
    
    if (modalFile) {
      const hasHTML = modalFile.source.includes('function buildAIDiscoveryTabHTML_()');
      const hasDropdown = modalFile.source.includes('logic-type-selector');
      const hasButton = modalFile.source.includes('onclick="discoverPathways()"');
      
      console.log('  ' + (hasHTML ? '✅' : '❌') + ' buildAIDiscoveryTabHTML_() function');
      console.log('  ' + (hasDropdown ? '✅' : '❌') + ' Logic type dropdown HTML');
      console.log('  ' + (hasButton ? '✅' : '❌') + ' Discover button with onclick handler');
    } else {
      console.log('  ❌ FILE NOT FOUND!');
    }

    // Check Code.gs for JavaScript functions
    console.log('\n📄 Code.gs Client-Side JavaScript:\n');
    const codeFile = content.data.files.find(f => f.name === 'Code');
    
    if (codeFile) {
      // Check for JavaScript functions inside HTML template strings
      const hasDiscoverJS = codeFile.source.includes('function discoverPathways() {');
      const hasHandleChange = codeFile.source.includes('function handleLogicTypeChange() {');
      const hasHandleResults = codeFile.source.includes('function handleDiscoveryResults(result) {');
      const hasGoogleScriptRun = codeFile.source.includes('google.script.run') && 
                                   codeFile.source.includes('.discoverPathwaysWithLogicType(logicTypeId)');
      
      console.log('  ' + (hasDiscoverJS ? '✅' : '❌') + ' discoverPathways() JavaScript function');
      console.log('  ' + (hasHandleChange ? '✅' : '❌') + ' handleLogicTypeChange() JavaScript function');
      console.log('  ' + (hasHandleResults ? '✅' : '❌') + ' handleDiscoveryResults() JavaScript function');
      console.log('  ' + (hasGoogleScriptRun ? '✅' : '❌') + ' google.script.run API call');
      
      // Check if buildAIDiscoveryTabHTML_() is called in buildBirdEyeViewUI_
      const callsDiscoveryHTML = codeFile.source.includes('buildAIDiscoveryTabHTML_()');
      console.log('  ' + (callsDiscoveryHTML ? '✅' : '❌') + ' buildBirdEyeViewUI_() calls buildAIDiscoveryTabHTML_()');
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('\n💡 DEBUGGING TIPS:\n');
    console.log('If button still not working, open browser DevTools (F12) and check:');
    console.log('1. Console tab - Look for JavaScript errors');
    console.log('2. Network tab - See if API call is being made');
    console.log('3. Try clicking button and check console for error messages\n');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testDiscoveryFunction();
