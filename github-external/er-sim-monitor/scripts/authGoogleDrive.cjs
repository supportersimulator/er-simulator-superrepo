#!/usr/bin/env node

/**
 * Google Drive OAuth Authentication
 *
 * Grants full Drive access for backups and file management
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const OAUTH_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const OAUTH_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const CREDS_PATH = path.join(__dirname, '..', 'config', 'credentials.json');

// Enhanced scopes including full Drive access
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/script.projects',
  'https://www.googleapis.com/auth/script.projects.readonly',
  'https://www.googleapis.com/auth/script.deployments',
  'https://www.googleapis.com/auth/drive.file',  // Create and modify files
  'https://www.googleapis.com/auth/drive'        // Full Drive access
];

async function authorizeWithDrive() {
  console.log('\n🔐 GOOGLE DRIVE + SHEETS OAUTH AUTHENTICATION\n');
  console.log('='.repeat(80) + '\n');

  // Load credentials
  let credentials;
  try {
    credentials = JSON.parse(fs.readFileSync(CREDS_PATH, 'utf8'));
  } catch (error) {
    console.error('❌ Error loading credentials.json');
    console.error('   Make sure config/credentials.json exists');
    process.exit(1);
  }

  const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web;

  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Generate auth URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent' // Force consent to get refresh token
  });

  console.log('📋 REQUESTED SCOPES:\n');
  SCOPES.forEach(scope => {
    const shortScope = scope.split('/').pop();
    console.log(`   ✓ ${shortScope}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('📖 AUTHORIZATION INSTRUCTIONS\n');
  console.log('1. Open this URL in your browser:');
  console.log('\n' + authUrl + '\n');
  console.log('2. Grant permissions for ALL requested scopes');
  console.log('3. You will be redirected to a page with an authorization code');
  console.log('4. Copy the ENTIRE authorization code');
  console.log('5. Run: node scripts/completeAuth.cjs [paste_code_here]');
  console.log('='.repeat(80) + '\n');
}

if (require.main === module) {
  authorizeWithDrive().catch(console.error);
}
