const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SCRIPT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

function getOAuth2Client() {
  const clasprcPath = path.join(process.env.HOME, '.clasprc.json');
  const credentials = JSON.parse(fs.readFileSync(clasprcPath, 'utf8'));
  const token = credentials.tokens.default;
  const oauth2Client = new google.auth.OAuth2(token.client_id, token.client_secret);
  oauth2Client.setCredentials({
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    token_type: token.token_type,
    expiry_date: token.expiry_date
  });
  return oauth2Client;
}

async function findFunction() {
  const auth = getOAuth2Client();
  const script = google.script({ version: 'v1', auth });
  const getResponse = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = getResponse.data.files;

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('FINDING openUltimateCategorization FUNCTION:');
  console.log('═══════════════════════════════════════════════════════════════\n');

  files.forEach(f => {
    if (f.source && f.source.includes('function openUltimateCategorization')) {
      console.log(`Found in: ${f.name}\n`);

      // Extract a larger portion to see what it does
      const lines = f.source.split('\n');
      const startIdx = lines.findIndex(l => l.includes('function openUltimateCategorization'));

      if (startIdx !== -1) {
        console.log('Function code:');
        console.log('─────────────────────────────────────────────────────────────\n');
        const functionLines = lines.slice(startIdx, startIdx + 30);
        functionLines.forEach((line, i) => {
          console.log(`${startIdx + i + 1}: ${line}`);
        });
        console.log('\n─────────────────────────────────────────────────────────────');
      }
    }
  });

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('SUMMARY:');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('This will show us which file the menu actually uses to run the');
  console.log('categorization tool.');
}

findFunction().catch(console.error);
