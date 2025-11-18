/**
 * Find Actual Onclick Handlers in AI Panel
 *
 * Extracts actual onclick attributes from buttons to see what's wrong
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Finding Actual Onclick Handlers\n');
  console.log('══════════════════════════════════════════════════════════════\n');

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

  if (!panelFile) {
    console.log('❌ Panel file not found\n');
    return;
  }

  const html = panelFile.source;

  console.log('🔍 Extracting All Buttons:\n');

  // Extract all button elements
  const buttonRegex = /<button([^>]*)>([^<]*)<\/button>/gi;
  let match;
  let buttonNum = 1;

  while ((match = buttonRegex.exec(html)) !== null) {
    const attributes = match[1];
    const text = match[2].trim();

    // Extract onclick
    const onclickMatch = attributes.match(/onclick=["']([^"']*)["']/);
    const onclick = onclickMatch ? onclickMatch[1] : 'NONE';

    // Extract id
    const idMatch = attributes.match(/id=["']([^"']*)["']/);
    const id = idMatch ? idMatch[1] : 'no-id';

    console.log(`${buttonNum}. "${text}"`);
    console.log(`   ID: ${id}`);
    console.log(`   onclick: ${onclick}`);
    console.log('');

    buttonNum++;
  }

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🔍 Checking for Key Functions:\n');

  const keyButtons = [
    'Retry Failed Cases',
    'Apply Selected Categories to Master',
    'Export Results to CSV',
  ];

  for (const buttonText of keyButtons) {
    const buttonMatch = html.match(new RegExp(`<button([^>]*)>${buttonText}<\\/button>`, 'i'));
    if (buttonMatch) {
      const attributes = buttonMatch[1];
      const onclickMatch = attributes.match(/onclick=["']([^"']*)["']/);
      const onclick = onclickMatch ? onclickMatch[1] : 'NONE';

      console.log(`✅ Found: "${buttonText}"`);
      console.log(`   onclick: ${onclick}`);
      console.log('');
    } else {
      console.log(`❌ Not Found: "${buttonText}"\n`);
    }
  }

  console.log('══════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
