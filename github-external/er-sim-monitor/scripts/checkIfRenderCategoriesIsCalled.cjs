#!/usr/bin/env node

/**
 * CHECK IF renderCategories() IS ACTUALLY IN THE HTML
 * Download current code and verify the HTML template structure
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🔍 CHECKING HTML TEMPLATE\n');
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

async function check() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading production code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const code = codeFile.source;

    // Find the showFieldSelector function
    const funcStart = code.indexOf('function showFieldSelector()');
    if (funcStart === -1) {
      console.log('❌ showFieldSelector() not found!\n');
      return;
    }

    // Find where HTML is built
    const htmlStart = code.indexOf('const html =', funcStart);
    if (htmlStart === -1) {
      console.log('❌ HTML construction not found!\n');
      return;
    }

    // Extract the HTML template (until showModalDialog)
    const htmlEnd = code.indexOf('showModalDialog', htmlStart);
    const htmlSection = code.substring(htmlStart, htmlEnd);

    // Check for key components
    console.log('📋 HTML Template Analysis:\n');

    const checks = [
      { name: 'Has <script> tag', pattern: /<script>/ },
      { name: 'Has </script> tag', pattern: /<\/script>/ },
      { name: 'Has renderCategories function', pattern: /function renderCategories\(\)/ },
      { name: 'Has renderCategories() call', pattern: /renderCategories\(\);/ },
      { name: 'Has categoriesData variable', pattern: /const categoriesData =/ },
      { name: 'Has selectedFields variable', pattern: /const selectedFields =/ },
      { name: 'Has recommendedFieldNames variable', pattern: /const recommendedFieldNames =/ },
      { name: 'Has categories container div', pattern: /id="categories"/ },
      { name: 'Has updateCount function', pattern: /function updateCount\(\)/ },
      { name: 'Has continueToCache function', pattern: /function continueToCache\(\)/ }
    ];

    checks.forEach(check => {
      const found = check.pattern.test(htmlSection);
      console.log(`   ${found ? '✅' : '❌'} ${check.name}`);
    });

    // Find and display the renderCategories() call location
    const renderCallMatch = htmlSection.match(/renderCategories\(\);/);
    if (renderCallMatch) {
      const callIndex = htmlSection.indexOf('renderCategories();');
      const contextStart = Math.max(0, callIndex - 100);
      const contextEnd = Math.min(htmlSection.length, callIndex + 100);
      console.log('\n📍 Context around renderCategories() call:\n');
      console.log(htmlSection.substring(contextStart, contextEnd));
    }

    // Save HTML section to file for inspection
    const htmlPath = '/Users/aarontjomsland/er-sim-monitor/backups/field-selector-html-template.txt';
    fs.writeFileSync(htmlPath, htmlSection, 'utf8');
    console.log(`\n💾 Saved HTML template to: ${htmlPath}\n`);

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

check();
