#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

async function checkAllMenusBeforeChange() {
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const tokenPath = path.join(__dirname, '../config/token.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oAuth2Client });
  const PROJECT_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf';

  console.log('\n🔍 CHECKING ALL MENUS & FUNCTIONS BEFORE MAKING CHANGES\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const content = await script.projects.getContent({ scriptId: PROJECT_ID });
  const files = content.data.files.filter(f => f.type === 'SERVER_JS');

  console.log('📋 ALL FILES IN PROJECT:\n');
  files.forEach((file, i) => {
    console.log(`   ${i + 1}. ${file.name}.gs (${(file.source.length / 1024).toFixed(1)} KB)`);
  });

  console.log('\n═══════════════════════════════════════════════════════════════\n');
  console.log('📄 CHECKING EACH FILE FOR MENUS & CRITICAL FUNCTIONS:\n');

  files.forEach(file => {
    console.log(`\n📄 ${file.name}.gs\n`);

    // Check for onOpen function
    if (file.source.includes('function onOpen()')) {
      console.log('   ✅ Has onOpen() function');
    }

    // Check for other menu-related functions
    const menuFunctions = [
      'onInstall',
      'createMenu',
      '.createMenu(',
      '.addItem(',
      '.addSubMenu(',
      '.addSeparator()'
    ];

    menuFunctions.forEach(pattern => {
      if (file.source.includes(pattern)) {
        console.log(`   📌 Contains: ${pattern}`);
      }
    });

    // Check for ATSR functions
    const atsrFunctions = [
      'runATSRTitleGenerator',
      'generateMysteriousSparkTitles',
      'saveATSRData'
    ];

    const hasATSR = atsrFunctions.some(fn => file.source.includes(`function ${fn}`));
    if (hasATSR) {
      console.log('   🎨 Contains ATSR functions');
    }

    // Check for Pathways functions
    const pathwaysFunctions = [
      'runPathwayChainBuilder',
      'showFieldSelector',
      'preCacheRichData'
    ];

    const hasPathways = pathwaysFunctions.some(fn => file.source.includes(`function ${fn}`));
    if (hasPathways) {
      console.log('   🧩 Contains Pathways functions');
    }
  });

  console.log('\n═══════════════════════════════════════════════════════════════\n');
  console.log('🎯 WHAT WE WILL DO:\n');
  console.log('✅ KEEP: onOpen() in Code.gs (unchanged)');
  console.log('❌ REMOVE: onOpen() ONLY from ATSR_Title_Generator_Feature.gs');
  console.log('✅ KEEP: ALL other functions in ATSR_Title_Generator_Feature.gs');
  console.log('✅ KEEP: ALL other files unchanged\n');
  console.log('⚠️  SAFETY CHECK: Removing ONLY onOpen() function, nothing else!\n');
}

checkAllMenusBeforeChange().catch(console.error);
