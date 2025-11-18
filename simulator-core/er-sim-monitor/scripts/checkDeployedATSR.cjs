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
  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });
  const atsrFile = project.data.files.find(f => f.name === 'ATSR_Title_Generator_Feature');

  if (atsrFile) {
    // Check for minimalistic CSS
    const hasSmallGap = atsrFile.source.includes('gap: 10px');
    const hasSmallPadding = atsrFile.source.includes('padding: 8px');
    const hasSmallFontSize = atsrFile.source.includes('font-size: 12px');

    console.log('\n📊 DEPLOYED ATSR FILE CHECK:\n');
    console.log(`✅ File size: ${(atsrFile.source.length / 1024).toFixed(1)} KB`);
    console.log(`${hasSmallGap ? '✅' : '❌'} Minimalistic grid gap (10px): ${hasSmallGap}`);
    console.log(`${hasSmallPadding ? '✅' : '❌'} Minimalistic section padding (8px): ${hasSmallPadding}`);
    console.log(`${hasSmallFontSize ? '✅' : '❌'} Smaller input font (12px): ${hasSmallFontSize}`);

    // Extract CSS section
    const cssMatch = atsrFile.source.match(/\.grid-3 \{[^}]+\}/);
    if (cssMatch) {
      console.log('\n📝 Deployed .grid-3 CSS:');
      console.log(cssMatch[0]);
    }
  } else {
    console.log('❌ ATSR file not found in deployed project!');
  }
}

check().catch(console.error);
