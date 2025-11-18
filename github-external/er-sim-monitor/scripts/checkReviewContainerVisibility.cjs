/**
 * Check Review Container Visibility
 *
 * Verify if ai-review-container is hidden by default
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Checking ai-review-container Visibility\n');
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

  // Find the ai-review-container opening tag
  const containerMatch = html.match(/<div id="ai-review-container"[^>]*>/);

  if (!containerMatch) {
    console.log('❌ ai-review-container not found\n');
    return;
  }

  console.log('✅ Found ai-review-container:\n');
  console.log(containerMatch[0] + '\n');

  // Check if it has display: none
  const hasDisplayNone = containerMatch[0].includes('display: none') || containerMatch[0].includes('display:none');

  if (hasDisplayNone) {
    console.log('⚠️  Container is HIDDEN by default (display: none)\n');
    console.log('This is why user doesn\'t see Apply and Export buttons!\n');
  } else {
    console.log('✅ Container is VISIBLE by default\n');
    console.log('User should be able to see the buttons...\n');
  }

  // Check CSS styles
  const styleMatch = html.match(/#ai-review-container\s*\{[^}]*\}/);
  if (styleMatch) {
    console.log('📋 CSS Style for #ai-review-container:\n');
    console.log(styleMatch[0] + '\n');
  }

  // Search for JavaScript that hides/shows this container
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🔍 JavaScript References to ai-review-container:\n');

  const jsRefs = html.match(/getElementById\(['"]ai-review-container['"]\)[^;]*/g) || [];
  if (jsRefs.length > 0) {
    jsRefs.forEach((ref, i) => {
      console.log(`  ${i + 1}. ${ref}`);
    });
  } else {
    console.log('  (none found)\n');
  }

  console.log('\n══════════════════════════════════════════════════════════════\n');
  console.log('💡 Analysis:\n');

  if (hasDisplayNone) {
    console.log('  ❌ Container starts hidden');
    console.log('  ❌ Apply & Export buttons are inside this container');
    console.log('  ❌ User won\'t see them until AI runs complete\n');
    console.log('✅ SOLUTION: Make container visible by default OR move buttons outside\n');
  } else {
    console.log('  ✅ Container should be visible');
    console.log('  ✅ Buttons should be accessible\n');
    console.log('⚠️  If user still doesn\'t see them, may need to check browser/refresh\n');
  }

  console.log('══════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
