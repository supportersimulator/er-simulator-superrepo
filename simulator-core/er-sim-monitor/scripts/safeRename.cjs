/**
 * Safe Rename - Archive Old Versions
 * NO DELETION - Just adds _ARCHIVE suffix to old version
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('📦 SAFE RENAME (NO DELETION)\n');
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

  // Find the old file
  const oldFile = project.data.files.find(f => f.name === 'Phase2_Enhanced_Categories_Pathways_Panel');

  if (!oldFile) {
    console.log('❌ Old file not found - may have been already renamed\n');
    return;
  }

  const timestamp = new Date().toISOString().split('T')[0];
  const newName = `Phase2_Enhanced_Categories_Pathways_Panel_ARCHIVE_${timestamp}`;

  console.log('Renaming:\n');
  console.log('  FROM:', oldFile.name);
  console.log('  TO:', newName);
  console.log('');

  // Rename the file
  oldFile.name = newName;

  console.log('🚀 Deploying rename...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Rename complete!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🎯 CLEAN STATE ACHIEVED!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('Active file: Phase2_Enhanced_Categories_With_AI.gs (48 KB)');
  console.log('Archived file:', newName);
  console.log('');
  console.log('Now test:');
  console.log('  1. Refresh Google Sheet');
  console.log('  2. Open AI Categorization panel');
  console.log('  3. Should work with NO conflicts!\n');
}

main().catch(console.error);
