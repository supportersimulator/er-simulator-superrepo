const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function listFiles() {
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
  const files = project.data.files;
  
  console.log('Files in Apps Script project:');
  files.forEach(f => {
    console.log('  - ' + f.name + ' (' + f.type + ')');
  });
}

listFiles().catch(console.error);
