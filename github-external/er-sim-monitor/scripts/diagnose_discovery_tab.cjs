#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function diagnoseDiscoveryTab() {
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

    console.log('🔍 DIAGNOSING DISCOVERY TAB ISSUES\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const content = await script.projects.getContent({ scriptId });
    const codeFile = content.data.files.find(f => f.name === 'Code');
    const discoveryUIFile = content.data.files.find(f => f.name === 'Phase2_Pathway_Discovery_UI');

    // Check 1: Does getLogicTypesForDropdown exist and is it called?
    console.log('📋 CHECK 1: Logic Type Dropdown Data Source\n');
    
    const hasGetLogicTypes = discoveryUIFile.source.includes('function getLogicTypesForDropdown()');
    console.log('   ' + (hasGetLogicTypes ? '✅' : '❌') + ' getLogicTypesForDropdown() exists in Phase2_Pathway_Discovery_UI.gs');
    
    const callsGetLogicTypes = codeFile.source.includes('const logicTypes = getLogicTypesForDropdown();');
    console.log('   ' + (callsGetLogicTypes ? '✅' : '❌') + ' buildAIDiscoveryTabHTML_() calls getLogicTypesForDropdown()');

    // Check 2: Look at the actual HTML generation
    console.log('\n📋 CHECK 2: HTML Generation Pattern\n');
    
    const buildFuncStart = codeFile.source.indexOf('function buildAIDiscoveryTabHTML_() {');
    if (buildFuncStart !== -1) {
      const excerpt = codeFile.source.substring(buildFuncStart, buildFuncStart + 1500);
      
      // Check for string concatenation vs template literals
      const usesStringConcat = excerpt.includes("return '<div");
      const usesTemplateLiteral = excerpt.includes('return `');
      
      console.log('   ' + (usesStringConcat ? '✅' : '❌') + ' Uses string concatenation (+ operator)');
      console.log('   ' + (usesTemplateLiteral ? '❌' : '✅') + ' No template literals (backticks)');
      
      // Check how logicTypeOptions is injected
      const hasDirectConcat = excerpt.includes('logicTypeOptions +');
      console.log('   ' + (hasDirectConcat ? '✅' : '❌') + ' logicTypeOptions directly concatenated\n');
      
      console.log('📄 FIRST 1500 CHARS OF buildAIDiscoveryTabHTML_():\n');
      console.log(excerpt);
      console.log('\n...\n');
    }

    // Check 3: Verify the button and dropdown exist in output
    console.log('\n📋 CHECK 3: Button & Dropdown in Generated HTML\n');
    
    const hasDropdown = codeFile.source.includes('id="logic-type-selector"');
    const hasButton = codeFile.source.includes('id="discover-btn"');
    const hasOnChange = codeFile.source.includes('onchange="handleLogicTypeChange()"');
    const hasOnClick = codeFile.source.includes('onclick="discoverPathways()"');
    
    console.log('   ' + (hasDropdown ? '✅' : '❌') + ' Dropdown element (id="logic-type-selector")');
    console.log('   ' + (hasButton ? '✅' : '❌') + ' Button element (id="discover-btn")');
    console.log('   ' + (hasOnChange ? '✅' : '❌') + ' onChange handler attached to dropdown');
    console.log('   ' + (hasOnClick ? '✅' : '❌') + ' onClick handler attached to button');

    // Check 4: JavaScript functions
    console.log('\n📋 CHECK 4: JavaScript Event Handlers\n');
    
    const hasHandleChange = codeFile.source.includes('function handleLogicTypeChange() {');
    const hasDiscoverFunc = codeFile.source.includes('function discoverPathways() {');
    const hasAPICall = codeFile.source.includes('.discoverPathwaysWithLogicType(logicTypeId)');
    
    console.log('   ' + (hasHandleChange ? '✅' : '❌') + ' handleLogicTypeChange() function');
    console.log('   ' + (hasDiscoverFunc ? '✅' : '❌') + ' discoverPathways() function');
    console.log('   ' + (hasAPICall ? '✅' : '❌') + ' API call to server');

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('\n💡 DEBUGGING STEPS:\n');
    console.log('1. Open Google Sheet');
    console.log('2. Press F12 (Developer Tools)');
    console.log('3. Go to Console tab');
    console.log('4. Open: 🧠 Sim Builder → 🧩 Categories & Pathways');
    console.log('5. Click "🔍 AI Discovery" tab');
    console.log('6. Check console for errors');
    console.log('7. In Elements tab, search for id="logic-type-selector"');
    console.log('8. Check if dropdown has <option> elements inside');
    console.log('9. Check if button has disabled attribute\n');
    console.log('Report back what you see in the console!\n');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

diagnoseDiscoveryTab();
