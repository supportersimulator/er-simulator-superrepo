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

async function findIssue() {
  console.log('\n🔍 SEARCHING FOR SYNTAX ISSUES IN AI FUNCTIONS\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });
  const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });
  const phase2File = project.data.files.find(f => f.name === 'Categories_Pathways_Feature_Phase2');

  if (!phase2File) {
    console.log('❌ File not found');
    return;
  }

  const code = phase2File.source;
  
  // Find the discoverNovelPathwaysWithAI_ function
  const funcStart = code.indexOf('function discoverNovelPathwaysWithAI_');
  if (funcStart === -1) {
    console.log('❌ Function not found');
    return;
  }
  
  const funcEnd = code.indexOf('\nfunction ', funcStart + 10);
  const funcCode = code.substring(funcStart, funcEnd !== -1 ? funcEnd : funcStart + 5000);
  
  console.log('🔍 Checking for common issues:\n');
  
  // Check for "Spreadsheet App" typo
  if (funcCode.indexOf('Spreadsheet App') !== -1) {
    console.log('❌ FOUND TYPO: "Spreadsheet App" (has space!)');
    console.log('   Should be: "SpreadsheetApp" (no space)');
    const line = funcCode.substring(0, funcCode.indexOf('Spreadsheet App'));
    const lineNum = line.split('\n').length;
    console.log('   Approximate line: ' + lineNum + ' in function\n');
  } else {
    console.log('✅ No "Spreadsheet App" typo found\n');
  }
  
  // Extract first 30 lines
  console.log('📝 First 30 lines of discoverNovelPathwaysWithAI_:\n');
  const lines = funcCode.split('\n').slice(0, 30);
  lines.forEach((line, idx) => {
    console.log('   ' + (idx + 1).toString().padStart(3) + ': ' + line);
  });
  
  console.log('\n');
}

findIssue().catch(console.error);
