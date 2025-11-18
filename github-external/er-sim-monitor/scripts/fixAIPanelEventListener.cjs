/**
 * Fix AI Panel Event Listener
 *
 * Replaces DOMContentLoaded with inline onchange handler for better compatibility
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Fixing AI Panel Event Listener\n');
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

  console.log('📝 Fixing event listener...\n');

  // Remove the problematic DOMContentLoaded script
  html = html.replace(
    /<script>\s*\/\/ Show\/hide specific rows input\s*document\.addEventListener\('DOMContentLoaded'[\s\S]*?<\/script>/,
    ''
  );

  console.log('✅ Removed DOMContentLoaded script\n');

  // Add inline onchange handler to the select element
  html = html.replace(
    /<select id="aiCatMode" style="[^"]*">/,
    `<select id="aiCatMode" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 3px; font-size: 13px;" onchange="document.getElementById('specificRowsContainer').style.display = this.value === 'specific' ? 'block' : 'none';">`
  );

  console.log('✅ Added inline onchange handler\n');

  panelFile.source = html;

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🚀 Deploying fix...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🎯 Fix Applied!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('The event listener now uses inline onchange handler instead of');
  console.log('DOMContentLoaded, which works better in Apps Script HTML.\n');
  console.log('Next steps:');
  console.log('  1. Refresh Google Sheet (F5)');
  console.log('  2. Try opening Categories & Pathways panel again\n');
}

main().catch(console.error);
