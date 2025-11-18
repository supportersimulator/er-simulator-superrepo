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

async function check() {
  console.log('\n🔍 CHECKING FOR discoverPathwaysSync_ FUNCTION\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });
    const phase2File = project.data.files.find(f => f.name === 'Categories_Pathways_Feature_Phase2');

    if (!phase2File) {
      console.log('❌ Categories_Pathways_Feature_Phase2.gs not found\n');
      return;
    }

    const code = phase2File.source;

    // Check for discoverPathwaysSync_
    const hasDiscoverFunc = code.includes('function discoverPathwaysSync_');
    console.log('❓ discoverPathwaysSync_ exists:', hasDiscoverFunc ? '✅ YES' : '❌ NO\n');

    if (!hasDiscoverFunc) {
      console.log('⚠️  FUNCTION MISSING - This is why AI discovery fails!\n');
      console.log('Searching for similar function names...\n');

      const funcMatches = code.match(/function\s+discover\w+/g);
      if (funcMatches) {
        console.log('Found these discover* functions:');
        funcMatches.forEach(fn => console.log('   • ' + fn));
        console.log('');
      }

      // Check if startAIDiscovery calls it
      const startAIDiscoveryMatch = code.match(/function startAIDiscovery[\s\S]{0,500}/);
      if (startAIDiscoveryMatch) {
        console.log('startAIDiscovery() function code:');
        console.log(startAIDiscoveryMatch[0].substring(0, 400));
        console.log('...\n');
      }
    } else {
      console.log('✅ Function exists - checking if it\'s being called...\n');

      const startAIDiscoveryMatch = code.match(/function startAIDiscovery[^{]*{[^}]*discoverPathwaysSync_[^}]*}/);
      if (startAIDiscoveryMatch) {
        console.log('✅ startAIDiscovery() correctly calls discoverPathwaysSync_()\n');
      } else {
        console.log('⚠️  startAIDiscovery() may not be calling discoverPathwaysSync_()\n');
      }
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('❌ Error:', e.message, '\n');
  }
}

check().catch(console.error);
