#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const OAUTH_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const OAUTH_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const APPS_SCRIPT_ID = process.env.APPS_SCRIPT_ID;

function loadToken() {
  const tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  return tokenData;
}

function createAppsScriptClient() {
  const oauth2Client = new google.auth.OAuth2(
    OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  const token = loadToken();
  oauth2Client.setCredentials(token);
  return google.script({ version: 'v1', auth: oauth2Client });
}

async function findCaseIDValidation() {
  console.log('🔍 Searching for Case ID validation logic...\n');
  
  const script = createAppsScriptClient();
  const getResponse = await script.projects.getContent({
    scriptId: APPS_SCRIPT_ID
  });

  const codeFile = getResponse.data.files.find(f => f.name === 'Code');
  const lines = codeFile.source.split('\n');

  console.log('Looking for Case ID checks...\n');

  // Search for Case ID validation
  const matches = [];
  lines.forEach((line, idx) => {
    if (line.toLowerCase().includes('case') && 
        line.toLowerCase().includes('id') &&
        (line.includes('!') || line.includes('empty') || line.includes('trim') || line.includes('skip'))) {
      matches.push({ lineNum: idx + 1, line: line.trim() });
    }
  });

  console.log(`Found ${matches.length} potential Case ID validation lines:\n`);
  matches.forEach(m => {
    console.log(`Line ${m.lineNum}: ${m.line}`);
  });

  // Look for the processSingleRow function
  const processSingleRowStart = lines.findIndex(l => l.includes('function processSingleRow'));
  if (processSingleRowStart >= 0) {
    console.log(`\n✅ Found processSingleRow function at line ${processSingleRowStart + 1}`);
    console.log('\nShowing first 50 lines of function:\n');
    for (let i = processSingleRowStart; i < Math.min(processSingleRowStart + 50, lines.length); i++) {
      console.log(`${i + 1}: ${lines[i]}`);
    }
  }
}

findCaseIDValidation().catch(console.error);
