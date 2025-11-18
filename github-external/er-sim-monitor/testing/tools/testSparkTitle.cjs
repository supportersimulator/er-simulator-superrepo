#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const SHEET_NAME = 'Master Scenario Convert';

async function testSparkTitle() {
  console.log('\n🎭 TESTING SPARK TITLE GENERATION\n');
  console.log('━'.repeat(70) + '\n');

  // Auth
  const credentialsPath = path.join(__dirname, '../../config/credentials.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const {client_id, client_secret, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const tokenPath = path.join(__dirname, '../../config/token.json');
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  oAuth2Client.setCredentials(token);

  const sheets = google.sheets({version: 'v4', auth: oAuth2Client});

  // Get 3 random test cases
  const dataResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SHEET_NAME}!3:200`
  });

  const rows = dataResponse.data.values || [];
  const testRows = [10, 50, 100].map(i => ({
    rowNum: i + 3,
    caseId: rows[i][0],
    currentSpark: rows[i][7], // Column H (Spark_Title)
    vitals: rows[i][55] // Column BD (vitals)
  }));

  console.log(`🧪 Testing ${testRows.length} cases:\n`);

  testRows.forEach(test => {
    console.log(`Row ${test.rowNum} (${test.caseId}):`);
    console.log(`   Current: "${test.currentSpark}"`);
    console.log(`   Length: ${test.currentSpark?.length || 0} chars`);

    // Quality checks
    const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(test.currentSpark || '');
    const hasQuestion = (test.currentSpark || '').includes('?');
    const isShort = (test.currentSpark || '').length <= 100;

    console.log(`   Has Emoji: ${hasEmoji ? '✅' : '❌'}`);
    console.log(`   Has Question: ${hasQuestion ? '✅' : '❌'}`);
    console.log(`   Under 100 chars: ${isShort ? '✅' : '❌'}`);
    console.log('');
  });

  // Save results
  const results = {
    timestamp: new Date().toISOString(),
    tool: 'Spark Title Generation',
    totalTested: testRows.length,
    testCases: testRows
  };

  const outputPath = path.join(__dirname, '../results/spark-title-test.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log('━'.repeat(70));
  console.log(`✅ Test results saved: ${outputPath}\n`);

  return results;
}

if (require.main === module) {
  testSparkTitle().catch(err => {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  });
}

module.exports = { testSparkTitle };
