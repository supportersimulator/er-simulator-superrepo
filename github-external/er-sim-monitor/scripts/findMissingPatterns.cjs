#!/usr/bin/env node

/**
 * FIND MISSING PATTERNS
 * Search for fields that match the concepts of our missing patterns
 */

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

async function findFields() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Fetching all field names from spreadsheet...\n');

    const result = await script.scripts.run({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: {
        function: 'getAvailableFields',
        devMode: false
      }
    });

    const fields = result.data.response.result.map(f => f.name);

    console.log(`Found ${fields.length} total fields\n`);

    // Missing patterns from logs
    const missingPatterns = [
      'Chief_Complaint',
      'Final_Vitals',
      'Diagnosis',
      'Clinical_Features',
      'Differential',
      'Critical_Actions',
      'Time_Sensitive',
      'Learning_Outcomes',
      'Teaching_Points',
      'Pitfalls',
      'Performance_Benchmarks'
    ];

    console.log('Searching for fields matching missing patterns:\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    missingPatterns.forEach(pattern => {
      // Search for fields containing key words from the pattern
      const keywords = pattern.split('_');
      const matches = fields.filter(field => {
        const fieldLower = field.toLowerCase();
        // Must match ALL keywords (case insensitive)
        return keywords.every(kw => fieldLower.includes(kw.toLowerCase()));
      });

      if (matches.length > 0) {
        console.log(`✅ "${pattern}":`);
        matches.forEach(m => console.log(`   → ${m}`));
      } else {
        // Try partial match (at least 1 keyword)
        const partialMatches = fields.filter(field => {
          const fieldLower = field.toLowerCase();
          return keywords.some(kw => fieldLower.includes(kw.toLowerCase()));
        });

        if (partialMatches.length > 0 && partialMatches.length <= 10) {
          console.log(`⚠️ "${pattern}" (no exact match, showing partial):`);
          partialMatches.slice(0, 5).forEach(m => console.log(`   → ${m}`));
        } else {
          console.log(`❌ "${pattern}": NO MATCHES`);
        }
      }
      console.log();
    });

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

findFields();
