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

async function readScriptLine(lineNum) {
  const script = createAppsScriptClient();
  const getResponse = await script.projects.getContent({
    scriptId: APPS_SCRIPT_ID
  });

  const codeFile = getResponse.data.files.find(f => f.name === 'Code');
  const lines = codeFile.source.split('\n');

  console.log(`Line ${lineNum - 2}: ${lines[lineNum - 3]}`);
  console.log(`Line ${lineNum - 1}: ${lines[lineNum - 2]}`);
  console.log(`Line ${lineNum}: ${lines[lineNum - 1]}`);
  console.log(`Line ${lineNum + 1}: ${lines[lineNum]}`);
  console.log(`Line ${lineNum + 2}: ${lines[lineNum + 1]}`);
}

readScriptLine(1162).catch(console.error);
