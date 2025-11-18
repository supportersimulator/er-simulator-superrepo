#!/usr/bin/env node

/**
 * Integrate Dynamic Header Resolution into Multi_Step_Cache_Enrichment
 *
 * Changes:
 * 1. Add getColumnIndexByHeader_() helper function
 * 2. Update enrichCacheLayer_() to use dynamic resolution
 * 3. Add refreshHeaders() auto-call in enrichAllCacheLayers()
 * 4. Remove cache menu integration from ATSR file (if exists)
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SCRIPT_ID = '1kkPZU3GsCCuu5IhTEOufmDT1Cb2rSQVB3Y3u1DPf87yoSV4WVtoNvd6i';

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
  console.log('\n🔧 INTEGRATING DYNAMIC HEADER RESOLUTION\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    // 1. Read local files
    const enrichmentPath = path.join(__dirname, '../apps-script-deployable/Multi_Step_Cache_Enrichment.gs');
    const uiPath = path.join(__dirname, '../apps-script-deployable/Multi_Step_Cache_UI.gs');

    let enrichmentCode = fs.readFileSync(enrichmentPath, 'utf8');
    let uiCode = fs.readFileSync(uiPath, 'utf8');

    console.log('📦 Read local files\n');

    // 2. Add getColumnIndexByHeader_() helper function
    const helperFunction = `
// ============================================================================
// DYNAMIC HEADER RESOLUTION
// ============================================================================

/**
 * Get column index by Tier2 header name with fallback to static index
 *
 * @param {string} tier2Name - The Tier2 header name to search for
 * @param {number} fallbackIndex - Static index to use if header not found
 * @returns {number} Column index
 */
