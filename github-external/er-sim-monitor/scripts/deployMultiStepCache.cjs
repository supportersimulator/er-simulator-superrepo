#!/usr/bin/env node

/**
 * Deploy Multi-Step Cache Enrichment System to Google Apps Script
 *
 * This adds two new files to the Apps Script project:
 * 1. Multi_Step_Cache_Enrichment.gs - Core enrichment engine
 * 2. Multi_Step_Cache_UI.gs - UI integration and menu items
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

async function deploy() {
  console.log('\n🚀 DEPLOYING MULTI-STEP CACHE ENRICHMENT SYSTEM\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    // 1. Read new files
    const enrichmentPath = path.join(__dirname, '../apps-script-deployable/Multi_Step_Cache_Enrichment.gs');
    const uiPath = path.join(__dirname, '../apps-script-deployable/Multi_Step_Cache_UI.gs');

    const enrichmentCode = fs.readFileSync(enrichmentPath, 'utf8');
    const uiCode = fs.readFileSync(uiPath, 'utf8');

    console.log('📦 Read local files:');
    console.log(`   Multi_Step_Cache_Enrichment.gs: ${(enrichmentCode.length / 1024).toFixed(1)} KB`);
    console.log(`   Multi_Step_Cache_UI.gs: ${(uiCode.length / 1024).toFixed(1)} KB\n`);

    // 2. Get current project
    console.log('📡 Reading current Apps Script project...\n');
    const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });

    // 3. Check if files already exist
    const enrichmentFile = project.data.files.find(f => f.name === 'Multi_Step_Cache_Enrichment');
    const uiFile = project.data.files.find(f => f.name === 'Multi_Step_Cache_UI');

    if (enrichmentFile) {
      console.log('✅ Multi_Step_Cache_Enrichment.gs exists - will update\n');
      enrichmentFile.source = enrichmentCode;
    } else {
      console.log('📄 Multi_Step_Cache_Enrichment.gs does not exist - will create\n');
      project.data.files.push({
        name: 'Multi_Step_Cache_Enrichment',
        type: 'SERVER_JS',
        source: enrichmentCode
      });
    }

    if (uiFile) {
      console.log('✅ Multi_Step_Cache_UI.gs exists - will update\n');
      uiFile.source = uiCode;
    } else {
      console.log('📄 Multi_Step_Cache_UI.gs does not exist - will create\n');
      project.data.files.push({
        name: 'Multi_Step_Cache_UI',
        type: 'SERVER_JS',
        source: uiCode
      });
    }

    // 4. Deploy
    console.log('🚀 Deploying to Google Apps Script...\n');

    await script.projects.updateContent({
      scriptId: TEST_SCRIPT_ID,
      requestBody: {
        files: project.data.files
      }
    });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ MULTI-STEP CACHE SYSTEM DEPLOYED SUCCESSFULLY\n');
    console.log('📋 FILES DEPLOYED:\n');
    console.log('   • Multi_Step_Cache_Enrichment.gs (core engine)');
    console.log('   • Multi_Step_Cache_UI.gs (UI integration)\n');
    console.log('🎯 WHAT\'S NEW:\n');
    console.log('   • 7 independent cache layers (basic, learning, metadata, demographics, vitals, clinical, environment)');
    console.log('   • Progressive enrichment system (cache layers independently)');
    console.log('   • Smart cache merger (combines all available layers)');
    console.log('   • UI menu with per-layer caching options');
    console.log('   • Live progress modal for bulk enrichment');
    console.log('   • Cache status viewer\n');
    console.log('📝 NEXT STEPS:\n');
    console.log('   1. Open your Google Sheet');
    console.log('   2. Refresh the page to load new menu items');
    console.log('   3. Look for "🗄️ Cache Management" submenu');
    console.log('   4. Try "📦 Cache All Layers (Sequential)" to enrich all layers');
    console.log('   5. Use "📊 View Cache Status" to see which layers are cached');
    console.log('   6. Run AI Pathway Discovery - it will automatically use merged cache\n');
    console.log('⚠️  IMPORTANT:\n');
    console.log('   • You may need to manually integrate menu items into your onOpen() function');
    console.log('   • Call addCacheEnrichmentMenuItems(menu) from onOpen()');
    console.log('   • Replace analyzeCatalog_() calls with analyzeCatalogWithMultiLayerCache_()\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('\n❌ Deployment failed: ' + e.message + '\n');
    if (e.stack) {
      console.log('Stack trace:', e.stack);
    }
  }
}

deploy().catch(console.error);
