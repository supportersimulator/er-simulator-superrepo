#!/usr/bin/env node

/**
 * List actual column names in the spreadsheet
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SPREADSHEET_ID = '1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI';

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

async function listColumns() {
  console.log('\n📋 LISTING ACTUAL COLUMN NAMES\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    const headerData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Master Scenario Convert!1:2'
    });

    const tier1 = headerData.data.values[0];
    const tier2 = headerData.data.values[1];

    console.log(`Total columns: ${tier2.length}\n`);
    console.log('First 100 columns (Tier2 header):\n');

    for (let i = 0; i < Math.min(100, tier2.length); i++) {
      console.log(`   [${i}] ${tier2[i]}`);
    }

    // Search for key terms
    console.log('\n\n🔍 Searching for key terms:\n');

    const searchTerms = [
      'diagnosis', 'chief', 'complaint',
      'overview', 'presim', 'postsim',
      'learning', 'outcomes', 'objectives',
      'category', 'pathway', 'difficulty', 'duration',
      'age', 'gender', 'patient',
      'vitals', 'initial', 'hr', 'bp',
      'exam', 'findings', 'medications', 'history', 'allergies',
      'environment', 'disposition', 'setting'
    ];

    searchTerms.forEach(term => {
      const matches = [];
      tier2.forEach((col, idx) => {
        if (col.toLowerCase().includes(term.toLowerCase())) {
          matches.push(`[${idx}] ${col}`);
        }
      });

      if (matches.length > 0) {
        console.log(`\n"${term}" found in ${matches.length} columns:`);
        matches.slice(0, 5).forEach(m => console.log(`   ${m}`));
        if (matches.length > 5) {
          console.log(`   ... and ${matches.length - 5} more`);
        }
      }
    });

    console.log('\n═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('❌ Error:', e.message, '\n');
  }
}

listColumns().catch(console.error);
