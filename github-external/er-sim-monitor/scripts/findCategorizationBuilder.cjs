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

  // Find where we build the dictionary with caseID as key
  const matches = [...codeFile.source.matchAll(/categorizationData\[caseID\]\s*=\s*\{[\s\S]{0,300}\}/g)];

  console.log('Found ' + matches.length + ' places where categorizationData is built\n');

  if (matches.length > 0) {
    // Find the function containing this
    const firstMatch = matches[0];
    const position = codeFile.source.indexOf(firstMatch[0]);
    
    // Look backward to find function name
    const beforeCode = codeFile.source.substring(Math.max(0, position - 1000), position);
    const funcMatch = beforeCode.match(/function\s+([a-zA-Z_]+)\s*\([^)]*\)\s*\{[^}]*$/);
    
    if (funcMatch) {
      console.log('Function name: ' + funcMatch[1] + '\n');
      console.log('Current structure:\n');
      console.log(firstMatch[0]);
    }
  }
}

main().catch(console.error);
