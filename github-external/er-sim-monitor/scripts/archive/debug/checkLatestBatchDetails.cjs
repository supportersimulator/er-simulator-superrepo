#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function checkBatchDetails() {
  console.log('Checking current batch implementation...\n');

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

  // Check startBatchFromSidebar return value
  const startFunc = source.match(/function startBatchFromSidebar[\s\S]{0,2000}/);
  const returnMatch = startFunc ? startFunc[0].match(/return `Batch queued[\s\S]{0,50}/g) : null;

  console.log('═══════════════════════════════════════════════════');
  console.log('1. What startBatchFromSidebar returns:');
  console.log('═══════════════════════════════════════════════════');
  if (returnMatch) {
    returnMatch.forEach(r => console.log('  ' + r));
  }
  console.log('');

  // Check loopStep
  const loopFunc = source.match(/function loopStep\(\)\{[\s\S]{0,1500}/);
  
  console.log('═══════════════════════════════════════════════════');
  console.log('2. Current loopStep() implementation:');
  console.log('═══════════════════════════════════════════════════');
  if (loopFunc) {
    console.log(loopFunc[0].substring(0, 800));
  }
  console.log('');

  // Check if there are TWO different runSingleStepBatch functions
  const batchFuncs = source.match(/function runSingleStepBatch[\s\S]{0,100}/g);
  console.log('═══════════════════════════════════════════════════');
  console.log('3. How many runSingleStepBatch functions exist:');
  console.log('═══════════════════════════════════════════════════');
  console.log('Count: ' + (batchFuncs ? batchFuncs.length : 0));
  console.log('');
}

checkBatchDetails().catch(err => console.error('Error:', err.message));
