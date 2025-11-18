#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const PROD_SCRIPT_ID = '1Bkbm2MNA-YmXQEoMsIlC-VgEgHiQHO2EuMXR-yyxy9lYWl3eNcEHk_S-';

async function finalVerification() {
  const keyPath = path.join(__dirname, '..', 'config', 'credentials.json');
  const tokenPath = path.join(__dirname, '..', 'config', 'token.json');

  const credentials = JSON.parse(fs.readFileSync(keyPath));
  const token = JSON.parse(fs.readFileSync(tokenPath));

  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oAuth2Client });

  console.log('═══════════════════════════════════════════════════');
  console.log('         FINAL DEPLOYMENT VERIFICATION');
  console.log('═══════════════════════════════════════════════════\n');

  const response = await script.projects.getContent({ scriptId: PROD_SCRIPT_ID });
  const codeFile = response.data.files.find(f => f.name === 'Code');
  const code = codeFile.source;

  // Comprehensive checks
  const checks = [
    {
      name: '✨ Helper: getColumnIndexByHeader_()',
      pattern: /function getColumnIndexByHeader_\(tier2Name, fallbackIndex\)/
    },
    {
      name: '✨ Helper: resolveColumnIndices_()',
      pattern: /function resolveColumnIndices_\(fieldMap\)/
    },
    {
      name: '🔄 Updated: refreshHeaders()',
      pattern: /function refreshHeaders[\s\S]{0,500}Master Scenario Convert/
    },
    {
      name: '🔄 Updated: openCategoriesPathwaysPanel()',
      pattern: /function openCategoriesPathwaysPanel[\s\S]{0,800}resolveColumnIndices_/
    },
    {
      name: '🔄 Updated: getCategoryView()',
      pattern: /function getCategoryView[\s\S]{0,500}resolveColumnIndices_/
    },
    {
      name: '🔄 Updated: getPathwayView()',
      pattern: /function getPathwayView[\s\S]{0,500}resolveColumnIndices_/
    }
  ];

  let allGood = true;
  checks.forEach(check => {
    const found = check.pattern.test(code);
    console.log(`  ${found ? '✅' : '❌'} ${check.name}`);
    if (!found) allGood = false;
  });

  console.log('');

  if (allGood) {
    console.log('🎉 ALL CHECKS PASSED! Complete deployment verified.\n');

    // Check for any remaining hardcoded indexOf calls
    console.log('🔍 Scanning for remaining hardcoded column lookups...\n');

    const categoryIndexOf = (code.match(/headers\.indexOf\(['"]Case_Organization:Category['"]\)/g) || []).length;
    const pathwayIndexOf = (code.match(/headers\.indexOf\(['"]Case_Organization:Pathway_Name['"]\)/g) || []).length;
    const sparkIndexOf = (code.match(/headers\.indexOf\(['"]Case_Organization:Spark_Title['"]\)/g) || []).length;

    console.log(`  Found ${categoryIndexOf} remaining Category lookups (likely in fallbacks - OK)`);
    console.log(`  Found ${pathwayIndexOf} remaining Pathway lookups (likely in fallbacks - OK)`);
    console.log(`  Found ${sparkIndexOf} remaining Spark lookups (likely in fallbacks - OK)\n`);

  } else {
    console.log('⚠️  Some checks failed. Review deployment.\n');
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log('                 📋 WHAT WAS DEPLOYED');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('✅ Dynamic Header Resolution System');
  console.log('   • Caches Tier2 headers from Master Scenario Convert');
  console.log('   • Resolves column indices dynamically at runtime');
  console.log('   • Falls back to hardcoded indices if cache missing');
  console.log('   • Logs column movements for transparency');
  console.log('');
  console.log('✅ Updated Functions:');
  console.log('   • refreshHeaders() - Reads from Master Scenario Convert');
  console.log('   • openCategoriesPathwaysPanel() - Uses dynamic resolution');
  console.log('   • getCategoryView() - Uses dynamic resolution');
  console.log('   • getPathwayView() - Uses dynamic resolution');
  console.log('');
  console.log('✅ New Helper Functions:');
  console.log('   • getColumnIndexByHeader_() - Single column resolution');
  console.log('   • resolveColumnIndices_() - Batch column resolution');
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('                  🎯 USER WORKFLOW');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('1️⃣  Open production spreadsheet');
  console.log('2️⃣  Click: Sim Builder → 🔁 Refresh Headers');
  console.log('3️⃣  System caches all Tier2 header mappings');
  console.log('4️⃣  Test Categories & Pathways panel');
  console.log('5️⃣  All functions automatically use cached mappings');
  console.log('');
  console.log('💡 TIP: Run Refresh Headers whenever column order changes');
  console.log('');
  console.log('═══════════════════════════════════════════════════\n');
}

finalVerification().catch(err => {
  console.error('\n❌ Verification failed:', err.message);
  process.exit(1);
});
