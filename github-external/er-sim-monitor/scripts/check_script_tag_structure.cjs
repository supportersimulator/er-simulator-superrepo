#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function checkScriptStructure() {
  try {
    const credPath = path.join(__dirname, '../config/credentials.json');
    const tokenPath = path.join(__dirname, '../config/token.json');

    const credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    oAuth2Client.setCredentials(token);

    const script = google.script({ version: 'v1', auth: oAuth2Client });
    const scriptId = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

    const content = await script.projects.getContent({ scriptId });
    const codeFile = content.data.files.find(f => f.name === 'Code');

    console.log('🔍 Checking Script Tag Structure in buildBirdEyeViewUI_\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Find where HTML structure starts
    const htmlStart = codeFile.source.indexOf("'<!DOCTYPE html>' +");
    if (htmlStart !== -1) {
      const excerpt = codeFile.source.substring(htmlStart, htmlStart + 2000);
      console.log('📄 HTML STRUCTURE:\n');
      console.log(excerpt);
      console.log('\n...\n');
    }

    // Find where <script> tag is
    const scriptTagStart = codeFile.source.indexOf("'  <script>' +");
    if (scriptTagStart !== -1) {
      const excerpt = codeFile.source.substring(scriptTagStart, scriptTagStart + 1500);
      console.log('\n📄 <script> TAG LOCATION:\n');
      console.log(excerpt);
      console.log('\n...\n');
    }

    // Check if there's a <head> section
    const headStart = codeFile.source.indexOf("'<head>' +");
    console.log('\n📋 STRUCTURE CHECK:\n');
    console.log('   ' + (headStart !== -1 ? '✅' : '❌') + ' Has <head> section');
    
    const hasScriptInHead = codeFile.source.indexOf("'  <script>' +") < codeFile.source.indexOf("'</head>' +");
    console.log('   ' + (hasScriptInHead ? '✅' : '❌') + ' <script> inside <head>');

    const bodyStart = codeFile.source.indexOf("'<body>' +");
    console.log('   ' + (bodyStart !== -1 ? '✅' : '❌') + ' Has <body> section\n');

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkScriptStructure();
