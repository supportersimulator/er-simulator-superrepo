#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function attachEventsImmediately() {
  try {
    console.log('🔧 REMOVING DOMContentLoaded - ATTACHING EVENTS IMMEDIATELY\n');
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

    // Replace the DOMContentLoaded wrapper with immediate execution
    const oldCode = "'    // Attach event listeners after DOM loads' +\n" +
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
"'    });'";

    const newCode = "'    // Attach Discovery tab event listeners immediately (HTML already loaded)' +\n" +
"'    (function() {' +\n" +
"'      console.log(\\'🔍 Attaching Discovery tab event listeners (immediate)\\');' +\n" +
"'      ' +\n" +
"'      var selector = document.getElementById(\\'logic-type-selector\\');' +\n" +
"'      if (selector) {' +\n" +
"'        console.log(\\'✅ Found logic-type-selector, attaching change listener\\');' +\n" +
"'        selector.addEventListener(\\'change\\', handleLogicTypeChange);' +\n" +
"'      } else {' +\n" +
"'        console.warn(\\'❌ logic-type-selector not found\\');' +\n" +
"'      }' +\n" +
"'      ' +\n" +
"'      var btn = document.getElementById(\\'discover-btn\\');' +\n" +
"'      if (btn) {' +\n" +
"'        console.log(\\'✅ Found discover-btn, attaching click listener\\');' +\n" +
"'        btn.addEventListener(\\'click\\', discoverPathways);' +\n" +
"'      } else {' +\n" +
"'        console.warn(\\'❌ discover-btn not found\\');' +\n" +
"'      }' +\n" +
"'    })();'";

    code = code.replace(oldCode, newCode);
    console.log('   ✅ Replaced DOMContentLoaded with immediate IIFE execution\n');

    const modifiedSize = (code.length / 1024).toFixed(1);
    console.log(`   Code.gs size: ${originalSize} KB → ${modifiedSize} KB\n`);

    // Upload
    console.log('💾 Uploading modified Code.gs...\n');

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
    console.log('✅ EVENTS ATTACHED IMMEDIATELY (NO DOMContentLoaded)!');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📊 WHAT CHANGED:\n');
    console.log('   Before: document.addEventListener("DOMContentLoaded", ...) - never fires');
    console.log('   After: (function() { ... })() - executes immediately');
    console.log('   Why: Modal HTML loaded dynamically, DOMContentLoaded already fired\n');
    console.log('🧪 TEST INSTRUCTIONS:\n');
    console.log('1. Refresh Google Sheet (F5)');
    console.log('2. Open: 🧠 Sim Builder → 🧩 Categories & Pathways');
    console.log('3. Click AI Discovery tab');
    console.log('4. Console should show: "🔍 Attaching Discovery tab event listeners (immediate)"');
    console.log('5. Select a logic type - button should enable immediately!');
    console.log('6. Click "Discover Pathways" - should work!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

attachEventsImmediately();
