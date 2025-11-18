#!/usr/bin/env node

/**
 * CRITICAL FIX: Replace buildAIDiscoveryTabHTML_() with string concatenation version
 * Template literals don't work in Apps Script - must use '+' concatenation
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function deployFixedVersion() {
  try {
    console.log('🔧 CRITICAL FIX: Convert Template Literal to String Concatenation\n');
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

    // Step 2: Find and replace buildAIDiscoveryTabHTML_() function
    console.log('🔍 Step 2: Locating buildAIDiscoveryTabHTML_() function...\n');
    
    const funcStart = code.indexOf('function buildAIDiscoveryTabHTML_() {');
    if (funcStart === -1) {
      throw new Error('buildAIDiscoveryTabHTML_() not found in Code.gs!');
    }

    // Find the end of this function (next function or end of file)
    const nextFuncPattern = /\n\nfunction /g;
    nextFuncPattern.lastIndex = funcStart + 100;
    const nextFunc = nextFuncPattern.exec(code);
    
    let funcEnd;
    if (nextFunc) {
      funcEnd = nextFunc.index;
    } else {
      throw new Error('Could not find end of buildAIDiscoveryTabHTML_() function!');
    }

    console.log(`   ✅ Found function at position ${funcStart} to ${funcEnd}\n`);

    // Step 3: Read the fixed version
    console.log('📄 Step 3: Loading fixed version with string concatenation...\n');
    
    const fixedPath = path.join(__dirname, '../apps-script-deployable/Phase2_Modal_Integration_FIXED.gs');
    const fixedContent = fs.readFileSync(fixedPath, 'utf8');
    
    // Extract just the function
    const fixedFuncStart = fixedContent.indexOf('function buildAIDiscoveryTabHTML_() {');
    const fixedFuncEnd = fixedContent.lastIndexOf('}') + 1;
    const fixedFunction = fixedContent.substring(fixedFuncStart, fixedFuncEnd);

    console.log(`   ✅ Loaded fixed function (${(fixedFunction.length / 1024).toFixed(1)} KB)\n`);

    // Step 4: Replace the function
    console.log('🔧 Step 4: Replacing function in Code.gs...\n');

    code = code.substring(0, funcStart) +
           fixedFunction + '\n' +
           code.substring(funcEnd);

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
    console.log('🔍 Step 7: Verifying fix...\n');
    const verifyProject = await script.projects.getContent({ scriptId });
    const verifyCodeFile = verifyProject.data.files.find(f => f.name === 'Code');

    // Check for string concatenation pattern
    const usesConcat = verifyCodeFile.source.includes("return '<div class=\"tab-content\" id=\"discovery-tab\"");
    const noBackticks = !verifyCodeFile.source.substring(
      verifyCodeFile.source.indexOf('function buildAIDiscoveryTabHTML_()'),
      verifyCodeFile.source.indexOf('function buildAIDiscoveryTabHTML_()') + 10000
    ).includes('return `');

    console.log('   ' + (usesConcat ? '✅' : '❌') + ' Uses string concatenation (+ operator)');
    console.log('   ' + (noBackticks ? '✅' : '❌') + ' No template literals (backticks)\n');

    console.log('═══════════════════════════════════════════════════════════════');
    if (usesConcat && noBackticks) {
      console.log('✅ CRITICAL FIX COMPLETE - STRING CONCATENATION DEPLOYED!');
      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log('🧪 TEST INSTRUCTIONS:\n');
      console.log('1. Refresh Google Sheet (F5) - CRITICAL!');
      console.log('2. Open: 🧠 Sim Builder → 🧩 Categories & Pathways');
      console.log('3. Click "🔍 AI Discovery" tab');
      console.log('4. Dropdown should now populate with logic types');
      console.log('5. Select a logic type');
      console.log('6. Button should become clickable (blue gradient)');
      console.log('7. Click "Discover Pathways"\n');
    } else {
      console.log('❌ FIX INCOMPLETE\n');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

deployFixedVersion();
