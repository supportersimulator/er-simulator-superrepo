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
  const panelFile = project.data.files.find(f => f.name === 'Phase2_Enhanced_Categories_With_AI');

  console.log('🔍 Checking current deployed version...\n');

  // Check for key features in the setTimeout block
  const setTimeoutMatch = panelFile.source.match(/setTimeout\(function\(\) \{[\s\S]{0,3000}\}, 500\);/);

  if (setTimeoutMatch) {
    const block = setTimeoutMatch[0];

    console.log('✅ setTimeout block found\n');
    console.log('Features in setTimeout block:');
    console.log('  - Has runAICategorization definition:', /window\.runAICategorization = function/.test(block) ? '✅' : '❌');
    console.log('  - Has mode selector handler:', /modeSelector\.onchange/.test(block) ? '✅' : '❌');
    console.log('  - Has console logs:', /console\.log/.test(block) ? '✅' : '❌');
    console.log('  - Has container.style.display logic:', /container\.style\.display/.test(block) ? '✅' : '❌');
    console.log('  - Has button text update:', /btn\.textContent/.test(block) ? '✅' : '❌');
    console.log('');

    // Check for syntax errors
    const openBraces = (block.match(/\{/g) || []).length;
    const closeBraces = (block.match(/\}/g) || []).length;
    const balanced = openBraces === closeBraces;

    console.log('Syntax check:');
    console.log('  - Open braces:', openBraces);
    console.log('  - Close braces:', closeBraces);
    console.log('  - Balanced:', balanced ? '✅ YES' : '❌ NO');
    console.log('');
  } else {
    console.log('❌ setTimeout block NOT FOUND!\n');
  }

  // Save for manual inspection
  fs.writeFileSync('/tmp/current_deployed_full.gs', panelFile.source);
  console.log('💾 Saved full file to /tmp/current_deployed_full.gs\n');
}

check().catch(console.error);
