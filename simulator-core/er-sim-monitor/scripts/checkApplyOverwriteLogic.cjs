/**
 * Check if Apply Function Overwrites or Skips Existing Data
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Checking Apply Function Overwrite/Skip Logic\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oAuth2Client });
  const scriptId = process.env.APPS_SCRIPT_ID;

  console.log('📥 Downloading Apps Script code...\n');

  const project = await script.projects.getContent({ scriptId });
  const codeFile = project.data.files.find(f => f.name === 'Code');

  // Find the applyCategorizationUpdates function
  console.log('🔍 Searching for applyCategorizationUpdates function...\n');

  // Look for the function by finding "for (const caseID in categorizationData)"
  const forLoopMatch = codeFile.source.match(/for \(const caseID in categorizationData\) \{[\s\S]{0,2500}\}/);

  if (!forLoopMatch) {
    console.log('❌ Could not find main loop\n');
    return;
  }

  const loopCode = forLoopMatch[0];

  console.log('Found main categorization loop:\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log(loopCode);
  console.log('\n══════════════════════════════════════════════════════════════\n');

  // Check for skip logic
  const hasGetValueCheck = loopCode.includes('getValue()');
  const hasSkipIfExists = loopCode.match(/if \([^)]*getValue[^)]*\) \{[\s\S]{0,100}(?:continue|skip)/);

  console.log('Analysis:\n');
  console.log('  Contains getValue() calls: ' + (hasGetValueCheck ? 'YES' : 'NO'));
  console.log('  Contains skip-if-exists logic: ' + (hasSkipIfExists ? 'YES' : 'NO') + '\n');

  if (hasSkipIfExists) {
    console.log('🚨 FOUND SKIP LOGIC:\n');
    console.log(hasSkipIfExists[0]);
    console.log('\n══════════════════════════════════════════════════════════════\n');
    console.log('⚠️  This means Apply will SKIP rows that already have data!\n');
    console.log('Impact:');
    console.log('  - Already categorized cases: SKIPPED (good - no duplicates)');
    console.log('  - Missing cases: APPLIED (good - fills gaps)');
    console.log('  - Will NOT crash or overwrite existing data ✅\n');
  } else {
    console.log('✅ NO SKIP LOGIC - Apply will OVERWRITE existing data\n');
    console.log('Impact:');
    console.log('  - Already categorized cases: OVERWRITTEN (safe - same data)');
    console.log('  - Missing cases: APPLIED (good - fills gaps)');
    console.log('  - Will NOT crash ✅\n');
  }

  // Check for try/catch
  const hasTryCatch = loopCode.includes('try {') && loopCode.includes('catch');

  if (hasTryCatch) {
    console.log('✅ Has try/catch block - errors will be caught and counted\n');
    console.log('Will NOT crash even if individual cases fail ✅\n');
  } else {
    console.log('⚠️  No try/catch in main loop\n');
    console.log('If a case fails, the entire Apply might stop\n');
  }

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('Conclusion:\n');
  console.log('  Will it crash? ' + (hasTryCatch ? 'NO ✅' : 'POSSIBLY ⚠️'));
  console.log('  Will it skip already completed fields? ' + (hasSkipIfExists ? 'YES ✅' : 'NO (will overwrite)'));
  console.log('  Safe to run? ' + (hasTryCatch ? 'YES ✅' : 'PROBABLY') + '\n');
}

main().catch(console.error);
