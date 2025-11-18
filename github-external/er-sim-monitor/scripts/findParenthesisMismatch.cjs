#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

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

async function findMismatch() {
  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  const content = await script.projects.getContent({
    scriptId: PRODUCTION_PROJECT_ID
  });

  const code = content.data.files.find(f => f.name === 'Code').source;

  const openParens = (code.match(/\(/g) || []).length;
  const closeParens = (code.match(/\)/g) || []).length;

  console.log('Open parentheses: ' + openParens);
  console.log('Close parentheses: ' + closeParens);
  console.log('Difference: ' + (openParens - closeParens) + '\n');

  if (openParens !== closeParens) {
    console.log('Searching for location of mismatch...\n');

    // Track balance line by line
    const lines = code.split('\n');
    let balance = 0;
    const imbalances = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const open = (line.match(/\(/g) || []).length;
      const close = (line.match(/\)/g) || []).length;
      balance += open - close;

      if (Math.abs(balance) > 10) {
        imbalances.push({
          line: i + 1,
          balance: balance,
          text: line.substring(0, 80).trim()
        });
      }
    }

    console.log('Lines with significant imbalance (> 10):');
    imbalances.slice(-20).forEach(item => {
      console.log('Line ' + item.line + ': balance = ' + item.balance);
      console.log('  ' + item.text);
    });

    console.log('\nFinal balance: ' + balance);
  } else {
    console.log('✅ Parentheses are balanced!');
  }
}

findMismatch().catch(console.error);
