#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

console.log('\n🔍 RE-ANALYZING "DUPLICATE" PROJECTS - ARCHITECTURAL PERSPECTIVE\n');
console.log('═══════════════════════════════════════════════════════════════\n');

const ALL_PROJECTS = [
  {
    id: '1orJ__UUViG-gdSOHXt2VSGzo--ASib9XdVLVCApccKujWnqTuxq7wHIw',
    name: 'GPT Formatter',
    purpose: 'Original main project'
  },
  {
    id: '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf',
    name: 'TEST Menu Script (Bound) #1',
    purpose: 'Active consolidated test environment'
  },
  {
    id: '1bwLs70zTwQsJxtAqA_yNJfyANjAW5x39YEY0VJhFPMamgDwb100qtqJD',
    name: 'TEST Menu Script (Bound) #2',
    purpose: 'Unknown - investigate'
  },
  {
    id: '1kkPZU3GsCCuu5IhTEOufmDT1Cb2rSQVB3Y3u1DPf87yoSV4WVtoNvd6i',
    name: 'TEST_Feature_Based_Code #1',
    purpose: 'Categories/Pathways isolation?'
  },
  {
    id: '1KBkujOTXGDmmhWOFm-ifxoMjXM5pRwwM5FpFBtPWK8eoE99fr4lla1OE',
    name: 'TEST_Feature_Based_Code #2',
    purpose: 'ATSR tool isolation? (per user suggestion)'
  },
  {
    id: '1INZy2-kQNEfEWEipSQ_WCvrvEhGgAeW4G4TM61W2ajNp_63G39KLPm4Y',
    name: 'TEST_Feature_Based_Code #3',
    purpose: 'Unknown isolation attempt?'
  }
];

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

async function reanalyze() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📊 DETAILED ARCHITECTURAL ANALYSIS:\n');

    for (const proj of ALL_PROJECTS) {
      console.log('═'.repeat(70));
      console.log('\n' + proj.name.toUpperCase());
      console.log('ID: ' + proj.id);
      console.log('Hypothesis: ' + proj.purpose + '\n');
      
      try {
        const project = await script.projects.get({ scriptId: proj.id });
        const content = await script.projects.getContent({ scriptId: proj.id });
        
        const files = content.data.files.filter(f => f.type === 'SERVER_JS');
        
        console.log('Files (' + files.length + ' total):');
        files.forEach(f => {
          const sizeKB = Math.round((f.source ? f.source.length : 0) / 1024);
          console.log('   • ' + f.name + '.gs (' + sizeKB + ' KB)');
        });
        
        console.log('\nLast Modified: ' + new Date(project.data.updateTime).toLocaleString());
        
        // Analyze file structure for architectural intent
        const fileNames = files.map(f => f.name);
        
        console.log('\nArchitectural Intent Analysis:');
        
        if (fileNames.includes('ATSR_Title_Generator_Feature') && 
            fileNames.includes('Batch_Processing_Sidebar_Feature') &&
            fileNames.includes('Core_Processing_Engine')) {
          console.log('   🎯 ISOLATED TOOL ARCHITECTURE DETECTED!');
          console.log('   This appears to be an intentional feature isolation:');
          console.log('      - ATSR_Title_Generator_Feature (pathway builder)');
          console.log('      - Batch_Processing_Sidebar_Feature (UI)');
          console.log('      - Core_Processing_Engine (shared logic)');
          console.log('   ✅ RECOMMENDATION: KEEP - This is isolated tooling');
        } else if (fileNames.includes('Categories_Pathways_Feature_Phase2') &&
                   fileNames.includes('Multi_Step_Cache_Enrichment')) {
          console.log('   🎯 CACHE/CATEGORIES ISOLATION DETECTED!');
          console.log('   This appears to isolate cache and pathway features:');
          console.log('      - Categories_Pathways_Feature_Phase2');
          console.log('      - Multi_Step_Cache_Enrichment');
          console.log('   ✅ RECOMMENDATION: KEEP - This is isolated tooling');
        } else if (files.length === 0) {
          console.log('   ❌ EMPTY PROJECT');
          console.log('   No files = no purpose');
          console.log('   ❌ RECOMMENDATION: DELETE - Empty shell');
        } else if (files.length === 1 && fileNames.includes('Code')) {
          console.log('   🎯 MAIN PROJECT');
          console.log('   Single Code.gs = original monolithic approach');
          console.log('   ✅ RECOMMENDATION: KEEP - Original reference');
        } else if (files.length === 3 && 
                   fileNames.includes('Code') &&
                   fileNames.includes('Categories_Pathways_Feature_Phase2') &&
                   fileNames.includes('ATSR_Title_Generator_Feature')) {
          console.log('   🎯 CONSOLIDATED TEST ENVIRONMENT');
          console.log('   All features in one place for testing');
          console.log('   ✅ RECOMMENDATION: KEEP - Active test environment');
        } else {
          console.log('   ⚠️  UNKNOWN ARCHITECTURE');
          console.log('   Needs manual review');
        }
        
      } catch (error) {
        console.log('   ❌ ERROR: ' + error.message);
      }
      
      console.log('');
    }

    console.log('═'.repeat(70));
    console.log('\n💡 REVISED RECOMMENDATIONS:\n');
    console.log('Based on architectural analysis, these projects may be intentional');
    console.log('feature isolations (microservices approach) to prevent breaking things.\n');
    console.log('BEFORE deleting anything, verify:');
    console.log('   1. Are any of these bound to DIFFERENT spreadsheets?');
    console.log('   2. Are any actively being used in production?');
    console.log('   3. Were these part of a "break features apart" strategy?\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

reanalyze();
