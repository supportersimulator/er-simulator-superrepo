#!/usr/bin/env node

/**
 * UPLOAD AI CATEGORIZATION TOOL STRUGGLES TO GOOGLE DRIVE (SIMPLE VERSION)
 *
 * Creates a Google Document from the markdown file (plain text upload)
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, '..', 'config', 'credentials.json');

async function uploadStrugglesDoc() {
  console.log('📤 Uploading AI Categorization Tool Struggles to Google Drive\n');

  try {
    // Load credentials
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Load token
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(token);

    const drive = google.drive({ version: 'v3', auth: oAuth2Client });

    // Read the markdown file
    const mdPath = path.join(__dirname, '..', 'AI_CATEGORIZATION_TOOL_STRUGGLES.md');
    const mdContent = fs.readFileSync(mdPath, 'utf8');

    console.log('📄 File Details:');
    console.log('  Path:', mdPath);
    console.log('  Size:', (mdContent.length / 1024).toFixed(2), 'KB');
    console.log('  Lines:', mdContent.split('\n').length);
    console.log();

    // Create Google Doc from plain text
    console.log('☁️  Uploading to Google Drive as Google Document...\n');

    const fileMetadata = {
      name: 'AI Categorization Tool Struggles - Complete Context',
      mimeType: 'application/vnd.google-apps.document'
    };

    const media = {
      mimeType: 'text/plain',
      body: mdContent
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id,name,webViewLink'
    });

    console.log('✅ Google Document Created!\n');
    console.log('📄 Document Details:');
    console.log('  Name:', file.data.name);
    console.log('  ID:', file.data.id);
    console.log('  URL:', file.data.webViewLink);
    console.log();

    // Make it accessible (anyone with link can view/edit)
    console.log('🔓 Setting sharing permissions...\n');

    await drive.permissions.create({
      fileId: file.data.id,
      requestBody: {
        role: 'writer',
        type: 'anyone'
      }
    });

    console.log('✅ Permissions set: Anyone with link can edit\n');

    // Save the URL to a local file for easy reference
    const urlPath = path.join(__dirname, '..', 'AI_CATEGORIZATION_TOOL_STRUGGLES_URL.txt');
    const urlContent = `AI Categorization Tool Struggles - Google Doc

URL: ${file.data.webViewLink}

Created: ${new Date().toISOString()}

This document contains:
• Complete project context & background
• Tool architecture overview (2 distinct tools explained)
• ACLS problem explanation & fix
• Case ID duplication issue
• Specific Rows mode addition details
• Live Logs attempt documentation
• Crash incident & recovery steps
• Hybrid code/function confusion hypothesis
• All syntax errors found & fixed
• Testing timeline (what worked, what broke)
• Recommended next steps & diagnostic questions
• All scripts created during debugging
• Lessons learned & key resources

If Atlas crashes again, read this document to pick up where we left off!
`;

    fs.writeFileSync(urlPath, urlContent);

    console.log('💾 URL saved to:', urlPath);
    console.log();

    console.log('🎉 Upload Complete!\n');
    console.log('📋 You can now access this document at:');
    console.log('   ', file.data.webViewLink);
    console.log();
    console.log('💡 TIP: The document is in markdown format.');
    console.log('   You can read it as-is or use Google Docs to format it.');
    console.log();

    return file.data;

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

uploadStrugglesDoc().catch(console.error);
