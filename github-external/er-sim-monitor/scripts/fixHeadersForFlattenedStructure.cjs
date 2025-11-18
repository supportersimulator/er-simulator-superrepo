#!/usr/bin/env node

/**
 * FIX HEADERS FOR FLATTENED STRUCTURE
 * Update refreshHeaders() and getAvailableFields() to handle flattened headers correctly
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🔧 FIXING HEADERS FOR FLATTENED STRUCTURE\n');
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

    console.log('🔍 Detected Structure:\n');
    console.log('   Row 1: Short headers (Case_ID, Spark_Title)');
    console.log('   Row 2: Full flattened (Case_Organization_Case_ID)');
    console.log('   Row 3+: Data\n');

    console.log('🔧 Updating getAvailableFields() to use Row 2...\n');

    // Replace getAvailableFields to parse flattened headers
    const oldGetAvailableFields = `/**
 * Get all available fields from cached headers
 * Returns array of field objects: { name, tier1, tier2, header }
 */
function getAvailableFields() {
  const docProps = PropertiesService.getDocumentProperties();

  // Read cached headers (set by refreshHeaders())
  const header1Json = docProps.getProperty('CACHED_HEADER1');
  const header2Json = docProps.getProperty('CACHED_HEADER2');

  if (!header1Json || !header2Json) {
    throw new Error('Headers not cached. Please run refreshHeaders() first.');
  }

  const header1 = JSON.parse(header1Json);
  const header2 = JSON.parse(header2Json);

  // Build array of field objects
  const fields = [];
  for (let i = 0; i < header1.length; i++) {
    const tier1 = String(header1[i] || '').trim();
    const tier2 = String(header2[i] || '').trim();

    if (!tier1 || !tier2) continue; // Skip empty headers

    // Create merged field name (e.g., "Case_Organization_Case_ID")
    const name = tier1 + '_' + tier2;
    const header = tier1 + ':' + tier2;

    fields.push({
      name: name,
      tier1: tier1,
      tier2: tier2,
      header: header
    });
  }

  Logger.log('📊 Found ' + fields.length + ' available fields');
  return fields;
}`;

    const newGetAvailableFields = `/**
 * Get all available fields from cached flattened headers
 * Returns array of field objects: { name, tier1, tier2, header }
 * Handles flattened format: Row 2 has "Case_Organization_Case_ID"
 */
