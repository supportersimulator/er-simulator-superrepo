#!/usr/bin/env node

/**
 * THE SIMPLE APPROACH: <head> JavaScript + inline handlers
 * 
 * Following the field selector pattern that WORKS:
 * 1. Put JavaScript in <head> (loads before HTML)
 * 2. Use simple inline onchange/onclick (reliable in Apps Script)
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function useHeadWithSimpleHandlers() {
  try {
    console.log('🔧 SIMPLE APPROACH: <head> JavaScript + Inline Handlers\n');
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

    let code = codeFile.source;
    const originalSize = (code.length / 1024).toFixed(1);

    console.log(`   Current Code.gs: ${originalSize} KB\n`);

    // STEP 1: Add Discovery JavaScript to <head> section (right after </style>, before </head>)
    console.log('🔧 Step 1: Adding Discovery JavaScript to <head> section...\n');

    const headEndMarker = "'  </style>' +\n'' +\n'</head>' +";

    if (code.indexOf(headEndMarker) === -1) {
      throw new Error('Could not find </head> marker in buildBirdEyeViewUI_');
    }

    const headJavaScript = "'  </style>' +\n'' +\n" +
"'  <script>' +\n" +
"'    function handleLogicTypeChange() {' +\n" +
"'      var select = document.getElementById(\"logic-type-selector\");' +\n" +
"'      var btn = document.getElementById(\"discover-btn\");' +\n" +
"'      if (!btn) return;' +\n" +
"'      if (select.value && select.value !== \"CREATE_NEW\") {' +\n" +
"'        btn.disabled = false;' +\n" +
"'      } else {' +\n" +
"'        btn.disabled = true;' +\n" +
"'      }' +\n" +
"'    }' +\n" +
"'    ' +\n" +
"'    function discoverPathways() {' +\n" +
"'      var logicTypeId = document.getElementById(\"logic-type-selector\").value;' +\n" +
"'      if (!logicTypeId || logicTypeId === \"CREATE_NEW\") {' +\n" +
"'        alert(\"Please select a logic type first\");' +\n" +
"'        return;' +\n" +
"'      }' +\n" +
"'      var btn = document.getElementById(\"discover-btn\");' +\n" +
"'      btn.disabled = true;' +\n" +
"'      btn.innerHTML = \"<span class=\\\\\"btn-icon\\\\\">🔄</span><span class=\\\\\"btn-text\\\\\">Discovering...</span>\";' +\n" +
"'      google.script.run' +\n" +
"'        .withSuccessHandler(handleDiscoveryResults)' +\n" +
"'        .withFailureHandler(handleDiscoveryError)' +\n" +
"'        .discoverPathwaysWithLogicType(logicTypeId);' +\n" +
"'    }' +\n" +
"'    ' +\n" +
"'    function handleDiscoveryResults(result) {' +\n" +
"'      var btn = document.getElementById(\"discover-btn\");' +\n" +
"'      btn.disabled = false;' +\n" +
"'      btn.innerHTML = \"<span class=\\\\\"btn-icon\\\\\">🤖</span><span class=\\\\\"btn-text\\\\\">Discover Pathways</span>\";' +\n" +
"'      if (!result.success) {' +\n" +
"'        alert(\"Error: \" + result.error);' +\n" +
"'        return;' +\n" +
"'      }' +\n" +
"'      alert(\"✅ Discovery complete! \" + result.pathwaysCount + \" pathways saved to Pathways_Master sheet.\");' +\n" +
"'    }' +\n" +
"'    ' +\n" +
"'    function handleDiscoveryError(error) {' +\n" +
"'      var btn = document.getElementById(\"discover-btn\");' +\n" +
"'      btn.disabled = false;' +\n" +
"'      btn.innerHTML = \"<span class=\\\\\"btn-icon\\\\\">🤖</span><span class=\\\\\"btn-text\\\\\">Discover Pathways</span>\";' +\n" +
"'      alert(\"Error: \" + error.message);' +\n" +
"'    }' +\n" +
"'  </script>' +\n" +
"'' +\n" +
"'</head>' +";

    code = code.replace(headEndMarker, headJavaScript);
    console.log('   ✅ Added Discovery JavaScript to <head>\n');

    // STEP 2: Update buildAIDiscoveryTabHTML_() to use simple inline handlers
    console.log('🔧 Step 2: Updating buildAIDiscoveryTabHTML_() with inline handlers...\n');

    const funcStart = code.indexOf('function buildAIDiscoveryTabHTML_() {');
    const funcEnd = code.indexOf('\n}\n', funcStart) + 3;
    
    const simpleDiscoveryFunction = `function buildAIDiscoveryTabHTML_() {
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
         '  <div style="padding: 40px; max-width: 800px; margin: 0 auto;">' +
         '    <h2 style="margin-bottom: 10px;">🔍 AI-Powered Pathway Discovery</h2>' +
         '    <p style="color: #8b92a0; margin-bottom: 30px;">Discover high-value learning pathways using AI and multiple intelligence frameworks</p>' +
         '    ' +
         '    <div style="margin-bottom: 20px;">' +
         '      <label style="display: block; margin-bottom: 8px; font-weight: 600;">🧠 Discovery Lens (Logic Type)</label>' +
         '      <select id="logic-type-selector" onchange="handleLogicTypeChange()" style="width: 100%; padding: 12px; font-size: 14px; border: 1px solid #2a3040; border-radius: 8px; background: #0f1115; color: #e7eaf0;">' +
         '        <option value="">-- Select Logic Type --</option>' +
         logicTypeOptions +
         '        <option value="" disabled>──────────────────</option>' +
         '        <option value="CREATE_NEW">🎨 Create New Logic Type...</option>' +
         '      </select>' +
         '      <p style="font-size: 12px; color: #8b92a0; margin-top: 8px;">💡 Most frequently used logic types appear first</p>' +
         '    </div>' +
         '    ' +
         '    <button id="discover-btn" onclick="discoverPathways()" disabled style="width: 100%; padding: 16px; font-size: 16px; font-weight: 700; background: linear-gradient(135deg, #2357ff 0%, #1a42cc 100%); border: none; color: #fff; border-radius: 10px; cursor: pointer; opacity: 0.5;">' +
         '      <span style="font-size: 20px;">🤖</span> Discover Pathways' +
         '    </button>' +
         '  </div>' +
         '</div>';
}`;

    code = code.substring(0, funcStart) + simpleDiscoveryFunction + code.substring(funcEnd);
    console.log('   ✅ Updated buildAIDiscoveryTabHTML_() with simple inline handlers\n');

    const modifiedSize = (code.length / 1024).toFixed(1);
    console.log(`   Code.gs size: ${originalSize} KB → ${modifiedSize} KB\n`);

    // Upload
    console.log('💾 Uploading...\n');

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
    console.log('✅ SIMPLE APPROACH DEPLOYED!');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📊 WHAT CHANGED:\n');
    console.log('   ✅ Discovery JavaScript in <head> (loads first, like field selector)');
    console.log('   ✅ Simple inline onchange="handleLogicTypeChange()"');
    console.log('   ✅ Simple inline onclick="discoverPathways()"');
    console.log('   ✅ Simplified HTML (no complex styles, just clean functional UI)\n');
    console.log('🧪 TEST:\n');
    console.log('1. Refresh Google Sheet (F5)');
    console.log('2. Open: 🧠 Sim Builder → 🧩 Categories & Pathways');
    console.log('3. Click AI Discovery tab');
    console.log('4. Select logic type - button should enable');
    console.log('5. Click button - should work!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

useHeadWithSimpleHandlers();
