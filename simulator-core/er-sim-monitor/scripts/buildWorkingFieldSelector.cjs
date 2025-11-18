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

async function fix() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    const content = await script.projects.getContent({ scriptId: PRODUCTION_PROJECT_ID });
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');
    let code = content.data.files.find(f => f.name === 'Code').source;

    // Read the original HTML from our backup file
    const htmlFile = fs.readFileSync('/tmp/showFieldSelector_extract.gs', 'utf8');
    
    // Extract just the HTML/CSS/JS portions (lines 14-219)
    const lines = htmlFile.split('\n');
    const htmlLines = lines.slice(13, 219); // Get the HTML construction part
    
    // Join them back
    const htmlConstruction = htmlLines.join('\n');

    const newFunc = `function showFieldSelector() {
  Logger.log('🎯 showFieldSelector() START');

  try {
    var roughDraft = getFieldSelectorRoughDraft();
    var allFields = roughDraft.allFields;
    var selected = roughDraft.selected;

    Logger.log('✅ Got ' + allFields.length + ' fields, ' + selected.length + ' selected');

    var html =
${htmlConstruction}

    var htmlOutput = HtmlService.createHtmlOutput(html)
      .setWidth(800)
      .setHeight(700);

    SpreadsheetApp.getUi().showModalDialog(htmlOutput, '🎯 Select Fields to Cache');
    Logger.log('✅ Field selector modal displayed');

  } catch (error) {
    Logger.log('❌ Error: ' + error.message);
    SpreadsheetApp.getUi().alert('Error', error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

`;

    const funcStart = code.indexOf('function showFieldSelector() {');
    const funcEnd = code.indexOf('\n\n\nfunction onOpen', funcStart);
    code = code.substring(0, funcStart) + newFunc + code.substring(funcEnd);

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: {
        files: [
          { name: 'Code', type: 'SERVER_JS', source: code },
          manifestFile
        ]
      }
    });

    console.log('✅ DEPLOYED - Using original HTML construction from backup\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

fix();
