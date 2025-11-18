#!/usr/bin/env node

/**
 * OPTIMIZE DATA PROVIDER
 * Make getFieldSelectorData_() much faster by simplifying
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🔧 OPTIMIZING DATA PROVIDER\n');
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

async function optimize() {
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

    console.log('🔧 Finding and replacing getFieldSelectorData_()...\n');

    // Find the function
    const funcStart = code.indexOf('function getFieldSelectorData_()');
    if (funcStart === -1) {
      console.log('❌ Function not found\n');
      return;
    }

    // Find its end
    let braceCount = 0;
    let inFunction = false;
    let funcEnd = funcStart;

    for (let i = funcStart; i < code.length; i++) {
      if (code[i] === '{') {
        braceCount++;
        inFunction = true;
      } else if (code[i] === '}') {
        braceCount--;
        if (inFunction && braceCount === 0) {
          funcEnd = i + 1;
          break;
        }
      }
    }

    // Replace with optimized version
    const optimizedFunction = `function getFieldSelectorData_() {
  Logger.log('📊 getFieldSelectorData_() started');

  refreshHeaders();
  Logger.log('   ✅ Headers refreshed');

  const availableFields = getAvailableFields();
  Logger.log('   ✅ Got ' + availableFields.length + ' fields');

  const selectedFields = loadFieldSelection();
  Logger.log('   ✅ Got ' + selectedFields.length + ' selected');

  const recommendedFields = getStaticRecommendedFields_(availableFields, selectedFields);
  Logger.log('   ✅ Got ' + recommendedFields.length + ' recommended');

  // Group by category - NO SORTING (do it client-side for speed)
  const grouped = {};
  for (let i = 0; i < availableFields.length; i++) {
    const field = availableFields[i];
    const category = field.tier1;
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push(field);
  }

  Logger.log('   ✅ Grouped into ' + Object.keys(grouped).length + ' categories');
  Logger.log('📊 getFieldSelectorData_() complete');

  return {
    grouped: grouped,
    selected: selectedFields,
    recommended: recommendedFields
  };
}`;

    code = code.substring(0, funcStart) + optimizedFunction + code.substring(funcEnd);

    console.log('✅ Replaced with optimized version (removed server-side sorting)\n');

    // Backup
    const backupPath = path.join(__dirname, '../backups/production-before-optimized-data-2025-11-06.gs');
    fs.writeFileSync(backupPath, codeFile.source, 'utf8');
    console.log(`💾 Backed up\n`);

    // Deploy
    console.log('📤 Deploying...\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log(`✅ Deployment successful!\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎉 DATA PROVIDER OPTIMIZED!\n');
    console.log('Changes:\n');
    console.log('   ✅ Removed slow server-side sorting');
    console.log('   ✅ Added detailed logging');
    console.log('   ✅ Should be MUCH faster now\n');
    console.log('Try "Pre-Cache Rich Data" again - should load quickly!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

optimize();
