#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function checkLoopStepCode() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oauth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oauth2Client });
  const response = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const source = response.data.files.find(f => f.name === 'Code').source;

  const loopStepIdx = source.indexOf('function loopStep(){');
  const loopStepEnd = source.indexOf('\n    function', loopStepIdx + 50);
  const loopStepCode = source.substring(loopStepIdx, loopStepEnd);

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('FULL loopStep FUNCTION:');
  console.log('═══════════════════════════════════════════════════');
  console.log(loopStepCode);
  console.log('═══════════════════════════════════════════════════');
}

checkLoopStepCode().catch(err => console.error('Error:', err.message));
