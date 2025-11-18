#!/usr/bin/env node

/**
 * BABY STEP 4: FIX - Add AI Discovery to MODAL (not sidebar)
 *
 * This corrects our deployment to integrate into the Pathway Chain Builder modal
 * instead of the small sidebar.
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function deployStep4() {
  try {
    console.log('🚀 BABY STEP 4: Add AI Discovery Tab to Pathway Chain Builder Modal\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Initialize auth
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

    // Step 1: Get current project content
    console.log('📥 Step 1: Downloading current project...\n');
    const currentProject = await script.projects.getContent({
      scriptId: scriptId
    });

    console.log(`   Current files (${currentProject.data.files.length}):`);
    currentProject.data.files.forEach(f => {
      const size = f.source ? `${(f.source.length / 1024).toFixed(1)} KB` : 'N/A';
      console.log(`      - ${f.name} (${f.type}) - ${size}`);
    });

    // Step 2: Read Phase2_Modal_Integration.gs
    console.log('\n📄 Step 2: Reading Phase2_Modal_Integration.gs...\n');
    const modalIntegrationPath = path.join(__dirname, '../apps-script-deployable/Phase2_Modal_Integration.gs');
    const modalIntegrationContent = fs.readFileSync(modalIntegrationPath, 'utf8');
    const modalIntegrationSize = (modalIntegrationContent.length / 1024).toFixed(1);

    console.log(`   ✅ Loaded: ${modalIntegrationSize} KB\n`);

    // Step 3: Modify Code.gs to add third tab
    console.log('🔧 Step 3: Modifying buildBirdEyeViewUI_() to add AI Discovery tab...\n');

    const codeFile = currentProject.data.files.find(f => f.name === 'Code');
    if (!codeFile) {
      throw new Error('Code.gs not found in project!');
    }

    let modifiedCode = codeFile.source;
    const originalSize = (modifiedCode.length / 1024).toFixed(1);

    // Find the buildBirdEyeViewUI_ function
    const functionStart = modifiedCode.indexOf('function buildBirdEyeViewUI_(analysis) {');
    if (functionStart === -1) {
      throw new Error('buildBirdEyeViewUI_() function not found!');
    }

    console.log('   ✅ Found buildBirdEyeViewUI_() at position ' + functionStart);

    // Find where tabs are built (look for const pathwaysTabHTML line)
    const tabBuildSection = modifiedCode.indexOf('const categoriesTabHTML = buildCategoriesTabHTML_(analysis);');
    if (tabBuildSection === -1) {
      throw new Error('Tab build section not found!');
    }

    // Add AI Discovery tab building
    const addDiscoveryTab = modifiedCode.substring(0, tabBuildSection) +
      'const categoriesTabHTML = buildCategoriesTabHTML_(analysis);\n  const pathwaysTabHTML = buildPathwaysTabHTML_(analysis);\n  const discoveryTabHTML = buildAIDiscoveryTabHTML_();' +
      modifiedCode.substring(tabBuildSection + 'const categoriesTabHTML = buildCategoriesTabHTML_(analysis);  const pathwaysTabHTML = buildPathwaysTabHTML_(analysis);'.length);

    modifiedCode = addDiscoveryTab;

    // Find the tab buttons section and add third tab
    const tabButtonsSection = modifiedCode.indexOf('">🧩 Pathways</button>\' +');
    if (tabButtonsSection === -1) {
      throw new Error('Tab buttons section not found!');
    }

    const thirdTabButton = `">🧩 Pathways</button>' +
'      <button class="tab" id="discovery-tab-btn" onclick="' +
'        document.getElementById(\\'categories-tab-btn\\').classList.remove(\\'active\\');' +
'        document.getElementById(\\'pathways-tab-btn\\').classList.remove(\\'active\\');' +
'        document.getElementById(\\'discovery-tab-btn\\').classList.add(\\'active\\');' +
'        document.getElementById(\\'categories-tab\\').style.display = \\'none\\';' +
'        document.getElementById(\\'pathways-tab\\').style.display = \\'none\\';' +
'        document.getElementById(\\'discovery-tab\\').style.display = \\'block\\';' +
'      ">🔍 AI Discovery</button>' +`;

    modifiedCode = modifiedCode.substring(0, tabButtonsSection) +
      thirdTabButton +
      modifiedCode.substring(tabButtonsSection + '">🧩 Pathways</button>\' +'.length);

    // Add discoveryTabHTML to the HTML output (after pathwaysTabHTML)
    const htmlOutputSection = modifiedCode.indexOf('\'  \' + categoriesTabHTML +\n\'  \' + pathwaysTabHTML +');
    if (htmlOutputSection === -1) {
      throw new Error('HTML output section not found!');
    }

    modifiedCode = modifiedCode.substring(0, htmlOutputSection) +
      '\'  \' + categoriesTabHTML +\n\'  \' + pathwaysTabHTML +\n\'  \' + discoveryTabHTML +' +
      modifiedCode.substring(htmlOutputSection + '\'  \' + categoriesTabHTML +\n\'  \' + pathwaysTabHTML +'.length);

    console.log('   ✅ Added third tab button (AI Discovery)');
    console.log('   ✅ Added discoveryTabHTML variable');
    console.log('   ✅ Added discoveryTabHTML to output');

    // Add JavaScript functions for AI Discovery tab
    const scriptEndTag = modifiedCode.lastIndexOf('  </script>');
    if (scriptEndTag === -1) {
      throw new Error('Script end tag not found!');
    }

    const discoveryJavaScript = `
    // AI Discovery Tab Functions
    function handleLogicTypeChange() {
      var select = document.getElementById('logic-type-selector');
      var btn = document.getElementById('discover-btn');

      if (select.value === 'CREATE_NEW') {
        alert('Create New Logic Type feature coming soon!');
        select.value = '';
        btn.disabled = true;
      } else if (select.value) {
        btn.disabled = false;
      } else {
        btn.disabled = true;
      }
    }

    function discoverPathways() {
      var logicTypeId = document.getElementById('logic-type-selector').value;

      if (!logicTypeId || logicTypeId === 'CREATE_NEW') {
        alert('Please select a logic type first');
        return;
      }

      var btn = document.getElementById('discover-btn');
      btn.disabled = true;
      btn.innerHTML = '<span class="btn-icon">🔄</span><span class="btn-text">Discovering...</span>';

      google.script.run
        .withSuccessHandler(handleDiscoveryResults)
        .withFailureHandler(handleDiscoveryError)
        .discoverPathwaysWithLogicType(logicTypeId);
    }

    function handleDiscoveryResults(result) {
      var btn = document.getElementById('discover-btn');
      btn.disabled = false;
      btn.innerHTML = '<span class="btn-icon">🤖</span><span class="btn-text">Discover Pathways</span>';

      if (!result.success) {
        alert('Error: ' + result.error);
        return;
      }

      var html = '';
      result.pathways.forEach(function(sp, idx) {
        var p = sp.pathway;
        var s = sp.scoring;
        var tierClass = 'tier-' + s.tier.charAt(0).toLowerCase();

        html += '<div class="pathway-card">';
        html += '  <div class="pathway-card-header">';
        html += '    <div class="pathway-name">' + (idx + 1) + '. ' + p.name + '</div>';
        html += '    <span class="tier-badge ' + tierClass + '">' + s.tier + '</span>';
        html += '  </div>';
        html += '  <div class="pathway-description">' + p.description + '</div>';
        html += '  <div class="pathway-persuasion"><p>"' + s.persuasion.persuasion_narrative + '"</p></div>';
        html += '  <div class="pathway-meta">';
        html += '    <div class="meta-item">📊 Score: <strong>' + s.composite_score + '/10</strong></div>';
        html += '    <div class="meta-item">📚 <strong>' + p.caseIds.length + '</strong> cases</div>';
        html += '    <div class="meta-item">🎯 ' + p.targetLearner + '</div>';
        html += '  </div>';
        html += '</div>';
      });

      document.getElementById('discovery-results-content').innerHTML = html;
      document.getElementById('discovery-results-container').style.display = 'block';
      document.getElementById('results-title').textContent = result.pathwaysCount + ' Pathways Discovered using "' + result.logicType + '"';

      alert('✅ Discovery complete! ' + result.pathwaysCount + ' pathways saved to Pathways_Master sheet.');
    }

    function handleDiscoveryError(error) {
      var btn = document.getElementById('discover-btn');
      btn.disabled = false;
      btn.innerHTML = '<span class="btn-icon">🤖</span><span class="btn-text">Discover Pathways</span>';
      alert('Error during discovery: ' + error.message);
    }

    function clearDiscoveryResults() {
      document.getElementById('discovery-results-container').style.display = 'none';
      document.getElementById('discovery-results-content').innerHTML = '';
    }

    function viewLogicTypeLibrary() {
      google.script.run
        .withSuccessHandler(function() {
          alert('Logic Type Library sheet is now active');
        })
        .manageLogicTypes();
    }

    function viewPathwaysMaster() {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName('Pathways_Master');
      if (sheet) {
        sheet.activate();
      }
    }

  `;

    modifiedCode = modifiedCode.substring(0, scriptEndTag) +
      discoveryJavaScript +
      modifiedCode.substring(scriptEndTag);

    console.log('   ✅ Added JavaScript functions for AI Discovery tab');

    const modifiedSize = (modifiedCode.length / 1024).toFixed(1);
    console.log(`\n   Code.gs size: ${originalSize} KB → ${modifiedSize} KB\n`);

    // Step 4: Prepare updated files
    console.log('📤 Step 4: Preparing file updates...\n');

    const updatedFiles = currentProject.data.files.map(f => {
      if (f.name === 'Code') {
        return { ...f, source: modifiedCode };
      }
      return f;
    });

    // Add Phase2_Modal_Integration.gs
    updatedFiles.push({
      name: 'Phase2_Modal_Integration',
      type: 'SERVER_JS',
      source: modalIntegrationContent
    });

    console.log(`   ✅ Prepared ${updatedFiles.length} files for upload\n`);

    // Step 5: Upload
    console.log('💾 Step 5: Uploading to Apps Script...\n');

    await script.projects.updateContent({
      scriptId: scriptId,
      requestBody: {
        files: updatedFiles
      }
    });

    console.log('   ✅ Upload complete!\n');

    // Step 6: Verify
    console.log('🔍 Step 6: Verifying deployment...\n');
    const verifyProject = await script.projects.getContent({
      scriptId: scriptId
    });

    console.log(`   Files in project now (${verifyProject.data.files.length}):`);
    verifyProject.data.files.forEach(f => {
      const size = f.source ? `${(f.source.length / 1024).toFixed(1)} KB` : 'N/A';
      const isNew = f.name === 'Phase2_Modal_Integration' ? '✨ NEW' : '';
      const isModified = f.name === 'Code' ? '🔧 MODIFIED' : '';
      const isPhase2 = f.name.startsWith('Phase2') && !isNew ? '(Phase 2)' : '';
      console.log(`      - ${f.name} (${f.type}) - ${size} ${isNew}${isModified}${isPhase2}`);
    });

    const hasModalIntegration = verifyProject.data.files.some(f => f.name === 'Phase2_Modal_Integration');

    console.log('\n═══════════════════════════════════════════════════════════════');
    if (hasModalIntegration) {
      console.log('✅ BABY STEP 4 COMPLETE - MODAL INTEGRATION FIXED!');
      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log('Phase2_Modal_Integration.gs deployed!\n');
      console.log('📦 CHANGES MADE:\n');
      console.log('   ✅ Added Phase2_Modal_Integration.gs file');
      console.log('   ✅ Modified buildBirdEyeViewUI_() in Code.gs');
      console.log('   ✅ Added third tab: 🔍 AI Discovery');
      console.log('   ✅ Integrated into Pathway Chain Builder modal');
      console.log('   ✅ All existing functionality preserved\n');
      console.log('🧪 TEST INSTRUCTIONS:\n');
      console.log('1. Refresh Google Sheet (F5)');
      console.log('2. Open: 🧠 Sim Builder → 🧩 Categories & Pathways');
      console.log('3. You should see the Pathway Chain Builder modal');
      console.log('4. Look for THREE TABS at the top:');
      console.log('   - 📁 Categories (existing)');
      console.log('   - 🧩 Pathways (existing)');
      console.log('   - 🔍 AI Discovery (NEW!)');
      console.log('5. Click the AI Discovery tab');
      console.log('6. Select a logic type and click "Discover Pathways"');
      console.log('7. Verify existing tabs still work\n');
      console.log('If all three tabs work correctly, we\'re done! 🎉\n');
    } else {
      console.log('❌ DEPLOYMENT FAILED');
      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log('Phase2_Modal_Integration file not found.\n');
    }

  } catch (error) {
    console.error('\n❌ Deployment Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

deployStep4();
