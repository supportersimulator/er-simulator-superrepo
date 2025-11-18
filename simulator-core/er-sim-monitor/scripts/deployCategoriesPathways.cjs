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
  console.log('\n🧩 DEPLOYING CATEGORIES & PATHWAYS ADVANCED PANEL\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  // Read new feature file
  const featurePath = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature.gs');
  const featureCode = fs.readFileSync(featurePath, 'utf8');

  console.log('📄 Feature file loaded:');
  console.log(`   File: Categories_Pathways_Feature.gs`);
  console.log(`   Size: ${(featureCode.length / 1024).toFixed(1)} KB\n`);

  // Get current project
  const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });

  // Check if file already exists
  let fileExists = false;
  project.data.files.forEach(f => {
    if (f.name === 'Categories_Pathways_Feature') {
      fileExists = true;
    }
  });

  console.log(`📋 Deployment mode: ${fileExists ? 'UPDATE' : 'CREATE'}\n`);

  // Update or create file
  const files = project.data.files.map(f => {
    if (f.name === 'Categories_Pathways_Feature') {
      console.log('   ✅ Updating existing Categories_Pathways_Feature.gs');
      return {
        name: f.name,
        type: f.type,
        source: featureCode
      };
    }
    return f;
  });

  // If file doesn't exist, add it
  if (!fileExists) {
    console.log('   ✅ Creating new Categories_Pathways_Feature.gs');
    files.push({
      name: 'Categories_Pathways_Feature',
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
  console.log('✅ DEPLOYMENT COMPLETE\n');
  console.log('📋 What was deployed:');
  console.log('   • Full modal dialog (1920x1000)');
  console.log('   • 6 pathway grouping logic types:');
  console.log('     - System-Based (CARD, RESP, NEUR, GI, etc.)');
  console.log('     - Skill Protocol Series (ACLS, PALS, ATLS, NRP)');
  console.log('     - Specialty/Department (GYN, PEDS, TRAUMA, TOX)');
  console.log('     - Patient Experience (Anxiety, Communication)');
  console.log('     - Complexity Progression (Foundational → Advanced)');
  console.log('     - Clinical Reasoning (Diagnostic Dilemmas, Time-Critical)');
  console.log('   • Accordion UI for expandable groups');
  console.log('   • AI-powered pathway suggestions');
  console.log('   • Dynamic logic type suggestions\n');
  console.log('🔧 How to use:');
  console.log('   1. Open Google Sheet');
  console.log('   2. Run: runCategoriesPathwaysPanel()');
  console.log('   3. Select a grouping logic type');
  console.log('   4. Click "Analyze & Generate Suggestions"');
  console.log('   5. Explore accordion groups with case recommendations\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

deploy().catch(console.error);
