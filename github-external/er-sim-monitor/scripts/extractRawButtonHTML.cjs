/**
 * Extract Raw Button HTML
 *
 * Get the actual HTML for each button to see exact structure
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Extracting Raw Button HTML\n');
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

  console.log('🔍 Key Buttons - Raw HTML:\n');

  const buttonsToFind = [
    'Retry Failed Cases',
    'Clear Results',
    'Edit Category Mappings',
    'Refresh',  // Logs refresh button
    'Clear',    // Logs clear button
    'Apply Selected Categories to Master',
    'Export Results to CSV',
  ];

  for (const buttonText of buttonsToFind) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🔍 "${buttonText}"`);
    console.log('='.repeat(70) + '\n');

    // Find button with this text (fuzzy match to account for emojis)
    const pattern = new RegExp(`(<button[^>]{0,300}>${buttonText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*?<\\/button>)`, 'i');
    const match = html.match(pattern);

    if (match) {
      console.log('Raw HTML:');
      console.log(match[1]);
      console.log('');
    } else {
      // Try without exact match (find any button containing this text)
      const fuzzyPattern = new RegExp(`(<button[^>]{0,300}>[^<]*${buttonText}[^<]*<\\/button>)`, 'i');
      const fuzzyMatch = html.match(fuzzyPattern);

      if (fuzzyMatch) {
        console.log('Raw HTML (fuzzy match):');
        console.log(fuzzyMatch[1]);
        console.log('');
      } else {
        console.log('❌ NOT FOUND\n');
      }
    }
  }

  console.log('\n' + '='.repeat(70) + '\n');

  // Save to file for detailed inspection
  const outputPath = '/Users/aarontjomsland/er-sim-monitor/scripts/button_html_dump.txt';
  let output = '';

  const buttonRegex = /<button[^>]*>[^<]+<\/button>/g;
  let match;
  let num = 1;

  while ((match = buttonRegex.exec(html)) !== null) {
    output += `\n=== BUTTON ${num} ===\n`;
    output += match[0] + '\n';
    num++;
  }

  fs.writeFileSync(outputPath, output);
  console.log(`✅ Saved all button HTML to: button_html_dump.txt\n`);
  console.log(`   Total buttons: ${num - 1}\n`);
}

main().catch(console.error);
