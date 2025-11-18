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

async function checkAllFiles() {
  const auth = getOAuth2Client();
  const script = google.script({ version: 'v1', auth });

  console.log('🔍 Checking all files in Apps Script project...\n');

  const getResponse = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = getResponse.data.files;

  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`TOTAL FILES: ${files.length}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  files.forEach((file, index) => {
    console.log(`${index + 1}. ${file.name} (${file.type})`);

    // Check for onOpen function
    if (file.source && file.source.includes('function onOpen')) {
      console.log('   ✅ Contains onOpen() function');
    }

    // Check for menu creation
    if (file.source && file.source.includes('addMenu')) {
      console.log('   ✅ Contains menu creation');
    }

    // Check file size
    if (file.source) {
      const lines = file.source.split('\n').length;
      console.log(`   📄 ${lines} lines`);
    }

    console.log('');
  });

  // Find the Code file specifically
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('CHECKING FOR MAIN CODE FILE:');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const codeFile = files.find(f => f.name === 'Code');
  if (codeFile) {
    console.log('✅ Code.gs file found');
    console.log(`   Lines: ${codeFile.source.split('\n').length}`);

    // Check if onOpen exists
    if (codeFile.source.includes('function onOpen')) {
      console.log('   ✅ onOpen() function exists');

      // Extract onOpen function
      const onOpenMatch = codeFile.source.match(/function onOpen\(\)[^{]*{[\s\S]*?(?=\n\nfunction|\n\/\/|\nvar|\nconst|$)/);
      if (onOpenMatch) {
        console.log('\n   📋 onOpen() function content:');
        console.log('   ─────────────────────────────────────────────────────────');
        console.log(onOpenMatch[0].split('\n').slice(0, 30).map(line => '   ' + line).join('\n'));
        console.log('   ─────────────────────────────────────────────────────────');
      }
    } else {
      console.log('   ❌ onOpen() function NOT FOUND');
    }
  } else {
    console.log('❌ Code.gs file NOT FOUND');
  }
}

checkAllFiles().catch(console.error);
