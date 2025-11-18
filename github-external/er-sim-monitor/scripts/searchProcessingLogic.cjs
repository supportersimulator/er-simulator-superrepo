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

async function searchProcessingLogic() {
  const script = createAppsScriptClient();
  const getResponse = await script.projects.getContent({
    scriptId: APPS_SCRIPT_ID
  });

  const codeFile = getResponse.data.files.find(f => f.name === 'Code');
  const code = codeFile.source;

  // Search for the batch processing step function
  const stepMatch = code.match(/function\s+processBatchStep_?\([^)]*\)\s*{([^}]*{[^}]*}[^}]*)*}/s);
  
  if (stepMatch) {
    console.log('Found processBatchStep_ function:\n');
    console.log(stepMatch[0].substring(0, 1500));
    console.log('\n...\n');
  }

  // Search for where rows are read from input
  const lines = code.split('\n');
  console.log('\n🔍 Lines containing "inputSheet" and "getRange":\n');
  lines.forEach((line, idx) => {
    if (line.includes('inputSheet') && line.includes('getRange')) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
  });

  // Search for Case_ID column reference
  console.log('\n🔍 Lines mentioning first column or Case_ID:\n');
  lines.forEach((line, idx) => {
    if ((line.includes('[0]') || line.includes('Case_ID')) && 
        (line.includes('row') || line.includes('data'))) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
  });
}

searchProcessingLogic().catch(console.error);
