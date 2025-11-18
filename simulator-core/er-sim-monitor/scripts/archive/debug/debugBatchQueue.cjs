#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function debugBatchQueue() {
  console.log('Adding diagnostic logging...');

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

  // Check what's currently in runSingleStepBatch
  const funcStart = source.indexOf('function runSingleStepBatch()');
  const funcSnippet = source.substring(funcStart, funcStart + 500);
  
  console.log('Current runSingleStepBatch start:');
  console.log('═══════════════════════════════════════════════════');
  console.log(funcSnippet);
  console.log('═══════════════════════════════════════════════════');
}

debugBatchQueue().catch(err => console.error('Error:', err.message));
