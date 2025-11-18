#!/usr/bin/env node

/**
 * ADD THE TWO MISSING PIECES
 *
 * Current production has EVERYTHING except:
 * 1. getRecommendedFields() - OpenAI implementation (copy from Phase2.gs)
 * 2. Live Log HTML panel - <div id="log">
 *
 * This adds both pieces surgically.
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

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

    console.log('📥 Downloading current production...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('🔧 PIECE 1: Adding getRecommendedFields() from Phase2.gs...\n');

    // Read getRecommendedFields_ from Phase2.gs
    const phase2Path = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs');
    const phase2Code = fs.readFileSync(phase2Path, 'utf8');

    // Extract getRecommendedFields_() function (lines 7-109 based on earlier read)
    const funcStart = phase2Code.indexOf('function getRecommendedFields_() {');
    const funcEnd = phase2Code.indexOf('\nfunction ', funcStart + 10);
    let getRecommendedFieldsCode = phase2Code.substring(funcStart, funcEnd).trim();

    // Remove trailing underscore to make it PUBLIC
    let publicVersion = getRecommendedFieldsCode.replace('function getRecommendedFields_()', 'function getRecommendedFields(availableFields, selectedFields)');

    // Remove the internal calls to getAvailableFields() and loadFieldSelection() since we're passing them as parameters
    publicVersion = publicVersion.replace('const availableFields = getAvailableFields();', '// availableFields passed as parameter');
    publicVersion = publicVersion.replace('const currentlySelected = loadFieldSelection();', 'const currentlySelected = selectedFields;');

    // Find insertion point - after getAIRecommendations
    const insertAfter = code.indexOf('function getAIRecommendations(');
    const afterFuncEnd = code.indexOf('\nfunction ', insertAfter + 10);

    code = code.substring(0, afterFuncEnd) + '\n\n' + publicVersion + code.substring(afterFuncEnd);

    console.log('✅ Added getRecommendedFields()\n');

    console.log('🔧 PIECE 2: Adding Live Log HTML panel...\n');

    // Find </body> tag in showFieldSelector
    const showFieldStart = code.indexOf('function showFieldSelector() {');
    const bodyEnd = code.indexOf("'</body>' +", showFieldStart);

    if (bodyEnd === -1) {
      console.log('❌ Could not find </body> tag\n');
      process.exit(1);
    }

    // Insert Live Log panel before </body>
    const liveLogPanel = `'<div id="log" style="' +
      'position: fixed;' +
      'bottom: 0;' +
      'left: 0;' +
      'right: 0;' +
      'background: #1e1e1e;' +
      'color: #00ff00;' +
      'padding: 15px;' +
      'max-height: 200px;' +
      'overflow-y: auto;' +
      'border-top: 3px solid #00ff00;' +
      'font-family: \\"Courier New\\", monospace;' +
      'font-size: 12px;' +
      'white-space: pre-wrap;' +
      'z-index: 9999;' +
      '"></div>' +
      `;

    code = code.substring(0, bodyEnd) + liveLogPanel + code.substring(bodyEnd);

    console.log('✅ Added Live Log panel\n');

    console.log('📤 Deploying...\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: {
        files: [
          { name: 'Code', type: 'SERVER_JS', source: code },
          manifestFile
        ]
      }
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ COMPLETE! BOTH MISSING PIECES ADDED!\n');
    console.log('\nWhat was added:\n');
    console.log('  1. ✅ getRecommendedFields() - OpenAI API implementation');
    console.log('  2. ✅ Live Log HTML panel - <div id="log">\n');
    console.log('The complete workflow is now ready:\n');
    console.log('  1. Refresh Google Sheet (F5)');
    console.log('  2. Click 🧠 Sim Builder → 🧩 Categories & Pathways');
    console.log('  3. Click cache button');
    console.log('  4. Modal opens INSTANTLY with rough draft (3 sections)');
    console.log('  5. Live Log shows: "Calling OpenAI API..."');
    console.log('  6. When AI responds → Modal updates with recommendations');
    console.log('  7. ✓✓ appears next to fields where AI agrees with defaults');
    console.log('  8. User adjusts, clicks Continue to Cache\n');
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
