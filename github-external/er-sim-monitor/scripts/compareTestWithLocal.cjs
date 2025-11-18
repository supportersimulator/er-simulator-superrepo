#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TEST_SCRIPT_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf';

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

async function compare() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('\n🔍 COMPARING TEST vs LOCAL ATSR FILE\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Get deployed version
    const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });
    const deployedFile = project.data.files.find(f => f.name === 'ATSR_Title_Generator_Feature');

    if (!deployedFile) {
      console.log('❌ ATSR_Title_Generator_Feature.gs NOT FOUND in TEST!\n');
      return;
    }

    // Get local version
    const localPath = path.join(__dirname, '../apps-script-deployable/ATSR_Title_Generator_Feature.gs');
    const localContent = fs.readFileSync(localPath, 'utf8');

    console.log('📊 Size comparison:\n');
    console.log(`   Deployed: ${Math.round(deployedFile.source.length / 1024)} KB`);
    console.log(`   Local:    ${Math.round(localContent.length / 1024)} KB\n`);

    // Check for onOpen function
    const deployedHasOnOpen = deployedFile.source.includes('function onOpen()');
    const localHasOnOpen = localContent.includes('function onOpen()');

    console.log('🔍 onOpen() function:\n');
    console.log(`   Deployed: ${deployedHasOnOpen ? '✅ Found' : '❌ Missing'}`);
    console.log(`   Local:    ${localHasOnOpen ? '✅ Found' : '❌ Missing'}\n`);

    // Check for TEST Tools menu
    const deployedHasMenu = deployedFile.source.includes('TEST Tools');
    const localHasMenu = localContent.includes('TEST Tools');

    console.log('🔍 TEST Tools menu:\n');
    console.log(`   Deployed: ${deployedHasMenu ? '✅ Found' : '❌ Missing'}`);
    console.log(`   Local:    ${localHasMenu ? '✅ Found' : '❌ Missing'}\n`);

    // Extract onOpen function from both
    if (deployedHasOnOpen && localHasOnOpen) {
      const deployedOnOpenMatch = deployedFile.source.match(/function onOpen\(\) \{[\s\S]*?(?=\nfunction|$)/);
      const localOnOpenMatch = localContent.match(/function onOpen\(\) \{[\s\S]*?(?=\nfunction|$)/);

      if (deployedOnOpenMatch && localOnOpenMatch) {
        const same = deployedOnOpenMatch[0] === localOnOpenMatch[0];
        console.log(`🔍 onOpen() function content: ${same ? '✅ IDENTICAL' : '❌ DIFFERENT'}\n`);

        if (!same) {
          console.log('Deployed onOpen() preview (first 500 chars):\n');
          console.log(deployedOnOpenMatch[0].substring(0, 500) + '...\n');
          console.log('Local onOpen() preview (first 500 chars):\n');
          console.log(localOnOpenMatch[0].substring(0, 500) + '...\n');
        }
      }
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

    if (!deployedHasOnOpen || !deployedHasMenu) {
      console.log('⚠️  PROBLEM FOUND!\n');
      console.log('The deployed ATSR file is missing onOpen() or TEST Tools menu.\n');
      console.log('This explains why the menu doesn\'t appear.\n');
      console.log('Solution: Redeploy ATSR file from local version.\n');
    } else if (deployedHasOnOpen && deployedHasMenu) {
      console.log('✅ Deployed file HAS onOpen() and TEST Tools menu!\n');
      console.log('If menu still not showing, try:\n');
      console.log('   1. Close and reopen the spreadsheet');
      console.log('   2. Clear browser cache');
      console.log('   3. Wait 30 seconds for Apps Script to initialize\n');
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

compare();
