#!/usr/bin/env node

/**
 * FIX: Add buildAIDiscoveryTabHTML_() function to Code.gs
 * The function exists in Phase2_Modal_Integration.gs but Code.gs can't call it
 * Need to add it directly to Code.gs like buildCategoriesTabHTML_() and buildPathwaysTabHTML_()
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function addDiscoveryHTMLFunction() {
  try {
    console.log('🔧 FIX: Add buildAIDiscoveryTabHTML_() to Code.gs\n');
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

    // Step 1: Get current Code.gs
    console.log('📥 Step 1: Downloading current Code.gs...\n');
    const currentProject = await script.projects.getContent({ scriptId });
    const codeFile = currentProject.data.files.find(f => f.name === 'Code');
    if (!codeFile) throw new Error('Code.gs not found!');

    let code = codeFile.source;
    const originalSize = (code.length / 1024).toFixed(1);

    // Step 2: Find where to insert the function (after buildPathwaysTabHTML_)
    console.log('🔍 Step 2: Locating insertion point...\n');
    
    // Find the end of buildPathwaysTabHTML_ function
    const buildPathwaysStart = code.indexOf('function buildPathwaysTabHTML_(analysis) {');
    if (buildPathwaysStart === -1) {
      throw new Error('Could not find buildPathwaysTabHTML_() function!');
    }

    // Find the matching closing brace - look for the pattern "}\n\nfunction" or "}\n\n/**"
    let searchFrom = buildPathwaysStart;
    let foundEnd = false;
    let insertionPoint = -1;

    // Look for the next function definition after buildPathwaysTabHTML_
    const nextFunctionPattern = /\n\nfunction /g;
    nextFunctionPattern.lastIndex = buildPathwaysStart + 100; // Start searching after function declaration
    const match = nextFunctionPattern.exec(code);
    
    if (match) {
      insertionPoint = match.index + 2; // +2 to skip the two newlines
      foundEnd = true;
    }

    if (!foundEnd) {
      throw new Error('Could not find insertion point after buildPathwaysTabHTML_()');
    }

    console.log(`   ✅ Found insertion point at position ${insertionPoint}\n`);

    // Step 3: Prepare the function to insert
    console.log('🔧 Step 3: Preparing buildAIDiscoveryTabHTML_() function...\n');

    // Read the function from Phase2_Modal_Integration.gs
    const modalIntegrationPath = path.join(__dirname, '../apps-script-deployable/Phase2_Modal_Integration.gs');
    const modalIntegrationContent = fs.readFileSync(modalIntegrationPath, 'utf8');

    // Extract just the function (from line 11 to end, minus last 2 lines)
    const functionStart = modalIntegrationContent.indexOf('function buildAIDiscoveryTabHTML_() {');
    const functionEnd = modalIntegrationContent.lastIndexOf('}');
    
    if (functionStart === -1 || functionEnd === -1) {
      throw new Error('Could not extract buildAIDiscoveryTabHTML_() from Phase2_Modal_Integration.gs');
    }

    const discoveryHTMLFunction = '\n' + modalIntegrationContent.substring(functionStart, functionEnd + 1) + '\n';

    console.log(`   ✅ Extracted function (${(discoveryHTMLFunction.length / 1024).toFixed(1)} KB)\n`);

    // Step 4: Insert the function
    console.log('📝 Step 4: Inserting function into Code.gs...\n');

    code = code.substring(0, insertionPoint) +
      discoveryHTMLFunction +
      code.substring(insertionPoint);

    const modifiedSize = (code.length / 1024).toFixed(1);
    console.log(`   Code.gs size: ${originalSize} KB → ${modifiedSize} KB\n`);

    // Step 5: Upload
    console.log('📤 Step 5: Preparing file updates...\n');

    const updatedFiles = currentProject.data.files.map(f => {
      if (f.name === 'Code') {
        return { ...f, source: code };
      }
      return f;
    });

    console.log('💾 Step 6: Uploading to Apps Script...\n');

    await script.projects.updateContent({
      scriptId: scriptId,
      requestBody: { files: updatedFiles }
    });

    console.log('   ✅ Upload complete!\n');

    // Step 6: Verify
    console.log('🔍 Step 7: Verifying deployment...\n');
    const verifyProject = await script.projects.getContent({ scriptId });
    const verifyCodeFile = verifyProject.data.files.find(f => f.name === 'Code');

    const hasBuildFunction = verifyCodeFile.source.includes('function buildAIDiscoveryTabHTML_()');
    const hasGetLogicTypes = verifyCodeFile.source.includes('const logicTypes = getLogicTypesForDropdown();');
    const hasDiscoverButton = verifyCodeFile.source.includes('onclick="discoverPathways()"');

    console.log('   ' + (hasBuildFunction ? '✅' : '❌') + ' buildAIDiscoveryTabHTML_() function exists');
    console.log('   ' + (hasGetLogicTypes ? '✅' : '❌') + ' Calls getLogicTypesForDropdown()');
    console.log('   ' + (hasDiscoverButton ? '✅' : '❌') + ' Has Discover button with onclick\n');

    console.log('═══════════════════════════════════════════════════════════════');
    if (hasBuildFunction && hasGetLogicTypes && hasDiscoverButton) {
      console.log('✅ FIX COMPLETE - buildAIDiscoveryTabHTML_() NOW IN CODE.GS!');
      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log('🧪 TEST INSTRUCTIONS:\n');
      console.log('1. Refresh Google Sheet (F5) - CRITICAL!');
      console.log('2. Open: 🧠 Sim Builder → 🧩 Categories & Pathways');
      console.log('3. Click AI Discovery tab');
      console.log('4. Select logic type from dropdown');
      console.log('5. Click "Discover Pathways" button');
      console.log('6. Button should work now!\n');
    } else {
      console.log('❌ DEPLOYMENT INCOMPLETE\n');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

addDiscoveryHTMLFunction();
