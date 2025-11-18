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

async function analyzeCaseIDUsage() {
  const script = createAppsScriptClient();
  const getResponse = await script.projects.getContent({
    scriptId: APPS_SCRIPT_ID
  });

  const codeFile = getResponse.data.files.find(f => f.name === 'Code');
  const lines = codeFile.source.split('\n');

  console.log('🔍 Searching for where "formal" variable is used after reading...\n');
  
  // Find lines 1220-1280 to see how formal is processed
  console.log('Lines 1220-1280:\n');
  for (let i = 1219; i < Math.min(1280, lines.length); i++) {
    if (lines[i].includes('formal') || lines[i].includes('Case_ID') || lines[i].includes('scenario')) {
      console.log(`${i + 1}: ${lines[i]}`);
    }
  }

  console.log('\n\n🔍 Looking for AI prompt construction...\n');
  for (let i = 1220; i < Math.min(1350, lines.length); i++) {
    if (lines[i].includes('const prompt') || lines[i].includes('AI request') || lines[i].includes('UrlFetchApp')) {
      console.log(`${i + 1}: ${lines[i]}`);
    }
  }
}

analyzeCaseIDUsage().catch(console.error);
