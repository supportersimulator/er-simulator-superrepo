#!/usr/bin/env node
/**
 * Export Apps Script Project
 * Exports "Sim Builder (Production)" to local files
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const APPS_SCRIPT_ID = process.env.APPS_SCRIPT_ID;
const OUTPUT_DIR = path.join(__dirname, '..', '..', '..', 'google-drive-code', 'sim-builder-production');

async function authenticateAppsScript() {
  const credentials = {
    installed: {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uris: ['http://localhost']
    }
  };

  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  if (!fs.existsSync(TOKEN_PATH)) {
    console.error('❌ Token file not found at:', TOKEN_PATH);
    process.exit(1);
  }

  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
  oAuth2Client.setCredentials(token);

  return oAuth2Client;
}

async function exportAppsScriptProject(auth) {
  console.log('🔧 Exporting Apps Script Project...\n');
  console.log(`Project ID: ${APPS_SCRIPT_ID}\n`);

  const script = google.script({ version: 'v1', auth });

  try {
    // Get project metadata
    const project = await script.projects.get({
      scriptId: APPS_SCRIPT_ID,
    });

    console.log(`✅ Project: "${project.data.title}"`);
    console.log(`   Created: ${project.data.createTime}`);
    console.log(`   Updated: ${project.data.updateTime}\n`);

    // Get project content
    const content = await script.projects.getContent({
      scriptId: APPS_SCRIPT_ID,
    });

    const files = content.data.files;
    console.log(`📁 Found ${files.length} files in project\n`);

    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Export each file
    let exportedCount = 0;
    for (const file of files) {
      const fileName = file.name;
      const fileContent = file.source;
      const fileType = file.type;

      let extension = '';
      if (fileType === 'SERVER_JS') {
        extension = '.gs';
      } else if (fileType === 'HTML') {
        extension = '.html';
      } else if (fileType === 'JSON') {
        extension = '.json';
      } else {
        extension = '.txt';
      }

      const outputPath = path.join(OUTPUT_DIR, `${fileName}${extension}`);
      fs.writeFileSync(outputPath, fileContent, 'utf-8');

      console.log(`✅ Exported: ${fileName}${extension} (${fileType})`);
      exportedCount++;
    }

    // Save project metadata
    const metadataPath = path.join(OUTPUT_DIR, '_project_metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify({
      title: project.data.title,
      scriptId: APPS_SCRIPT_ID,
      createTime: project.data.createTime,
      updateTime: project.data.updateTime,
      exportTime: new Date().toISOString(),
      fileCount: files.length,
      files: files.map(f => ({
        name: f.name,
        type: f.type
      }))
    }, null, 2));

    console.log(`\n📋 Metadata saved: _project_metadata.json`);
    console.log(`\n🎉 Export complete! ${exportedCount} files saved to:`);
    console.log(`   ${OUTPUT_DIR}\n`);

    return exportedCount;

  } catch (error) {
    console.error('❌ Error exporting Apps Script project:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const auth = await authenticateAppsScript();
    const fileCount = await exportAppsScriptProject(auth);
    console.log(`✅ Successfully exported ${fileCount} files from Sim Builder (Production)`);
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    process.exit(1);
  }
}

main();
