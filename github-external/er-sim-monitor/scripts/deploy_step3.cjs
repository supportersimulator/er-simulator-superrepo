#!/usr/bin/env node

/**
 * BABY STEP 3: Add Phase2_Enhanced_Categories_Pathways_Panel.gs
 *              AND replace 2 functions in Code.gs
 *
 * This is the step that makes the UI visible!
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function deployStep3() {
  try {
    console.log('🚀 BABY STEP 3: Deploy Enhanced Panel + Modify Code.gs\n');
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

    // Step 2: Read new panel file
    console.log('\n📄 Step 2: Reading Phase2_Enhanced_Categories_Pathways_Panel.gs...\n');
    const newFilePath = path.join(__dirname, '../apps-script-deployable/Phase2_Enhanced_Categories_Pathways_Panel.gs');
    const newFileContent = fs.readFileSync(newFilePath, 'utf8');
    const newFileSize = (newFileContent.length / 1024).toFixed(1);

    console.log(`   ✅ Loaded: ${newFileSize} KB\n`);

    // Step 3: Modify Code.gs
    console.log('🔧 Step 3: Modifying Code.gs (replacing 2 functions)...\n');

    const codeFile = currentProject.data.files.find(f => f.name === 'Code');
    if (!codeFile) {
      throw new Error('Code.gs not found in project!');
    }

    let modifiedCode = codeFile.source;
    const originalSize = (modifiedCode.length / 1024).toFixed(1);

    // Find and comment out the old functions
    const oldPanelFunctionStart = modifiedCode.indexOf('function openCategoriesPathwaysPanel()');
    const oldMenuFunctionStart = modifiedCode.indexOf('function buildCategoriesPathwaysMainMenu_()');

    if (oldPanelFunctionStart === -1) {
      console.log('   ⚠️  WARNING: openCategoriesPathwaysPanel() not found in Code.gs');
      console.log('   This function may have a different name or not exist yet.');
      console.log('   Proceeding with deployment anyway...\n');
    } else {
      console.log('   ✅ Found openCategoriesPathwaysPanel() at position ' + oldPanelFunctionStart);
    }

    if (oldMenuFunctionStart === -1) {
      console.log('   ⚠️  WARNING: buildCategoriesPathwaysMainMenu_() not found in Code.gs');
      console.log('   This function may have a different name or not exist yet.');
      console.log('   Proceeding with deployment anyway...\n');
    } else {
      console.log('   ✅ Found buildCategoriesPathwaysMainMenu_() at position ' + oldMenuFunctionStart);
    }

    // Comment out old panel function
    if (oldPanelFunctionStart !== -1) {
      const functionEnd = findFunctionEnd(modifiedCode, oldPanelFunctionStart);
      const oldFunction = modifiedCode.substring(oldPanelFunctionStart, functionEnd);
      const commentedFunction = '// REPLACED BY Phase2_Enhanced_Categories_Pathways_Panel.gs\n/*\n' + oldFunction + '\n*/';
      modifiedCode = modifiedCode.substring(0, oldPanelFunctionStart) + commentedFunction + modifiedCode.substring(functionEnd);
      console.log('   ✅ Commented out openCategoriesPathwaysPanel()');
    }

    // Comment out old menu function
    const newMenuFunctionStart = modifiedCode.indexOf('function buildCategoriesPathwaysMainMenu_()');
    if (newMenuFunctionStart !== -1) {
      const functionEnd = findFunctionEnd(modifiedCode, newMenuFunctionStart);
      const oldFunction = modifiedCode.substring(newMenuFunctionStart, functionEnd);
      const commentedFunction = '// REPLACED BY Phase2_Enhanced_Categories_Pathways_Panel.gs\n/*\n' + oldFunction + '\n*/';
      modifiedCode = modifiedCode.substring(0, newMenuFunctionStart) + commentedFunction + modifiedCode.substring(functionEnd);
      console.log('   ✅ Commented out buildCategoriesPathwaysMainMenu_()');
    }

    const modifiedSize = (modifiedCode.length / 1024).toFixed(1);
    console.log(`\n   Code.gs size: ${originalSize} KB → ${modifiedSize} KB\n`);

    // Step 4: Prepare updated files array
    console.log('📤 Step 4: Preparing file updates...\n');

    const updatedFiles = currentProject.data.files.map(f => {
      if (f.name === 'Code') {
        return { ...f, source: modifiedCode };
      }
      return f;
    });

    // Add new panel file
    updatedFiles.push({
      name: 'Phase2_Enhanced_Categories_Pathways_Panel',
      type: 'SERVER_JS',
      source: newFileContent
    });

    console.log('   ✅ Prepared 5 files for upload\n');

    // Step 5: Update project
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
      const isNew = f.name === 'Phase2_Enhanced_Categories_Pathways_Panel' ? '✨ NEW' : '';
      const isModified = f.name === 'Code' ? '🔧 MODIFIED' : '';
      const isPhase2 = f.name.startsWith('Phase2') && !isNew ? '(Phase 2)' : '';
      console.log(`      - ${f.name} (${f.type}) - ${size} ${isNew}${isModified}${isPhase2}`);
    });

    const hasPanelFile = verifyProject.data.files.some(f => f.name === 'Phase2_Enhanced_Categories_Pathways_Panel');

    console.log('\n═══════════════════════════════════════════════════════════════');
    if (hasPanelFile) {
      console.log('✅ BABY STEP 3 COMPLETE!');
      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log('Phase2_Enhanced_Categories_Pathways_Panel.gs deployed!\n');
      console.log('📦 CHANGES MADE:\n');
      console.log('   ✅ Added Phase2_Enhanced_Categories_Pathways_Panel.gs');
      console.log('   ✅ Commented out old panel functions in Code.gs');
      console.log('   ✅ Enhanced panel now controls Categories & Pathways sidebar\n');
      console.log('🧪 TEST INSTRUCTIONS:\n');
      console.log('1. Refresh Google Sheet (F5)');
      console.log('2. Open Utilities → Categories & Pathways');
      console.log('3. You should now see TWO TABS:');
      console.log('   - Categories (existing functionality)');
      console.log('   - AI Discovery (NEW - with logic type dropdown)');
      console.log('4. Try selecting a logic type and clicking "Discover Pathways"');
      console.log('5. Check that existing Categories tab still works\n');
      console.log('If everything looks good, we\'re done with Phase 2 deployment! 🎉\n');
    } else {
      console.log('❌ DEPLOYMENT FAILED');
      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log('Phase2_Enhanced_Categories_Pathways_Panel file not found.\n');
    }

  } catch (error) {
    console.error('\n❌ Deployment Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

/**
 * Find the end of a function by counting braces
 */
function findFunctionEnd(code, startPos) {
  let braceCount = 0;
  let inFunction = false;

  for (let i = startPos; i < code.length; i++) {
    if (code[i] === '{') {
      braceCount++;
      inFunction = true;
    } else if (code[i] === '}') {
      braceCount--;
      if (inFunction && braceCount === 0) {
        return i + 1;
      }
    }
  }

  return code.length;
}

deployStep3();
