#!/usr/bin/env node

/**
 * Check what code is currently deployed on TEST CSV
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

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

async function check() {
  console.log('\n🔍 CHECKING TEST CSV CURRENT CODE\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('TEST Spreadsheet: TEST_Convert_Master_Sim_CSV_Template_with_Input');
  console.log(`Script ID: ${TEST_SCRIPT_ID}\n`);

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });

    console.log('📋 Files in project:\n');
    project.data.files.forEach(f => {
      console.log(`   • ${f.name} (${f.type})`);
    });
    console.log('');

    const codeFile = project.data.files.find(f => f.name === 'Code');

    if (!codeFile) {
      console.log('❌ No Code file found!\n');
      return;
    }

    const code = codeFile.source;
    const size = Math.round(code.length / 1024);

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 CODE ANALYSIS:\n');
    console.log(`   Size: ${size} KB\n`);

    // Check for menus
    console.log('🎨 MENUS:\n');

    const testToolsMenu = code.includes('TEST Tools');
    const simBuilderMenu = code.includes('Sim Builder');

    if (testToolsMenu) {
      console.log('   ✅ 🧪 TEST Tools menu');
      // Extract menu items
      const menuMatch = code.match(/createMenu\(['"]🧪 TEST Tools['"]\)([\s\S]*?)\.addToUi\(\)/);
      if (menuMatch) {
        const items = menuMatch[1].match(/addItem\(['"]([^'"]+)['"]/g);
        if (items) {
          items.forEach(item => {
            const name = item.match(/addItem\(['"]([^'"]+)['"]/)[1];
            console.log(`      - ${name}`);
          });
        }
      }
    } else {
      console.log('   ❌ 🧪 TEST Tools menu');
    }

    if (simBuilderMenu) {
      console.log('   ⚠️  🧠 Sim Builder menu (production menu, not for testing)');
    }

    console.log('\n🔧 FEATURES:\n');

    // Check for ATSR
    const hasATSR = code.includes('runATSRTitleGenerator');
    const hasATSRFunction = code.includes('function runATSRTitleGenerator');
    console.log(`   ${hasATSR ? '✅' : '❌'} ATSR Title Optimizer`);
    if (hasATSR && hasATSRFunction) {
      console.log('      Function definition found');
    }

    // Check for Categories & Pathways
    const hasCategories = code.includes('Categories') || code.includes('categories');
    const hasPathways = code.includes('Pathways') || code.includes('pathways');
    const hasPathwayChainBuilder = code.includes('runPathwayChainBuilder');

    console.log(`   ${hasCategories ? '✅' : '❌'} Categories feature`);
    console.log(`   ${hasPathways ? '✅' : '❌'} Pathways feature`);
    console.log(`   ${hasPathwayChainBuilder ? '✅' : '❌'} Pathway Chain Builder`);

    // Check for onOpen
    const hasOnOpen = code.includes('function onOpen()');
    console.log(`\n   ${hasOnOpen ? '✅' : '❌'} onOpen() function`);

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📝 SUMMARY:\n');

    if (testToolsMenu && hasATSR && hasPathwayChainBuilder) {
      console.log('✅ TEST CSV HAS ALL EXPECTED FEATURES!\n');
      console.log('   🧪 TEST Tools menu with:');
      console.log('      - ATSR Titles Optimizer (v2)');
      console.log('      - Pathway Chain Builder\n');
      console.log('🎉 You should see the TEST Tools menu when you refresh the spreadsheet!\n');
    } else {
      console.log('⚠️  MISSING SOME FEATURES:\n');
      if (!testToolsMenu) console.log('   ❌ TEST Tools menu not found');
      if (!hasATSR) console.log('   ❌ ATSR Title Optimizer not found');
      if (!hasPathwayChainBuilder) console.log('   ❌ Pathway Chain Builder not found');
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');
    if (e.stack) {
      console.log(e.stack);
    }
  }
}

check().catch(console.error);
