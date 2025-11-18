#!/usr/bin/env node

/**
 * Read Apps Script Project Code
 *
 * Fetches all files and code from the Apps Script project
 * for analysis and understanding
 *
 * Usage:
 *   node scripts/readAppsScript.cjs
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

// OAuth2 credentials
const OAUTH_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const OAUTH_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const APPS_SCRIPT_ID = process.env.APPS_SCRIPT_ID;

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
 * Read Apps Script project content
 */
async function readAppsScript() {
  console.log('');
  console.log('📖 READING APPS SCRIPT PROJECT');
  console.log('════════════════════════════════════════════════════');
  console.log(`Script ID: ${APPS_SCRIPT_ID}`);
  console.log('════════════════════════════════════════════════════');
  console.log('');

  try {
    const script = createAppsScriptClient();

    // Get project metadata
    console.log('📊 Fetching project details...');
    const projectResponse = await script.projects.get({
      scriptId: APPS_SCRIPT_ID
    });

    const project = projectResponse.data;
    console.log('');
    console.log(`✅ Project: "${project.title}"`);
    console.log(`   Script ID: ${project.scriptId}`);
    console.log(`   Created: ${new Date(project.createTime).toLocaleString()}`);
    console.log(`   Updated: ${new Date(project.updateTime).toLocaleString()}`);
    console.log('');

    // Get project content (all files)
    console.log('📂 Fetching project content...');
    const contentResponse = await script.projects.getContent({
      scriptId: APPS_SCRIPT_ID
    });

    const content = contentResponse.data;
    const files = content.files || [];

    console.log('');
    console.log(`✅ Found ${files.length} file(s) in project:`);
    console.log('');

    // Save all files locally for analysis
    const outputDir = path.join(__dirname, '..', 'apps-script-backup');
    fs.mkdirSync(outputDir, { recursive: true });

    files.forEach((file, index) => {
      console.log(`📄 File ${index + 1}: ${file.name}`);
      console.log(`   Type: ${file.type}`);
      console.log(`   Lines: ${file.source ? file.source.split('\n').length : 'N/A'}`);
      console.log('');

      // Save file locally
      const fileName = `${file.name}.${file.type === 'SERVER_JS' ? 'gs' : 'json'}`;
      const filePath = path.join(outputDir, fileName);

      if (file.source) {
        fs.writeFileSync(filePath, file.source, 'utf8');
        console.log(`   💾 Saved to: ${filePath}`);
      } else if (file.functionSet) {
        fs.writeFileSync(filePath, JSON.stringify(file.functionSet, null, 2), 'utf8');
        console.log(`   💾 Saved manifest to: ${filePath}`);
      }
      console.log('');
    });

    // Save complete project JSON
    const projectJsonPath = path.join(outputDir, 'full-project.json');
    fs.writeFileSync(projectJsonPath, JSON.stringify(content, null, 2), 'utf8');

    console.log('═══════════════════════════════════════════════════');
    console.log('✅ READ COMPLETE');
    console.log('');
    console.log(`All files saved to: ${outputDir}`);
    console.log('');
    console.log('Files:');
    files.forEach(file => {
      const fileName = `${file.name}.${file.type === 'SERVER_JS' ? 'gs' : 'json'}`;
      console.log(`  - ${fileName}`);
    });
    console.log('');

    return { project, files };

  } catch (error) {
    console.error('');
    console.error('❌ READ FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');

    if (error.message.includes('insufficient authentication scopes')) {
      console.error('💡 Solution: You need script.projects scope');
      console.error('');
      console.error('   The token may need script.projects (not just readonly)');
      console.error('   Run: npm run auth-google again');
      console.error('');
    } else if (error.message.includes('Permission denied')) {
      console.error('💡 Solution: Check Apps Script sharing permissions');
      console.error('');
      console.error('   Make sure the OAuth client has access to this script');
      console.error('');
    }

    process.exit(1);
  }
}

// Run read
if (require.main === module) {
  readAppsScript().catch(console.error);
}

module.exports = { readAppsScript };
