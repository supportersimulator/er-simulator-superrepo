/**
 * Check Apply Function in Deployed Code
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Checking Apply function in deployed Code.gs\n');

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
    console.log('❌ Code.gs not found');
    return;
  }

  // Search for any function with "apply" and "categor" (case insensitive)
  const applyFunctions = codeFile.source.match(/function\s+\w*[Aa]pply\w*[Cc]ategor\w*[\s\S]*?(?=\nfunction|\n\/\*\*\*|$)/g);

  if (!applyFunctions || applyFunctions.length === 0) {
    console.log('❌ No Apply categorization functions found\n');
    console.log('Searching for any mentions of "Category_Symptom"...\n');

    if (codeFile.source.includes('Category_Symptom')) {
      const lines = codeFile.source.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('Category_Symptom')) {
          console.log('Line ' + (index + 1) + ': ' + line.trim());
        }
      });
    } else {
      console.log('❌ No mentions of "Category_Symptom" found in Code.gs');
    }

    console.log('\n');
    console.log('Let me search for column X and Y references...\n');

    if (codeFile.source.includes('Column X') || codeFile.source.includes('Column Y')) {
      const lines = codeFile.source.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('Column X') || line.includes('Column Y')) {
          console.log('Line ' + (index + 1) + ': ' + line.trim());
        }
      });
    }

    return;
  }

  console.log('✅ Found ' + applyFunctions.length + ' Apply function(s):\n');

  applyFunctions.forEach((func, i) => {
    const funcName = func.match(/function\s+(\w+)/)[1];
    console.log('══════════════════════════════════════════════════════════════');
    console.log('Function ' + (i + 1) + ': ' + funcName);
    console.log('══════════════════════════════════════════════════════════════\n');

    // Show first 50 lines
    const lines = func.split('\n').slice(0, 50);
    lines.forEach((line, index) => {
      console.log((index + 1) + ': ' + line);
    });

    if (func.split('\n').length > 50) {
      console.log('\n... (truncated, showing first 50 lines)');
    }

    console.log('\n');
  });
}

main().catch(console.error);
