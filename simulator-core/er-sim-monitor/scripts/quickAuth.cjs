#!/usr/bin/env node

/**
 * Quick OAuth Authentication Helper
 *
 * This script makes OAuth authentication easier by:
 * 1. Starting a local web server on port 3000
 * 2. Automatically capturing the authorization code
 * 3. Exchanging it for tokens
 * 4. Saving tokens to config/token.json
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { google } = require('googleapis');
require('dotenv').config();

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/script.projects",
  "https://www.googleapis.com/auth/script.projects.readonly",
  "https://www.googleapis.com/auth/drive.readonly"
];

const TOKEN_PATH = path.resolve(__dirname, '..', 'config', 'token.json');
const OAUTH_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const OAUTH_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

async function authenticate() {
  const oAuth2Client = new google.auth.OAuth2(
    OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET,
    REDIRECT_URI
  );

  // Generate auth URL
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('');
  console.log('🔐 GOOGLE OAUTH AUTHENTICATION');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('Starting local server on port 3000...');
  console.log('');

  // Start local server to capture redirect
  const server = http.createServer(async (req, res) => {
    if (req.url.startsWith('/oauth2callback')) {
      const url = new URL(req.url, `http://localhost:3000`);
      const code = url.searchParams.get('code');

      if (code) {
        console.log('✅ Authorization code received!');
        console.log('Exchanging code for tokens...');

        try {
          const { tokens } = await oAuth2Client.getToken(code);
          oAuth2Client.setCredentials(tokens);

          // Save tokens
          fs.mkdirSync(path.dirname(TOKEN_PATH), { recursive: true });
          fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));

          console.log('✅ Token saved to:', TOKEN_PATH);
          console.log('');
          console.log('═══════════════════════════════════════════════════');
          console.log('✅ AUTHENTICATION SUCCESSFUL!');
          console.log('');
          console.log('You can now:');
          console.log('  • Run: npm run list-scripts');
          console.log('  • Run: npm run fetch-vitals');
          console.log('  • Run: npm run sync-vitals');
          console.log('');

          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <body style="font-family: system-ui; padding: 40px; text-align: center;">
                <h1 style="color: #22c55e;">✅ Authentication Successful!</h1>
                <p>You can close this window and return to your terminal.</p>
              </body>
            </html>
          `);

          setTimeout(() => {
            server.close();
            process.exit(0);
          }, 1000);

        } catch (error) {
          console.error('❌ Error exchanging code for tokens:', error.message);
          res.writeHead(500, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <body style="font-family: system-ui; padding: 40px; text-align: center;">
                <h1 style="color: #ef4444;">❌ Authentication Failed</h1>
                <p>${error.message}</p>
              </body>
            </html>
          `);
          server.close();
          process.exit(1);
        }
      } else {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('No authorization code received');
        server.close();
        process.exit(1);
      }
    }
  });

  server.listen(3000, () => {
    console.log('✅ Server is listening on http://localhost:3000');
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('STEP 1: Click the URL below to authorize:');
    console.log('');
    console.log(authUrl);
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('Waiting for authorization...');
    console.log('(This will automatically complete once you approve)');
    console.log('');
  });
}

authenticate().catch(console.error);
