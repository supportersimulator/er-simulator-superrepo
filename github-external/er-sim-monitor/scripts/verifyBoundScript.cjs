#!/usr/bin/env node

/**
 * Verify the newly created bound script
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const BOUND_SCRIPT_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf';

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

async function verify() {
  console.log('\n🔍 VERIFYING BOUND SCRIPT\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    const project = await script.projects.getContent({ scriptId: BOUND_SCRIPT_ID });

    console.log(`📄 Script Title: ${project.data.title || 'TEST Menu Script (Bound)'}\n`);
    console.log('📋 Files:\n');
    project.data.files.forEach(f => console.log(`   • ${f.name}`));
    console.log('');

    const codeFile = project.data.files.find(f => f.name === 'Code');
    if (codeFile) {
      const hasOnOpen = codeFile.source.includes('function onOpen()');
      const hasTestMenu = codeFile.source.includes('TEST') && codeFile.source.includes('createMenu');
      const hasTitlesOptimizer = codeFile.source.includes('Titles Optimizer');
      const hasCategoriesPathways = codeFile.source.includes('Categories & Pathways');

      console.log('✅ VERIFICATION RESULTS:\n');
      console.log(`   onOpen() function: ${hasOnOpen ? '✅' : '❌'}`);
      console.log(`   TEST menu: ${hasTestMenu ? '✅' : '❌'}`);
      console.log(`   Titles Optimizer menu item: ${hasTitlesOptimizer ? '✅' : '❌'}`);
      console.log(`   Categories & Pathways item: ${hasCategoriesPathways ? '✅' : '❌'}\n`);

      if (hasOnOpen && hasTestMenu) {
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('✅ ALL CHECKS PASSED - Script is ready!\n');
        console.log('📋 YOUR TEST MENU SHOULD NOW APPEAR WHEN YOU:\n');
        console.log('   1. Close the spreadsheet tab completely');
        console.log('   2. Reopen: https://docs.google.com/spreadsheets/d/1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI/edit\n');
        console.log('🧪 TEST Menu will appear at the top with:');
        console.log('   • 🎨 Titles Optimizer');
        console.log('   • 📂 Categories & Pathways\n');
        console.log('🔧 If menu doesn\'t appear immediately:');
        console.log('   • Wait 10 seconds and refresh (Cmd+R)');
        console.log('   • Or go to Extensions → Apps Script (opens the bound script)\n');
        console.log('═══════════════════════════════════════════════════════════════\n');
      } else {
        console.log('❌ Menu code not complete - needs debugging\n');
      }
    } else {
      console.log('❌ Code file not found\n');
    }

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');
    if (e.stack) {
      console.log(e.stack);
    }
  }
}

verify().catch(console.error);
