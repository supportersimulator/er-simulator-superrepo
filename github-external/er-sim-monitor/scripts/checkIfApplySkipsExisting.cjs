/**
 * Check if Apply Function Skips Rows with Existing Data
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Checking if Apply Skips Existing Categories\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oAuth2Client });
  const scriptId = process.env.APPS_SCRIPT_ID;

  const project = await script.projects.getContent({ scriptId });
  const codeFile = project.data.files.find(f => f.name === 'Code');

  // Find applyCategorizationUpdates function
  const funcMatch = codeFile.source.match(/function applyCategorizationUpdates\(categorizationData, masterSheet\)[\s\S]{0,4000}return \{ updated: updated, errors: errors \};/);

  if (!funcMatch) {
    console.log('Function not found');
    return;
  }

  const funcCode = funcMatch[0];

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('Searching for skip logic...\n');

  // Check for existing data check
  const hasExistingCheck = funcCode.match(/getRange\(row, \d+\)\.getValue\(\)/g);
  const hasIfSkip = funcCode.match(/if \([^)]*getValue[^)]*\) \{[\s\S]{0,100}continue;/);

  if (hasExistingCheck) {
    console.log('✅ FOUND getValue() calls - function checks existing values!\n');
    console.log('getValue() calls found: ' + hasExistingCheck.length + '\n');
  }

  if (hasIfSkip) {
    console.log('🚨 FOUND SKIP LOGIC!\n');
    console.log(hasIfSkip[0]);
    console.log('\n══════════════════════════════════════════════════════════════\n');
    console.log('This is why 49 cases were skipped!\n');
    console.log('The function checks if category data already exists,');
    console.log('and if it does, it skips that row.\n');
    console.log('Solution: Need to either:');
    console.log('  1. Clear columns P/Q/R/S for the 49 missing cases');
    console.log('  2. Remove the skip logic from the Apply function\n');
  } else {
    console.log('No skip logic found. Let me show the full function:\n');
    console.log('══════════════════════════════════════════════════════════════\n');
    console.log(funcCode.substring(0, 2000));
    console.log('\n...(truncated)\n');
  }
}

main().catch(console.error);
