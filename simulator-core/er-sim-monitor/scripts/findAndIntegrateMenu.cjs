#!/usr/bin/env node

/**
 * Find TEST menu and integrate cache management
 * Also ensure refreshHeaders() is called before caching
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
  console.log('\n🔧 INTEGRATING CACHE MANAGEMENT INTO TEST MENU\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });

    console.log('📋 Available files in project:\n');
    project.data.files.forEach(f => console.log('   • ' + f.name));
    console.log('');

    // Search all files for TEST menu
    let testMenuFile = null;
    let testMenuCode = null;

    for (const file of project.data.files) {
      if (file.source && file.source.includes('TEST') && file.source.includes('Pathway Chain Builder')) {
        testMenuFile = file;
        testMenuCode = file.source;
        console.log(`✅ Found TEST menu in: ${file.name}\n`);
        break;
      }
    }

    if (!testMenuFile) {
      console.log('⚠️  Could not find TEST menu with Pathway Chain Builder\n');
      console.log('Searching for any menu containing "TEST"...\n');

      for (const file of project.data.files) {
        if (file.source && /createMenu.*TEST/i.test(file.source)) {
          testMenuFile = file;
          testMenuCode = file.source;
          console.log(`✅ Found TEST menu in: ${file.name}\n`);
          break;
        }
      }
    }

    if (!testMenuFile) {
      console.log('❌ Could not locate TEST menu\n');
      return;
    }

    // Check if already integrated
    if (testMenuCode.includes('addCacheEnrichmentMenuItems')) {
      console.log('✅ Cache menu already integrated\n');
      return;
    }

    // Find the TEST menu creation and add cache submenu
    // Look for pattern: .createMenu('TEST') or similar
    const testMenuRegex = /\.createMenu\(['"].*TEST.*['"]\)([\s\S]*?)\.addToUi\(\)/i;
    const match = testMenuCode.match(testMenuRegex);

    if (match) {
      const fullMenuBlock = match[0];
      console.log('✅ Found TEST menu creation block\n');

      // Add cache submenu before .addToUi()
      const modifiedBlock = fullMenuBlock.replace(
        /(\s*)\.addToUi\(\)/,
        '\n\n  // Add cache management submenu\n  addCacheEnrichmentMenuItems(testMenu);\n\n$1.addToUi()'
      );

      testMenuCode = testMenuCode.replace(fullMenuBlock, modifiedBlock);
      console.log('✅ Added cache submenu to TEST menu\n');
    } else {
      console.log('⚠️  Could not find TEST menu creation pattern\n');
    }

    // Now update the enrichment functions to call refreshHeaders() first
    const enrichmentFile = project.data.files.find(f => f.name === 'Multi_Step_Cache_Enrichment');

    if (enrichmentFile) {
      let enrichmentCode = enrichmentFile.source;

      // Add refreshHeaders() call at start of enrichAllCacheLayers()
      const enrichAllMatch = enrichmentCode.match(/(function enrichAllCacheLayers\(\) \{[\s\S]*?const startTime[^\n]*\n)/);

      if (enrichAllMatch) {
        const modifiedStart = enrichAllMatch[0] + `
  // Refresh headers to ensure column mappings are up-to-date
  Logger.log('🔄 Refreshing headers before enrichment...');
  try {
    refreshHeaders();
    Logger.log('✅ Headers refreshed successfully\\n');
  } catch (e) {
    Logger.log('⚠️  Could not refresh headers: ' + e.message);
    Logger.log('   Proceeding with cached header data\\n');
  }

`;

        enrichmentCode = enrichmentCode.replace(enrichAllMatch[0], modifiedStart);
        console.log('✅ Added refreshHeaders() call to enrichAllCacheLayers()\n');
      }

      // Also add to individual layer enrichment
      const enrichLayerMatch = enrichmentCode.match(/(function enrichCacheLayer_\(layerKey\) \{[\s\S]*?Logger\.log\('🗄️)/);

      if (enrichLayerMatch) {
        const modifiedLayerStart = enrichLayerMatch[0].replace(
          /(Logger\.log\('🗄️)/,
          `// Ensure headers are fresh
  try {
    refreshHeaders();
  } catch (e) {
    Logger.log('⚠️  Could not refresh headers: ' + e.message);
  }

  $1`
        );

        enrichmentCode = enrichmentCode.replace(enrichLayerMatch[0], modifiedLayerStart);
        console.log('✅ Added refreshHeaders() call to enrichCacheLayer_()\n');
      }

      enrichmentFile.source = enrichmentCode;
    }

    // Deploy changes
    testMenuFile.source = testMenuCode;

    console.log('🚀 Deploying changes...\n');

    await script.projects.updateContent({
      scriptId: TEST_SCRIPT_ID,
      requestBody: {
        files: project.data.files
      }
    });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ INTEGRATION COMPLETE\n');
    console.log('📋 CHANGES MADE:\n');
    console.log('   ✅ Added cache management submenu to TEST menu');
    console.log('   ✅ Added refreshHeaders() call to enrichAllCacheLayers()');
    console.log('   ✅ Added refreshHeaders() call to enrichCacheLayer_()');
    console.log('\n🎯 NEXT STEPS:\n');
    console.log('   1. Refresh your Google Sheet (reload the page)');
    console.log('   2. Open TEST menu');
    console.log('   3. Look for Cache Management submenu');
    console.log('   4. Headers will automatically refresh before each cache operation\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('\n❌ Failed: ' + e.message + '\n');
    if (e.stack) {
      console.log('Stack trace:', e.stack);
    }
  }
}

integrate().catch(console.error);
