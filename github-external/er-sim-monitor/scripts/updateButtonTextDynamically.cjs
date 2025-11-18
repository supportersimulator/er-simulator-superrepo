/**
 * Update Button Text Dynamically
 *
 * Make the Run button change its text based on mode selection:
 * - "All Cases" → "🚀 Run AI Categorization (All 207 Cases)"
 * - "Specific Rows" → "🚀 Run AI Categorization (Specific Rows)"
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Updating Button Text to Change Dynamically\n');
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

  console.log('📥 Downloading current project...\n');

  const project = await script.projects.getContent({ scriptId });
  const panelFile = project.data.files.find(f => f.name === 'Phase2_Enhanced_Categories_With_AI');

  if (!panelFile) {
    console.log('❌ Panel file not found\n');
    return;
  }

  let html = panelFile.source;

  console.log('🔍 Finding mode selector onchange handler...\n');

  // Find the current onchange handler
  const currentOnchange = html.match(/<select id="aiCatMode"[^>]*onchange="[^"]*"/);

  if (currentOnchange) {
    console.log('✅ Found current onchange:\n');
    console.log('   ' + currentOnchange[0] + '\n');
  }

  // Update onchange to also change button text
  const updatedOnchange = `<select id="aiCatMode" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 3px; font-size: 13px;" onchange="var container = document.getElementById('specificRowsContainer'); container.style.display = this.value === 'specific' ? 'block' : 'none'; var btn = document.getElementById('run-ai-btn'); btn.textContent = this.value === 'specific' ? '🚀 Run AI Categorization (Specific Rows)' : '🚀 Run AI Categorization (All 207 Cases)';"`;

  html = html.replace(
    /<select id="aiCatMode"[^>]*onchange="[^"]*"/,
    updatedOnchange
  );

  console.log('✅ Updated onchange handler to change button text\n');

  // Also update the button initial text to have ID for easier targeting
  const buttonPattern = /<button id="run-ai-btn"[^>]*>[\s\S]*?Run AI Categorization[^<]*<\/button>/;
  const buttonMatch = html.match(buttonPattern);

  if (buttonMatch) {
    console.log('✅ Found Run button\n');

    // Make sure button has the default text
    const updatedButton = buttonMatch[0].replace(
      />[\s\S]*?Run AI Categorization[^<]*</,
      '>🚀 Run AI Categorization (All 207 Cases)<'
    );

    html = html.replace(buttonMatch[0], updatedButton);
    console.log('✅ Updated button default text\n');
  }

  panelFile.source = html;

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🚀 Deploying changes...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🎯 Button Text Now Changes Dynamically!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('Behavior:');
  console.log('  • Select "All Cases" → Button shows "🚀 Run AI Categorization (All 207 Cases)"');
  console.log('  • Select "Specific Rows" → Button shows "🚀 Run AI Categorization (Specific Rows)"\n');
  console.log('Next steps:');
  console.log('  1. Refresh Google Sheet (F5)');
  console.log('  2. Open AI Categorization panel');
  console.log('  3. Change dropdown between modes');
  console.log('  4. Watch button text change automatically!\n');
}

main().catch(console.error);
