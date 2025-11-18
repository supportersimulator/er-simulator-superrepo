#!/usr/bin/env node

/**
 * BABY STEP 4 (SAFE): Add AI Discovery Tab to Modal
 *
 * Uses exact pattern matching to safely insert third tab
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function deployStep4Safe() {
  try {
    console.log('🚀 BABY STEP 4 (SAFE): Add AI Discovery Tab to Modal\n');
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

    console.log(`   Current files (${currentProject.data.files.length}):`);
    currentProject.data.files.forEach(f => {
      const size = f.source ? `${(f.source.length / 1024).toFixed(1)} KB` : 'N/A';
      console.log(`      - ${f.name} (${f.type}) - ${size}`);
    });

    // Step 2: Read Phase2_Modal_Integration.gs
    console.log('\n📄 Step 2: Reading Phase2_Modal_Integration.gs...\n');
    const modalIntegrationPath = path.join(__dirname, '../apps-script-deployable/Phase2_Modal_Integration.gs');
    const modalIntegrationContent = fs.readFileSync(modalIntegrationPath, 'utf8');
    console.log(`   ✅ Loaded: ${(modalIntegrationContent.length / 1024).toFixed(1)} KB\n`);

    // Step 3: Modify Code.gs
    console.log('🔧 Step 3: Safely modifying Code.gs...\n');

    const codeFile = currentProject.data.files.find(f => f.name === 'Code');
    if (!codeFile) throw new Error('Code.gs not found!');

    let code = codeFile.source;
    const originalSize = (code.length / 1024).toFixed(1);

    // CHANGE 1: Add discoveryTabHTML variable after pathwaysTabHTML
    const marker1 = '  const categoriesTabHTML = buildCategoriesTabHTML_(analysis);\n  const pathwaysTabHTML = buildPathwaysTabHTML_(analysis);';
    if (code.indexOf(marker1) === -1) {
      throw new Error('Could not find tab HTML building section');
    }

    code = code.replace(
      marker1,
      `  const categoriesTabHTML = buildCategoriesTabHTML_(analysis);
  const pathwaysTabHTML = buildPathwaysTabHTML_(analysis);
  const discoveryTabHTML = buildAIDiscoveryTabHTML_();`
    );
    console.log('   ✅ Added discoveryTabHTML variable');

    // CHANGE 2: Add third tab button (matching exact format)
    const marker2 = `'      ">🧩 Pathways</button>' +
'    </div>' +`;

    if (code.indexOf(marker2) === -1) {
      throw new Error('Could not find tab buttons section');
    }

    const thirdTabButton = `'      ">🧩 Pathways</button>' +
'      <button class="tab" id="discovery-tab-btn" onclick="' +
'        document.getElementById(\\'categories-tab-btn\\').classList.remove(\\'active\\');' +
'        document.getElementById(\\'pathways-tab-btn\\').classList.remove(\\'active\\');' +
'        document.getElementById(\\'discovery-tab-btn\\').classList.add(\\'active\\');' +
'        document.getElementById(\\'categories-tab\\').style.display = \\'none\\';' +
'        document.getElementById(\\'pathways-tab\\').style.display = \\'none\\';' +
'        document.getElementById(\\'discovery-tab\\').style.display = \\'block\\';' +
'      ">🔍 AI Discovery</button>' +
'    </div>' +`;

    code = code.replace(marker2, thirdTabButton);
    console.log('   ✅ Added third tab button');

    // CHANGE 3: Add discoveryTabHTML to output
    const marker3 = `'  ' + categoriesTabHTML +
'  ' + pathwaysTabHTML +
'' +
'  <script>'`;

    if (code.indexOf(marker3) === -1) {
      throw new Error('Could not find HTML output section');
    }

    code = code.replace(
      marker3,
      `'  ' + categoriesTabHTML +
'  ' + pathwaysTabHTML +
'  ' + discoveryTabHTML +
'' +
'  <script>'`
    );
    console.log('   ✅ Added discoveryTabHTML to output');

    // CHANGE 4: Add showDiscovery() function (matching exact pattern of showCategories/showPathways)
    const marker4 = `'    function showPathways() {' +
'      // Update tab buttons' +
'      var categoriesBtn = document.getElementById(\\'categories-tab-btn\\');' +
'      var pathwaysBtn = document.getElementById(\\'pathways-tab-btn\\');' +
'      if (categoriesBtn) categoriesBtn.classList.remove(\\'active\\');' +
'      if (pathwaysBtn) pathwaysBtn.classList.add(\\'active\\');' +
'      ' +
'      // Update tab content' +
'      var categoriesTab = document.getElementById(\\'categories-tab\\');' +
'      var pathwaysTab = document.getElementById(\\'pathways-tab\\');' +
'      if (categoriesTab) categoriesTab.style.display = \\'none\\';' +
'      if (pathwaysTab) pathwaysTab.style.display = \\'block\\';' +
'    }'`;

    if (code.indexOf(marker4) === -1) {
      throw new Error('Could not find showPathways() function');
    }

    const showDiscoveryFunction = `'    function showPathways() {' +
'      // Update tab buttons' +
'      var categoriesBtn = document.getElementById(\\'categories-tab-btn\\');' +
'      var pathwaysBtn = document.getElementById(\\'pathways-tab-btn\\');' +
'      if (categoriesBtn) categoriesBtn.classList.remove(\\'active\\');' +
'      if (pathwaysBtn) pathwaysBtn.classList.add(\\'active\\');' +
'      ' +
'      // Update tab content' +
'      var categoriesTab = document.getElementById(\\'categories-tab\\');' +
'      var pathwaysTab = document.getElementById(\\'pathways-tab\\');' +
'      if (categoriesTab) categoriesTab.style.display = \\'none\\';' +
'      if (pathwaysTab) pathwaysTab.style.display = \\'block\\';' +
'    }' +
'' +
'    function showDiscovery() {' +
'      // Update tab buttons' +
'      var categoriesBtn = document.getElementById(\\'categories-tab-btn\\');' +
'      var pathwaysBtn = document.getElementById(\\'pathways-tab-btn\\');' +
'      var discoveryBtn = document.getElementById(\\'discovery-tab-btn\\');' +
'      if (categoriesBtn) categoriesBtn.classList.remove(\\'active\\');' +
'      if (pathwaysBtn) pathwaysBtn.classList.remove(\\'active\\');' +
'      if (discoveryBtn) discoveryBtn.classList.add(\\'active\\');' +
'      ' +
'      // Update tab content' +
'      var categoriesTab = document.getElementById(\\'categories-tab\\');' +
'      var pathwaysTab = document.getElementById(\\'pathways-tab\\');' +
'      var discoveryTab = document.getElementById(\\'discovery-tab\\');' +
'      if (categoriesTab) categoriesTab.style.display = \\'none\\';' +
'      if (pathwaysTab) pathwaysTab.style.display = \\'none\\';' +
'      if (discoveryTab) discoveryTab.style.display = \\'block\\';' +
'    }'`;

    code = code.replace(marker4, showDiscoveryFunction);
    console.log('   ✅ Added showDiscovery() function');

    const modifiedSize = (code.length / 1024).toFixed(1);
    console.log(`\n   Code.gs size: ${originalSize} KB → ${modifiedSize} KB\n`);

    // Step 4: Prepare files
    console.log('📤 Step 4: Preparing file updates...\n');

    const updatedFiles = currentProject.data.files.map(f => {
      if (f.name === 'Code') {
        return { ...f, source: code };
      }
      return f;
    });

    // Add Phase2_Modal_Integration.gs
    updatedFiles.push({
      name: 'Phase2_Modal_Integration',
      type: 'SERVER_JS',
      source: modalIntegrationContent
    });

    console.log(`   ✅ Prepared ${updatedFiles.length} files\n`);

    // Step 5: Upload
    console.log('💾 Step 5: Uploading to Apps Script...\n');

    await script.projects.updateContent({
      scriptId: scriptId,
      requestBody: { files: updatedFiles }
    });

    console.log('   ✅ Upload complete!\n');

    // Step 6: Verify
    console.log('🔍 Step 6: Verifying deployment...\n');
    const verifyProject = await script.projects.getContent({ scriptId });

    console.log(`   Files in project now (${verifyProject.data.files.length}):`);
    verifyProject.data.files.forEach(f => {
      const size = f.source ? `${(f.source.length / 1024).toFixed(1)} KB` : 'N/A';
      const label = f.name === 'Phase2_Modal_Integration' ? '✨ NEW' :
                    f.name === 'Code' ? '🔧 MODIFIED' :
                    f.name.startsWith('Phase2') ? '(Phase 2)' : '';
      console.log(`      - ${f.name} (${f.type}) - ${size} ${label}`);
    });

    const hasModalIntegration = verifyProject.data.files.some(f => f.name === 'Phase2_Modal_Integration');

    console.log('\n═══════════════════════════════════════════════════════════════');
    if (hasModalIntegration) {
      console.log('✅ BABY STEP 4 COMPLETE - MODAL INTEGRATION SUCCESS!');
      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log('🧪 TEST INSTRUCTIONS:\n');
      console.log('1. Refresh Google Sheet (F5)');
      console.log('2. Open: 🧠 Sim Builder → 🧩 Categories & Pathways');
      console.log('3. Look for THREE TABS:');
      console.log('   - 📁 Categories');
      console.log('   - 🧩 Pathways');
      console.log('   - 🔍 AI Discovery ← NEW!');
      console.log('4. Click AI Discovery tab');
      console.log('5. Select logic type and discover pathways\n');
    } else {
      console.log('❌ DEPLOYMENT FAILED\n');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

deployStep4Safe();
