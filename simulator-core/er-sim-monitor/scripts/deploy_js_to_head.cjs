#!/usr/bin/env node

/**
 * THE <HEAD> FIX: Move Discovery Tab JavaScript to <head> Section
 *
 * Following the working field selector pattern:
 * - Field selector: JavaScript in <head> section (WORKS)
 * - Discovery tab: JavaScript in <body> section (DOESN'T WORK)
 *
 * This fix moves all Discovery tab JavaScript functions to <head>
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function deployJSToHead() {
  try {
    console.log('🚀 THE <HEAD> FIX: Move Discovery JavaScript to <head>\n');
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

    const codeFile = currentProject.data.files.find(f => f.name === 'Code');
    if (!codeFile) throw new Error('Code.gs not found!');

    let code = codeFile.source;
    const originalSize = (code.length / 1024).toFixed(1);

    console.log(`   Current Code.gs: ${originalSize} KB\n`);

    // Step 2: Extract Discovery tab JavaScript functions from <body> <script> tag
    console.log('🔧 Step 2: Extracting Discovery JavaScript functions...\n');

    // The Discovery tab JavaScript functions that need to move to <head>
    const discoveryJSFunctions = `'  <script>' +
'    // Discovery Tab JavaScript Functions' +
'    function handleLogicTypeChange() {' +
'      var select = document.getElementById(\\'logic-type-selector\\');' +
'      var btn = document.getElementById(\\'discover-btn\\');' +
'      ' +
'      if (select.value === \\'CREATE_NEW\\') {' +
'        alert(\\'Create New Logic Type feature coming soon!\\');' +
'        select.value = \\'\\';' +
'        btn.disabled = true;' +
'      } else if (select.value) {' +
'        btn.disabled = false;' +
'      } else {' +
'        btn.disabled = true;' +
'      }' +
'    }' +
'    ' +
'    function discoverPathways() {' +
'      var logicTypeId = document.getElementById(\\'logic-type-selector\\').value;' +
'      ' +
'      if (!logicTypeId || logicTypeId === \\'CREATE_NEW\\') {' +
'        alert(\\'Please select a logic type first\\');' +
'        return;' +
'      }' +
'      ' +
'      var btn = document.getElementById(\\'discover-btn\\');' +
'      btn.disabled = true;' +
'      btn.innerHTML = \\'<span class=\"btn-icon\">🔄</span><span class=\"btn-text\">Discovering...</span>\\';' +
'      ' +
'      google.script.run' +
'        .withSuccessHandler(handleDiscoveryResults)' +
'        .withFailureHandler(handleDiscoveryError)' +
'        .discoverPathwaysWithLogicType(logicTypeId);' +
'    }' +
'    ' +
'    function handleDiscoveryResults(pathways) {' +
'      var btn = document.getElementById(\\'discover-btn\\');' +
'      btn.disabled = false;' +
'      btn.innerHTML = \\'<span class=\"btn-icon\">🤖</span><span class=\"btn-text\">Discover Pathways</span>\\';' +
'      ' +
'      var container = document.getElementById(\\'discovery-results-container\\');' +
'      var content = document.getElementById(\\'discovery-results-content\\');' +
'      var title = document.getElementById(\\'results-title\\');' +
'      ' +
'      if (!pathways || pathways.length === 0) {' +
'        alert(\\'No pathways discovered. Try a different logic type.\\');' +
'        return;' +
'      }' +
'      ' +
'      title.textContent = pathways.length + \\' Pathways Discovered\\';' +
'      content.innerHTML = pathways.map(function(p) {' +
'        var tierClass = \\'tier-\\' + p.tier.toLowerCase();' +
'        return \\'' +
'          <div class=\"pathway-card\">' +
'            <div class=\"pathway-card-header\">' +
'              <div class=\"pathway-name\">\\' + p.name + \\'</div>' +
'              <span class=\"tier-badge \\' + tierClass + \\'\">\\' + p.tier + \\'-Tier</span>' +
'            </div>' +
'            <div class=\"pathway-description\">\\' + (p.description || \\'\\') + \\'</div>' +
'            <div class=\"pathway-persuasion\"><p>\\' + p.persuasion + \\'</p></div>' +
'            <div class=\"pathway-meta\">' +
'              <div class=\"meta-item\">📊 Score: <strong>\\' + p.composite_score.toFixed(2) + \\'/10</strong></div>' +
'              <div class=\"meta-item\">🎯 Cases: <strong>\\' + (p.case_count || \\'TBD\\') + \\'</strong></div>' +
'            </div>' +
'          </div>' +
'        \\';' +
'      }).join(\\'\\');' +
'      ' +
'      container.style.display = \\'block\\';' +
'    }' +
'    ' +
'    function handleDiscoveryError(error) {' +
'      var btn = document.getElementById(\\'discover-btn\\');' +
'      btn.disabled = false;' +
'      btn.innerHTML = \\'<span class=\"btn-icon\">🤖</span><span class=\"btn-text\">Discover Pathways</span>\\';' +
'      ' +
'      alert(\\'Discovery failed: \\' + error.message);' +
'    }' +
'    ' +
'    function clearDiscoveryResults() {' +
'      var container = document.getElementById(\\'discovery-results-container\\');' +
'      var content = document.getElementById(\\'discovery-results-content\\');' +
'      content.innerHTML = \\'\\';' +
'      container.style.display = \\'none\\';' +
'    }' +
'    ' +
'    function viewLogicTypeLibrary() {' +
'      var ss = SpreadsheetApp.getActiveSpreadsheet();' +
'      var sheet = ss.getSheetByName(\\'Logic_Type_Library\\');' +
'      if (sheet) {' +
'        ss.setActiveSheet(sheet);' +
'        google.script.host.close();' +
'      }' +
'    }' +
'    ' +
'    function viewPathwaysMaster() {' +
'      var ss = SpreadsheetApp.getActiveSpreadsheet();' +
'      var sheet = ss.getSheetByName(\\'Pathways_Master\\');' +
'      if (sheet) {' +
'        ss.setActiveSheet(sheet);' +
'        google.script.host.close();' +
'      }' +
'    }' +
'  </script>' +`;

    console.log('   ✅ Extracted Discovery tab JavaScript functions\n');

    // Step 3: Find the </style> tag in <head> where we'll insert JavaScript
    console.log('🔧 Step 3: Finding insertion point in <head> section...\n');

    const styleEndMarker = "'  </style>' +\n'</head>' +";

    if (code.indexOf(styleEndMarker) === -1) {
      throw new Error('Could not find </style></head> marker in buildBirdEyeViewUI_');
    }

    // Insert JavaScript BEFORE </head> (after </style>)
    const newHeadSection = "'  </style>' +\n" +
"'' +\n" +
"'  <script>' +\n" +
"'    // Discovery Tab JavaScript Functions (in <head> for early loading)' +\n" +
"'    function handleLogicTypeChange() {' +\n" +
"'      var select = document.getElementById(\\'logic-type-selector\\');' +\n" +
"'      var btn = document.getElementById(\\'discover-btn\\');' +\n" +
"'      ' +\n" +
"'      if (select.value === \\'CREATE_NEW\\') {' +\n" +
"'        alert(\\'Create New Logic Type feature coming soon!\\');' +\n" +
"'        select.value = \\'\\';' +\n" +
"'        btn.disabled = true;' +\n" +
"'      } else if (select.value) {' +\n" +
"'        btn.disabled = false;' +\n" +
"'      } else {' +\n" +
"'        btn.disabled = true;' +\n" +
"'      }' +\n" +
"'    }' +\n" +
"'    ' +\n" +
"'    function discoverPathways() {' +\n" +
"'      var logicTypeId = document.getElementById(\\'logic-type-selector\\').value;' +\n" +
"'      ' +\n" +
"'      if (!logicTypeId || logicTypeId === \\'CREATE_NEW\\') {' +\n" +
"'        alert(\\'Please select a logic type first\\');' +\n" +
"'        return;' +\n" +
"'      }' +\n" +
"'      ' +\n" +
"'      var btn = document.getElementById(\\'discover-btn\\');' +\n" +
"'      btn.disabled = true;' +\n" +
"'      btn.innerHTML = \\'<span class=\"btn-icon\">🔄</span><span class=\"btn-text\">Discovering...</span>\\';' +\n" +
"'      ' +\n" +
"'      google.script.run' +\n" +
"'        .withSuccessHandler(handleDiscoveryResults)' +\n" +
"'        .withFailureHandler(handleDiscoveryError)' +\n" +
"'        .discoverPathwaysWithLogicType(logicTypeId);' +\n" +
"'    }' +\n" +
"'    ' +\n" +
"'    function handleDiscoveryResults(pathways) {' +\n" +
"'      var btn = document.getElementById(\\'discover-btn\\');' +\n" +
"'      btn.disabled = false;' +\n" +
"'      btn.innerHTML = \\'<span class=\"btn-icon\">🤖</span><span class=\"btn-text\">Discover Pathways</span>\\';' +\n" +
"'      ' +\n" +
"'      var container = document.getElementById(\\'discovery-results-container\\');' +\n" +
"'      var content = document.getElementById(\\'discovery-results-content\\');' +\n" +
"'      var title = document.getElementById(\\'results-title\\');' +\n" +
"'      ' +\n" +
"'      if (!pathways || pathways.length === 0) {' +\n" +
"'        alert(\\'No pathways discovered. Try a different logic type.\\');' +\n" +
"'        return;' +\n" +
"'      }' +\n" +
"'      ' +\n" +
"'      title.textContent = pathways.length + \\' Pathways Discovered\\';' +\n" +
"'      content.innerHTML = pathways.map(function(p) {' +\n" +
"'        var tierClass = \\'tier-\\' + p.tier.toLowerCase();' +\n" +
"'        return \\'' +\n" +
"'          <div class=\"pathway-card\">' +\n" +
"'            <div class=\"pathway-card-header\">' +\n" +
"'              <div class=\"pathway-name\">\\' + p.name + \\'</div>' +\n" +
"'              <span class=\"tier-badge \\' + tierClass + \\'\">\\' + p.tier + \\'-Tier</span>' +\n" +
"'            </div>' +\n" +
"'            <div class=\"pathway-description\">\\' + (p.description || \\'\\') + \\'</div>' +\n" +
"'            <div class=\"pathway-persuasion\"><p>\\' + p.persuasion + \\'</p></div>' +\n" +
"'            <div class=\"pathway-meta\">' +\n" +
"'              <div class=\"meta-item\">📊 Score: <strong>\\' + p.composite_score.toFixed(2) + \\'/10</strong></div>' +\n" +
"'              <div class=\"meta-item\">🎯 Cases: <strong>\\' + (p.case_count || \\'TBD\\') + \\'</strong></div>' +\n" +
"'            </div>' +\n" +
"'          </div>' +\n" +
"'        \\';' +\n" +
"'      }).join(\\'\\');' +\n" +
"'      ' +\n" +
"'      container.style.display = \\'block\\';' +\n" +
"'    }' +\n" +
"'    ' +\n" +
"'    function handleDiscoveryError(error) {' +\n" +
"'      var btn = document.getElementById(\\'discover-btn\\');' +\n" +
"'      btn.disabled = false;' +\n" +
"'      btn.innerHTML = \\'<span class=\"btn-icon\">🤖</span><span class=\"btn-text\">Discover Pathways</span>\\';' +\n" +
"'      ' +\n" +
"'      alert(\\'Discovery failed: \\' + error.message);' +\n" +
"'    }' +\n" +
"'    ' +\n" +
"'    function clearDiscoveryResults() {' +\n" +
"'      var container = document.getElementById(\\'discovery-results-container\\');' +\n" +
"'      var content = document.getElementById(\\'discovery-results-content\\');' +\n" +
"'      content.innerHTML = \\'\\';' +\n" +
"'      container.style.display = \\'none\\';' +\n" +
"'    }' +\n" +
"'    ' +\n" +
"'    function viewLogicTypeLibrary() {' +\n" +
"'      var ss = SpreadsheetApp.getActiveSpreadsheet();' +\n" +
"'      var sheet = ss.getSheetByName(\\'Logic_Type_Library\\');' +\n" +
"'      if (sheet) {' +\n" +
"'        ss.setActiveSheet(sheet);' +\n" +
"'        google.script.host.close();' +\n" +
"'      }' +\n" +
"'    }' +\n" +
"'    ' +\n" +
"'    function viewPathwaysMaster() {' +\n" +
"'      var ss = SpreadsheetApp.getActiveSpreadsheet();' +\n" +
"'      var sheet = ss.getSheetByName(\\'Pathways_Master\\');' +\n" +
"'      if (sheet) {' +\n" +
"'        ss.setActiveSheet(sheet);' +\n" +
"'        google.script.host.close();' +\n" +
"'      }' +\n" +
"'    }' +\n" +
"'  </script>' +\n" +
"'</head>' +";

    code = code.replace(styleEndMarker, newHeadSection);
    console.log('   ✅ Added Discovery JavaScript to <head> section\n');

    // Step 4: Remove duplicate JavaScript from <body> <script> tag (if it exists)
    console.log('🔧 Step 4: Removing duplicate Discovery JavaScript from <body>...\n');

    // Find and remove the Discovery tab functions from body <script> tag
    const bodyScriptStart = code.indexOf("'  <script>' +\n'    function handleLogicTypeChange() {'");
    if (bodyScriptStart !== -1) {
      // Find end of Discovery functions (before next existing function or </script>)
      const bodyScriptEnd = code.indexOf("'    function viewPathwaysMaster() {", bodyScriptStart) +
                            code.substring(code.indexOf("'    function viewPathwaysMaster() {", bodyScriptStart)).indexOf("'    }' +") + 10;

      // Remove the duplicate Discovery functions from body
      const beforeDuplicate = code.substring(0, bodyScriptStart);
      const afterDuplicate = code.substring(bodyScriptEnd);

      code = beforeDuplicate + afterDuplicate;
      console.log('   ✅ Removed duplicate Discovery JavaScript from <body>\n');
    } else {
      console.log('   ℹ️  No duplicate Discovery JavaScript found in <body> (already clean)\n');
    }

    const modifiedSize = (code.length / 1024).toFixed(1);
    console.log(`   Code.gs size: ${originalSize} KB → ${modifiedSize} KB\n`);

    // Step 5: Upload
    console.log('💾 Step 5: Uploading modified Code.gs...\n');

    const updatedFiles = currentProject.data.files.map(f => {
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
    console.log('✅ THE <HEAD> FIX COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🧪 TEST INSTRUCTIONS:\n');
    console.log('1. Refresh Google Sheet (F5)');
    console.log('2. Open: 🧠 Sim Builder → 🧩 Categories & Pathways');
    console.log('3. Click AI Discovery tab');
    console.log('4. Select a logic type from dropdown');
    console.log('5. "Discover Pathways" button should NOW be clickable!\n');
    console.log('📊 WHAT CHANGED:\n');
    console.log('   Before: JavaScript in <body> <script> tag (loaded after HTML)');
    console.log('   After: JavaScript in <head> <script> tag (loaded before HTML)');
    console.log('   Result: Event handlers available when HTML elements render\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

deployJSToHead();
