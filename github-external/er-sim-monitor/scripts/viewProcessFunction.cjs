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

async function viewProcessFunction() {
  const script = createAppsScriptClient();
  const getResponse = await script.projects.getContent({
    scriptId: APPS_SCRIPT_ID
  });

  const codeFile = getResponse.data.files.find(f => f.name === 'Code');
  const lines = codeFile.source.split('\n');

  // Show lines 1180-1220
  console.log('Lines 1180-1220 (around where input is read):\n');
  for (let i = 1179; i < Math.min(1220, lines.length); i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}

viewProcessFunction().catch(console.error);
