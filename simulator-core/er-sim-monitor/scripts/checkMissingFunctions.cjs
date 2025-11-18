#!/usr/bin/env node

/**
 * CHECK FOR MISSING FUNCTIONS IN PRODUCTION
 * Compare with the original Categories & Pathways file
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🔍 CHECKING FOR MISSING FUNCTIONS\n');
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

async function checkMissing() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log(`📦 Production Project: ${PRODUCTION_PROJECT_ID}\n`);

    // Download production code
    console.log('📥 Downloading production code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');

    if (!codeFile) {
      console.log('❌ No Code file found!\n');
      return;
    }

    const prodCode = codeFile.source;

    // Load the original Categories & Pathways Phase2 file
    const phase2Path = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs');

    if (!fs.existsSync(phase2Path)) {
      console.log('❌ Categories_Pathways_Feature_Phase2.gs not found!\n');
      return;
    }

    const phase2Code = fs.readFileSync(phase2Path, 'utf8');

    console.log('📊 Comparing function lists...\n');

    // Extract function names from both
    const prodFunctions = [...prodCode.matchAll(/^function\s+(\w+)/gm)].map(m => m[1]);
    const phase2Functions = [...phase2Code.matchAll(/^function\s+(\w+)/gm)].map(m => m[1]);

    console.log(`Production functions: ${prodFunctions.length}`);
    console.log(`Phase2 functions: ${phase2Functions.length}\n`);

    // Find missing functions
    const missingFunctions = phase2Functions.filter(f => !prodFunctions.includes(f));

    console.log('═══════════════════════════════════════════════════════════════\n');

    if (missingFunctions.length === 0) {
      console.log('✅ No missing functions - all Phase2 functions are present!\n');
    } else {
      console.log(`❌ MISSING ${missingFunctions.length} FUNCTIONS:\n`);
      missingFunctions.forEach((func, i) => {
        console.log(`   ${i + 1}. ${func}`);
      });
      console.log('\n');
    }

    // Check specifically for the one mentioned
    const hasRunCategoriesPathwaysPanel = prodCode.includes('function runCategoriesPathwaysPanel(');
    console.log(`🔍 runCategoriesPathwaysPanel: ${hasRunCategoriesPathwaysPanel ? '✅ PRESENT' : '❌ MISSING'}\n`);

    if (missingFunctions.length > 0) {
      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log('📝 SOLUTION:\n');
      console.log('I need to extract these missing functions from Phase2 and add them.\n');
      console.log('Should I proceed with adding the missing functions?\n');
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

checkMissing();
