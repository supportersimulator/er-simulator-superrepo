#!/usr/bin/env node

/**
 * FIX: Use addEventListener instead of inline onclick/onchange
 * 
 * Apps Script HTML templates work differently than regular HTML.
 * Inline event handlers might not work in string concatenation.
 * Solution: Attach event listeners via JavaScript after DOM loads.
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function fixEventListenersApproach() {
  try {
    console.log('🔧 FIX: Add Event Listeners via JavaScript\n');
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

    // Step 2: Add document.addEventListener('DOMContentLoaded') to attach event listeners
    console.log('🔧 Step 2: Adding DOMContentLoaded event listener...\n');

    // Find the end of the <script> section (just before </script>)
    const scriptEndMarker = "'    ' +\n'  </script>' +";
    
    if (code.indexOf(scriptEndMarker) === -1) {
      throw new Error('Could not find </script> tag marker');
    }

    const domContentLoadedCode = "'    ' +\n" +
"'    // Attach event listeners after DOM loads' +\n" +
"'    document.addEventListener(\\'DOMContentLoaded\\', function() {' +\n" +
"'      console.log(\\'🔍 DOM loaded, attaching Discovery tab event listeners\\');' +\n" +
"'      ' +\n" +
"'      // Attach dropdown onchange listener' +\n" +
"'      var selector = document.getElementById(\\'logic-type-selector\\');' +\n" +
"'      if (selector) {' +\n" +
"'        console.log(\\'✅ Found logic-type-selector\\');' +\n" +
"'        selector.addEventListener(\\'change\\', handleLogicTypeChange);' +\n" +
"'      } else {' +\n" +
"'        console.warn(\\'❌ logic-type-selector not found\\');' +\n" +
"'      }' +\n" +
"'      ' +\n" +
"'      // Attach button click listener' +\n" +
"'      var btn = document.getElementById(\\'discover-btn\\');' +\n" +
"'      if (btn) {' +\n" +
"'        console.log(\\'✅ Found discover-btn\\');' +\n" +
"'        btn.addEventListener(\\'click\\', discoverPathways);' +\n" +
"'      } else {' +\n" +
"'        console.warn(\\'❌ discover-btn not found\\');' +\n" +
"'      }' +\n" +
"'    });' +\n" +
"'    ' +\n" +
"'  </script>' +";

    code = code.replace(scriptEndMarker, domContentLoadedCode);
    console.log('   ✅ Added DOMContentLoaded event listener setup\n');

    const modifiedSize = (code.length / 1024).toFixed(1);
    console.log(`   Code.gs size: ${originalSize} KB → ${modifiedSize} KB\n`);

    // Step 3: Upload
    console.log('💾 Step 3: Uploading modified Code.gs...\n');

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
    console.log('✅ EVENT LISTENERS FIX DEPLOYED!');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🧪 TEST INSTRUCTIONS:\n');
    console.log('1. Refresh Google Sheet (F5)');
    console.log('2. Open: 🧠 Sim Builder → 🧩 Categories & Pathways');
    console.log('3. Click AI Discovery tab');
    console.log('4. Open browser console (F12) - should see "DOM loaded" message');
    console.log('5. Select a logic type - button should NOW enable!');
    console.log('6. Click "Discover Pathways" button - should NOW work!\n');
    console.log('📊 WHAT CHANGED:\n');
    console.log('   Before: Inline onclick/onchange attributes (might not work in Apps Script)');
    console.log('   After: addEventListener in DOMContentLoaded (reliable)');
    console.log('   Benefit: Event listeners attached after DOM fully loads\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

fixEventListenersApproach();
