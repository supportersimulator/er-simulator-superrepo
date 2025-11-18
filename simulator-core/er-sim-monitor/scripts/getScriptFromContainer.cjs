#!/usr/bin/env node

/**
 * Get Apps Script project using container (spreadsheet) binding
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SPREADSHEET_ID = '1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI';

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

async function getScript() {
  console.log('\n🔍 GETTING SCRIPT FROM SPREADSHEET CONTAINER\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    // Try to get the script by its container
    console.log('🔎 Attempting to get script via container ID...\n');

    const project = await script.projects.get({
      scriptId: SPREADSHEET_ID
    });

    console.log('✅ Found script via container!\n');
    console.log(`📄 Script Title: ${project.data.title}\n`);
    console.log(`🆔 Script ID: ${project.data.scriptId}\n`);

    // Get content
    const content = await script.projects.getContent({
      scriptId: project.data.scriptId
    });

    console.log('📋 Files in script:\n');
    content.data.files.forEach(f => console.log(`   • ${f.name}`));
    console.log('');

    // Check for TEST menu
    const codeFile = content.data.files.find(f => f.name === 'Code');
    if (codeFile) {
      const hasOnOpen = codeFile.source.includes('function onOpen()');
      const hasTestMenu = codeFile.source.includes('TEST');

      console.log('📊 Analysis:\n');
      console.log(`   onOpen() exists: ${hasOnOpen ? '✅' : '❌'}`);
      console.log(`   TEST menu found: ${hasTestMenu ? '✅' : '❌'}\n`);
    }

    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`✅ CONTAINER SCRIPT ID: ${project.data.scriptId}\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    return project.data.scriptId;

  } catch (e) {
    if (e.code === 404) {
      console.log('❌ No script found using container ID\n');
      console.log('This means the spreadsheet does NOT have a container-bound script.\n');
      console.log('The spreadsheet must be using a standalone/library script instead.\n');
      console.log('═══════════════════════════════════════════════════════════════\n');
    } else {
      console.log('❌ Error: ' + e.message + '\n');
      if (e.stack) {
        console.log(e.stack);
      }
    }
    return null;
  }
}

getScript().catch(console.error);
