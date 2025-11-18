#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function checkDiscoveryPrerequisites() {
  try {
    console.log('🔍 CHECKING DISCOVERY PREREQUISITES\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const credPath = path.join(__dirname, '../config/credentials.json');
    const tokenPath = path.join(__dirname, '../config/token.json');

    const credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    oAuth2Client.setCredentials(token);

    const script = google.script({ version: 'v1', auth: oAuth2Client });
    const scriptId = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

    const content = await script.projects.getContent({ scriptId });
    
    // Check Phase2_Pathway_Discovery_UI.gs for the server-side function
    const discoveryFile = content.data.files.find(f => f.name === 'Phase2_Pathway_Discovery_UI');
    
    if (!discoveryFile) {
      console.log('❌ Phase2_Pathway_Discovery_UI.gs not found\n');
      return;
    }

    // Find discoverPathwaysWithLogicType function
    const funcStart = discoveryFile.source.indexOf('function discoverPathwaysWithLogicType(');
    if (funcStart === -1) {
      console.log('❌ discoverPathwaysWithLogicType() function not found\n');
      return;
    }

    const funcEnd = discoveryFile.source.indexOf('\n}\n', funcStart) + 3;
    const funcCode = discoveryFile.source.substring(funcStart, funcEnd);

    console.log('📄 discoverPathwaysWithLogicType() FUNCTION:\n');
    console.log(funcCode);
    console.log('\n');

    // Check what it requires
    console.log('🔍 PREREQUISITES CHECK:\n');
    
    const checks = [
      { name: 'Needs API Key', found: funcCode.includes('getApiKey') || funcCode.includes('API') },
      { name: 'Needs Logic_Type_Library sheet', found: funcCode.includes('Logic_Type_Library') },
      { name: 'Needs Pathways_Master sheet', found: funcCode.includes('Pathways_Master') },
      { name: 'Needs Field_Cache_Incremental', found: funcCode.includes('Field_Cache_Incremental') },
      { name: 'Calls OpenAI', found: funcCode.includes('OpenAI') || funcCode.includes('callOpenAI') }
    ];

    checks.forEach(check => {
      console.log(`   ${check.found ? '✅' : '❌'} ${check.name}`);
    });

    console.log('\n');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkDiscoveryPrerequisites();
