#!/usr/bin/env node

/**
 * FIX: Add missing JavaScript functions for AI Discovery tab
 * These functions handle button clicks and discovery workflow
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function deployJavaScriptFunctions() {
  try {
    console.log('🔧 DEPLOY STEP 4.5: Add Missing JavaScript Functions\n');
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
    console.log('📥 Step 1: Downloading current Code.gs...\n');
    const currentProject = await script.projects.getContent({ scriptId });

    const codeFile = currentProject.data.files.find(f => f.name === 'Code');
    if (!codeFile) throw new Error('Code.gs not found!');

    let code = codeFile.source;
    const originalSize = (code.length / 1024).toFixed(1);

    // Step 2: Find the script end tag (before the closing </script>)
    console.log('🔍 Step 2: Locating script end tag...\n');
    
    // Look for the pattern just before </script> in the buildBirdEyeViewUI_ function
    const scriptEndMarker = "'  </script>' +";
    const scriptEndIndex = code.indexOf(scriptEndMarker);
    
    if (scriptEndIndex === -1) {
      throw new Error('Could not find script end marker!');
    }

    console.log('   ✅ Found script end marker at position ' + scriptEndIndex);

    // Step 3: Prepare JavaScript functions to insert
    const discoveryJavaScript = `
'    ' +
'    // AI Discovery Tab Functions' +
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
'    function handleDiscoveryResults(result) {' +
'      var btn = document.getElementById(\\'discover-btn\\');' +
'      btn.disabled = false;' +
'      btn.innerHTML = \\'<span class=\"btn-icon\">🤖</span><span class=\"btn-text\">Discover Pathways</span>\\';' +
'      ' +
'      if (!result.success) {' +
'        alert(\\'Error: \\' + result.error);' +
'        return;' +
'      }' +
'      ' +
'      var html = \\'\\';' +
'      result.pathways.forEach(function(sp, idx) {' +
'        var p = sp.pathway;' +
'        var s = sp.scoring;' +
'        var tierClass = \\'tier-\\' + s.tier.charAt(0).toLowerCase();' +
'        ' +
'        html += \\'<div class=\"pathway-card\">\\';' +
'        html += \\'  <div class=\"pathway-card-header\">\\';' +
'        html += \\'    <div class=\"pathway-name\">\\' + (idx + 1) + \\'. \\' + p.name + \\'</div>\\';' +
'        html += \\'    <span class=\"tier-badge \\' + tierClass + \\'\">\\'  + s.tier + \\'</span>\\';' +
'        html += \\'  </div>\\';' +
'        html += \\'  <div class=\"pathway-description\">\\' + p.description + \\'</div>\\';' +
'        html += \\'  <div class=\"pathway-persuasion\"><p>\"\\' + s.persuasion.persuasion_narrative + \\'\"</p></div>\\';' +
'        html += \\'  <div class=\"pathway-meta\">\\';' +
'        html += \\'    <div class=\"meta-item\">📊 Score: <strong>\\' + s.composite_score + \\'/10</strong></div>\\';' +
'        html += \\'    <div class=\"meta-item\">📚 <strong>\\' + p.caseIds.length + \\'</strong> cases</div>\\';' +
'        html += \\'    <div class=\"meta-item\">🎯 \\' + p.targetLearner + \\'</div>\\';' +
'        html += \\'  </div>\\';' +
'        html += \\'</div>\\';' +
'      });' +
'      ' +
'      document.getElementById(\\'discovery-results-content\\').innerHTML = html;' +
'      document.getElementById(\\'discovery-results-container\\').style.display = \\'block\\';' +
'      document.getElementById(\\'results-title\\').textContent = result.pathwaysCount + \\' Pathways Discovered using \"\\' + result.logicType + \\'\"\\';' +
'      ' +
'      alert(\\'✅ Discovery complete! \\' + result.pathwaysCount + \\' pathways saved to Pathways_Master sheet.\\');' +
'    }' +
'    ' +
'    function handleDiscoveryError(error) {' +
'      var btn = document.getElementById(\\'discover-btn\\');' +
'      btn.disabled = false;' +
'      btn.innerHTML = \\'<span class=\"btn-icon\">🤖</span><span class=\"btn-text\">Discover Pathways</span>\\';' +
'      alert(\\'Error during discovery: \\' + error.message);' +
'    }' +
'    ' +
'    function clearDiscoveryResults() {' +
'      document.getElementById(\\'discovery-results-container\\').style.display = \\'none\\';' +
'      document.getElementById(\\'discovery-results-content\\').innerHTML = \\'\\';' +
'    }' +
'    ' +
'    function viewLogicTypeLibrary() {' +
'      google.script.run' +
'        .withSuccessHandler(function() {' +
'          alert(\\'Logic Type Library sheet is now active\\');' +
'        })' +
'        .manageLogicTypes();' +
'    }' +
'    ' +
'    function viewPathwaysMaster() {' +
'      google.script.run' +
'        .withSuccessHandler(function() {' +
'          alert(\\'Pathways_Master sheet is now active\\');' +
'        })' +
'        .viewPathwaysMaster();' +
'    }' +
'    ' +
`;

    // Step 4: Insert JavaScript before script end tag
    console.log('🔧 Step 3: Inserting JavaScript functions...\n');
    
    code = code.substring(0, scriptEndIndex) +
      discoveryJavaScript +
      code.substring(scriptEndIndex);

    console.log('   ✅ Inserted 7 JavaScript functions for AI Discovery');

    const modifiedSize = (code.length / 1024).toFixed(1);
    console.log(`\n   Code.gs size: ${originalSize} KB → ${modifiedSize} KB\n`);

    // Step 5: Prepare files
    console.log('📤 Step 4: Preparing file updates...\n');

    const updatedFiles = currentProject.data.files.map(f => {
      if (f.name === 'Code') {
        return { ...f, source: code };
      }
      return f;
    });

    console.log(`   ✅ Prepared ${updatedFiles.length} files\n`);

    // Step 6: Upload
    console.log('💾 Step 5: Uploading to Apps Script...\n');

    await script.projects.updateContent({
      scriptId: scriptId,
      requestBody: { files: updatedFiles }
    });

    console.log('   ✅ Upload complete!\n');

    // Step 7: Verify
    console.log('🔍 Step 6: Verifying deployment...\n');
    const verifyProject = await script.projects.getContent({ scriptId });
    const verifyCodeFile = verifyProject.data.files.find(f => f.name === 'Code');

    const functionsToCheck = [
      'function handleLogicTypeChange()',
      'function discoverPathways()',
      'function handleDiscoveryResults(result)',
      'function handleDiscoveryError(error)',
      'function clearDiscoveryResults()',
      'function viewLogicTypeLibrary()',
      'function viewPathwaysMaster()'
    ];

    console.log('   JavaScript Functions in Code.gs:\n');
    let allPresent = true;
    functionsToCheck.forEach(fn => {
      const exists = verifyCodeFile.source.includes(fn);
      console.log('      ' + (exists ? '✅' : '❌') + ' ' + fn);
      if (!exists) allPresent = false;
    });

    console.log('\n═══════════════════════════════════════════════════════════════');
    if (allPresent) {
      console.log('✅ STEP 4.5 COMPLETE - JAVASCRIPT FUNCTIONS DEPLOYED!');
      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log('🧪 TEST INSTRUCTIONS:\n');
      console.log('1. Refresh Google Sheet (F5)');
      console.log('2. Open: 🧠 Sim Builder → 🧩 Categories & Pathways');
      console.log('3. Click AI Discovery tab');
      console.log('4. Select a logic type from dropdown');
      console.log('5. Click "Discover Pathways" button');
      console.log('6. Button should change to "Discovering..." and call the API\n');
    } else {
      console.log('❌ DEPLOYMENT INCOMPLETE - Some functions missing\n');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

deployJavaScriptFunctions();
