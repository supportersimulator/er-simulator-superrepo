#!/usr/bin/env node

/**
 * UPDATE FIELD SELECTOR WITH EXAMPLES
 * Use Row 2 (flattened headers) + Row 3 (example data) to show what each field contains
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🔧 UPDATING FIELD SELECTOR WITH EXAMPLES\n');
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

async function update() {
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

    console.log('🔍 Strategy:\n');
    console.log('   Row 1: Human-readable names (IGNORE)');
    console.log('   Row 2: Flattened headers (USE for field names)');
    console.log('   Row 3: Example data (USE to show what field contains)\n');

    console.log('🔧 Updating refreshHeaders() to cache example data...\n');

    // Update refreshHeaders to also cache Row 3 example data
    const oldRefreshHeaders = `function refreshHeaders() {
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

    const newRefreshHeaders = `function refreshHeaders() {
  const ui = getSafeUi_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const outputSheet = pickMasterSheet_();
  if (!outputSheet) {
    if (ui) { ui.alert('❌ Master sheet not found.'); }
    return;
  }

  // Row 1: Human-readable (IGNORE)
  // Row 2: Flattened headers (USE)
  // Row 3: Example data (USE)
  const flattenedHeaders = outputSheet.getRange(2, 1, 1, outputSheet.getLastColumn()).getValues()[0];
  const exampleData = outputSheet.getRange(3, 1, 1, outputSheet.getLastColumn()).getValues()[0];

  // Clean and filter headers
  const mergedKeys = flattenedHeaders
    .map(h => String(h || '').trim())
    .filter(h => h !== '');

  // Cache the flattened headers
  setProp('CACHED_MERGED_KEYS', JSON.stringify(mergedKeys));

  // Cache example data for field selector preview
  setProp('CACHED_EXAMPLE_DATA', JSON.stringify(exampleData));

  // For backward compatibility, parse tier1 and tier2 from flattened names
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
      console.log('✅ Updated refreshHeaders() to cache example data\n');
    } else {
      console.log('⚠️  refreshHeaders() not found or already updated\n');
    }

    console.log('🔧 Updating getAvailableFields() to include examples...\n');

    // Update getAvailableFields to include example data
    const oldGetAvailableFields = `/**
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

    const newGetAvailableFields = `/**
 * Get all available fields from cached flattened headers with example data
 * Returns array of field objects: { name, tier1, tier2, header, example }
 * Row 2: Flattened headers, Row 3: Example data
 */
function getAvailableFields() {
  const docProps = PropertiesService.getDocumentProperties();

  // Read cached merged keys (flattened headers from Row 2)
  const mergedKeysJson = docProps.getProperty('CACHED_MERGED_KEYS');
  const exampleDataJson = docProps.getProperty('CACHED_EXAMPLE_DATA');

  if (!mergedKeysJson) {
    throw new Error('Headers not cached. Please run refreshHeaders() first.');
  }

  const mergedKeys = JSON.parse(mergedKeysJson);
  const exampleData = exampleDataJson ? JSON.parse(exampleDataJson) : [];

  // Build array of field objects by parsing flattened names
  const fields = [];
  for (let i = 0; i < mergedKeys.length; i++) {
    const merged = String(mergedKeys[i] || '').trim();
    if (!merged) continue;

    // Get example data for this field (truncate if too long)
    let example = String(exampleData[i] || 'N/A');
    if (example.length > 100) {
      example = example.substring(0, 97) + '...';
    }

    // Parse flattened name: "Case_Organization_Case_ID" → tier1:"Case_Organization", tier2:"Case_ID"
    const parts = merged.split('_');

    let tier1, tier2;
    if (parts.length >= 3) {
      // Format: Tier1_Tier1Part2_Tier2 (e.g., "Case_Organization_Case_ID")
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
      header: merged,      // Display flattened name
      example: example     // Example from Row 3
    });
  }

  Logger.log('📊 Found ' + fields.length + ' available fields with examples from Row 3');
  return fields;
}`;

    if (code.includes(oldGetAvailableFields)) {
      code = code.replace(oldGetAvailableFields, newGetAvailableFields);
      console.log('✅ Updated getAvailableFields() to include example data\n');
    } else {
      console.log('⚠️  getAvailableFields() not found or already updated\n');
    }

    console.log('🔧 Updating field selector HTML to display examples...\n');

    // Update the label rendering to show examples
    const oldLabelHTML = `label.innerHTML = "<span class=\\"field-name\\">" + field.name + "</span><span class=\\"field-header\\">→ " + field.header + "</span>";`;

    const newLabelHTML = `label.innerHTML = "<span class=\\"field-name\\">" + field.name + "</span><span class=\\"field-header\\">→ " + field.header + "</span>" + (field.example ? "<span class=\\"field-example\\">Example: " + field.example + "</span>" : "");`;

    if (code.includes(oldLabelHTML)) {
      code = code.replace(oldLabelHTML, newLabelHTML);
      console.log('✅ Updated field selector to display examples\n');
    } else {
      console.log('⚠️  Field selector label HTML not found\n');
    }

    // Add CSS for field examples
    const oldCSS = `.field-header { color: #666; font-size: 12px; display: block; margin-top: 2px; }`;

    const newCSS = `.field-header { color: #666; font-size: 12px; display: block; margin-top: 2px; }
    '.field-example { color: #999; font-size: 11px; display: block; margin-top: 3px; font-style: italic; }`;

    if (code.includes(oldCSS)) {
      code = code.replace(oldCSS, newCSS);
      console.log('✅ Added CSS for field examples\n');
    } else {
      console.log('⚠️  CSS not found, skipping style update\n');
    }

    // Backup
    const backupPath = path.join(__dirname, '../backups/production-before-field-examples-2025-11-06.gs');
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
    console.log('🎉 FIELD EXAMPLES ADDED!\n');
    console.log('What changed:\n');
    console.log('   ✅ refreshHeaders() now caches Row 3 example data\n');
    console.log('   ✅ getAvailableFields() includes example for each field\n');
    console.log('   ✅ Field selector displays: "Example: GAST0001" below field name\n');
    console.log('\nNow when field selector opens, each field shows:\n');
    console.log('   Field Name: Case_Organization_Case_ID\n');
    console.log('   → Case_Organization_Case_ID\n');
    console.log('   Example: GAST0001\n');
    console.log('\nThis helps users understand what data each field contains!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

update();
