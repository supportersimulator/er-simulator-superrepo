#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function testDirectAccess() {
  try {
    const credPath = path.join(__dirname, '../config/credentials.json');
    const tokenPath = path.join(__dirname, '../config/token.json');

    const credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    oAuth2Client.setCredentials(token);

    const script = google.script({ version: 'v1', auth: oAuth2Client });
    const scriptId = process.env.APPS_SCRIPT_ID;

    console.log('🔍 Testing direct script access...\n');
    console.log(`   Script ID: ${scriptId}\n`);

    const content = await script.projects.getContent({
      scriptId: scriptId
    });

    console.log('   ✅ SUCCESS! Script is accessible.\n');
    console.log(`   Files in project (${content.data.files.length}):\n`);

    content.data.files.forEach(f => {
      const size = f.source ? `${(f.source.length / 1024).toFixed(1)} KB` : 'N/A';
      console.log(`      - ${f.name} (${f.type}) - ${size}`);
    });

    // Check for Phase2 files
    const hasPhase2 = content.data.files.some(f => f.name.includes('Phase2'));

    console.log('\n   ═══════════════════════════════════════════════════════════════');
    if (hasPhase2) {
      console.log('   ⚠️  Phase2 files already present!');
      console.log('   Deployment may have already occurred.');
    } else {
      console.log('   ✅ READY FOR DEPLOYMENT');
      console.log('   No Phase2 files detected - safe to proceed.');
    }
    console.log('   ═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);

    if (error.message.includes('insufficient authentication scopes')) {
      console.log('\n⚠️  Missing scopes. Run: npm run auth-google\n');
    } else if (error.message.includes('not found')) {
      console.log('\n⚠️  Script ID incorrect. Double-check the ID from Apps Script editor.\n');
    }
  }
}

testDirectAccess();
