#!/usr/bin/env node

/**
 * Integrate Multi-Step Cache into Categories_Pathways_Feature_Phase2.gs
 *
 * Makes two changes:
 * 1. Add addCacheEnrichmentMenuItems(menu) to onOpen()
 * 2. Replace analyzeCatalog_() calls with analyzeCatalogWithMultiLayerCache_()
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TEST_SCRIPT_ID = '1kkPZU3GsCCuu5IhTEOufmDT1Cb2rSQVB3Y3u1DPf87yoSV4WVtoNvd6i';

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

async function integrate() {
  console.log('\n🔧 INTEGRATING MULTI-STEP CACHE INTO PHASE2 FILE\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    // 1. Get current project
    console.log('📡 Reading current Apps Script project...\n');
    const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });

    // 2. Find Phase2 file
    const phase2File = project.data.files.find(f => f.name === 'Categories_Pathways_Feature_Phase2');

    if (!phase2File) {
      console.log('❌ Categories_Pathways_Feature_Phase2.gs not found\n');
      console.log('Available files:');
      project.data.files.forEach(f => console.log('   • ' + f.name));
      return;
    }

    console.log('✅ Found Categories_Pathways_Feature_Phase2.gs\n');

    let code = phase2File.source;
    let changesMade = 0;

    // 3. Integration #1: Add cache menu to onOpen()
    console.log('🔍 Looking for onOpen() function...\n');

    // Find onOpen function
    const onOpenMatch = code.match(/function onOpen\(\)\s*{[^}]*menu\.addToUi\(\);?\s*}/s);

    if (onOpenMatch) {
      const originalOnOpen = onOpenMatch[0];

      // Check if already integrated
      if (originalOnOpen.includes('addCacheEnrichmentMenuItems')) {
        console.log('✅ onOpen() already has cache menu integration - skipping\n');
      } else {
        // Add the call before menu.addToUi()
        const modifiedOnOpen = originalOnOpen.replace(
          /(\s*)(menu\.addToUi\(\);?\s*})/s,
          '$1// Add cache management submenu\n$1addCacheEnrichmentMenuItems(menu);\n\n$1$2'
        );

        code = code.replace(originalOnOpen, modifiedOnOpen);
        console.log('✅ Added addCacheEnrichmentMenuItems(menu) to onOpen()\n');
        changesMade++;
      }
    } else {
      console.log('⚠️  Could not find onOpen() function with menu.addToUi() - manual integration may be needed\n');
    }

    // 4. Integration #2: Replace analyzeCatalog_() calls
    console.log('🔍 Looking for analyzeCatalog_() calls...\n');

    // Find all calls to analyzeCatalog_()
    const catalogCallMatches = code.match(/(?:const|var|let)\s+\w+\s*=\s*analyzeCatalog_\(\)/g);

    if (catalogCallMatches) {
      console.log(`Found ${catalogCallMatches.length} call(s) to analyzeCatalog_()\n`);

      // Replace all occurrences
      const replacedCode = code.replace(
        /analyzeCatalog_\(\)/g,
        'analyzeCatalogWithMultiLayerCache_()'
      );

      if (replacedCode !== code) {
        code = replacedCode;
        console.log('✅ Replaced analyzeCatalog_() with analyzeCatalogWithMultiLayerCache_()\n');
        changesMade++;
      }
    } else {
      console.log('⚠️  No calls to analyzeCatalog_() found\n');
    }

    // 5. Show summary of changes
    if (changesMade === 0) {
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('ℹ️  NO CHANGES NEEDED - Already integrated\n');
      console.log('═══════════════════════════════════════════════════════════════\n');
      return;
    }

    // 6. Deploy modified code
    console.log(`🚀 Deploying changes (${changesMade} integration(s) made)...\n`);

    phase2File.source = code;

    await script.projects.updateContent({
      scriptId: TEST_SCRIPT_ID,
      requestBody: {
        files: project.data.files
      }
    });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ INTEGRATION COMPLETE\n');
    console.log('📋 CHANGES MADE:\n');

    if (code.includes('addCacheEnrichmentMenuItems(menu)')) {
      console.log('   ✅ Added cache menu to onOpen()');
    }

    if (code.includes('analyzeCatalogWithMultiLayerCache_()')) {
      console.log('   ✅ Replaced analyzeCatalog_() with multi-layer version');
    }

    console.log('\n🎯 NEXT STEPS:\n');
    console.log('   1. Refresh your Google Sheet (reload the page)');
    console.log('   2. Look for "🗄️ Cache Management" in the menu');
    console.log('   3. Try "📦 Cache All Layers (Sequential)"');
    console.log('   4. Run "🤖 AI: Discover Novel Pathways" to test with enriched cache\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('\n❌ Integration failed: ' + e.message + '\n');
    if (e.stack) {
      console.log('Stack trace:', e.stack);
    }
  }
}

integrate().catch(console.error);
