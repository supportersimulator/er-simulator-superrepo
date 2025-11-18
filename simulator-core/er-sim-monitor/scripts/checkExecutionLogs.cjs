const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function checkLogs() {
  console.log('📋 Checking recent Apps Script execution logs...\n');
  
  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);
  
  const script = google.script({ version: 'v1', auth: oAuth2Client });
  const scriptId = process.env.APPS_SCRIPT_ID;
  
  try {
    const executions = await script.projects.executions.list({
      scriptId: scriptId,
      pageSize: 10
    });
    
    if (!executions.data.executions || executions.data.executions.length === 0) {
      console.log('⚠️  No recent executions found');
      return;
    }
    
    console.log('Found ' + executions.data.executions.length + ' recent executions:\n');
    
    executions.data.executions.forEach((exec, i) => {
      console.log((i + 1) + '. Function: ' + (exec.functionName || 'unknown'));
      console.log('   Status: ' + (exec.status || 'unknown'));
      console.log('   Time: ' + (exec.createTime || 'unknown'));
      if (exec.error) {
        console.log('   Error: ' + exec.error.message);
      }
      console.log('');
    });
  } catch (error) {
    console.log('⚠️  Could not retrieve execution logs');
    console.log('Error: ' + error.message);
  }
}

checkLogs().catch(console.error);
