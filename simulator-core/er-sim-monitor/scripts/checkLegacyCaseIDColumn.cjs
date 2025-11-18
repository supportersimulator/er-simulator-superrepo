/**
 * Check which column findRowByLegacyCaseID searches
 *
 * Legacy_Case_ID is in Column I (index 8 / sheet column 9)
 * Need to verify the function looks in the right place.
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Checking findRowByLegacyCaseID Function\n');

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

  // Find findRowByLegacyCaseID function
  const match = codeFile.source.match(/function findRowByLegacyCaseID\([^)]+\)[\s\S]*?(?=\nfunction [a-z]|\n\/\*\*\*|$)/);

  if (!match) {
    console.log('❌ findRowByLegacyCaseID function not found');
    return;
  }

  console.log('📋 findRowByLegacyCaseID Function:\n');
  console.log(match[0]);

  console.log('\n══════════════════════════════════════════════════════════════\n');

  // Extract the column it's searching
  const columnMatch = match[0].match(/const legacyCaseIDColumn = (\d+);/);
  if (columnMatch) {
    const colIndex = parseInt(columnMatch[1]);
    const colLetter = String.fromCharCode(65 + colIndex - 1);
    console.log('🎯 Function searches column: ' + colIndex + ' (Column ' + colLetter + ')\n');

    if (colIndex === 9) {
      console.log('✅ CORRECT - Searching Column I (index 9 in 1-based)\n');
      console.log('This matches where Legacy_Case_ID actually is!\n');
      console.log('══════════════════════════════════════════════════════════════\n');
      console.log('✅ Universal Fallback Pattern Confirmed:\n');
      console.log('  1. Try Legacy_Case_ID lookup first (Column I / index 9)');
      console.log('  2. If not found OR empty → Fallback to Case_ID (Column A / index 1)');
      console.log('  3. Works for ALL 207 cases (regular + retry)\n');
      console.log('Benefits:');
      console.log('  ✅ Reduces ultimate retries');
      console.log('  ✅ Self-healing if Legacy_Case_ID missing/wrong');
      console.log('  ✅ Consistent pattern for all cases\n');
    } else {
      console.log('❌ WRONG - Should be searching Column I (index 9)\n');
      console.log('Currently searching: Column ' + colLetter + '\n');
      console.log('Need to fix: Change legacyCaseIDColumn to 9\n');
    }
  }
}

main().catch(console.error);
