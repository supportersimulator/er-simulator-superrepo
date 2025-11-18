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

  // Find where we build the dictionary
  const buildMatch = codeFile.source.match(/categorizationData\[caseID\]\s*=\s*\{[\s\S]{0,300}\};/);

  if (buildMatch) {
    console.log('Current dictionary building code:\n');
    console.log(buildMatch[0]);
    console.log('\n══════════════════════════════════════════════════════════════\n');
    console.log('Need to add: symptomName: row[14]  // Column O: Final_Symptom_Name\n');
  }

  // Find applyCategorizationUpdates
  const applyMatch = codeFile.source.match(/\/\/ Get full symptom name from mapping[\s\S]{0,200}symptomName[\s\S]{0,100};/);

  if (applyMatch) {
    console.log('Current symptomName lookup code:\n');
    console.log(applyMatch[0]);
    console.log('\n══════════════════════════════════════════════════════════════\n');
    console.log('Need to change to: const symptomName = cat.symptomName || cat.symptom;\n');
  }
}

main().catch(console.error);
