#!/usr/bin/env node

/**
 * EXTRACT AND TEST HTML
 * Download the HTML content and save it to test locally
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

async function extract() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading current code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');

    // Find showFieldSelector function
    const funcStart = codeFile.source.indexOf('function showFieldSelector() {');
    if (funcStart === -1) {
      console.error('❌ Could not find showFieldSelector function');
      return;
    }

    // Find the HTML content variable
    const htmlStart = codeFile.source.indexOf("var htmlContent = '<!DOCTYPE html>'", funcStart);
    if (htmlStart === -1) {
      console.error('❌ Could not find htmlContent variable');
      return;
    }

    // Extract until the end of the string concatenation
    let braceCount = 0;
    let inFunction = false;
    let funcEnd = funcStart;

    for (let i = funcStart; i < codeFile.source.length; i++) {
      if (codeFile.source[i] === '{') {
        braceCount++;
        inFunction = true;
      } else if (codeFile.source[i] === '}') {
        braceCount--;
        if (inFunction && braceCount === 0) {
          funcEnd = i + 1;
          break;
        }
      }
    }

    const functionCode = codeFile.source.substring(funcStart, funcEnd);

    // Extract just the HTML content string
    const htmlStartMarker = "var htmlContent = '";
    const htmlContentStart = functionCode.indexOf(htmlStartMarker) + htmlStartMarker.length;
    const htmlContentEnd = functionCode.indexOf("';", htmlContentStart);

    let htmlString = functionCode.substring(htmlContentStart, htmlContentEnd);

    // Convert the Apps Script string concatenation to actual HTML
    htmlString = htmlString
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/' \+\n\s*'/g, '')
      .replace(/\\\\/g, '\\');

    console.log('✅ Extracted HTML\n');
    console.log('📝 First 500 characters:\n');
    console.log(htmlString.substring(0, 500));
    console.log('\n...\n');
    console.log('📝 Last 500 characters:\n');
    console.log(htmlString.substring(htmlString.length - 500));

    // Save to file
    const outputPath = path.join(__dirname, '../backups/extracted-modal.html');
    fs.writeFileSync(outputPath, htmlString, 'utf8');
    console.log('\n💾 Saved to:', outputPath);
    console.log('\nYou can open this file in a browser to see JavaScript errors!');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

extract();
