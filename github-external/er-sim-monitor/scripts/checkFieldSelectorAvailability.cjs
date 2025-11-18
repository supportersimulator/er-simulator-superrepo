#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

async function checkFieldSelectorAvailability() {
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const tokenPath = path.join(__dirname, '../config/token.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oAuth2Client });
  const PROJECT_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf';

  console.log('\n🔍 CHECKING FIELD SELECTOR AVAILABILITY\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const content = await script.projects.getContent({ scriptId: PROJECT_ID });
  const pathwaysFile = content.data.files.find(f => f.name === 'Categories_Pathways_Feature_Phase2');

  if (!pathwaysFile) {
    console.log('❌ Categories_Pathways_Feature_Phase2 file not found!');
    return;
  }

  console.log('📄 Found: Categories_Pathways_Feature_Phase2.gs\n');

  // Find all public functions (non-private)
  const functionRegex = /^function\s+(\w+)\s*\(/gm;
  const matches = [...pathwaysFile.source.matchAll(functionRegex)];

  console.log('📋 PUBLIC FUNCTIONS (callable from menu):\n');

  const publicFunctions = matches
    .map(m => m[1])
    .filter(name => !name.endsWith('_')); // Filter out private functions

  publicFunctions.forEach((fnName, i) => {
    console.log(`   ${i + 1}. ${fnName}()`);
  });

  console.log('\n═══════════════════════════════════════════════════════════════\n');
  console.log('💡 KEY FUNCTIONS FOR MENU:\n');

  const keyFunctions = [
    'showFieldSelector',
    'preCacheRichData',
    'runPathwayChainBuilder'
  ];

  keyFunctions.forEach(fnName => {
    if (publicFunctions.includes(fnName)) {
      console.log(`   ✅ ${fnName}() - Available`);
    } else {
      console.log(`   ❌ ${fnName}() - Missing`);
    }
  });

  console.log('\n═══════════════════════════════════════════════════════════════\n');
  console.log('🎯 CURRENT MENU (from Code.gs onOpen):\n');
  console.log('🧪 TEST Tools');
  console.log('├── 🎨 ATSR Titles Optimizer (v2) → runATSRTitleGenerator()');
  console.log('└── 🧩 Pathway Chain Builder → runPathwayChainBuilder()\n');

  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('🎯 PROPOSED ENHANCED MENU:\n');
  console.log('🧪 TEST Tools');
  console.log('├── 🎨 ATSR Titles Optimizer (v2) → runATSRTitleGenerator()');
  console.log('├── 📝 Field Selector (27 headers) → showFieldSelector()');
  console.log('├── 💾 Pre-Cache Pathway Data → preCacheRichData()');
  console.log('└── 🧩 Pathway Chain Builder → runPathwayChainBuilder()\n');
}

checkFieldSelectorAvailability().catch(console.error);
