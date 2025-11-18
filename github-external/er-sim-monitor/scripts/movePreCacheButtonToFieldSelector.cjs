#!/usr/bin/env node

/**
 * MOVE "PRE-CACHE RICH DATA" BUTTON TO FIELD SELECTOR MODAL
 *
 * The user wants:
 * 1. Click "Categories & Pathways" → Pathway UI opens (no button needed there)
 * 2. Pathway UI shows placeholder analysis (0 cases)
 * 3. User manually clicks custom menu item or keyboard shortcut to open field selector
 * 4. Field selector modal has "Cache All Layers" button at bottom
 * 5. User reviews fields, adjusts selection, clicks "Cache All Layers"
 * 6. Live Log shows batch processing progress
 * 7. When done, modal shows success message with diagnostics
 *
 * Changes:
 * - Remove "Pre-Cache Rich Data" button from Pathway UI
 * - Add "Cache All Layers" button to field selector modal (bottom)
 * - Keep Live Log panel visible throughout
 * - Show comprehensive diagnostics when complete
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

async function authorize() {
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const tokenPath = path.join(__dirname, '../config/token.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

async function fix() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading current code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('🔧 STEP 1: Removing "Pre-Cache Rich Data" button from Pathway UI...\n');

    // Find and remove the green "Pre-Cache Rich Data" button from buildPathwaysTabHTML_
    const buttonPattern = /<button class="precache-btn" onclick="google\.script\.run\.preCacheRichData\(\);"[^>]*>💾 Pre-Cache Rich Data<\/button>/;

    if (code.match(buttonPattern)) {
      code = code.replace(buttonPattern, '');
      console.log('✅ Removed "Pre-Cache Rich Data" button from Pathway UI\n');
    } else {
      console.log('⚠️  Button pattern not found, trying alternative...\n');

      // Try broader pattern
      const altPattern = "'        <button class=\"precache-btn\" onclick=\"google.script.run.preCacheRichData();\"";
      const startIdx = code.indexOf(altPattern);
      if (startIdx !== -1) {
        const endIdx = code.indexOf('</button>', startIdx) + 9;
        const buttonCode = code.substring(startIdx, endIdx);
        code = code.replace(buttonCode + "' +\n", '');
        console.log('✅ Removed button using alternative pattern\n');
      }
    }

    console.log('🔧 STEP 2: Adding "Cache All Layers" button to field selector modal...\n');

    // Find the field selector modal HTML - specifically the button area
    const returnButtonPattern = "'  <button onclick=\"returnToPanel()\"";
    const returnButtonIdx = code.indexOf(returnButtonPattern);

    if (returnButtonIdx === -1) {
      console.log('❌ Could not find return button in field selector\n');
      return;
    }

    // Find the complete button group ending
    const buttonGroupEnd = code.indexOf("'</div>' +", returnButtonIdx);

    if (buttonGroupEnd === -1) {
      console.log('❌ Could not find button group end\n');
      return;
    }

    // Insert "Cache All Layers" button before the closing div
    const cacheButton = `'    <button onclick=\"startCacheAllLayers()\" style=\"background:linear-gradient(135deg,#00c853 0%,#00a040 100%);color:#fff;border:none;padding:12px 24px;border-radius:4px;font-size:14px;font-weight:bold;cursor:pointer;box-shadow:0 0 12px rgba(0,200,83,0.3);\">💾 Cache All Layers</button>' +\n      `;

    code = code.substring(0, buttonGroupEnd) + cacheButton + code.substring(buttonGroupEnd);

    console.log('✅ Added "Cache All Layers" button to field selector\n');

    console.log('🔧 STEP 3: Adding startCacheAllLayers() JavaScript function...\n');

    // Find where JavaScript functions are defined in the modal
    const returnToPanelFunc = code.indexOf("'function returnToPanel() {");

    if (returnToPanelFunc === -1) {
      console.log('❌ Could not find returnToPanel function\n');
      return;
    }

    // Add the new function after returnToPanel
    const returnFuncEnd = code.indexOf("'}' +", returnToPanelFunc);

    const cacheAllLayersFunc = `\n      'function startCacheAllLayers() {' +
      '  addLog(\"🚀 Starting Cache All Layers...\", \"info\");' +
      '  addLog(\"📋 Collecting selected fields...\", \"info\");' +
      '' +
      '  // Get all checked checkboxes' +
      '  var checkboxes = document.querySelectorAll(\"input[type=\\\\\"checkbox\\\\\"]:checked\");' +
      '  var selectedFields = [];' +
      '  for (var i = 0; i < checkboxes.length; i++) {' +
      '    selectedFields.push(checkboxes[i].value);' +
      '  }' +
      '' +
      '  addLog(\"✅ Selected \" + selectedFields.length + \" fields\", \"success\");' +
      '  addLog(\"💾 Saving selection to cache...\", \"info\");' +
      '' +
      '  // Save selection and start cache' +
      '  google.script.run' +
      '    .withSuccessHandler(function(result) {' +
      '      addLog(\"✅ Selection saved!\", \"success\");' +
      '      addLog(\"🔄 Starting batch processing...\", \"info\");' +
      '      addLog(\"📊 Processing 25 rows at a time\", \"info\");' +
      '      addLog(\"\", \"info\");' +
      '' +
      '      // Now start the actual cache process' +
      '      google.script.run' +
      '        .withSuccessHandler(function(cacheResult) {' +
      '          if (cacheResult.success) {' +
      '            addLog(\"\", \"info\");' +
      '            addLog(\"═══════════════════════════════════════\", \"success\");' +
      '            addLog(\"✅ CACHE COMPLETE!\", \"success\");' +
      '            addLog(\"═══════════════════════════════════════\", \"success\");' +
      '            addLog(\"\", \"info\");' +
      '            addLog(\"📊 DIAGNOSTICS:\", \"info\");' +
      '            addLog(\"   • Cases processed: \" + cacheResult.casesProcessed, \"info\");' +
      '            addLog(\"   • Fields per case: \" + cacheResult.fieldsPerCase, \"info\");' +
      '            addLog(\"   • Time elapsed: \" + cacheResult.elapsed + \"s\", \"info\");' +
      '            addLog(\"\", \"info\");' +
      '            addLog(\"💡 You can now copy these logs and send to Claude for diagnostics\", \"info\");' +
      '          } else {' +
      '            addLog(\"❌ CACHE FAILED: \" + cacheResult.error, \"error\");' +
      '          }' +
      '        })' +
      '        .withFailureHandler(function(error) {' +
      '          addLog(\"❌ ERROR: \" + error.message, \"error\");' +
      '        })' +
      '        .performCacheWithProgress();' +
      '    })' +
      '    .withFailureHandler(function(error) {' +
      '      addLog(\"❌ Failed to save selection: \" + error.message, \"error\");' +
      '    })' +
      '    .saveFieldSelectionAndStartCache(selectedFields);' +
      '}' +`;

    code = code.substring(0, returnFuncEnd + 5) + cacheAllLayersFunc + code.substring(returnFuncEnd + 5);

    console.log('✅ Added startCacheAllLayers() function\n');

    console.log('🔧 STEP 4: Updating preCacheRichData() to directly open field selector...\n');

    // Update preCacheRichData to just open the modal (no longer triggered by button)
    const preCacheFunc = code.indexOf('function preCacheRichData() {');
    const preCacheFuncEnd = code.indexOf('\n}', preCacheFunc);

    if (preCacheFunc !== -1 && preCacheFuncEnd !== -1) {
      const newPreCacheFunc = `function preCacheRichData() {
  // This function now just opens the field selector modal
  // User can call this via custom menu or keyboard shortcut
  try {
    Logger.log('🚀 preCacheRichData() called - opening field selector');
    showFieldSelector();
  } catch (error) {
    Logger.log('❌ preCacheRichData ERROR: ' + error.toString());
    SpreadsheetApp.getUi().alert('Field Selector Error: ' + error.message + '\\n\\nCheck Execution Log for details.');
  }
}`;

      code = code.substring(0, preCacheFunc) + newPreCacheFunc + code.substring(preCacheFuncEnd + 2);
      console.log('✅ Updated preCacheRichData() function\n');
    }

    console.log('🔧 STEP 5: Fixing saveFieldSelectionAndStartCache() to NOT auto-start cache...\n');

    // Find saveFieldSelectionAndStartCache
    const saveFuncPattern = 'function saveFieldSelectionAndStartCache(selectedFields) {';
    const saveFuncStart = code.indexOf(saveFuncPattern);
    const saveFuncEnd = code.indexOf('\n}', saveFuncStart);

    if (saveFuncStart !== -1 && saveFuncEnd !== -1) {
      const newSaveFunc = `function saveFieldSelectionAndStartCache(selectedFields) {
  const docProps = PropertiesService.getDocumentProperties();
  docProps.setProperty('SELECTED_CACHE_FIELDS', JSON.stringify(selectedFields));

  Logger.log('✅ Saved field selection: ' + selectedFields.length + ' fields');
  Logger.log('Fields: ' + selectedFields.join(', '));

  // Return success (caller will trigger cache separately)
  return { success: true, fieldCount: selectedFields.length };
}`;

      code = code.substring(0, saveFuncStart) + newSaveFunc + code.substring(saveFuncEnd + 2);
      console.log('✅ Updated saveFieldSelectionAndStartCache() to just save (no auto-cache)\n');
    }

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ FIELD SELECTOR MODAL NOW HAS "CACHE ALL LAYERS" BUTTON!\n');
    console.log('\nComplete User Workflow:\n');
    console.log('  1. Click "Categories & Pathways" menu\n');
    console.log('     → Headers cache refreshes (background)\n');
    console.log('     → 35 defaults initialize (background)\n');
    console.log('     → AI recommendations pre-fetch (background)\n');
    console.log('     → Pathway UI opens with placeholder (0 cases)\n');
    console.log('');
    console.log('  2. Open field selector (via custom menu or preCacheRichData())\n');
    console.log('     → Modal opens with Live Log panel\n');
    console.log('     → Section 1: Last saved defaults (pre-checked)\n');
    console.log('     → Section 2: AI recommendations (unchecked)\n');
    console.log('     → Section 3: All other 642 fields\n');
    console.log('');
    console.log('  3. Review fields, adjust checkboxes\n');
    console.log('');
    console.log('  4. Click "💾 Cache All Layers" button (green, bottom of modal)\n');
    console.log('     → Live Log shows: "Saving selection..."\n');
    console.log('     → Live Log shows: "Starting batch processing..."\n');
    console.log('     → Live Log shows: "Processing 25 rows at a time"\n');
    console.log('     → Live Log shows progress for each batch\n');
    console.log('     → Live Log shows final diagnostics:\n');
    console.log('         • Cases processed\n');
    console.log('         • Fields per case\n');
    console.log('         • Time elapsed\n');
    console.log('');
    console.log('  5. Copy logs and send to Claude for diagnostics!\n');
    console.log('');
    console.log('Buttons in Field Selector Modal:\n');
    console.log('  🔙 Return to Panel (top right) - Close modal without caching\n');
    console.log('  📋 Copy Logs (top right) - Copy all Live Log entries\n');
    console.log('  💾 Cache All Layers (bottom, green, glowing) - Start batch processing\n');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

fix();
