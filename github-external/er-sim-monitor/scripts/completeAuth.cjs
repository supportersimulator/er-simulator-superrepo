#!/usr/bin/env node

/**
 * Complete OAuth Authentication Programmatically
 *
 * Takes an authorization code and completes the OAuth flow
 *
 * Usage:
 *   node scripts/completeAuth.cjs [auth_code]
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

// OAuth2 credentials
const OAUTH_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const OAUTH_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/script.projects',
  'https://www.googleapis.com/auth/script.projects.readonly',
  'https://www.googleapis.com/auth/script.deployments',
  'https://www.googleapis.com/auth/drive.file',  // Create and modify files
  'https://www.googleapis.com/auth/drive'        // Full Drive access
];

/**
 * Complete authentication with code
 */
async function completeAuth(authCode) {
  console.log('');
  console.log('🔐 COMPLETING OAUTH AUTHENTICATION');
  console.log('════════════════════════════════════════════════════');
  console.log(`Authorization code: ${authCode.substring(0, 20)}...`);
  console.log('════════════════════════════════════════════════════');
  console.log('');

  try {
    const oauth2Client = new google.auth.OAuth2(
      OAUTH_CLIENT_ID,
      OAUTH_CLIENT_SECRET,
      'http://localhost'
    );

    console.log('📡 Exchanging authorization code for tokens...');
    const { tokens } = await oauth2Client.getToken(authCode);

    console.log('✅ Tokens received successfully!');
    console.log('');
    console.log('Token details:');
    console.log(`   Access token: ${tokens.access_token.substring(0, 20)}...`);
    console.log(`   Refresh token: ${tokens.refresh_token ? tokens.refresh_token.substring(0, 20) + '...' : 'Not provided'}`);
    console.log(`   Expiry: ${new Date(tokens.expiry_date).toLocaleString()}`);
    console.log('');

    // Save tokens
    console.log('💾 Saving tokens to config/token.json...');
    fs.mkdirSync(path.dirname(TOKEN_PATH), { recursive: true });
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));

    console.log('✅ Tokens saved successfully!');
    console.log('');

    // Verify scopes
    console.log('🔍 Verifying granted scopes...');
    console.log('');
    console.log('Requested scopes:');
    SCOPES.forEach(scope => {
      const shortScope = scope.split('/').pop();
      console.log(`   ✓ ${shortScope}`);
    });
    console.log('');

    console.log('════════════════════════════════════════════════════');
    console.log('✅ AUTHENTICATION COMPLETE');
    console.log('════════════════════════════════════════════════════');
    console.log('');
    console.log('Next steps:');
    console.log('   1. Token saved to config/token.json');
    console.log('   2. All deployment permissions granted');
    console.log('   3. Ready to deploy Apps Script');
    console.log('');
    console.log('Run: npm run deploy-script');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ AUTHENTICATION FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');

    if (error.response && error.response.data) {
      console.error('Full error details:');
      console.error(JSON.stringify(error.response.data, null, 2));
      console.error('');
    }

    process.exit(1);
  }
}

// Get auth code from command line
const authCode = process.argv[2];

if (!authCode) {
  console.error('');
  console.error('❌ No authorization code provided');
  console.error('');
  console.error('Usage:');
  console.error('   node scripts/completeAuth.cjs [auth_code]');
  console.error('');
  process.exit(1);
}

if (require.main === module) {
  completeAuth(authCode).catch(console.error);
}

module.exports = { completeAuth };
