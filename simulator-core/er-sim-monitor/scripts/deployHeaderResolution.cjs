#!/usr/bin/env node

/**
 * Deploy Dynamic Header Resolution System to Production
 *
 * Adds header caching and dynamic column resolution to:
 * - refreshHeaders() - Cache Tier2 headers from Master Scenario Convert
 * - getColumnIndexByHeader_() - Resolve single column dynamically
 * - resolveColumnIndices_() - Batch resolve multiple columns
 * - Updates existing functions to use dynamic resolution
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const PROD_SCRIPT_ID = '1Bkbm2MNA-YmXQEoMsIlC-VgEgHiQHO2EuMXR-yyxy9lYWl3eNcEHk_S-';

// The new helper functions to add
const HEADER_RESOLUTION_FUNCTIONS = `

// ========== DYNAMIC HEADER RESOLUTION HELPERS ==========

/**
 * Get column index by Tier2 header name from cached mappings
 * Falls back to hardcoded index if cache unavailable
 * @param {string} tier2Name - The Tier2 header name to find
 * @param {number} fallbackIndex - Fallback column index if not found
 * @returns {number} Column index (0-based)
 */
function getColumnIndexByHeader_(tier2Name, fallbackIndex) {
  try {
    const cachedHeader2 = getProp('CACHED_HEADER2');

    if (cachedHeader2) {
      const headers = JSON.parse(cachedHeader2);
      const index = headers.indexOf(tier2Name);

      if (index !== -1) {
        if (index !== fallbackIndex) {
          Logger.log(\`🔄 Column "\${tier2Name}" moved: \${fallbackIndex} → \${index}\`);
        }
        return index;
      } else {
        Logger.log(\`⚠️  Column "\${tier2Name}" not found in cache, using fallback \${fallbackIndex}\`);
      }
    } else {
      Logger.log(\`⚠️  No cached headers, using fallback index for "\${tier2Name}"\`);
    }
  } catch (e) {
    Logger.log('⚠️  Could not read cached headers: ' + e.message);
  }

  return fallbackIndex;
}

/**
 * Resolve multiple column indices at once using cached headers
 * @param {Object} fieldMap - Map of field names to {name: tier2Name, fallback: index}
 * @returns {Object} Map of field names to resolved column indices
 */
function resolveColumnIndices_(fieldMap) {
  const resolved = {};

  Object.keys(fieldMap).forEach(function(fieldName) {
    const field = fieldMap[fieldName];
    resolved[fieldName] = getColumnIndexByHeader_(field.name, field.fallback);
  });

  Logger.log(\`📍 Resolved \${Object.keys(resolved).length} column indices\`);
  return resolved;
}

// ========== END HEADER RESOLUTION HELPERS ==========
`;

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  DEPLOY DYNAMIC HEADER RESOLUTION TO PRODUCTION');
  console.log('═══════════════════════════════════════════════════\n');

  // Load OAuth credentials
  const keyPath = path.join(__dirname, '..', 'config', 'credentials.json');
  const tokenPath = path.join(__dirname, '..', 'config', 'token.json');

  const credentials = JSON.parse(fs.readFileSync(keyPath));
  const token = JSON.parse(fs.readFileSync(tokenPath));

  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oAuth2Client });

  // Step 1: Read production code
  console.log('📖 Reading production code...');
  const response = await script.projects.getContent({ scriptId: PROD_SCRIPT_ID });

  const codeFile = response.data.files.find(f => f.name === 'Code');
  if (!codeFile) {
    console.error('❌ Code.gs not found');
    process.exit(1);
  }

  let code = codeFile.source;
  console.log(`✅ Loaded production code (${code.length} chars)\n`);

  // Step 2: Update refreshHeaders() function
  console.log('🔧 Step 1: Updating refreshHeaders() to read from Master Scenario Convert...');

  const refreshHeadersRegex = /function refreshHeaders\(\) \{[\s\S]*?\n\}/;
  const newRefreshHeaders = `function refreshHeaders() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const masterSheet = ss.getSheetByName('Master Scenario Convert');

    if (!masterSheet) {
      const ui = getSafeUi_();
      if (ui) { ui.alert('⚠️ Master Scenario Convert sheet not found'); }
      Logger.log('⚠️  Master Scenario Convert sheet not found');
      return;
    }

    // Read headers
    const tier1Row = masterSheet.getRange(1, 1, 1, masterSheet.getLastColumn()).getValues()[0];
    const tier2Row = masterSheet.getRange(2, 1, 1, masterSheet.getLastColumn()).getValues()[0];
    const mergedKeys = tier1Row.map((t1, i) => \`\${t1}:\${tier2Row[i]}\`.replace(/\\s+/g, '_'));

    // Cache in document properties (compatible with existing system)
    setProp('CACHED_HEADER1', JSON.stringify(tier1Row));
    setProp('CACHED_HEADER2', JSON.stringify(tier2Row));
    setProp('CACHED_MERGED_KEYS', JSON.stringify(mergedKeys));
    setProp('HEADER_REFRESH_TIME', new Date().toISOString());

    Logger.log(\`✅ Refreshed \${tier2Row.length} header mappings from Master Scenario Convert\`);

    const ui = getSafeUi_();
    if (ui) {
      ui.alert(\`✅ Headers refreshed!\\n\\n\${mergedKeys.length} columns cached from Master Scenario Convert.\`);
    }
  } catch (e) {
    Logger.log('⚠️  Could not refresh headers: ' + e.message);
    const ui = getSafeUi_();
    if (ui) { ui.alert('❌ Error refreshing headers: ' + e.message); }
  }
}`;

  code = code.replace(refreshHeadersRegex, newRefreshHeaders);
  console.log('✅ Updated refreshHeaders()\n');

  // Step 3: Add helper functions after refreshHeaders
  console.log('🔧 Step 2: Adding dynamic header resolution helper functions...');

  // Find where refreshHeaders ends and insert helpers
  const refreshEndRegex = /function refreshHeaders\(\) \{[\s\S]*?\n\}/;
  const match = code.match(refreshEndRegex);

  if (match) {
    const insertPosition = match.index + match[0].length;
    code = code.slice(0, insertPosition) + HEADER_RESOLUTION_FUNCTIONS + code.slice(insertPosition);
    console.log('✅ Added getColumnIndexByHeader_() and resolveColumnIndices_()\n');
  } else {
    console.error('❌ Could not find refreshHeaders() function');
    process.exit(1);
  }

  // Step 4: Update openCategoriesPathwaysPanel
  console.log('🔧 Step 3: Updating openCategoriesPathwaysPanel() to use dynamic resolution...');

  const oldPanelCode = /const categoryIdx = headers\.indexOf\('Case_Organization:Category'\);\s*const pathwayIdx = headers\.indexOf\('Case_Organization:Pathway_Name'\);\s*const sparkIdx = headers\.indexOf\('Case_Organization:Spark_Title'\);/;

  const newPanelCode = `// Resolve column indices dynamically
  const cols = resolveColumnIndices_({
    category: { name: 'Category', fallback: headers.indexOf('Case_Organization:Category') },
    pathway: { name: 'Pathway_Name', fallback: headers.indexOf('Case_Organization:Pathway_Name') },
    spark: { name: 'Spark_Title', fallback: headers.indexOf('Case_Organization:Spark_Title') }
  });

  const categoryIdx = cols.category;
  const pathwayIdx = cols.pathway;
  const sparkIdx = cols.spark;`;

  code = code.replace(oldPanelCode, newPanelCode);
  console.log('✅ Updated openCategoriesPathwaysPanel()\n');

  // Step 5: Update viewCategory_
  console.log('🔧 Step 4: Updating viewCategory_() to use dynamic resolution...');

  const oldViewCategoryCode = /function viewCategory_\(category\) \{[\s\S]*?const headers = data\[1\];\s*const categoryIdx = headers\.indexOf\('Case_Organization:Category'\);\s*const sparkIdx = headers\.indexOf\('Case_Organization:Spark_Title'\);\s*const pathwayIdx = headers\.indexOf\('Case_Organization:Pathway_Name'\);/;

  const newViewCategoryCode = `function viewCategory_(category) {
  const sheet = pickMasterSheet_();
  const data = sheet.getDataRange().getValues();
  const headers = data[1];

  // Resolve column indices dynamically
  const cols = resolveColumnIndices_({
    category: { name: 'Category', fallback: headers.indexOf('Case_Organization:Category') },
    spark: { name: 'Spark_Title', fallback: headers.indexOf('Case_Organization:Spark_Title') },
    pathway: { name: 'Pathway_Name', fallback: headers.indexOf('Case_Organization:Pathway_Name') }
  });

  const categoryIdx = cols.category;
  const sparkIdx = cols.spark;
  const pathwayIdx = cols.pathway;`;

  code = code.replace(oldViewCategoryCode, newViewCategoryCode);
  console.log('✅ Updated viewCategory_()\n');

  // Step 6: Deploy
  console.log('💾 Deploying updated code to production...');

  const updatedFiles = response.data.files.map(file => {
    if (file.name === 'Code') {
      return {
        name: file.name,
        type: file.type,
        source: code
      };
    }
    return file;
  });

  await script.projects.updateContent({
    scriptId: PROD_SCRIPT_ID,
    requestBody: {
      files: updatedFiles
    }
  });

  console.log('✅ Deployment complete!\n');

  console.log('═══════════════════════════════════════════════════');
  console.log('                   📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════');
  console.log('  ✅ Updated refreshHeaders() to read from Master Scenario Convert');
  console.log('  ✅ Added getColumnIndexByHeader_() helper function');
  console.log('  ✅ Added resolveColumnIndices_() helper function');
  console.log('  ✅ Updated openCategoriesPathwaysPanel() to use dynamic resolution');
  console.log('  ✅ Updated viewCategory_() to use dynamic resolution');
  console.log('');
  console.log('🎯 NEXT STEPS:');
  console.log('  1. Open production spreadsheet');
  console.log('  2. Click: Sim Builder → 🔁 Refresh Headers');
  console.log('  3. System caches Master Scenario Convert header mappings');
  console.log('  4. All functions now use dynamic column resolution!');
  console.log('═══════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('\n❌ Deployment failed:', err.message);
  if (err.response && err.response.data) {
    console.error('Details:', JSON.stringify(err.response.data, null, 2));
  }
  process.exit(1);
});
