#!/usr/bin/env node

/**
 * Apps Script Projects Lister
 *
 * Lists all Apps Script projects accessible via OAuth2 credentials
 * Provides project IDs for programmatic access to Apps Script API
 *
 * Usage:
 *   node scripts/listAppsScriptProjects.cjs
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

// OAuth2 credentials
const OAUTH_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const OAUTH_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');

// Apps Script API scopes
const SCOPES = [
  'https://www.googleapis.com/auth/script.projects',
  'https://www.googleapis.com/auth/script.projects.readonly',
  'https://www.googleapis.com/auth/drive.readonly'
];

/**
 * Load OAuth2 token from disk
 */
function loadToken() {
  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error(`Token file not found at ${TOKEN_PATH}. Run 'npm run auth-google' first.`);
  }
  const tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  return tokenData;
}

/**
 * Create authenticated Apps Script API client
 */
function createAppsScriptClient() {
  const oauth2Client = new google.auth.OAuth2(
    OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );

  const token = loadToken();
  oauth2Client.setCredentials(token);

  return google.script({ version: 'v1', auth: oauth2Client });
}

/**
 * Create authenticated Drive API client (to list script files)
 */
function createDriveClient() {
  const oauth2Client = new google.auth.OAuth2(
    OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );

  const token = loadToken();
  oauth2Client.setCredentials(token);

  return google.drive({ version: 'v3', auth: oauth2Client });
}

/**
 * List all Apps Script projects
 */
async function listAppsScriptProjects() {
  console.log('');
  console.log('🔍 APPS SCRIPT PROJECTS DISCOVERY');
  console.log('════════════════════════════════════════════════════');
  console.log('Searching for Apps Script projects accessible via');
  console.log('your OAuth2 credentials...');
  console.log('════════════════════════════════════════════════════');
  console.log('');

  try {
    // Method 1: Use Drive API to find Apps Script files
    console.log('📂 Method 1: Searching via Google Drive API...');
    const drive = createDriveClient();

    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.script'",
      fields: 'files(id, name, createdTime, modifiedTime, webViewLink)',
      orderBy: 'modifiedTime desc'
    });

    const projects = response.data.files || [];

    console.log('');
    console.log(`✅ Found ${projects.length} Apps Script project(s):`);
    console.log('');

    if (projects.length === 0) {
      console.log('⚠️  No Apps Script projects found.');
      console.log('');
      console.log('💡 Possible reasons:');
      console.log('   - You may need to grant additional API scopes');
      console.log('   - The script may be bound to a Google Sheet (container-bound)');
      console.log('   - You may need to enable the Apps Script API in Google Cloud Console');
      console.log('');
      return;
    }

    // Display each project
    projects.forEach((project, index) => {
      console.log(`📋 Project ${index + 1}:`);
      console.log(`   Name: ${project.name}`);
      console.log(`   Script ID: ${project.id}`);
      console.log(`   Created: ${new Date(project.createdTime).toLocaleString()}`);
      console.log(`   Modified: ${new Date(project.modifiedTime).toLocaleString()}`);
      console.log(`   URL: ${project.webViewLink}`);
      console.log('');
    });

    // Method 2: Try to get project details using Apps Script API
    console.log('═══════════════════════════════════════════════════');
    console.log('📊 Method 2: Fetching project details via Apps Script API...');
    console.log('');

    const script = createAppsScriptClient();

    for (const project of projects) {
      try {
        const projectDetails = await script.projects.get({
          scriptId: project.id
        });

        console.log(`🔎 Details for "${project.name}":`);
        console.log(`   Script ID: ${projectDetails.data.scriptId}`);
        console.log(`   Title: ${projectDetails.data.title}`);
        console.log(`   Parent ID: ${projectDetails.data.parentId || 'Standalone'}`);
        console.log('');

        // If this looks like the ER Simulator Builder script
        if (project.name.toLowerCase().includes('simulator') ||
            project.name.toLowerCase().includes('builder') ||
            project.name.toLowerCase().includes('er')) {
          console.log('🎯 THIS MAY BE YOUR ER SIMULATOR BUILDER SCRIPT!');
          console.log(`   Use this Script ID: ${project.id}`);
          console.log('');
        }

      } catch (error) {
        console.log(`⚠️  Could not fetch details for "${project.name}": ${error.message}`);
        console.log('');
      }
    }

    // Save results to file
    const outputPath = path.join(__dirname, '..', 'config', 'apps-script-projects.json');
    fs.writeFileSync(outputPath, JSON.stringify(projects, null, 2), 'utf8');
    console.log(`💾 Results saved to: ${outputPath}`);
    console.log('');

    console.log('═══════════════════════════════════════════════════');
    console.log('✅ DISCOVERY COMPLETE');
    console.log('');
    console.log('Next steps:');
    console.log('1. Identify the correct Script ID from the list above');
    console.log('2. Add APPS_SCRIPT_ID to your .env file:');
    console.log('   APPS_SCRIPT_ID=<your-script-id>');
    console.log('3. Enable Apps Script API in Google Cloud Console:');
    console.log('   https://console.cloud.google.com/apis/library/script.googleapis.com');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ DISCOVERY FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');

    if (error.message.includes('insufficient authentication scopes')) {
      console.error('💡 Solution: You need to re-authenticate with additional scopes');
      console.error('   The Apps Script API requires additional permissions.');
      console.error('');
      console.error('   Run this to re-authenticate:');
      console.error('   1. Delete config/token.json');
      console.error('   2. Run: npm run auth-google');
      console.error('');
    } else if (error.message.includes('API has not been used')) {
      console.error('💡 Solution: Enable the Apps Script API');
      console.error('');
      console.error('   1. Go to: https://console.cloud.google.com/apis/library/script.googleapis.com');
      console.error('   2. Click "Enable"');
      console.error('   3. Run this script again');
      console.error('');
    } else if (error.message.includes('Token')) {
      console.error('💡 Solution: Run "npm run auth-google" to authenticate first.');
      console.error('');
    }

    process.exit(1);
  }
}

// Run discovery
if (require.main === module) {
  listAppsScriptProjects().catch(console.error);
}

module.exports = { listAppsScriptProjects };