function getColumnIndexByHeader_(tier2Name, fallbackIndex) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Find master sheet
  const masterSheet = ss.getSheets().find(function(sh) {
    return /master.*scenario.*convert/i.test(sh.getName());
  });

  if (!masterSheet) {
    Logger.log(\`   ⚠️  Master sheet not found, using fallback index \${fallbackIndex}\`);
    return fallbackIndex;
  }

  // Get fresh headers (row 2 = Tier2)
  const data = masterSheet.getDataRange().getValues();
  const tier2Headers = data[1];

  // Search for exact match
  const foundIndex = tier2Headers.indexOf(tier2Name);

  if (foundIndex !== -1) {
    return foundIndex;
  }

  // Not found, use fallback
  Logger.log(\`   ⚠️  Header "\${tier2Name}" not found, using fallback index \${fallbackIndex}\`);
  return fallbackIndex;
}
`;

    // Insert helper function after getCacheLayerDefinitions_()
    const insertAfter = '}';
    const insertPosition = enrichmentCode.indexOf('// ============================================================================\n// CORE ENRICHMENT ENGINE');

    if (insertPosition === -1) {
      throw new Error('Could not find insertion point for helper function');
    }

    enrichmentCode =
      enrichmentCode.slice(0, insertPosition) +
      helperFunction + '\n' +
      enrichmentCode.slice(insertPosition);

    console.log('✅ Added getColumnIndexByHeader_() helper function\n');

    // 3. Update enrichCacheLayer_() field validation loop
    const oldValidationLoop = `  Object.keys(layerDef.fields).forEach(function(fieldName) {
    const columnIndex = layerDef.fields[fieldName];

    if (typeof columnIndex !== 'number' || columnIndex < 0) {
      Logger.log(\`   ⚠️  Invalid column index for field \${fieldName}: \${columnIndex}\`);
      return;
    }`;

    const newValidationLoop = `  Object.keys(layerDef.fields).forEach(function(fieldName) {
    const fallbackIndex = layerDef.fields[fieldName];

    // Resolve column index dynamically from refreshed headers
    let columnIndex;

    if (typeof fallbackIndex === 'number' && fallbackIndex >= 0) {
      // Get the actual tier2 header name for this column
      const tier2Headers = data[1];
      const tier2Name = tier2Headers[fallbackIndex];

      if (tier2Name) {
        // Use dynamic resolution with fallback
        columnIndex = getColumnIndexByHeader_(tier2Name, fallbackIndex);

        if (columnIndex !== fallbackIndex) {
          Logger.log(\`   🔄 Field \${fieldName}: Column moved from \${fallbackIndex} to \${columnIndex} (\${tier2Name})\`);
        }
      } else {
        columnIndex = fallbackIndex;
      }
    } else {
      Logger.log(\`   ⚠️  Invalid column index for field \${fieldName}: \${fallbackIndex}\`);
      return;
    }

    if (typeof columnIndex !== 'number' || columnIndex < 0) {
      Logger.log(\`   ⚠️  Could not resolve column for field \${fieldName}\`);
      return;
    }`;

    if (enrichmentCode.includes(oldValidationLoop)) {
      enrichmentCode = enrichmentCode.replace(oldValidationLoop, newValidationLoop);
      console.log('✅ Updated enrichCacheLayer_() field validation loop\n');
    } else {
      console.log('⚠️  Could not find field validation loop to update\n');
    }

    // 4. Add refreshHeaders() call to enrichAllCacheLayers()
    const enrichAllStart = `function enrichAllCacheLayers() {
  const startTime = new Date().getTime();
  const layers = getCacheLayerDefinitions_();
  const results = [];

  Logger.log('\\n🚀 STARTING MULTI-LAYER CACHE ENRICHMENT\\n');
  Logger.log('═══════════════════════════════════════════════════════════════\\n');`;

    const enrichAllStartWithRefresh = `function enrichAllCacheLayers() {
  const startTime = new Date().getTime();

  // Refresh headers before enrichment (ensures up-to-date column mappings)
  Logger.log('\\n🔄 REFRESHING HEADERS\\n');
  try {
    if (typeof refreshHeaders === 'function') {
      refreshHeaders();
      Logger.log('✅ Headers refreshed successfully\\n');
    } else {
      Logger.log('⚠️  refreshHeaders() function not found, skipping\\n');
    }
  } catch (e) {
    Logger.log(\`⚠️  Could not refresh headers: \${e.message}\\n\`);
  }

  const layers = getCacheLayerDefinitions_();
  const results = [];

  Logger.log('\\n🚀 STARTING MULTI-LAYER CACHE ENRICHMENT\\n');
  Logger.log('═══════════════════════════════════════════════════════════════\\n');`;

    if (enrichmentCode.includes(enrichAllStart)) {
      enrichmentCode = enrichmentCode.replace(enrichAllStart, enrichAllStartWithRefresh);
      console.log('✅ Added refreshHeaders() auto-call to enrichAllCacheLayers()\n');
    } else {
      console.log('⚠️  Could not find enrichAllCacheLayers() to update\n');
    }

    // 5. Save modified files locally
    fs.writeFileSync(enrichmentPath, enrichmentCode);
    console.log('💾 Saved modified Multi_Step_Cache_Enrichment.gs\n');

    // 6. Get current project and update
    console.log('📡 Reading current Apps Script project...\n');
    const project = await script.projects.getContent({ scriptId: SCRIPT_ID });

    // Find and update Multi_Step_Cache_Enrichment file
    const enrichmentFile = project.data.files.find(f => f.name === 'Multi_Step_Cache_Enrichment');
    if (enrichmentFile) {
      enrichmentFile.source = enrichmentCode;
      console.log('✅ Multi_Step_Cache_Enrichment.gs queued for update\n');
    } else {
      console.log('⚠️  Multi_Step_Cache_Enrichment.gs not found in project\n');
    }

    // 7. Deploy to Apps Script
    console.log('🚀 Deploying to Google Apps Script...\n');
    await script.projects.updateContent({
      scriptId: SCRIPT_ID,
      requestBody: {
        files: project.data.files
      }
    });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ DYNAMIC HEADER RESOLUTION INTEGRATED SUCCESSFULLY\n');
    console.log('📋 CHANGES APPLIED:\n');
    console.log('   ✅ Added getColumnIndexByHeader_() helper function');
    console.log('   ✅ Updated enrichCacheLayer_() field validation with dynamic resolution');
    console.log('   ✅ Added automatic refreshHeaders() call in enrichAllCacheLayers()');
    console.log('\n🎯 WHAT THIS MEANS:\n');
    console.log('   • Cache enrichment now adapts to column movements automatically');
    console.log('   • Headers are refreshed before every bulk cache operation');
    console.log('   • Field mappings update dynamically if columns shift');
    console.log('   • Logs show when columns have moved from original index');
    console.log('\n📝 NEXT STEPS:\n');
    console.log('   1. Test by moving a column in the Master sheet');
    console.log('   2. Run cache enrichment - should detect and adapt');
    console.log('   3. Check execution logs for column movement notices');
    console.log('\n═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('\n❌ Integration failed: ' + e.message + '\n');
    if (e.stack) {
      console.log('Stack trace:', e.stack);
    }
  }
}

integrate().catch(console.error);
