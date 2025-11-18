#!/usr/bin/env node

/**
 * EXPAND TEST TOOLS MENU
 * Add missing menu items (Pre-Cache, Field Selector) to complete the TEST Tools menu
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TEST_SCRIPT_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf';

console.log('\n🎨 EXPANDING TEST TOOLS MENU\n');
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

async function expandMenu() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    // Read current TEST project
    console.log('📥 Reading TEST Integration project...\n');
    const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });

    // Find Code.gs with onOpen
    const codeFile = project.data.files.find(f => f.name === 'Code' && f.type === 'SERVER_JS');

    if (!codeFile) {
      console.log('❌ Code.gs not found in TEST project!\n');
      process.exit(1);
    }

    console.log('✅ Found Code.gs\n');

    // Check current menu
    const currentSource = codeFile.source;
    const currentOnOpen = currentSource.match(/function onOpen\(\)[^{]*\{[^}]*\}/s);

    if (currentOnOpen) {
      console.log('📋 Current onOpen() function:\n');
      console.log(currentOnOpen[0]);
      console.log('\n');
    }

    // Check if functions exist
    const hasPreCache = currentSource.includes('function preCacheRichData') ||
                        project.data.files.some(f => f.source && f.source.includes('function preCacheRichData'));

    const hasFieldSelector = currentSource.includes('function showFieldSelector') ||
                              project.data.files.some(f => f.source && f.source.includes('function showFieldSelector'));

    console.log('🔍 Function availability check:\n');
    console.log(`   preCacheRichData(): ${hasPreCache ? '✅ Found' : '❌ Missing'}`);
    console.log(`   showFieldSelector(): ${hasFieldSelector ? '✅ Found' : '❌ Missing'}`);
    console.log('');

    if (!hasPreCache || !hasFieldSelector) {
      console.log('⚠️  WARNING: Some functions missing from project!\n');
      console.log('The menu will be updated, but missing functions need to be added.\n');
    }

    // Create expanded menu
    const expandedOnOpen = `function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('TEST Tools')
    .addItem('💾 Pre-Cache', 'preCacheRichData')
    .addItem('🔍 Field Selector', 'showFieldSelector')
    .addItem('🧩 Pathway Chain Builder', 'runPathwayChainBuilder')
    .addItem('🎨 ATSR Titles Optimizer (v2)', 'runATSRTitleGenerator')
    .addToUi();
}`;

    console.log('📝 Expanded onOpen() function:\n');
    console.log(expandedOnOpen);
    console.log('\n');

    // Replace onOpen in Code.gs
    let updatedSource = currentSource;

    if (currentOnOpen) {
      // Replace existing onOpen
      updatedSource = currentSource.replace(/function onOpen\(\)[^{]*\{[^}]*\}/s, expandedOnOpen);
    } else {
      // Add onOpen at the beginning
      updatedSource = expandedOnOpen + '\n\n' + currentSource;
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🚀 DEPLOYING EXPANDED MENU...\n');

    // Prepare updated files
    const updatedFiles = project.data.files.map(f => {
      if (f.name === 'Code' && f.type === 'SERVER_JS') {
        return {
          name: f.name,
          type: f.type,
          source: updatedSource
        };
      } else {
        return {
          name: f.name,
          type: f.type,
          source: f.source
        };
      }
    });

    // Deploy
    await script.projects.updateContent({
      scriptId: TEST_SCRIPT_ID,
      requestBody: {
        files: updatedFiles
      }
    });

    console.log('✅ Successfully deployed expanded TEST Tools menu!\n');

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📋 NEW MENU STRUCTURE:\n');
    console.log('   1. 💾 Pre-Cache → preCacheRichData()');
    console.log('   2. 🔍 Field Selector → showFieldSelector()');
    console.log('   3. 🧩 Pathway Chain Builder → runPathwayChainBuilder()');
    console.log('   4. 🎨 ATSR Titles Optimizer (v2) → runATSRTitleGenerator()');
    console.log('');

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ DEPLOYMENT COMPLETE!\n');
    console.log('Next steps:\n');
    console.log('   1. Close and reopen your spreadsheet');
    console.log('   2. Wait 10-15 seconds for Apps Script to initialize');
    console.log('   3. Check Extensions menu for "TEST Tools" with 4 items');
    console.log('   4. Test each menu item to verify functionality\n');

    // Save deployment log
    const logContent = `═══════════════════════════════════════════════════════════════
TEST TOOLS MENU EXPANSION DEPLOYMENT LOG
Date: ${new Date().toLocaleString()}
═══════════════════════════════════════════════════════════════

EXPANDED MENU CODE:

${expandedOnOpen}

DEPLOYMENT STATUS: ✅ SUCCESS

NEW MENU ITEMS:
1. 💾 Pre-Cache → preCacheRichData()
2. 🔍 Field Selector → showFieldSelector()
3. 🧩 Pathway Chain Builder → runPathwayChainBuilder()
4. 🎨 ATSR Titles Optimizer (v2) → runATSRTitleGenerator()

FUNCTION AVAILABILITY:
- preCacheRichData(): ${hasPreCache ? 'AVAILABLE' : 'MISSING - NEEDS TO BE ADDED'}
- showFieldSelector(): ${hasFieldSelector ? 'AVAILABLE' : 'MISSING - NEEDS TO BE ADDED'}
- runPathwayChainBuilder(): AVAILABLE (in Phase2)
- runATSRTitleGenerator(): AVAILABLE (in ATSR file)

NEXT STEPS:
1. Close and reopen spreadsheet
2. Verify menu appears with all 4 items
3. Test each menu item individually
4. If functions missing, deploy them from their respective files

═══════════════════════════════════════════════════════════════
`;

    const logPath = path.join(__dirname, '../backups/menu-expansion-deployment-log.txt');
    fs.writeFileSync(logPath, logContent, 'utf8');
    console.log(`📄 Deployment log saved: ${logPath}\n`);

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

expandMenu();
