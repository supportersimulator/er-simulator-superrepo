#!/usr/bin/env node

/**
 * DOWNLOAD CURRENT DEPLOYED CODE
 * Get the actual code that's deployed right now
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

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

async function download() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading current deployed code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');

    if (codeFile) {
      const outputPath = '/tmp/actual_deployed_code.gs';
      fs.writeFileSync(outputPath, codeFile.source, 'utf8');
      console.log('✅ Downloaded to:', outputPath);
      console.log('📊 File size:', codeFile.source.length, 'characters');
      console.log('📊 Line count:', codeFile.source.split('\n').length, 'lines');

      // Check for key functions
      const hasGetFieldSelectorData = codeFile.source.includes('function getFieldSelectorData()');
      const hasShowFieldSelector = codeFile.source.includes('function showFieldSelector()');
      const hasShowCacheAllLayers = codeFile.source.includes('function showCacheAllLayersModal()');

      console.log('\n🔍 Function Check:');
      console.log('   getFieldSelectorData():', hasGetFieldSelectorData ? '✅ EXISTS' : '❌ MISSING');
      console.log('   showFieldSelector():', hasShowFieldSelector ? '✅ EXISTS' : '❌ MISSING');
      console.log('   showCacheAllLayersModal():', hasShowCacheAllLayers ? '✅ EXISTS' : '❌ MISSING');
    } else {
      console.log('❌ Could not find Code file');
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

download();
