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

    console.log('📥 Downloading...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const code = content.data.files.find(f => f.name === 'Code').source;

    // Find getFieldSelectorRoughDraft function
    const funcStart = code.indexOf('function getFieldSelectorRoughDraft() {');
    const funcEnd = code.indexOf('\nfunction ', funcStart + 100);
    const func = code.substring(funcStart, funcEnd);

    // Look for what allFields structure is
    console.log('Checking allFields structure...\n');
    
    // Find where allFields is built
    const allFieldsPattern = /allFields.*?=.*?(\[[\s\S]{0,500}?\]|validFields)/;
    const match = func.match(allFieldsPattern);
    
    if (match) {
      console.log('Found allFields construction:\n');
      console.log(match[0]);
      console.log('\n');
    }

    // Check if it returns objects or strings
    if (func.includes('allFields.push({')) {
      console.log('⚠️  allFields contains OBJECTS (with properties)\n');
      console.log('This might cause JSON issues in the HTML!\n');
    } else if (func.includes('allFields.push(')) {
      console.log('✅ allFields contains simple values\n');
    }

    // Extract a sample to see structure
    const returnPattern = /return\s*\{[\s\S]{0,200}?\}/;
    const returnMatch = func.match(returnPattern);
    
    if (returnMatch) {
      console.log('Return structure:\n');
      console.log(returnMatch[0]);
      console.log('\n');
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

check();
