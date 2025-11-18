#!/usr/bin/env node

/**
 * Integrate dynamic header resolution into Categories_Pathways_Feature_Phase2
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
  console.log('\n🔧 INTEGRATING DYNAMIC HEADER RESOLUTION\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });
    const phase2File = project.data.files.find(f => f.name === 'Categories_Pathways_Feature_Phase2');

    if (!phase2File) {
      console.log('❌ Phase2 file not found\n');
      return;
    }

    let code = phase2File.source;

    // Check if already integrated
    if (code.includes('function refreshHeaders()') && code.includes('function getColumnIndexByHeader_')) {
      console.log('✅ Integration already exists\n');
      console.log('Verifying integration completeness...\n');
      
      // Still check if all functions call refreshHeaders
      const needsRefresh = [
        { fn: 'discoverNovelPathwaysWithAI_', has: code.match(/discoverNovelPathwaysWithAI_[\s\S]{0,300}refreshHeaders/) },
        { fn: 'getOrCreateHolisticAnalysis_', has: code.match(/getOrCreateHolisticAnalysis_[\s\S]{0,300}refreshHeaders/) }
      ];
      
      const missing = needsRefresh.filter(n => !n.has);
      
      if (missing.length === 0) {
        console.log('✅ All integrations complete - no changes needed\n');
        return;
      }
      
      console.log(`⚠️  ${missing.length} function(s) need refreshHeaders() call:\n`);
      missing.forEach(m => console.log(`   • ${m.fn}`));
      console.log('');
    }

    // Add helper functions at the top of the file (after any existing header comments)
    const helperFunctions = `
// ============================================================================
// DYNAMIC HEADER RESOLUTION
// ============================================================================

/**
 * Refresh header mappings from spreadsheet and cache in document properties
 * Call this before any operations that use column indices
 */
function refreshHeaders() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const masterSheet = ss.getSheetByName('Master Scenario Convert');
    
    if (!masterSheet) {
      Logger.log('⚠️  Master Scenario Convert sheet not found');
      return;
    }
    
    // Read Tier2 headers (row 2)
    const tier2Row = masterSheet.getRange(2, 1, 1, masterSheet.getLastColumn()).getValues()[0];
    
    // Cache in document properties
    const docProps = PropertiesService.getDocumentProperties();
    docProps.setProperty('CACHED_HEADER2', JSON.stringify(tier2Row));
    docProps.setProperty('HEADER_REFRESH_TIME', new Date().toISOString());
    
    Logger.log(\`✅ Refreshed \${tier2Row.length} header mappings\`);
  } catch (e) {
    Logger.log('⚠️  Could not refresh headers: ' + e.message);
  }
}

/**
 * Get column index by Tier2 header name from cached mappings
 * @param {string} tier2Name - The Tier2 header name to find
 * @param {number} fallbackIndex - Fallback column index if not found
 * @returns {number} Column index (0-based)
 */
function getColumnIndexByHeader_(tier2Name, fallbackIndex) {
  try {
    const docProps = PropertiesService.getDocumentProperties();
    const cachedHeader2 = docProps.getProperty('CACHED_HEADER2');
    
    if (cachedHeader2) {
      const headers = JSON.parse(cachedHeader2);
      const index = headers.indexOf(tier2Name);
      
      if (index !== -1) {
        if (index !== fallbackIndex) {
          Logger.log(\`🔄 Header "\${tier2Name}" moved: \${fallbackIndex} → \${index}\`);
        }
        return index;
      }
    }
  } catch (e) {
    Logger.log('⚠️  Could not read cached headers: ' + e.message);
  }
  
  return fallbackIndex;
}

/**
 * Resolve multiple column indices at once
 * @param {Object} fieldMap - Map of field names to {name: tier2Name, fallback: index}
 * @returns {Object} Map of field names to resolved column indices
 */
function resolveColumnIndices_(fieldMap) {
  const resolved = {};
  
  Object.keys(fieldMap).forEach(function(fieldName) {
    const field = fieldMap[fieldName];
    resolved[fieldName] = getColumnIndexByHeader_(field.name, field.fallback);
  });
  
  return resolved;
}

`;

    // Find a good insertion point (after initial comments, before first function)
    const firstFunctionMatch = code.match(/^function\s+\w+/m);
    
    if (firstFunctionMatch) {
      const insertPos = code.indexOf(firstFunctionMatch[0]);
      code = code.substring(0, insertPos) + helperFunctions + '\n' + code.substring(insertPos);
      console.log('✅ Added helper functions (refreshHeaders, getColumnIndexByHeader_, resolveColumnIndices_)\n');
    }

    // Add refreshHeaders() call to discovery functions
    const discoverNovelMatch = code.match(/(function discoverNovelPathwaysWithAI_\([^)]*\) \{[\s\S]*?)(Logger\.log\('🚀)/);
    
    if (discoverNovelMatch && !code.match(/discoverNovelPathwaysWithAI_[\s\S]{0,300}refreshHeaders/)) {
      const withRefresh = discoverNovelMatch[1] + '\n  // Refresh headers before analysis\n  refreshHeaders();\n  \n  ' + discoverNovelMatch[2];
      code = code.replace(discoverNovelMatch[0], withRefresh);
      console.log('✅ Added refreshHeaders() to discoverNovelPathwaysWithAI_()\n');
    }

    // Add to holistic analysis function
    const holisticMatch = code.match(/(function getOrCreateHolisticAnalysis_\([^)]*\) \{[\s\S]*?)(const ss = SpreadsheetApp\.getActiveSpreadsheet)/);
    
    if (holisticMatch && !code.match(/getOrCreateHolisticAnalysis_[\s\S]{0,300}refreshHeaders/)) {
      const withRefresh = holisticMatch[1] + '\n  // Refresh headers before analysis\n  refreshHeaders();\n  \n  ' + holisticMatch[2];
      code = code.replace(holisticMatch[0], withRefresh);
      console.log('✅ Added refreshHeaders() to getOrCreateHolisticAnalysis_()\n');
    }

    // Deploy
    phase2File.source = code;

    console.log('🚀 Deploying changes...\n');

    await script.projects.updateContent({
      scriptId: TEST_SCRIPT_ID,
      requestBody: {
        files: project.data.files
      }
    });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ INTEGRATION COMPLETE\n');
    console.log('🔄 FUNCTIONS ADDED:\n');
    console.log('   • refreshHeaders() - Caches current column mappings');
    console.log('   • getColumnIndexByHeader_() - Dynamic column lookup');
    console.log('   • resolveColumnIndices_() - Batch column resolution\n');
    console.log('🎯 FUNCTIONS UPDATED:\n');
    console.log('   • discoverNovelPathwaysWithAI_() - Calls refreshHeaders()');
    console.log('   • getOrCreateHolisticAnalysis_() - Calls refreshHeaders()\n');
    console.log('📊 VERIFICATION:\n');
    console.log('   Run: node scripts/verifyHeaderIntegration.cjs\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('\n❌ Failed: ' + e.message + '\n');
    if (e.stack) {
      console.log(e.stack);
    }
  }
}

integrate().catch(console.error);
