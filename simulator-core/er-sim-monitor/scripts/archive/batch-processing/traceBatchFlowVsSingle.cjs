#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function traceBatchFlow() {
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

  console.log('\n═══════════════════════════════════════════════════');
  console.log('TRACING: Why batch queue becomes empty');
  console.log('═══════════════════════════════════════════════════\n');

  // Check if there are TWO runSingleStepBatch functions
  const matches = [];
  let idx = 0;
  while ((idx = source.indexOf('function runSingleStepBatch', idx)) !== -1) {
    matches.push(idx);
    idx += 10;
  }

  console.log(`Found ${matches.length} runSingleStepBatch function(s)\n`);

  if (matches.length > 1) {
    console.log('❌ PROBLEM: Multiple runSingleStepBatch functions detected!\n');
    matches.forEach((pos, i) => {
      const snippet = source.substring(pos, pos + 300);
      console.log(`Function #${i + 1} at position ${pos}:`);
      console.log('─────────────────────────────────────────────────');
      console.log(snippet);
      console.log('\n');
    });
  }

  // Check what loopStep currently does
  const loopMatch = source.match(/function loopStep\(\)\{[\s\S]{0,1200}/);
  if (loopMatch) {
    console.log('Current loopStep() implementation:');
    console.log('═══════════════════════════════════════════════════');
    console.log(loopMatch[0]);
    console.log('═══════════════════════════════════════════════════\n');

    if (loopMatch[0].includes('runSingleCaseFromSidebar')) {
      console.log('✅ loopStep DOES call runSingleCaseFromSidebar\n');
    } else {
      console.log('❌ loopStep does NOT call runSingleCaseFromSidebar\n');
    }
  }

  // Check the actual runSingleStepBatch being called
  const batchFunc = source.match(/function runSingleStepBatch\(\)[\s\S]{0,1500}/);
  if (batchFunc) {
    console.log('Current runSingleStepBatch() implementation:');
    console.log('═══════════════════════════════════════════════════');
    console.log(batchFunc[0].substring(0, 800));
    console.log('═══════════════════════════════════════════════════\n');

    if (batchFunc[0].includes('processOneInputRow_')) {
      console.log('⚠️  runSingleStepBatch STILL processes rows internally!\n');
      console.log('This is the problem - it should just return the row number.\n');
    } else if (batchFunc[0].includes('inputSheetName:')) {
      console.log('✅ runSingleStepBatch returns row data (correct)\n');
    }
  }
}

traceBatchFlow().catch(err => console.error('Error:', err.message));
