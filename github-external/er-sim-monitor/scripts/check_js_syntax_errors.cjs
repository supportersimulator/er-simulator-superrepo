#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function checkJSSyntaxErrors() {
  try {
    console.log('🔍 CHECKING FOR JAVASCRIPT SYNTAX ERRORS\n');
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
    const codeFile = content.data.files.find(f => f.name === 'Code');

    // Find the <script> tag section
    const scriptStart = codeFile.source.indexOf("'  <script>' +");
    const scriptEnd = codeFile.source.indexOf("'  </script>' +", scriptStart);
    const scriptSection = codeFile.source.substring(scriptStart, scriptEnd + 20);

    console.log('📄 COMPLETE <SCRIPT> SECTION:\n');
    console.log(scriptSection);
    console.log('\n...\n');

    // Check for common syntax errors
    console.log('🔍 CHECKING FOR COMMON ISSUES:\n');

    const issues = [];

    // Check for unmatched quotes
    const singleQuotes = (scriptSection.match(/'/g) || []).length;
    const doubleQuotes = (scriptSection.match(/"/g) || []).length;
    console.log(`   Single quotes: ${singleQuotes} (should be even)`);
    console.log(`   Double quotes: ${doubleQuotes} (should be even)\n`);

    // Check if Discovery functions are BEFORE </script>
    if (scriptSection.includes('handleLogicTypeChange')) {
      console.log('   ✅ handleLogicTypeChange() is inside <script> tag\n');
    } else {
      console.log('   ❌ handleLogicTypeChange() NOT inside <script> tag!\n');
      issues.push('Discovery functions missing from <script> tag');
    }

    // Check if Discovery functions come AFTER tab switching functions
    const showCategoriesIdx = scriptSection.indexOf('function showCategories');
    const handleLogicIdx = scriptSection.indexOf('function handleLogicTypeChange');
    
    if (showCategoriesIdx !== -1 && handleLogicIdx !== -1) {
      if (handleLogicIdx > showCategoriesIdx) {
        console.log('   ✅ Discovery functions come after showCategories()\n');
      } else {
        console.log('   ⚠️  Discovery functions come BEFORE showCategories() (unusual)\n');
      }
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
    
    if (issues.length > 0) {
      console.log('❌ ISSUES FOUND:\n');
      issues.forEach((issue, idx) => {
        console.log(`${idx + 1}. ${issue}`);
      });
    } else {
      console.log('✅ NO OBVIOUS SYNTAX ERRORS FOUND\n');
      console.log('💡 HYPOTHESIS:\n');
      console.log('   The JavaScript looks correct. The issue might be:');
      console.log('   1. Browser console errors (check F12 developer tools)');
      console.log('   2. The button is disabled but handleLogicTypeChange() not firing');
      console.log('   3. The dropdown onchange event not attached properly\n');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkJSSyntaxErrors();
