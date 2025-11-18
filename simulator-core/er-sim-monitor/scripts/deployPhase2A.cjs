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

async function deploy() {
  console.log('\n🧩 DEPLOYING PHASE 2A: HOLISTIC ANALYSIS ENGINE\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  // Read Phase 2 feature file
  const featurePath = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs');
  const featureCode = fs.readFileSync(featurePath, 'utf8');

  console.log('📄 Feature file loaded:');
  console.log(`   File: Categories_Pathways_Feature_Phase2.gs`);
  console.log(`   Size: ${(featureCode.length / 1024).toFixed(1)} KB\n`);

  // Get current project
  const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });

  // Update or create file
  const files = project.data.files.map(f => {
    if (f.name === 'Categories_Pathways_Feature_Phase2') {
      console.log('   ✅ Updating existing Categories_Pathways_Feature_Phase2.gs');
      return {
        name: f.name,
        type: f.type,
        source: featureCode
      };
    }
    return f;
  });

  // If file doesn't exist, add it
  const fileExists = project.data.files.some(f => f.name === 'Categories_Pathways_Feature_Phase2');
  if (!fileExists) {
    console.log('   ✅ Creating new Categories_Pathways_Feature_Phase2.gs');
    files.push({
      name: 'Categories_Pathways_Feature_Phase2',
      type: 'SERVER_JS',
      source: featureCode
    });
  }

  // Deploy
  await script.projects.updateContent({
    scriptId: TEST_SCRIPT_ID,
    requestBody: {
      files: files
    }
  });

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('✅ PHASE 2A DEPLOYMENT COMPLETE\n');
  console.log('📋 What was deployed:');
  console.log('   • Holistic case library analyzer');
  console.log('   • Pre-computed analysis with 24-hour cache');
  console.log('   • Bird\'s eye view dashboard');
  console.log('   • System distribution visualization');
  console.log('   • Top 6 pathway opportunities with confidence scores');
  console.log('   • AI-generated insights (5-7 bullets)');
  console.log('   • Re-analyze button for fresh computation');
  console.log('   • Hidden sheet: Pathway_Analysis_Cache\n');
  console.log('🔧 How to use:');
  console.log('   1. Open Google Sheet');
  console.log('   2. Run: runPathwayChainBuilder()');
  console.log('   3. View bird\'s eye analysis of entire case library');
  console.log('   4. Click pathway cards to build chains (Phase 2B coming next)');
  console.log('   5. Click "Re-analyze" to refresh cached analysis\n');
  console.log('📊 Analysis Features:');
  console.log('   • Detects ACLS, PALS, and protocol opportunities');
  console.log('   • Identifies system-based pathway potential');
  console.log('   • Calculates confidence scores (0-1)');
  console.log('   • Analyzes complexity distribution');
  console.log('   • Tracks unassigned cases');
  console.log('   • Suggests pediatric and specialty pathways\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

deploy().catch(console.error);
