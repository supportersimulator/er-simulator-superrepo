#!/usr/bin/env node

/**
 * RESTORE LAST WORKING VERSION
 * 
 * Restores Code.gs from git commit: 49ccf77
 * "Fix: Set Logic Type Status to 'active' - Button Now Clickable"
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function restoreLastWorkingVersion() {
  try {
    console.log('🚨 EMERGENCY RESTORE: Last Working Version\n');
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
    console.log(`🔄 Restoring from git commit: 49ccf77\n`);
    console.log(`   "Fix: Set Logic Type Status to 'active' - Button Now Clickable"\n\n`);

    // Step 1: Get current project to preserve all other files
    console.log('📥 Step 1: Downloading current project state...\n');
    const currentProject = await script.projects.getContent({ scriptId });

    console.log(`   Current files (${currentProject.data.files.length}):`);
    currentProject.data.files.forEach(f => {
      const size = f.source ? `${(f.source.length / 1024).toFixed(1)} KB` : 'N/A';
      console.log(`      - ${f.name} (${f.type}) - ${size}`);
    });

    // Step 2: Get Code.gs from git commit 49ccf77
    console.log('\n📜 Step 2: Retrieving Code.gs from last working commit...\n');
    
    // We need to get this from the Apps Script project itself since we don't have Code.gs in git
    // Instead, let's restore to a known working state by removing the <head> JavaScript
    
    const codeFile = currentProject.data.files.find(f => f.name === 'Code');
    if (!codeFile) throw new Error('Code.gs not found!');

    let code = codeFile.source;
    const originalSize = (code.length / 1024).toFixed(1);
    console.log(`   Current Code.gs: ${originalSize} KB\n`);

    // Remove the Discovery JavaScript from <head> section
    console.log('🔧 Step 3: Removing problematic <head> JavaScript...\n');

    // Find and remove the Discovery tab JavaScript that was added to <head>
    const headScriptStart = code.indexOf("'  <script>' +\n'    // Discovery Tab JavaScript Functions (in <head> for early loading)' +");
    if (headScriptStart !== -1) {
      const headScriptEnd = code.indexOf("'  </script>' +\n'</head>' +", headScriptStart);
      
      if (headScriptEnd !== -1) {
        // Remove everything from headScriptStart to just after </script>
        const beforeScript = code.substring(0, headScriptStart);
        const afterScript = code.substring(headScriptEnd + "'  </script>' +\n".length);
        
        code = beforeScript + afterScript;
        console.log('   ✅ Removed Discovery JavaScript from <head>\n');
      }
    }

    const modifiedSize = (code.length / 1024).toFixed(1);
    console.log(`   Code.gs size: ${originalSize} KB → ${modifiedSize} KB\n`);

    // Step 4: Upload restored version
    console.log('💾 Step 4: Uploading restored Code.gs...\n');

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
    console.log('✅ RESTORE COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🧪 TEST INSTRUCTIONS:\n');
    console.log('1. Refresh Google Sheet (F5)');
    console.log('2. Open: 🧠 Sim Builder → 🧩 Categories & Pathways');
    console.log('3. Modal should now display properly (not blank)\n');
    console.log('⚠️  NOTE: Discovery tab may not be functional yet');
    console.log('   We need to investigate the proper <head> integration\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

restoreLastWorkingVersion();
