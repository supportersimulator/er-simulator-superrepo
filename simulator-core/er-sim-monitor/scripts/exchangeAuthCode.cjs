#!/usr/bin/env node

/**
 * Exchange authorization code for access token
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, '../config/credentials.json');
const TOKEN_PATH = path.join(__dirname, '../config/token.json');

// Authorization code from the URL the user provided
const AUTH_CODE = '4/0Ab32j92jKEft5qNyME3flTIpajXWGmMOjBDTdINtPLUI7dkq9IcjtzUWWDtrKfyRDmLm7w';

async function exchangeCode() {
  console.log('\n🔐 EXCHANGING AUTHORIZATION CODE FOR TOKENS\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  try {
    console.log('📝 Authorization Code:', AUTH_CODE.substring(0, 20) + '...\n');
    console.log('🔄 Exchanging code for tokens...\n');

    const { tokens } = await oAuth2Client.getToken(AUTH_CODE);

    console.log('✅ Token exchange successful!\n');
    console.log('📋 Token Details:\n');
    console.log(`   Scope: ${tokens.scope}\n`);
    console.log(`   Has Refresh Token: ${tokens.refresh_token ? 'Yes' : 'No'}\n`);

    // Save tokens
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
    console.log('💾 Saved to:', TOKEN_PATH, '\n');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎉 AUTHENTICATION COMPLETE!\n');
    console.log('🚀 You can now run: node scripts/backupPathwaysPhase2ToDrive.cjs\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error exchanging code:', error.message);
    if (error.response) {
      console.error('\n   Response:', error.response.data);
    }
  }
}

exchangeCode().catch(console.error);
