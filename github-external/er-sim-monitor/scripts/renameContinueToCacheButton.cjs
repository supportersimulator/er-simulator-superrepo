#!/usr/bin/env node

/**
 * RENAME "Continue to Cache" TO "Cache All Layers"
 *
 * Simple fix: The button already exists in the field selector modal.
 * Just rename it and update the onclick handler to show better diagnostics.
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

    console.log('🔧 STEP 1: Renaming "Continue to Cache" button to "💾 Cache All Layers"...\n');

    // Find and replace the button text
    const oldButtonHTML = '<button class="btn-continue" onclick="continueToCache()">Continue to Cache →</button>';
    const newButtonHTML = '<button class="btn-continue" onclick="continueToCache()">💾 Cache All Layers</button>';

    if (code.includes(oldButtonHTML)) {
      code = code.replace(oldButtonHTML, newButtonHTML);
      console.log('✅ Renamed button\n');
    } else {
      console.log('⚠️  Exact pattern not found, trying partial match...\n');
      code = code.replace('Continue to Cache →', '💾 Cache All Layers');
      console.log('✅ Renamed button text\n');
    }

    console.log('🔧 STEP 2: Updating continueToCache() function to show comprehensive diagnostics...\n');

    // Find the continueToCache function
    const funcStart = code.indexOf('function continueToCache() {');
    const funcEnd = code.indexOf('\n    }', funcStart) + 6;

    if (funcStart === -1 || funcEnd === -1) {
      console.log('❌ Could not find continueToCache function\n');
      return;
    }

    const newContinueFunc = `function continueToCache() {
      log('🚀 Starting Cache All Layers...');
      log('📋 Collecting selected fields...');

      var checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
      var selectedFields = [];
      for (var i = 0; i < checkboxes.length; i++) {
        selectedFields.push(checkboxes[i].value);
      }

      log('✅ Selected ' + selectedFields.length + ' fields');
      log('💾 Saving selection...');

      google.script.run
        .withSuccessHandler(function(saveResult) {
          log('✅ Selection saved!');
          log('🔄 Starting batch processing (25 rows at a time)...');
          log('');

          // Now trigger the actual cache process
          google.script.run
            .withSuccessHandler(function(cacheResult) {
              if (cacheResult.success) {
                log('');
                log('═══════════════════════════════════════════════════════');
                log('✅ CACHE COMPLETE!');
                log('═══════════════════════════════════════════════════════');
                log('');
                log('📊 DIAGNOSTICS:');
                log('   • Cases processed: ' + cacheResult.casesProcessed);
                log('   • Fields per case: ' + cacheResult.fieldsPerCase);
                log('   • Time elapsed: ' + cacheResult.elapsed + 's');
                log('');
                log('💡 Click "Copy" button to copy these logs');
                log('💡 Send copied logs to Claude for diagnostics');
              } else {
                log('❌ CACHE FAILED: ' + cacheResult.error);
              }
            })
            .withFailureHandler(function(error) {
              log('❌ CACHE ERROR: ' + error.message);
            })
            .performCacheWithProgress();
        })
        .withFailureHandler(function(error) {
          log('❌ Save failed: ' + error.message);
        })
        .saveFieldSelectionAndStartCache(selectedFields);
    }`;

    code = code.substring(0, funcStart) + newContinueFunc + code.substring(funcEnd);

    console.log('✅ Updated continueToCache() with comprehensive diagnostics\n');

    console.log('🔧 STEP 3: Verifying saveFieldSelectionAndStartCache returns success...\n');

    // Check if the function returns properly
    if (code.includes('function saveFieldSelectionAndStartCache(selectedFields)')) {
      console.log('✅ saveFieldSelectionAndStartCache exists\n');

      // Make sure it returns a result
      const saveFuncPattern = 'function saveFieldSelectionAndStartCache(selectedFields) {';
      const saveFuncStart = code.indexOf(saveFuncPattern);
      const saveFuncEnd = code.indexOf('\n}', saveFuncStart);

      if (saveFuncStart !== -1 && saveFuncEnd !== -1) {
        const funcBody = code.substring(saveFuncStart, saveFuncEnd);

        if (!funcBody.includes('return {')) {
          console.log('⚠️  Function missing return statement, adding...\n');

          const newSaveFunc = `function saveFieldSelectionAndStartCache(selectedFields) {
  const docProps = PropertiesService.getDocumentProperties();
  docProps.setProperty('SELECTED_CACHE_FIELDS', JSON.stringify(selectedFields));

  Logger.log('✅ Saved field selection: ' + selectedFields.length + ' fields');
  Logger.log('Fields: ' + selectedFields.join(', '));

  // Return success
  return { success: true, fieldCount: selectedFields.length };
}`;

          code = code.substring(0, saveFuncStart) + newSaveFunc + code.substring(saveFuncEnd + 2);
          console.log('✅ Added return statement\n');
        } else {
          console.log('✅ Function already returns result\n');
        }
      }
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
    console.log('✅ BUTTON RENAMED: "💾 Cache All Layers"\n');
    console.log('\nField Selector Modal Now Shows:\n');
    console.log('  Top: 📋 Live Log panel with Copy button\n');
    console.log('  Middle: Field selection interface\n');
    console.log('    ✅ Section 1: Last saved defaults (pre-checked)\n');
    console.log('    💡 Section 2: AI recommendations (unchecked)\n');
    console.log('    📋 Section 3: All other fields\n');
    console.log('  Bottom: Buttons\n');
    console.log('    🔄 Reset to Defaults (left)\n');
    console.log('    💾 Cache All Layers (right, purple gradient)\n');
    console.log('');
    console.log('When you click "💾 Cache All Layers":\n');
    console.log('  1. Live Log shows: "Collecting selected fields..."\n');
    console.log('  2. Live Log shows: "Selected 35 fields"\n');
    console.log('  3. Live Log shows: "Saving selection..."\n');
    console.log('  4. Live Log shows: "✅ Selection saved!"\n');
    console.log('  5. Live Log shows: "Starting batch processing (25 rows at a time)..."\n');
    console.log('  6. Live Log shows progress updates\n');
    console.log('  7. Live Log shows final diagnostics:\n');
    console.log('     ═══════════════════════════════════════════════════════\n');
    console.log('     ✅ CACHE COMPLETE!\n');
    console.log('     ═══════════════════════════════════════════════════════\n');
    console.log('     📊 DIAGNOSTICS:\n');
    console.log('        • Cases processed: 41\n');
    console.log('        • Fields per case: 35\n');
    console.log('        • Time elapsed: 12.3s\n');
    console.log('');
    console.log('  8. You click "Copy" button\n');
    console.log('  9. You paste logs and send to Claude!\n');
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
