const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function verify() {
  console.log('🔍 Verifying ACLS filter in deployed Code.gs...\n');
  
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
  
  if (!codeFile) {
    console.log('Code.gs not found');
    return;
  }
  
  console.log('Checking for ACLS filter code...\n');
  
  const hasFilter = codeFile.source.includes(".filter(symptom => symptom !== 'ACLS')");
  const hasACLSRule = codeFile.source.includes('ACLS RULE (VERY IMPORTANT)');
  const hasClearOnStart = codeFile.source.includes('Clear old results sheet immediately');
  
  console.log('ACLS filter present:', hasFilter ? 'YES' : 'NO');
  console.log('ACLS rule in prompt:', hasACLSRule ? 'YES' : 'NO');
  console.log('Clear on start present:', hasClearOnStart ? 'YES' : 'NO');
  console.log('');
  
  if (hasFilter) {
    const filterContext = codeFile.source.substring(
      codeFile.source.indexOf('.filter(symptom') - 100,
      codeFile.source.indexOf('.filter(symptom') + 150
    );
    console.log('Filter code context:');
    console.log(filterContext);
  } else {
    console.log('PROBLEM: ACLS filter NOT found in Code.gs');
    console.log('The deployment may have failed or been overwritten.');
    console.log('');
    console.log('Looking for accronymMapping usage:');
    const accronymMatches = codeFile.source.match(/Object\.keys\(accronymMapping\)[^\n]*/g);
    if (accronymMatches) {
      accronymMatches.forEach(match => {
        console.log('  Found: ' + match);
      });
    }
  }
}

verify().catch(console.error);
