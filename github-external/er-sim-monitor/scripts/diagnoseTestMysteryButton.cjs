#!/usr/bin/env node

/**
 * DIAGNOSE MYSTERY BUTTON IN TEST ENVIRONMENT
 * Downloads test code and examines why mystery button isn't showing
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TEST_PROJECT_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf';

console.log('\n🔍 DIAGNOSING MYSTERY BUTTON IN TEST ENVIRONMENT\n');
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

async function diagnose() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log(`🎯 TEST Project ID: ${TEST_PROJECT_ID}\n`);
    console.log('📥 Downloading current test code...\n');

    const project = await script.projects.getContent({
      scriptId: TEST_PROJECT_ID
    });

    const codeFile = project.data.files.find(f => f.name === 'Code');
    if (!codeFile) {
      throw new Error('Could not find Code.gs file');
    }

    const code = codeFile.source;
    console.log(`✅ Downloaded: ${(code.length / 1024).toFixed(1)} KB\n`);

    // Save for examination
    const savePath = path.join(__dirname, '../backups/test-current-diagnosis-2025-11-06.gs');
    fs.writeFileSync(savePath, code, 'utf8');
    console.log(`💾 Saved: ${savePath}\n`);

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🔍 DIAGNOSTIC CHECKS:\n');

    // Check 1: Mystery button HTML
    const hasMysteryHTML = code.includes('Make More Mysterious');
    console.log(`${hasMysteryHTML ? '✅' : '❌'} 1. Mystery button HTML present: ${hasMysteryHTML}`);
    if (hasMysteryHTML) {
      const lines = code.split('\n');
      lines.forEach((line, i) => {
        if (line.includes('Make More Mysterious')) {
          console.log(`      Found at line ${i + 1}: ${line.trim().substring(0, 60)}...`);
        }
      });
    }

    // Check 2: showMysteryButton parameter
    const hasShowParam = code.includes('showMysteryButton');
    console.log(`\n${hasShowParam ? '✅' : '❌'} 2. showMysteryButton parameter exists: ${hasShowParam}`);
    if (hasShowParam) {
      const regex = /makeEditable\([^)]*Spark[^)]*true\)/g;
      const sparkWithButton = regex.test(code);
      console.log(`   ${sparkWithButton ? '✅' : '❌'} Parameter set to TRUE for Spark Titles: ${sparkWithButton}`);
    }

    // Check 3: regenerateMoreMysterious function
    const hasRegenFunc = code.includes('function regenerateMoreMysterious');
    console.log(`\n${hasRegenFunc ? '✅' : '❌'} 3. regenerateMoreMysterious() function: ${hasRegenFunc}`);

    // Check 4: generateMysteriousSparkTitles function
    const hasMysteriousFunc = code.includes('function generateMysteriousSparkTitles');
    console.log(`${hasMysteriousFunc ? '✅' : '❌'} 4. generateMysteriousSparkTitles() function: ${hasMysteriousFunc}`);

    // Check 5: buildATSRUltimateUI_ function
    const hasBuildUI = code.includes('function buildATSRUltimateUI_');
    console.log(`${hasBuildUI ? '✅' : '❌'} 5. buildATSRUltimateUI_() function: ${hasBuildUI}`);

    // Check 6: runATSRTitleGenerator function
    const runATSRMatches = code.match(/function runATSRTitleGenerator/g);
    const runATSRCount = runATSRMatches ? runATSRMatches.length : 0;
    console.log(`\n${runATSRCount === 1 ? '✅' : '❌'} 6. runATSRTitleGenerator functions: ${runATSRCount}`);
    if (runATSRCount > 1) {
      console.log(`   ⚠️  DUPLICATE FOUND! Multiple ATSR implementations detected.`);
    }

    // Check 7: Menu item
    const hasMenuUpdated = code.includes('ATSR Titles Optimizer') || code.includes('Title Optimizer');
    console.log(`\n${hasMenuUpdated ? '✅' : '❌'} 7. Menu updated to "Titles Optimizer": ${hasMenuUpdated}`);

    // Check 8: Look for commented code
    const hasCommentedMystery = /\/\/.*Make More Mysterious/.test(code) || /\/\*[\s\S]*?Make More Mysterious[\s\S]*?\*\//.test(code);
    console.log(`${!hasCommentedMystery ? '✅' : '❌'} 8. Mystery button NOT commented out: ${!hasCommentedMystery}`);

    console.log('\n═══════════════════════════════════════════════════════════════\n');
    console.log('📊 DIAGNOSIS SUMMARY:\n');

    if (hasMysteryHTML && hasShowParam && hasRegenFunc && hasMysteriousFunc && runATSRCount === 1) {
      console.log('✅ ALL CHECKS PASSED - Code is correct!\n');
      console.log('🔍 LIKELY CAUSES:\n');
      console.log('   1. Browser cache - Hard refresh needed (Cmd+Shift+R)');
      console.log('   2. Apps Script not reloaded - Close/reopen spreadsheet');
      console.log('   3. Wrong browser session - Try incognito mode\n');
    } else {
      console.log('❌ CODE ISSUES DETECTED:\n');
      if (!hasMysteryHTML) console.log('   • Mystery button HTML is missing');
      if (!hasShowParam) console.log('   • showMysteryButton parameter not found');
      if (!hasRegenFunc) console.log('   • regenerateMoreMysterious() function missing');
      if (!hasMysteriousFunc) console.log('   • generateMysteriousSparkTitles() function missing');
      if (runATSRCount !== 1) console.log(`   • Wrong number of ATSR functions: ${runATSRCount} (should be 1)`);
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

diagnose();
