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

  // Find all functions that contain "categorization" and "resultsSheet"
  const matches = [...codeFile.source.matchAll(/function ([a-zA-Z_]+)\([^)]*\)[^{]*\{[\s\S]{0,500}resultsSheet[\s\S]{0,500}categorizationData/g)];

  console.log('Found functions that build categorizationData:\n');
  matches.forEach((match, idx) => {
    console.log((idx + 1) + '. ' + match[1]);
  });
}

main().catch(console.error);
