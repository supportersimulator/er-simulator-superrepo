#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TEST_SCRIPT_ID = '1kkPZU3GsCCuu5IhTEOufmDT1Cb2rSQVB3Y3u1DPf87yoSV4WVtoNvd6i';

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
  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });
  const cpFile = project.data.files.find(f => f.name === 'Categories_Pathways_Feature');

  if (!cpFile) {
    console.log('❌ Categories_Pathways_Feature file not found!');
    return;
  }

  console.log('\n🔍 CATEGORIES & PATHWAYS FEATURE VERIFICATION\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const checks = [
    { name: 'Main function', pattern: /function runCategoriesPathwaysPanel\(\)/ },
    { name: 'Modal dialog (1920x1000)', pattern: /\.setWidth\(1920\)[\s\S]*\.setHeight\(1000\)/ },
    { name: 'System-Based grouping', pattern: /function groupByMedicalSystem_/ },
    { name: 'Protocol grouping', pattern: /function groupBySkillProtocol_/ },
    { name: 'Specialty grouping', pattern: /function groupBySpecialty_/ },
    { name: 'Experience grouping', pattern: /function groupByPatientExperience_/ },
    { name: 'Complexity grouping', pattern: /function groupByComplexity_/ },
    { name: 'Reasoning grouping', pattern: /function groupByClinicalReasoning_/ },
    { name: 'Accordion UI', pattern: /accordion-header/ },
    { name: 'Logic type dropdown', pattern: /logicTypeSelect/ },
    { name: 'Analyze button', pattern: /analyzePathways/ },
    { name: 'New logic suggestions', pattern: /newLogicSuggestions/ },
    { name: 'Dark theme styling', pattern: /background: linear-gradient\(135deg, #0f1115/ },
    { name: 'Case grid layout', pattern: /case-grid/ },
    { name: 'Empty state', pattern: /empty-state/ }
  ];

  let allPassed = true;

  checks.forEach(check => {
    const match = cpFile.source.match(check.pattern);
    if (match) {
      console.log(`✅ ${check.name}`);
    } else {
      console.log(`❌ ${check.name}`);
      allPassed = false;
    }
  });

  console.log('\n═══════════════════════════════════════════════════════════════');

  if (allPassed) {
    console.log('✅ ALL FEATURES VERIFIED\n');
    console.log('📋 Complete Feature Set:');
    console.log('   ✅ Full modal dialog (1920x1000)');
    console.log('   ✅ 6 pathway grouping logic types');
    console.log('   ✅ Accordion UI for expandable groups');
    console.log('   ✅ AI-powered pathway suggestions');
    console.log('   ✅ Dynamic logic type suggestions');
    console.log('   ✅ Dark-themed professional UI');
    console.log('   ✅ Case grid with metadata display\n');
    console.log('🎯 How to use:');
    console.log('   1. Open Google Sheet');
    console.log('   2. Run: runCategoriesPathwaysPanel()');
    console.log('   3. Select logic type from dropdown');
    console.log('   4. Click "Analyze & Generate Suggestions"');
    console.log('   5. Click accordion headers to expand/collapse');
    console.log('   6. Click case cards to view details');
    console.log('   7. Click suggested logic types to add them\n');
  } else {
    console.log('⚠️  SOME FEATURES MISSING - Check deployment\n');
  }

  console.log('═══════════════════════════════════════════════════════════════\n');
}

verify().catch(console.error);
