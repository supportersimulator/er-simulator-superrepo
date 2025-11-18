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

  // Search for "already has" or "skip" or "continue" near category writing
  const skipMatches = [...codeFile.source.matchAll(/if \([^)]*(?:getValue|already|existing)[^)]*\) \{[\s\S]{0,150}(?:continue|skip)/gi)];

  console.log('Found ' + skipMatches.length + ' potential skip patterns\n');

  skipMatches.forEach((match, i) => {
    console.log('Match ' + (i+1) + ':\n');
    console.log(match[0]);
    console.log('\n══════════════════════════════════════════════════════════════\n');
  });

  if (skipMatches.length === 0) {
    console.log('No skip logic found. Checking for overwrite logic instead...\n');
    
    const writeMatches = [...codeFile.source.matchAll(/masterSheet\.getRange\(row, (?:16|17|18|19)\)\.setValue/g)];
    console.log('Found ' + writeMatches.length + ' setValue() calls to columns 16-19\n');
  }
}

main().catch(console.error);
