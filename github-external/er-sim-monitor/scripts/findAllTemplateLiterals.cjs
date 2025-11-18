const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oAuth2Client });
  const scriptId = process.env.APPS_SCRIPT_ID;

  console.log('📥 Downloading fresh copy...\n');

  const project = await script.projects.getContent({ scriptId });
  const panelFile = project.data.files.find(f => f.name === 'Phase2_Enhanced_Categories_With_AI');

  if (!panelFile) {
    console.log('❌ Panel file not found');
    return;
  }

  fs.writeFileSync('/tmp/current_panel.gs', panelFile.source);
  console.log('✅ Saved to /tmp/current_panel.gs\n');

  // Find ALL template literal interpolations
  const allMatches = panelFile.source.match(/\$\{[^}]+\}/g);

  if (allMatches) {
    console.log('Found', allMatches.length, 'template literal interpolations:\n');

    // Group by uniqueness
    const unique = [...new Set(allMatches)];
    unique.forEach(m => {
      const count = allMatches.filter(x => x === m).length;
      console.log('  ' + count + 'x', m);
    });

    console.log('\n');

    // Now find which ones are INSIDE script tags
    const scriptBlocks = panelFile.source.match(/<script>[\s\S]*?<\/script>/g);

    if (scriptBlocks) {
      console.log('Checking', scriptBlocks.length, 'script blocks for template literals...\n');

      scriptBlocks.forEach((block, i) => {
        const matches = block.match(/\$\{[^}]+\}/g);
        if (matches) {
          console.log('❌ Script block', (i+1), 'has', matches.length, 'template literal(s):');
          matches.forEach(m => console.log('     ', m));
          console.log('');
        }
      });
    }
  } else {
    console.log('✅ No template literals found!');
  }
}

main().catch(console.error);
