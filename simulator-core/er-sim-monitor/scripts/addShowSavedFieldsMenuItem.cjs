#!/usr/bin/env node

/**
 * ADD MENU ITEM TO SHOW SAVED FIELD SELECTION
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🔧 ADDING SHOW SAVED FIELDS MENU ITEM\n');
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

async function addMenuItem() {
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

    // Add function to show saved fields
    const showSavedFieldsFunction = `
/**
 * Show currently saved field selection
 */
function showSavedFieldSelection() {
  const ui = getSafeUi_();
  if (!ui) return;

  const docProps = PropertiesService.getDocumentProperties();
  const saved = docProps.getProperty('SELECTED_CACHE_FIELDS');

  if (!saved) {
    ui.alert('No Saved Fields', 'No saved field selection found.\\n\\nYou can save fields by opening Categories & Pathways and selecting which fields to cache.', ui.ButtonSet.OK);
    return;
  }

  try {
    const fields = JSON.parse(saved);
    const message = 'Found ' + fields.length + ' saved fields:\\n\\n' + fields.join('\\n');
    ui.alert('Saved Field Selection', message, ui.ButtonSet.OK);
  } catch (e) {
    ui.alert('Error', 'Error parsing saved fields: ' + e.message, ui.ButtonSet.OK);
  }
}
`;

    // Check if function already exists
    if (!code.includes('function showSavedFieldSelection')) {
      // Insert before first function
      const firstFunctionMatch = code.match(/^function /m);
      if (firstFunctionMatch) {
        const insertPos = firstFunctionMatch.index;
        code = code.slice(0, insertPos) + showSavedFieldsFunction + '\n' + code.slice(insertPos);
        console.log('✅ Added showSavedFieldSelection() function\n');
      }
    } else {
      console.log('✅ showSavedFieldSelection() function already exists\n');
    }

    // Add menu item to Cache Management submenu
    const oldCacheMenu = `.addItem('🧹 Clear All Cache Layers', 'clearAllCacheLayers')
  );

  menu.addToUi();
}`;

    const newCacheMenu = `.addItem('🧹 Clear All Cache Layers', 'clearAllCacheLayers')
    .addSeparator()
    .addItem('👁️ View Saved Field Selection', 'showSavedFieldSelection')
  );

  menu.addToUi();
}`;

    if (code.includes(oldCacheMenu)) {
      code = code.replace(oldCacheMenu, newCacheMenu);
      console.log('✅ Added "View Saved Field Selection" menu item\n');
    } else {
      console.log('⚠️  Menu pattern not found - menu may have different structure\n');
    }

    // Backup
    const backupPath = path.join(__dirname, '../backups/production-before-saved-fields-menu-2025-11-06.gs');
    fs.writeFileSync(backupPath, codeFile.source, 'utf8');
    console.log(`💾 Backed up to: ${backupPath}\n`);

    // Deploy
    console.log('📤 Deploying...\n');

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
    console.log('🎉 MENU ITEM ADDED!\n');
    console.log('To view your saved field selection:\n');
    console.log('   1. Refresh your spreadsheet\n');
    console.log('   2. Click "🧠 Sim Builder" → "🗄️ Cache Management"\n');
    console.log('   3. Click "👁️ View Saved Field Selection"\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

addMenuItem();
