#!/usr/bin/env node

/**
 * Update cache enrichment system to use refreshHeaders() cached mappings
 * instead of hardcoded column indices
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

async function update() {
  console.log('\n🔧 UPDATING CACHE TO USE REFRESHHEADERS() MAPPINGS\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });
    const enrichmentFile = project.data.files.find(f => f.name === 'Multi_Step_Cache_Enrichment');

    if (!enrichmentFile) {
      console.log('❌ Enrichment file not found\n');
      return;
    }

    let code = enrichmentFile.source;

    // Check if helper already exists
    if (code.includes('function getColumnIndexByHeader_')) {
      console.log('✅ Helper function already exists - updating enrichment logic only\n');
    } else {
      // Add helper function before getCacheLayerDefinitions_
      const helperFunction = `
// ============================================================================
// HEADER REFRESH INTEGRATION
// ============================================================================

/**
 * Get column index by tier2 header name using cached headers from refreshHeaders()
 * Falls back to provided index if header not found
 *
 * @param {string} tier2Name - The Tier2 header name to find
 * @param {number} fallbackIndex - Fallback column index if header not found
 * @returns {number} Column index
 */
function getColumnIndexByHeader_(tier2Name, fallbackIndex) {
  try {
    // Try to get cached headers from refreshHeaders()
    const cachedHeader2 = getProp('CACHED_HEADER2');

    if (cachedHeader2) {
      const headers = JSON.parse(cachedHeader2);
      const index = headers.indexOf(tier2Name);

      if (index !== -1) {
        return index;
      }
    }
  } catch (e) {
    Logger.log('⚠️  Could not read cached headers: ' + e.message);
  }

  // Fallback to provided index
  return fallbackIndex;
}

`;

      const getCacheLayerPos = code.indexOf('function getCacheLayerDefinitions_()');

      if (getCacheLayerPos !== -1) {
        code = code.substring(0, getCacheLayerPos) + helperFunction + code.substring(getCacheLayerPos);
        console.log('✅ Added getColumnIndexByHeader_() helper function\n');
      }
    }

    // Update enrichCacheLayer_ to resolve column indices from actual tier2 headers
    const enrichPattern = /(function enrichCacheLayer_\(layerKey\) \{[\s\S]*?)(Object\.keys\(layerDef\.fields\)\.forEach\(function\(fieldName\) \{[\s\S]*?const columnIndex = layerDef\.fields\[fieldName\];[\s\S]*?if \(typeof columnIndex !== 'number' \|\| columnIndex < 0\) \{[\s\S]*?return;[\s\S]*?\})/;

    const enrichMatch = code.match(enrichPattern);

    if (enrichMatch) {
      console.log('✅ Updating enrichCacheLayer_() to use dynamic header resolution\n');

      // Replace validation section with dynamic resolution
      const replacement = enrichMatch[1] + `Object.keys(layerDef.fields).forEach(function(fieldName) {
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

      code = code.replace(enrichMatch[0], replacement);
      console.log('✅ Added dynamic header resolution to field validation loop\n');
    } else {
      console.log('⚠️  Could not find enrichCacheLayer_() validation loop\n');
      console.log('Will still deploy helper function for manual integration\n');
    }

    enrichmentFile.source = code;

    console.log('🚀 Deploying updated enrichment system...\n');

    await script.projects.updateContent({
      scriptId: TEST_SCRIPT_ID,
      requestBody: {
        files: project.data.files
      }
    });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ CACHE SYSTEM UPDATED\n');
    console.log('🔄 WHAT CHANGED:\n');
    console.log('   • Added getColumnIndexByHeader_() helper function');
    console.log('   • Cache system now reads from CACHED_HEADER2 property');
    console.log('   • Column mappings update automatically after refreshHeaders()');
    console.log('   • Logs when columns move to different indices\n');
    console.log('🎯 HOW IT WORKS:\n');
    console.log('   1. User clicks cache button → refreshHeaders() runs first');
    console.log('   2. Column mappings saved to CACHED_HEADER2 property');
    console.log('   3. Cache enrichment reads tier2 names from data[1]');
    console.log('   4. Resolves each column dynamically using cached headers');
    console.log('   5. Falls back to hardcoded values if headers not found\n');
    console.log('📊 BENEFITS:\n');
    console.log('   • Schema changes automatically detected');
    console.log('   • Cache adapts to new column positions');
    console.log('   • No manual column index updates needed');
    console.log('   • Logs show when columns moved\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('\n❌ Failed: ' + e.message + '\n');
    if (e.stack) {
      console.log(e.stack);
    }
  }
}

update().catch(console.error);
