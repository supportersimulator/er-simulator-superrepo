const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function check() {
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
  
  const funcMatch = codeFile.source.match(/function getAccronymMapping\(\)[\s\S]*?(?=\nfunction [a-zA-Z]|\n\/\/)/);
  
  if (funcMatch) {
    console.log('getAccronymMapping function:');
    console.log('');
    console.log(funcMatch[0]);
  } else {
    console.log('Function not found');
  }
}

check().catch(console.error);
