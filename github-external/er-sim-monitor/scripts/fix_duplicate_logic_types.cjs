#!/usr/bin/env node

/**
 * FIX DUPLICATE LOGIC TYPES IN DROPDOWN
 * 
 * Removes duplicate entries from logic type dropdown
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function fixDuplicateLogicTypes() {
  try {
    console.log('🔧 FIX: Remove Duplicate Logic Types from Dropdown\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const credPath = path.join(__dirname, '../config/credentials.json');
    const tokenPath = path.join(__dirname, '../config/token.json');

    const credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    oAuth2Client.setCredentials(token);

    const script = google.script({ version: 'v1', auth: oAuth2Client });
    const scriptId = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

    console.log(`📋 Script ID: ${scriptId}\n`);

    // Step 1: Get current project
    console.log('📥 Step 1: Downloading current project...\n');
    const currentProject = await script.projects.getContent({ scriptId });

    const discoveryUIFile = currentProject.data.files.find(f => f.name === 'Phase2_Pathway_Discovery_UI');
    if (!discoveryUIFile) throw new Error('Phase2_Pathway_Discovery_UI.gs not found!');

    let code = discoveryUIFile.source;
    const originalSize = (code.length / 1024).toFixed(1);
    console.log(`   Current Phase2_Pathway_Discovery_UI.gs: ${originalSize} KB\n`);

    // Step 2: Find and fix getLogicTypesForDropdown function
    console.log('🔧 Step 2: Adding deduplication to getLogicTypesForDropdown()...\n');

    // Find the function
    const funcStart = code.indexOf('function getLogicTypesForDropdown() {');
    if (funcStart === -1) throw new Error('getLogicTypesForDropdown() not found!');

    const funcEnd = code.indexOf('\n}', funcStart);
    const originalFunction = code.substring(funcStart, funcEnd + 2);

    console.log('   Original function found\n');

    // Replace with deduplicating version
    const newFunction = `function getLogicTypesForDropdown() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Logic_Type_Library');
  
  if (!sheet) {
    Logger.log('Logic_Type_Library sheet not found');
    return [];
  }
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  
  // Find column indices
  var idIdx = headers.indexOf('Logic_Type_ID');
  var nameIdx = headers.indexOf('Logic_Type_Name');
  var statusIdx = headers.indexOf('Status');
  var timesUsedIdx = headers.indexOf('Times_Used');
  
  if (idIdx === -1 || nameIdx === -1 || statusIdx === -1) {
    Logger.log('Required columns not found');
    return [];
  }
  
  var logicTypes = [];
  var seenNames = {}; // Track seen names to prevent duplicates
  
  // Skip header row (row 0)
  for (var i = 1; i < data.length; i++) {
    var status = data[i][statusIdx];
    var name = data[i][nameIdx];
    
    // Only include active logic types that haven't been seen yet
    if (status === 'active' && !seenNames[name]) {
      seenNames[name] = true; // Mark this name as seen
      
      logicTypes.push({
        id: data[i][idIdx],
        name: name,
        timesUsed: parseInt(data[i][timesUsedIdx]) || 0
      });
    }
  }
  
  // Sort by Times_Used (descending), then alphabetically by name
  logicTypes.sort(function(a, b) {
    if (b.timesUsed !== a.timesUsed) {
      return b.timesUsed - a.timesUsed;
    }
    return a.name.localeCompare(b.name);
  });
  
  return logicTypes;
}`;

    code = code.replace(originalFunction, newFunction);
    console.log('   ✅ Added deduplication logic (seenNames tracker)\n');

    const modifiedSize = (code.length / 1024).toFixed(1);
    console.log(`   File size: ${originalSize} KB → ${modifiedSize} KB\n`);

    // Step 3: Upload
    console.log('💾 Step 3: Uploading fixed Phase2_Pathway_Discovery_UI.gs...\n');

    const updatedFiles = currentProject.data.files.map(f => {
      if (f.name === 'Phase2_Pathway_Discovery_UI') {
        return { ...f, source: code };
      }
      return f;
    });

    await script.projects.updateContent({
      scriptId: scriptId,
      requestBody: { files: updatedFiles }
    });

    console.log('   ✅ Upload complete!\n');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ DUPLICATE LOGIC TYPES FIXED!');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🧪 TEST INSTRUCTIONS:\n');
    console.log('1. Refresh Google Sheet (F5)');
    console.log('2. Open: 🧠 Sim Builder → 🧩 Categories & Pathways');
    console.log('3. Click AI Discovery tab');
    console.log('4. Open logic type dropdown - duplicates should be gone!\n');
    console.log('📊 HOW IT WORKS:\n');
    console.log('   - Uses seenNames object to track already-added logic types');
    console.log('   - First occurrence of each name is kept');
    console.log('   - Subsequent duplicates are skipped');
    console.log('   - Still sorted by usage frequency\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

fixDuplicateLogicTypes();
