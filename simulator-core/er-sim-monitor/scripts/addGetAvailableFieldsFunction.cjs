#!/usr/bin/env node

/**
 * ADD MISSING getAvailableFields() FUNCTION
 * This function reads the cached headers and returns available fields for selection
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🔧 ADDING getAvailableFields() FUNCTION\n');
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

async function addFunction() {
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

    console.log('🔍 Diagnosis:\n');
    console.log('   showFieldSelector() calls getAvailableFields() but function is missing\n');
    console.log('   refreshHeaders() caches CACHED_HEADER1 and CACHED_HEADER2\n');
    console.log('   Need to create getAvailableFields() that reads cached headers\n');

    // Check if function already exists
    if (code.includes('function getAvailableFields')) {
      console.log('✅ getAvailableFields() already exists\n');
      return;
    }

    console.log('🔧 Adding getAvailableFields() function...\n');

    const getAvailableFieldsFunction = `
/**
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
}
`;

    // Find the showFieldSelector function and insert getAvailableFields before it
    const showFieldSelectorMatch = code.match(/\/\*\*\n \* Show dynamic field selector modal/);
    if (showFieldSelectorMatch) {
      const insertPos = showFieldSelectorMatch.index;
      code = code.slice(0, insertPos) + getAvailableFieldsFunction + '\n' + code.slice(insertPos);
      console.log('✅ Added getAvailableFields() before showFieldSelector()\n');
    } else {
      // Fallback: insert before first function
      const firstFunctionMatch = code.match(/^function /m);
      if (firstFunctionMatch) {
        const insertPos = firstFunctionMatch.index;
        code = code.slice(0, insertPos) + getAvailableFieldsFunction + '\n' + code.slice(insertPos);
        console.log('✅ Added getAvailableFields() at beginning\n');
      }
    }

    // Backup
    const backupPath = path.join(__dirname, '../backups/production-before-get-available-fields-2025-11-06.gs');
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
    console.log('🎉 FUNCTION ADDED!\n');
    console.log('What it does:\n');
    console.log('   1. Reads CACHED_HEADER1 and CACHED_HEADER2 from DocumentProperties\n');
    console.log('   2. Builds array of field objects with tier1, tier2, name, and header\n');
    console.log('   3. Returns available fields for field selector\n');
    console.log('\nComplete Flow:\n');
    console.log('   User clicks "Pre-Cache Rich Data" →\n');
    console.log('   preCacheRichData() called →\n');
    console.log('   showFieldSelector() called →\n');
    console.log('   refreshHeaders() caches headers (shows "642 merged keys cached") →\n');
    console.log('   getAvailableFields() reads cached headers →\n');
    console.log('   Field selector modal opens with 3 sections:\n');
    console.log('     ✅ Selected Fields (saved from last time)\n');
    console.log('     💡 Recommended Fields (AI via ChatGPT)\n');
    console.log('     📋 All Other Fields\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

addFunction();
