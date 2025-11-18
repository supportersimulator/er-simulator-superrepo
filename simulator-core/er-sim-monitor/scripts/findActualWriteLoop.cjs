/**
 * Find the Actual Write Loop in applyCategorizationUpdates
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Finding Actual Write Loop\n');

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

  // Find code that writes to columns 16, 17, 18, 19
  const writeMatches = [...codeFile.source.matchAll(/masterSheet\.getRange\(row, (?:16|17|18|19)\)\.setValue[^;]+;/g)];

  console.log('Found ' + writeMatches.length + ' setValue() calls to columns 16-19\n');

  if (writeMatches.length > 0) {
    // Get context around first write
    const firstWrite = writeMatches[0];
    const position = firstWrite.index;
    const contextStart = Math.max(0, position - 800);
    const contextEnd = Math.min(codeFile.source.length, position + 400);
    const context = codeFile.source.substring(contextStart, contextEnd);

    console.log('══════════════════════════════════════════════════════════════\n');
    console.log('Context around write operations:\n');
    console.log(context);
    console.log('\n══════════════════════════════════════════════════════════════\n');

    // Check for try/catch
    const hasTryCatch = context.includes('try {') && context.includes('catch');
    const hasErrorsCounter = context.includes('errors++');

    console.log('Safety Analysis:\n');
    console.log('  Has try/catch: ' + (hasTryCatch ? 'YES ✅' : 'NO ⚠️'));
    console.log('  Has errors counter: ' + (hasErrorsCounter ? 'YES ✅' : 'NO ⚠️'));
    console.log('  Writes to columns 16-19: ' + writeMatches.length + ' ✅\n');

    if (hasTryCatch && hasErrorsCounter) {
      console.log('✅ SAFE: Errors are caught and counted, won\'t crash!\n');
    } else if (hasTryCatch) {
      console.log('⚠️  Has error handling but might not count errors properly\n');
    } else {
      console.log('⚠️  No error handling - might crash on first error\n');
    }
  }
}

main().catch(console.error);
