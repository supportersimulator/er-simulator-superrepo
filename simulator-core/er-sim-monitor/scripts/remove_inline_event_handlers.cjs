#!/usr/bin/env node

/**
 * FIX: Remove inline onchange/onclick attributes from Discovery tab HTML
 * 
 * Since we're using addEventListener in DOMContentLoaded, we don't need
 * (and shouldn't have) inline event handler attributes.
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function removeInlineEventHandlers() {
  try {
    console.log('🔧 FIX: Remove Inline Event Handlers from Discovery Tab\n');
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

    // Step 2: Remove onchange from dropdown
    console.log('🔧 Step 2: Removing inline event handlers...\n');

    // Remove onchange="handleLogicTypeChange()" from dropdown
    const dropdownBefore = '<select id="logic-type-selector" class="logic-type-select" onchange="handleLogicTypeChange()">';
    const dropdownAfter = '<select id="logic-type-selector" class="logic-type-select">';
    
    if (code.includes(dropdownBefore)) {
      code = code.replace(new RegExp(dropdownBefore.replace(/[()]/g, '\\$&'), 'g'), dropdownAfter);
      console.log('   ✅ Removed onchange="handleLogicTypeChange()" from dropdown\n');
    } else {
      console.log('   ℹ️  onchange attribute not found (might already be removed)\n');
    }

    // Remove onclick from button
    const buttonBefore = '<button id="discover-btn" class="btn-discover" onclick="discoverPathways()" disabled>';
    const buttonAfter = '<button id="discover-btn" class="btn-discover" disabled>';
    
    if (code.includes(buttonBefore)) {
      code = code.replace(new RegExp(buttonBefore.replace(/[()]/g, '\\$&'), 'g'), buttonAfter);
      console.log('   ✅ Removed onclick="discoverPathways()" from button\n');
    } else {
      console.log('   ℹ️  onclick attribute not found (might already be removed)\n');
    }

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
    console.log('✅ INLINE EVENT HANDLERS REMOVED!');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🧪 TEST INSTRUCTIONS:\n');
    console.log('1. Refresh Google Sheet (F5)');
    console.log('2. Open: 🧠 Sim Builder → 🧩 Categories & Pathways');
    console.log('3. Click AI Discovery tab');
    console.log('4. Open console (F12) - should see "DOM loaded" message');
    console.log('5. Select logic type - button should enable');
    console.log('6. Click button - should work!\n');
    console.log('📊 WHAT CHANGED:\n');
    console.log('   Before: onchange="..." and onclick="..." inline (causes ReferenceError)');
    console.log('   After: Clean HTML, events attached via addEventListener in DOMContentLoaded');
    console.log('   Result: No more "handleLogicTypeChange is not defined" error!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

removeInlineEventHandlers();
