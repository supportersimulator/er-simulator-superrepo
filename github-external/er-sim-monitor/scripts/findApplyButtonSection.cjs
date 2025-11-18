/**
 * Find Apply Button Section
 *
 * Extract the section containing Apply and Export buttons to see if it's hidden
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Finding Apply Button Section\n');
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

  // Find the Apply button
  const applyButtonMatch = html.match(/<button id="apply-btn"[^>]*>[\s\S]*?Apply Selected Categories to Master[\s\S]*?<\/button>/);

  if (!applyButtonMatch) {
    console.log('❌ Apply button not found\n');
    return;
  }

  const applyButtonPos = html.indexOf(applyButtonMatch[0]);

  console.log('✅ Found Apply button at position ' + applyButtonPos + '\n');

  // Extract 2000 characters before and after to see context
  const contextBefore = html.substring(Math.max(0, applyButtonPos - 2000), applyButtonPos);
  const contextAfter = html.substring(applyButtonPos, applyButtonPos + 1000);

  console.log('📋 Context BEFORE Apply Button:\n');
  console.log('─'.repeat(70));

  // Find divs/sections in context before
  const divsBefore = contextBefore.match(/<div[^>]*>/g) || [];
  console.log(`\nFound ${divsBefore.length} <div> tags before Apply button:`);
  divsBefore.slice(-10).forEach((div, i) => {
    console.log(`  ${divsBefore.length - 10 + i + 1}. ${div}`);
  });

  // Check for display:none or hidden styles
  const hiddenDivs = divsBefore.filter(div => div.includes('display: none') || div.includes('display:none') || div.includes('hidden'));
  if (hiddenDivs.length > 0) {
    console.log('\n⚠️  FOUND HIDDEN DIVS:');
    hiddenDivs.forEach(div => {
      console.log('  ' + div);
    });
  }

  // Find section headers before
  const headers = contextBefore.match(/<h[3-5][^>]*>([^<]*)<\/h[3-5]>/g) || [];
  if (headers.length > 0) {
    console.log('\nSection headers before Apply button:');
    headers.slice(-3).forEach(h => {
      console.log('  ' + h);
    });
  }

  console.log('\n' + '─'.repeat(70) + '\n');

  // Save full context to file
  const outputPath = '/Users/aarontjomsland/er-sim-monitor/scripts/apply_button_context.txt';
  fs.writeFileSync(outputPath,
    '=== CONTEXT BEFORE ===\n' +
    contextBefore +
    '\n\n=== APPLY BUTTON ===\n' +
    applyButtonMatch[0] +
    '\n\n=== CONTEXT AFTER ===\n' +
    contextAfter
  );

  console.log('✅ Saved full context to: apply_button_context.txt\n');

  // Check for collapsible/expandable sections
  console.log('🔍 Checking for collapsible sections:\n');

  const collapsePatterns = [
    'display: none',
    'display:none',
    'hidden',
    'collapse',
    'expandable',
    'toggle',
  ];

  for (const pattern of collapsePatterns) {
    const matches = contextBefore.toLowerCase().split(pattern).length - 1;
    if (matches > 0) {
      console.log(`  ⚠️  Found "${pattern}" (${matches} times) before Apply button`);
    }
  }

  console.log('\n══════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
