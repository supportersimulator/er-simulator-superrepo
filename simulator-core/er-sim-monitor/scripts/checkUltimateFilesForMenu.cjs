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

async function checkFiles() {
  const auth = getOAuth2Client();
  const script = google.script({ version: 'v1', auth });
  const res = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = res.data.files;

  console.log('CHECKING ULTIMATE CATEGORIZATION FILES FOR MENU CODE:');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const fileNames = ['Ultimate_Categorization_Tool_Complete', 'Ultimate_Categorization_Tool_Phase2E'];

  fileNames.forEach(name => {
    const file = files.find(f => f.name === name);
    if (!file) {
      console.log(name + ': NOT FOUND');
      return;
    }

    console.log(name + ':');

    // Check for menu-related code
    const hasOnOpen = file.source.includes('onOpen');
    const hasCreateMenu = file.source.includes('createMenu');
    const hasAddToUi = file.source.includes('addToUi');
    const hasExtendMenu = file.source.includes('extendMenu');

    console.log('  Has onOpen: ' + hasOnOpen);
    console.log('  Has createMenu: ' + hasCreateMenu);
    console.log('  Has addToUi: ' + hasAddToUi);
    console.log('  Has extendMenu: ' + hasExtendMenu);

    if (hasCreateMenu || hasAddToUi || hasExtendMenu) {
      console.log('  ⚠️  THIS FILE HAS MENU CODE!');

      // Search for menu creation
      if (hasCreateMenu) {
        const menuIndex = file.source.indexOf('createMenu');
        const context = file.source.substring(Math.max(0, menuIndex - 300), menuIndex + 700);
        console.log('\n  Menu code context:');
        console.log('  ─────────────────────────────────────────────');
        const lines = context.split('\n');
        lines.forEach(line => console.log('  ' + line.substring(0, 100)));
        console.log('  ─────────────────────────────────────────────');
      }
    } else {
      console.log('  ✅ No menu code found');
    }
    console.log('');
  });

  console.log('═══════════════════════════════════════════════════════════════');
}

checkFiles().catch(console.error);
