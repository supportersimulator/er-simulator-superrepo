#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function checkLogicTypeData() {
  try {
    const credPath = path.join(__dirname, '../config/credentials.json');
    const tokenPath = path.join(__dirname, '../config/token.json');

    const credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    oAuth2Client.setCredentials(token);

    const script = google.script({ version: 'v1', auth: oAuth2Client });
    const scriptId = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

    console.log('🔍 CHECKING LOGIC TYPE DATA SOURCE\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const content = await script.projects.getContent({ scriptId });
    const discoveryUIFile = content.data.files.find(f => f.name === 'Phase2_Pathway_Discovery_UI');

    // Find getLogicTypesForDropdown function
    const funcStart = discoveryUIFile.source.indexOf('function getLogicTypesForDropdown()');
    if (funcStart === -1) {
      throw new Error('getLogicTypesForDropdown() not found!');
    }

    const funcEnd = discoveryUIFile.source.indexOf('\n}', funcStart) + 2;
    const funcCode = discoveryUIFile.source.substring(funcStart, funcEnd);

    console.log('📄 getLogicTypesForDropdown() FUNCTION:\n');
    console.log(funcCode);
    console.log('\n═══════════════════════════════════════════════════════════════\n');

    // Check what sheet it's reading from
    const readsFromSheet = funcCode.includes('Logic_Type_Library');
    console.log('📋 CHECKS:\n');
    console.log('   ' + (readsFromSheet ? '✅' : '❌') + ' Reads from Logic_Type_Library sheet');

    // Check if it sorts by usage
    const sortsByUsage = funcCode.includes('Times_Used') || funcCode.includes('timesUsed');
    console.log('   ' + (sortsByUsage ? '✅' : '❌') + ' Sorts by usage frequency\n');

    console.log('💡 POTENTIAL ISSUES:\n');
    console.log('1. Logic_Type_Library sheet might not exist');
    console.log('2. Logic_Type_Library sheet might be empty');
    console.log('3. Sheet might not have the expected column structure\n');
    console.log('Next: Check if Logic_Type_Library sheet exists in your Google Sheet\n');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkLogicTypeData();
