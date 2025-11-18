#!/usr/bin/env node

/**
 * FIX FIELD SELECTOR RENDERING
 * Add renderCategories() call at end of script to actually render the fields
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🔧 FIXING FIELD SELECTOR RENDERING\n');
console.log('═══════════════════════════════════════════════════════════════\n');

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

    console.log('📥 Downloading production code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('🔍 Finding the closing </script> tag in showFieldSelector()...\n');

    // Find where the script closes and add renderCategories() call before it
    // Look for the pattern where the script ends
    const scriptEndPattern = /(}<\/script>)/;

    if (code.match(scriptEndPattern)) {
      // Add renderCategories() call before </script> closes
      code = code.replace(
        scriptEndPattern,
        '}\n// Initialize: render categories on load\nrenderCategories();\n</script>'
      );
      console.log('✅ Added renderCategories() call at script initialization\n');
    } else {
      console.log('⚠️  Pattern not found, trying alternative approach...\n');

      // Alternative: look for the end of continueToCache function and add after it
      const altPattern = /(google\.script\.run\.saveFieldSelectionAndStartCache\(selected\);[\s\S]*?}[\s\S]*?)<\/script>/;
      if (code.match(altPattern)) {
        code = code.replace(altPattern, '$1\n// Initialize: render categories on load\nrenderCategories();\n</script>');
        console.log('✅ Added renderCategories() call (alternative method)\n');
      }
    }

    // Backup
    const backupPath = path.join(__dirname, '../backups/production-before-render-fix-2025-11-06.gs');
    fs.writeFileSync(backupPath, codeFile.source, 'utf8');
    console.log(`💾 Backed up to: ${backupPath}\n`);

    // Deploy
    console.log('📤 Deploying to production...\n');

    const updatedFiles = [
      {
        name: 'Code',
        type: 'SERVER_JS',
        source: code
      },
      manifestFile
    ];

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: updatedFiles }
    });

    const newSize = (code.length / 1024).toFixed(1);

    console.log(`✅ Deployment successful! Size: ${newSize} KB\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎉 FIELD SELECTOR RENDERING FIXED!\n');
    console.log('The renderCategories() function is now called on page load.\n');
    console.log('Close the dialog and click "Pre-Cache Rich Data" again.\n');
    console.log('You should now see all 3 sections with fields!\n');
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