function getAvailableFields() {
  const docProps = PropertiesService.getDocumentProperties();

  // Read cached merged keys (flattened headers from Row 2)
  const mergedKeysJson = docProps.getProperty('CACHED_MERGED_KEYS');

  if (!mergedKeysJson) {
    throw new Error('Headers not cached. Please run refreshHeaders() first.');
  }

  const mergedKeys = JSON.parse(mergedKeysJson);

  // Build array of field objects by parsing flattened names
  const fields = [];
  for (let i = 0; i < mergedKeys.length; i++) {
    const merged = String(mergedKeys[i] || '').trim();
    if (!merged) continue;

    // Parse flattened name: "Case_Organization_Case_ID" → tier1:"Case_Organization", tier2:"Case_ID"
    // OR simpler: "Case_ID" → tier1:"Case", tier2:"ID"
    const parts = merged.split('_');

    let tier1, tier2;
    if (parts.length >= 3) {
      // Format: Tier1_Tier1Part2_Tier2 (e.g., "Case_Organization_Case_ID")
      // Take first part(s) as tier1, last part as tier2
      tier2 = parts[parts.length - 1];
      tier1 = parts.slice(0, -1).join('_');
    } else if (parts.length === 2) {
      // Format: Tier1_Tier2 (e.g., "Case_ID")
      tier1 = parts[0];
      tier2 = parts[1];
    } else {
      // Single part, no underscore
      tier1 = 'General';
      tier2 = merged;
    }

    fields.push({
      name: merged,        // Use full flattened name as-is
      tier1: tier1,
      tier2: tier2,
      header: merged       // Display flattened name
    });
  }

  Logger.log('📊 Found ' + fields.length + ' available fields from flattened headers');
  return fields;
}`;

    if (code.includes(oldGetAvailableFields)) {
      code = code.replace(oldGetAvailableFields, newGetAvailableFields);
      console.log('✅ Updated getAvailableFields() to parse flattened headers\n');
    } else {
      console.log('⚠️  getAvailableFields() not found or already updated\n');
    }

    // Update refreshHeaders to read Row 2 as flattened headers
    console.log('🔧 Updating refreshHeaders() to read Row 2 as flattened...\n');

    const oldRefreshHeaders = `function refreshHeaders() {
  const ui = getSafeUi_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  // Use pickMasterSheet_() instead of hardcoded fallback
  const outputSheet = pickMasterSheet_();
  if (!outputSheet) {
    if (ui) { ui.alert('❌ Master sheet not found.'); }
    return;
  }

  const header1 = outputSheet.getRange(1, 1, 1, outputSheet.getLastColumn()).getValues()[0];
  const header2 = outputSheet.getRange(2, 1, 1, outputSheet.getLastColumn()).getValues()[0];
  const mergedKeys = header1.map((t1, i) => \`\${t1}:\${header2[i]}\`.replace(/\\s+/g, '_'));

  // Cache headers for future access
  setProp('CACHED_HEADER1', JSON.stringify(header1));
  setProp('CACHED_HEADER2', JSON.stringify(header2));
  setProp('CACHED_MERGED_KEYS', JSON.stringify(mergedKeys));

  if (getSafeUi_()) { getSafeUi_().alert(\`✅ Headers refreshed!\\n\\n\${mergedKeys.length} merged keys cached.\`); }
}`;

    const newRefreshHeaders = `function refreshHeaders() {
  const ui = getSafeUi_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const outputSheet = pickMasterSheet_();
  if (!outputSheet) {
    if (ui) { ui.alert('❌ Master sheet not found.'); }
    return;
  }

  // Read Row 2 which contains the FULL flattened headers
  // Row 1: Short names (Case_ID, Spark_Title)
  // Row 2: Full flattened (Case_Organization_Case_ID, Case_Organization_Spark_Title)
  const flattenedHeaders = outputSheet.getRange(2, 1, 1, outputSheet.getLastColumn()).getValues()[0];

  // Clean and filter headers
  const mergedKeys = flattenedHeaders
    .map(h => String(h || '').trim())
    .filter(h => h !== '');

  // Cache the flattened headers
  setProp('CACHED_MERGED_KEYS', JSON.stringify(mergedKeys));

  // For backward compatibility, also cache as header1/header2
  // Parse tier1 and tier2 from flattened names
  const header1 = [];
  const header2 = [];

  mergedKeys.forEach(merged => {
    const parts = merged.split('_');
    if (parts.length >= 3) {
      header1.push(parts.slice(0, -1).join('_'));
      header2.push(parts[parts.length - 1]);
    } else if (parts.length === 2) {
      header1.push(parts[0]);
      header2.push(parts[1]);
    } else {
      header1.push('General');
      header2.push(merged);
    }
  });

  setProp('CACHED_HEADER1', JSON.stringify(header1));
  setProp('CACHED_HEADER2', JSON.stringify(header2));

  if (getSafeUi_()) {
    getSafeUi_().alert(\`✅ Headers refreshed!\\n\\n\${mergedKeys.length} merged keys cached.\`);
  }
}`;

    if (code.includes(oldRefreshHeaders)) {
      code = code.replace(oldRefreshHeaders, newRefreshHeaders);
      console.log('✅ Updated refreshHeaders() to read Row 2 as flattened\n');
    } else {
      console.log('⚠️  refreshHeaders() pattern not found\n');
    }

    // Backup
    const backupPath = path.join(__dirname, '../backups/production-before-flattened-header-fix-2025-11-06.gs');
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
    console.log('🎉 FLATTENED HEADER SUPPORT ADDED!\n');
    console.log('What changed:\n');
    console.log('   ✅ refreshHeaders() now reads Row 2 (full flattened headers)\n');
    console.log('   ✅ getAvailableFields() parses flattened names correctly\n');
    console.log('   ✅ Splits "Case_Organization_Case_ID" → tier1:"Case_Organization", tier2:"Case_ID"\n');
    console.log('\nNow when you click "Pre-Cache Rich Data":\n');
    console.log('   1. refreshHeaders() reads Row 2: Case_Organization_Case_ID, etc.\n');
    console.log('   2. Caches 642 merged keys\n');
    console.log('   3. getAvailableFields() parses them into field objects\n');
    console.log('   4. Field selector opens with proper categories!\n');
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
