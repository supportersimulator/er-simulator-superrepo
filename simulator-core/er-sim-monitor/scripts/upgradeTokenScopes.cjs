#!/usr/bin/env node

/**
 * Upgrade OAuth Token Scopes
 *
 * Uses existing refresh token to request additional Drive write permissions
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const CREDS_PATH = path.join(__dirname, '..', 'config', 'credentials.json');

// Enhanced scopes including full Drive access
const ENHANCED_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/script.projects',
  'https://www.googleapis.com/auth/script.projects.readonly',
  'https://www.googleapis.com/auth/script.deployments',
  'https://www.googleapis.com/auth/drive.file',  // Create and modify files
  'https://www.googleapis.com/auth/drive'        // Full Drive access
];

async function upgradeScopes() {
  console.log('\n🔐 UPGRADING OAUTH TOKEN SCOPES\n');
  console.log('='.repeat(80) + '\n');

  try {
    // Load credentials
    const credentials = JSON.parse(fs.readFileSync(CREDS_PATH, 'utf8'));
    const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web;

    // Load existing token
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));

    console.log('📋 Current scopes:');
    const currentScopes = token.scope.split(' ');
    currentScopes.forEach(scope => {
      const shortScope = scope.split('/').pop();
      console.log(`   ✓ ${shortScope}`);
    });

    console.log('\n📋 Missing scopes needed for Drive upload:');
    const missingScopes = ENHANCED_SCOPES.filter(s => !currentScopes.includes(s));
    if (missingScopes.length === 0) {
      console.log('   ✅ All scopes already granted!');
      console.log('\n✅ No upgrade needed - token already has full Drive access\n');
      return;
    }

    missingScopes.forEach(scope => {
      const shortScope = scope.split('/').pop();
      console.log(`   ⚠️  ${shortScope} (MISSING)`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('⚠️  MANUAL RE-AUTHORIZATION REQUIRED');
    console.log('='.repeat(80));
    console.log('\nOAuth tokens cannot be upgraded programmatically.');
    console.log('User must re-authorize with expanded scopes.\n');
    console.log('Run these commands:');
    console.log('   1. node scripts/authGoogleDrive.cjs  # Get new auth URL');
    console.log('   2. Open URL in browser and authorize');
    console.log('   3. node scripts/completeAuth.cjs [auth_code]  # Complete auth\n');

    // Generate auth URL for convenience
    const oauth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ENHANCED_SCOPES,
      prompt: 'consent'
    });

    console.log('Or copy this URL directly:');
    console.log('\n' + authUrl + '\n');

  } catch (error) {
    console.error('\n❌ ERROR upgrading scopes:');
    console.error(error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  upgradeScopes().catch(console.error);
}
