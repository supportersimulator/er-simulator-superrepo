/**
 * Check Apply Function Error Handling
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
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

  // Find apply Updates function
  const match = codeFile.source.match(/function applyCategorizationUpdates[\s\S]{0,3000}return \{ updated: updated, errors: errors \};/);

  if (match) {
    console.log('applyCategorizationUpdates function:\n');
    console.log('══════════════════════════════════════════════════════════════\n');
    console.log(match[0]);
    console.log('\n══════════════════════════════════════════════════════════════\n');

    // Check for try/catch
    const hasTryCatch = match[0].includes('try {') && match[0].includes('catch');
    const hasErrorsIncrement = match[0].includes('errors++');

    console.log('Error Handling Analysis:\n');
    console.log('  Has try/catch: ' + hasTryCatch);
    console.log('  Increments errors counter: ' + hasErrorsIncrement + '\n');

    if (hasTryCatch && hasErrorsIncrement) {
      console.log('✅ Errors ARE being caught and counted.\n');
      console.log('But success message showed "Errors: 0"...\n');
      console.log('This means no exceptions were thrown during Apply.\n');
      console.log('The writes must have succeeded but went to wrong location?\n');
    }
  }
}

main().catch(console.error);
