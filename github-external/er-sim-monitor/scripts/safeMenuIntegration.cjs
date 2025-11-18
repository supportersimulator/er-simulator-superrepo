#!/usr/bin/env node

/**
 * Safely integrate cache management into TEST menu
 * Read file, find menu variable name, add submenu properly
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
  console.log('\n🔧 SAFELY INTEGRATING CACHE MANAGEMENT\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });

    // Find ATSR file
    const atsrFile = project.data.files.find(f => f.name === 'ATSR_Title_Generator_Feature');

    if (!atsrFile) {
      console.log('❌ ATSR file not found\n');
      return;
    }

    let code = atsrFile.source;

    // Check if already integrated
    if (code.includes('addCacheEnrichmentMenuItems')) {
      console.log('✅ Already integrated - updating enrichment functions only\n');
    } else {
      console.log('🔍 Finding TEST menu variable...\n');

      // Find menu variable assignment: const testMenu = ... or var testMenu = ...
      const menuVarMatch = code.match(/(const|var|let)\s+(\w+)\s*=\s*ui\.createMenu\(['"].*TEST.*['"]\)/i);

      if (menuVarMatch) {
        const menuVarName = menuVarMatch[2];
        console.log(`✅ Found menu variable: ${menuVarName}\n`);

        // Find where .addToUi() is called on this menu
        const addToUiRegex = new RegExp(`${menuVarName}\\.addToUi\\(\\)`, 'g');
        const addToUiMatch = code.match(addToUiRegex);

        if (addToUiMatch) {
          console.log(`✅ Found ${menuVarName}.addToUi()\n`);

          // Add call just before .addToUi()
          const pattern = new RegExp(`(\\s*)(${menuVarName}\\.addToUi\\(\\))`);
          code = code.replace(pattern, `$1// Add cache management submenu\n$1addCacheEnrichmentMenuItems(${menuVarName});\n$1$2`);

          console.log('✅ Added cache submenu call\n');
        } else {
          console.log('⚠️  Could not find .addToUi() call\n');
        }
      } else {
        console.log('⚠️  Could not find menu variable\n');
      }
    }

    // Update enrichment functions to call refreshHeaders()
    const enrichmentFile = project.data.files.find(f => f.name === 'Multi_Step_Cache_Enrichment');

    if (enrichmentFile) {
      let enrichmentCode = enrichmentFile.source;
      let enrichmentChanged = false;

      // Check if already has refreshHeaders() in enrichAllCacheLayers
      if (!enrichmentCode.includes('refreshHeaders()') || !enrichmentCode.match(/enrichAllCacheLayers[\s\S]{0,500}refreshHeaders/)) {
        // Add at start of enrichAllCacheLayers, after startTime
        const enrichAllPattern = /(function enrichAllCacheLayers\(\) \{[\s\S]*?const startTime = new Date\(\)\.getTime\(\);\s*\n)/;
        const enrichAllMatch = enrichmentCode.match(enrichAllPattern);

        if (enrichAllMatch) {
          const replacement = enrichAllMatch[0] + `
  // Refresh headers to ensure column mappings are up-to-date
  Logger.log('🔄 Refreshing headers before enrichment...');
  try {
    refreshHeaders();
    Logger.log('✅ Headers refreshed successfully\\n');
  } catch (e) {
    Logger.log('⚠️  Could not refresh headers: ' + e.message);
    Logger.log('   Proceeding with existing headers\\n');
  }

`;

          enrichmentCode = enrichmentCode.replace(enrichAllMatch[0], replacement);
          enrichmentChanged = true;
          console.log('✅ Added refreshHeaders() to enrichAllCacheLayers()\n');
        }
      } else {
        console.log('✅ refreshHeaders() already in enrichAllCacheLayers()\n');
      }

      if (enrichmentChanged) {
        enrichmentFile.source = enrichmentCode;
      }
    }

    // Deploy
    atsrFile.source = code;

    console.log('🚀 Deploying changes...\n');

    await script.projects.updateContent({
      scriptId: TEST_SCRIPT_ID,
      requestBody: {
        files: project.data.files
      }
    });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ INTEGRATION COMPLETE\n');
    console.log('🎯 NEXT STEPS:\n');
    console.log('   1. Refresh your Google Sheet');
    console.log('   2. Open TEST menu → Cache Management');
    console.log('   3. Try "Cache All Layers (Sequential)"');
    console.log('   4. Headers will refresh automatically before caching\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('\n❌ Failed: ' + e.message + '\n');
    if (e.stack) {
      console.log('Stack trace:', e.stack);
    }
  }
}

integrate().catch(console.error);
