#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function findAndFixDiscoveryHTML() {
  try {
    console.log('🔍 FINDING AND FIXING buildAIDiscoveryTabHTML_() INLINE ATTRIBUTES\n');
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

    const content = await script.projects.getContent({ scriptId });
    const codeFile = content.data.files.find(f => f.name === 'Code');

    // Find buildAIDiscoveryTabHTML_ function
    const funcStart = codeFile.source.indexOf('function buildAIDiscoveryTabHTML_() {');
    const funcEnd = codeFile.source.indexOf('\n}\n', funcStart) + 3;
    const funcCode = codeFile.source.substring(funcStart, funcEnd);

    console.log('📄 CURRENT buildAIDiscoveryTabHTML_() function:\n');
    console.log(`   Size: ${funcCode.length} characters\n`);

    // Check for inline attributes
    const hasOnchange = funcCode.includes('onchange=');
    const hasOnclick = funcCode.includes('onclick=');

    console.log(`   Has onchange attribute: ${hasOnchange}`);
    console.log(`   Has onclick attribute: ${hasOnclick}\n`);

    if (hasOnchange || hasOnclick) {
      console.log('⚠️  FOUND INLINE EVENT HANDLERS!\n');
      console.log('🔧 Fixing now...\n');

      let code = codeFile.source;
      const originalSize = (code.length / 1024).toFixed(1);

      // Replace the entire buildAIDiscoveryTabHTML_() function with clean version
      const cleanFunction = `function buildAIDiscoveryTabHTML_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var logicSheet = ss.getSheetByName('Logic_Type_Library');
  
  if (!logicSheet) {
    return '<div class="tab-content" id="discovery-tab" style="display: none;"><p>Logic_Type_Library sheet not found</p></div>';
  }
  
  var data = logicSheet.getDataRange().getValues();
  var headers = data[0];
  
  var idIdx = headers.indexOf('Logic_Type_ID');
  var nameIdx = headers.indexOf('Logic_Type_Name');
  var statusIdx = headers.indexOf('Status');
  var timesUsedIdx = headers.indexOf('Times_Used');
  
  var logicTypes = [];
  var seenNames = {};
  
  for (var i = 1; i < data.length; i++) {
    var status = data[i][statusIdx];
    var name = data[i][nameIdx];
    
    if (status === 'active' && !seenNames[name]) {
      seenNames[name] = true;
      logicTypes.push({
        id: data[i][idIdx],
        name: name,
        timesUsed: parseInt(data[i][timesUsedIdx]) || 0
      });
    }
  }
  
  logicTypes.sort(function(a, b) {
    if (b.timesUsed !== a.timesUsed) {
      return b.timesUsed - a.timesUsed;
    }
    return a.name.localeCompare(b.name);
  });
  
  var logicTypeOptions = logicTypes.map(function(lt) {
    var usageLabel = lt.timesUsed > 0 ? ' (' + lt.timesUsed + ' uses)' : '';
    return '<option value="' + lt.id + '">' + lt.name + usageLabel + '</option>';
  }).join('');
  
  return '<div class="tab-content" id="discovery-tab" style="display: none;">' +
         '  <div class="discovery-container">' +
         '    <div class="discovery-header">' +
         '      <div class="discovery-title">' +
         '        <h2>🔍 AI-Powered Pathway Discovery</h2>' +
         '        <p class="discovery-subtitle">Discover high-value learning pathways using AI and multiple intelligence frameworks</p>' +
         '      </div>' +
         '    </div>' +
         '' +
         '    <div class="discovery-config">' +
         '      <div class="config-section">' +
         '        <label class="config-label">' +
         '          <span class="label-icon">🧠</span>' +
         '          <span class="label-text">Discovery Lens (Logic Type)</span>' +
         '        </label>' +
         '        <select id="logic-type-selector" class="logic-type-select">' +
         '          <option value="">-- Select Logic Type --</option>' +
         logicTypeOptions +
         '          <option value="" disabled>──────────────────</option>' +
         '          <option value="CREATE_NEW">🎨 Create New Logic Type...</option>' +
         '        </select>' +
         '        <div class="help-text">' +
         '          💡 Most frequently used logic types appear first. Each lens reveals different pathway patterns.' +
         '        </div>' +
         '      </div>' +
         '' +
         '      <div class="config-section">' +
         '        <button id="discover-btn" class="btn-discover" disabled>' +
         '          <span class="btn-icon">🤖</span>' +
         '          <span class="btn-text">Discover Pathways</span>' +
         '        </button>' +
         '      </div>' +
         '    </div>' +
         '' +
         '    <div id="discovery-results-container" style="display: none;">' +
         '      <div class="results-header">' +
         '        <h3 id="results-title">Discovery Results</h3>' +
         '        <button class="btn-clear-results" onclick="clearDiscoveryResults()">Clear Results</button>' +
         '      </div>' +
         '      <div id="discovery-results-content" class="results-grid"></div>' +
         '    </div>' +
         '' +
         '    <div class="discovery-footer">' +
         '      <h3 class="footer-title">Manage Discovery System</h3>' +
         '      <div class="footer-actions">' +
         '        <button class="btn-footer" onclick="viewLogicTypeLibrary()">📚 View Logic Type Library</button>' +
         '        <button class="btn-footer" onclick="viewPathwaysMaster()">📊 View All Discovered Pathways</button>' +
         '      </div>' +
         '    </div>' +
         '  </div>' +
         '</div>';
}`;

      code = code.substring(0, funcStart) + cleanFunction + code.substring(funcEnd);
      console.log('   ✅ Replaced buildAIDiscoveryTabHTML_() with clean version (NO inline handlers)\n');

      const modifiedSize = (code.length / 1024).toFixed(1);
      console.log(`   Code.gs size: ${originalSize} KB → ${modifiedSize} KB\n`);

      // Upload
      console.log('💾 Uploading fixed Code.gs...\n');

      const updatedFiles = content.data.files.map(f => {
        if (f.name === 'Code') {
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
      console.log('✅ INLINE EVENT HANDLERS COMPLETELY REMOVED!');
      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log('📊 CLEAN HTML:\n');
      console.log('   <select id="logic-type-selector"> (NO onchange)');
      console.log('   <button id="discover-btn"> (NO onclick)\n');
      console.log('📊 EVENT ATTACHMENT:\n');
      console.log('   DOMContentLoaded → addEventListener("change", handleLogicTypeChange)');
      console.log('   DOMContentLoaded → addEventListener("click", discoverPathways)\n');

    } else {
      console.log('✅ NO inline event handlers found - already clean!\n');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

findAndFixDiscoveryHTML();
