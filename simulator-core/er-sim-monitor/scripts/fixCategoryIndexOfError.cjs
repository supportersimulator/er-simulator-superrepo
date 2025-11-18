#!/usr/bin/env node

/**
 * FIX CATEGORY INDEXOF ERROR
 * Add null safety to all category.indexOf() calls
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🔧 FIXING CATEGORY INDEXOF ERROR\n');
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

async function fix() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading production code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('🔍 Diagnosis:\n');
    console.log('   Error: "c.category.indexOf is not a function"');
    console.log('   Root Cause: category field might be a number or null\n');

    console.log('🔧 Adding null safety to all category.indexOf() calls...\n');

    // Fix: c.category.indexOf(',') !== -1
    const before1 = `const multiSystemCount = cases.filter(function(c) {
    return c.category.indexOf(',') !== -1 || c.category.indexOf('/') !== -1;
  }).length;`;

    const after1 = `const multiSystemCount = cases.filter(function(c) {
    if (!c.category || typeof c.category !== 'string') return false;
    return c.category.indexOf(',') !== -1 || c.category.indexOf('/') !== -1;
  }).length;`;

    if (code.includes(before1)) {
      code = code.replace(before1, after1);
      console.log('✅ Fixed multi-system case filter\n');
    } else {
      console.log('⚠️  Pattern 1 not found - may already be fixed\n');
    }

    // Also add a global helper to safely get category as string
    const categoryHelper = `
/**
 * Safely get category as string
 */
function getCategoryString_(obj) {
  if (!obj) return '';
  if (!obj.category) return '';
  if (typeof obj.category === 'string') return obj.category;
  return String(obj.category);
}
`;

    // Check if helper already exists
    if (!code.includes('function getCategoryString_')) {
      const firstFunctionMatch = code.match(/^function /m);
      if (firstFunctionMatch) {
        const insertPos = firstFunctionMatch.index;
        code = code.slice(0, insertPos) + categoryHelper + '\n' + code.slice(insertPos);
        console.log('✅ Added getCategoryString_() helper function\n');
      }
    }

    // Replace all remaining unsafe category access patterns
    console.log('🔧 Adding safety to all category field access...\n');

    // Pattern: c.category.indexOf
    code = code.replace(
      /([a-zA-Z_]\w*)\.category\.indexOf\(/g,
      '(getCategoryString_($1).indexOf('
    );
    console.log('✅ Protected all .category.indexOf() calls\n');

    // Pattern: c.category.toUpperCase
    code = code.replace(
      /([a-zA-Z_]\w*)\.category\.toUpperCase\(/g,
      '(getCategoryString_($1).toUpperCase('
    );
    console.log('✅ Protected all .category.toUpperCase() calls\n');

    // Backup
    const backupPath = path.join(__dirname, '../backups/production-before-category-indexof-fix-2025-11-06.gs');
    fs.writeFileSync(backupPath, codeFile.source, 'utf8');
    console.log(`💾 Backed up to: ${backupPath}\n`);

    // Deploy
    console.log('📤 Deploying fixes to production...\n');

    const updatedFiles = [
      {
        name: 'Code',
        type: 'SERVER_JS',
        source: code
      },
      manifestFile
    ];

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: updatedFiles }
    });

    const newSize = (code.length / 1024).toFixed(1);

    console.log(`✅ Deployment successful! Size: ${newSize} KB\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎉 FIXES APPLIED!\n');
    console.log('What was fixed:\n');
    console.log('   ✅ Added getCategoryString_() helper function');
    console.log('   ✅ Protected all .category.indexOf() calls');
    console.log('   ✅ Protected all .category.toUpperCase() calls\n');
    console.log('Next steps:\n');
    console.log('   1. Refresh your production spreadsheet\n');
    console.log('   2. Click "🧠 Sim Builder" → "🧩 Categories & Pathways"\n');
    console.log('   3. The big tabbed panel should open!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

fix();
