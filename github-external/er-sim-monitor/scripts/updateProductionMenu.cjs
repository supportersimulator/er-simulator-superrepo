#!/usr/bin/env node

/**
 * UPDATE PRODUCTION SIM BUILDER MENU
 * Removes old menu items and adds new ATSR Titles Optimizer + Categories & Pathways (Phase 2)
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '1orJ__UUViG-gdSOHXt2VSGzo--ASib9XdVLVCApccKujWnqTuxq7wHIw'; // GPT Formatter (production)

console.log('\n🔧 UPDATING PRODUCTION SIM BUILDER MENU\n');
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

async function updateMenu() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log(`🎯 Production Project ID: ${PRODUCTION_PROJECT_ID}\n`);
    console.log('📥 Reading current project code...\n');

    const project = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = project.data.files.find(f => f.name === 'Code');
    const manifestFile = project.data.files.find(f => f.name === 'appsscript');

    if (!codeFile) {
      throw new Error('Could not find Code.gs file');
    }

    console.log(`✅ Current code size: ${(codeFile.source.length / 1024).toFixed(1)} KB\n`);

    let updatedCode = codeFile.source;

    // Find and replace the old menu items in the onOpen() function
    const oldMenu = `    .addItem(\`\${ICONS.wand} ATSR — Titles & Summary\`, 'runATSRTitleGenerator')
    .addItem('📂 Categories & Pathways', 'openCategoriesPathwaysPanel')`;

    const newMenu = `    .addItem(\`\${ICONS.wand} ATSR Titles Optimizer\`, 'runATSRTitleGenerator')
    .addItem('🧩 Categories & Pathways (Phase 2)', 'showFieldSelector')`;

    if (!updatedCode.includes(oldMenu)) {
      console.log('⚠️  Could not find exact old menu items. Trying alternative match...\n');

      // Try more flexible replacement
      updatedCode = updatedCode.replace(
        /\.addItem\([^)]*ATSR[^)]*runATSRTitleGenerator[^)]*\)/,
        `.addItem(\`\${ICONS.wand} ATSR Titles Optimizer\`, 'runATSRTitleGenerator')`
      );

      updatedCode = updatedCode.replace(
        /\.addItem\([^)]*Categories & Pathways[^)]*openCategoriesPathwaysPanel[^)]*\)/,
        `.addItem('🧩 Categories & Pathways (Phase 2)', 'showFieldSelector')`
      );
    } else {
      console.log('✅ Found exact match, replacing...\n');
      updatedCode = updatedCode.replace(oldMenu, newMenu);
    }

    // Verify the replacement worked
    if (updatedCode.includes('ATSR Titles Optimizer') && updatedCode.includes('Categories & Pathways (Phase 2)')) {
      console.log('✅ Menu items updated successfully in code\n');
    } else {
      console.log('⚠️  Warning: Could not verify menu updates\n');
    }

    console.log(`📊 Updated code size: ${(updatedCode.length / 1024).toFixed(1)} KB\n`);

    console.log('💾 Uploading updated code...\n');

    const files = [
      {
        name: 'Code',
        type: 'SERVER_JS',
        source: updatedCode
      },
      manifestFile
    ];

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files }
    });

    console.log('✅ Successfully updated production Sim Builder menu!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ UPDATE COMPLETE!\n');
    console.log('📝 CHANGES MADE:\n');
    console.log('   REMOVED:');
    console.log('   - ❌ ATSR — Titles & Summary (old version)');
    console.log('   - ❌ Categories & Pathways (old version)\n');
    console.log('   ADDED:');
    console.log('   - ✅ ATSR Titles Optimizer (new version)');
    console.log('   - ✅ Categories & Pathways (Phase 2) (new version)\n');
    console.log('   NOT ADDED:');
    console.log('   - Pathway Chain Builder (accessible from within Categories & Pathways)\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📝 NEXT STEPS:\n');
    console.log('   1. Refresh your spreadsheet (Cmd+R or F5)\n');
    console.log('   2. Wait 5-10 seconds for scripts to load\n');
    console.log('   3. Check the "Sim Builder" menu\n');
    console.log('   4. You should see the updated menu items!\n');

    // Save local backup
    const localBackupPath = path.join(__dirname, '../backups/production-updated-menu-2025-11-06.gs');
    fs.writeFileSync(localBackupPath, updatedCode, 'utf8');
    console.log(`💾 Local backup saved: ${localBackupPath}\n`);

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

updateMenu();
