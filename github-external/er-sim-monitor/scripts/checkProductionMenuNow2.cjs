#!/usr/bin/env node

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

async function check() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const code = codeFile.source;

    console.log('\n🔍 Checking for onOpen function...\n');

    // Check for onOpen
    if (code.includes('function onOpen(')) {
      console.log('✅ onOpen function exists\n');

      // Find and display it
      const match = code.match(/function onOpen\(\)[^{]*\{[\s\S]{0,500}/);
      if (match) {
        console.log('First 500 chars:\n');
        console.log(match[0]);
      }
    } else {
      console.log('❌ NO onOpen function found!\n');
    }

    // Check for menu creation
    const menuMatches = code.match(/createMenu\(['"]([^'"]+)['"]\)/g);
    if (menuMatches) {
      console.log('\n📋 Found menu creation:\n');
      menuMatches.slice(0, 5).forEach(m => console.log(`   ${m}`));
    }

    // Check for extendMenu
    if (code.includes('extendMenu_')) {
      console.log('\n⚠️  Found extendMenu_ function (self-executing)\n');
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

check();
