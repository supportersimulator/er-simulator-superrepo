const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SCRIPT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

function getOAuth2Client() {
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const tokenPath = path.join(__dirname, '../config/token.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const { client_id, client_secret, redirect_uris } = credentials.installed;
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oauth2Client.setCredentials(token);
  return oauth2Client;
}

async function checkBeforeOnOpen() {
  const auth = getOAuth2Client();
  const script = google.script({ version: 'v1', auth });
  const res = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const codeFile = res.data.files.find(f => f.name === 'Code');

  const onOpenIndex = codeFile.source.indexOf('function onOpen()');

  console.log('CODE BEFORE onOpen():');
  console.log('═══════════════════════════════════════════════════════════════');

  const beforeOnOpen = codeFile.source.substring(0, onOpenIndex);
  const lines = beforeOnOpen.split('\n');

  console.log('Total lines before onOpen: ' + lines.length);
  console.log('\nLast 50 lines before onOpen:');
  console.log('─────────────────────────────────────────────────────────');

  lines.slice(-50).forEach((line, i) => {
    const lineNum = lines.length - 50 + i + 1;
    console.log(lineNum + ': ' + line);
  });

  console.log('─────────────────────────────────────────────────────────');

  // Check syntax
  const openBraces = (beforeOnOpen.match(/{/g) || []).length;
  const closeBraces = (beforeOnOpen.match(/}/g) || []).length;
  const openParens = (beforeOnOpen.match(/\(/g) || []).length;
  const closeParens = (beforeOnOpen.match(/\)/g) || []).length;

  console.log('\nSyntax check before onOpen:');
  console.log('Braces: ' + openBraces + ' open, ' + closeBraces + ' close (diff: ' + (openBraces - closeBraces) + ')');
  console.log('Parens: ' + openParens + ' open, ' + closeParens + ' close (diff: ' + (openParens - closeParens) + ')');

  if (openBraces !== closeBraces) {
    console.log('❌ UNBALANCED BRACES - onOpen will never execute!');
  }
  if (openParens !== closeParens) {
    console.log('❌ UNBALANCED PARENS - onOpen will never execute!');
  }
}

checkBeforeOnOpen().catch(console.error);
