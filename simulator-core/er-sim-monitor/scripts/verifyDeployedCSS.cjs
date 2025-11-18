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
  const { client_secret, client_id, redirect_uris} = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

async function verify() {
  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });
  const atsrFile = project.data.files.find(f => f.name === 'ATSR_Title_Generator_Feature');

  if (!atsrFile) {
    console.log('❌ ATSR file not found!');
    return;
  }

  console.log('\n🔍 DEPLOYED CSS VERIFICATION\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Extract specific CSS rules
  const cssChecks = [
    { name: '.grid-3 gap', pattern: /\.grid-3\s*\{[^}]*gap:\s*(\d+)px/ },
    { name: '.section padding', pattern: /\.section\s*\{[^}]*padding:\s*(\d+)px/ },
    { name: '.options gap', pattern: /\.options\s*\{[^}]*gap:\s*(\d+)px/ },
    { name: '.edit-field font-size', pattern: /\.edit-field\s*\{[^}]*font-size:\s*(\d+)px/ },
    { name: '.edit-field padding', pattern: /\.edit-field\s*\{[^}]*padding:\s*(\d+)px\s+(\d+)px/ },
    { name: 'cache-bust comment', pattern: /Cache bust: v4_fullscreen_editable_current/ }
  ];

  cssChecks.forEach(check => {
    const match = atsrFile.source.match(check.pattern);
    if (match) {
      if (check.name === 'cache-bust comment') {
        console.log(`✅ ${check.name}: PRESENT`);
      } else if (check.name === '.edit-field padding') {
        console.log(`✅ ${check.name}: ${match[1]}px ${match[2]}px`);
      } else {
        console.log(`✅ ${check.name}: ${match[1]}px`);
      }
    } else {
      console.log(`❌ ${check.name}: NOT FOUND`);
    }
  });

  console.log('\n═══════════════════════════════════════════════════════════════\n');
}

verify().catch(console.error);
