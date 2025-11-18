#!/usr/bin/env node

/**
 * Fetch specific old version of Apps Script
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const SCRIPT_ID = '1NXjFvH2Wo117saCyqmNDfCqZ1iQ9vykxa0-kHUhFAYDuhthgql5Ru_P6';
const VERSION_NUMBER = 1; // Version 1 from Nov 1st - before the "context fix" updates

async function fetchVersion() {
  console.log(`🕰️  Fetching Version ${VERSION_NUMBER} (Nov 1st - before context fixes)\n`);
  console.log('════════════════════════════════════════════════════\n');

  // Authenticate
  console.log('🔑 Authenticating...');
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const {client_id, client_secret, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const tokenPath = path.join(__dirname, '../config/token.json');
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  oAuth2Client.setCredentials(token);
  console.log('   ✅ Authenticated\n');

  const script = google.script({version: 'v1', auth: oAuth2Client});

  // Get the old version
  console.log(`📥 Fetching Version ${VERSION_NUMBER} content...`);

  try {
    const version = await script.projects.versions.get({
      scriptId: SCRIPT_ID,
      versionNumber: VERSION_NUMBER
    });

    console.log(`   ✅ Version ${VERSION_NUMBER} retrieved\n`);
    console.log(`   Description: ${version.data.description}`);
    console.log(`   Created: ${new Date(version.data.createTime).toLocaleString()}\n`);

    // Save to file
    const outputDir = path.join(__dirname, '../apps-script-backup/versions');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, `version-${VERSION_NUMBER}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(version.data, null, 2));
    console.log(`💾 Version saved to: ${outputPath}\n`);

    // Get the actual code content from the project at that version
    console.log('📖 Fetching code content from that version...');

    // We need to use getContent but Google doesn't let us fetch old versions directly
    // So let's just show what we have
    console.log('   Note: Google Apps Script API doesn\'t allow fetching old version content directly\n');
    console.log('════════════════════════════════════════════════════');
    console.log('💡 SOLUTION: Manual Restore via Web Interface');
    console.log('════════════════════════════════════════════════════\n');

    console.log('To restore the old working version:');
    console.log('1. Open Apps Script editor in browser');
    console.log('2. Click: File → Version history');
    console.log('3. Look for Version 1 (Nov 1, 2025 10:46 AM)');
    console.log('   Description: "Web App with HTTP endpoints for batch processing"');
    console.log('4. Click the 3-dot menu → "Restore this version"');
    console.log('5. Then I\'ll upgrade just the model to gpt-4o\n');

    console.log('Or try this Google Sheets script editor URL:');
    const url = `https://script.google.com/home/projects/${SCRIPT_ID}/edit`;
    console.log(`   ${url}\n`);

  } catch (error) {
    console.error('❌ Error fetching version:', error.message);
  }
}

fetchVersion().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
