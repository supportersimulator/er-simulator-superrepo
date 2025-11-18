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

async function findWhichFileIsUsed() {
  const auth = getOAuth2Client();
  const script = google.script({ version: 'v1', auth });
  const getResponse = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = getResponse.data.files;

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('FINDING WHICH FILE IS ACTUALLY BEING USED:');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Check which files have openUltimateCategorization
  const filesWithOpen = files.filter(f => f.source && f.source.includes('function openUltimateCategorization'));

  console.log('Files with openUltimateCategorization():');
  filesWithOpen.forEach((f, i) => {
    console.log(`  ${i + 1}. ${f.name}`);
  });

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('CHECKING FILE ORDER (Apps Script uses first match):');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Apps Script executes files in the order they appear in the project
  // The FIRST file with openUltimateCategorization() will be used
  console.log('Files in project order:');
  files.forEach((f, i) => {
    const hasOpen = f.source && f.source.includes('function openUltimateCategorization');
    const hasRun = f.source && f.source.includes('function runUltimateCategorization');

    console.log(`  ${i + 1}. ${f.name}`);
    if (hasOpen) console.log(`     ✅ Has openUltimateCategorization()`);
    if (hasRun) console.log(`     ✅ Has runUltimateCategorization()`);
  });

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('RECOMMENDATION:');
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (filesWithOpen.length > 1) {
    console.log('⚠️  PROBLEM: Multiple files have the same function!');
    console.log('   Apps Script will use the FIRST one it finds.');
    console.log(`   The file being used is likely: ${filesWithOpen[0].name}`);
    console.log('');
    console.log('SOLUTION: Update BOTH files or delete one of them.');
  }
}

findWhichFileIsUsed().catch(console.error);
