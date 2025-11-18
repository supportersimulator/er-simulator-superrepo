#!/usr/bin/env node

/**
 * UPLOAD AI CATEGORIZATION TOOL STRUGGLES TO GOOGLE DRIVE
 *
 * Creates a Google Document from the markdown file for easy reference
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

    // Convert markdown to simple HTML for better Google Docs formatting
    console.log('🔄 Converting markdown to HTML...\n');

    const htmlContent = convertMarkdownToHTML(mdContent);

    // Create Google Doc
    console.log('☁️  Uploading to Google Drive as Google Document...\n');

    const fileMetadata = {
      name: 'AI Categorization Tool Struggles - Complete Context',
      mimeType: 'application/vnd.google-apps.document'
    };

    const media = {
      mimeType: 'text/html',
      body: htmlContent
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

    // Make it accessible (anyone with link can view)
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
    fs.writeFileSync(urlPath, `AI Categorization Tool Struggles - Google Doc\n\nURL: ${file.data.webViewLink}\n\nCreated: ${new Date().toISOString()}\n`);

    console.log('💾 URL saved to:', urlPath);
    console.log();

    console.log('🎉 Upload Complete!\n');
    console.log('📋 You can now access this document at:');
    console.log('   ', file.data.webViewLink);
    console.log();
    console.log('📝 Document includes:');
    console.log('   • Complete project context & background');
    console.log('   • Tool architecture overview');
    console.log('   • ACLS problem explanation');
    console.log('   • Case ID duplication issue');
    console.log('   • Specific Rows mode addition details');
    console.log('   • Live Logs attempt documentation');
    console.log('   • Crash incident recovery steps');
    console.log('   • Hybrid code/function confusion hypothesis');
    console.log('   • Syntax errors found & fixed');
    console.log('   • Testing timeline (what worked, what broke)');
    console.log('   • Recommended next steps');
    console.log('   • All scripts created during debugging');
    console.log('   • Lessons learned & key resources');
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

/**
 * Convert markdown to HTML for Google Docs
 */
function convertMarkdownToHTML(markdown) {
  let html = '<html><body style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px;">';

  // Split into lines
  const lines = markdown.split('\n');
  let inCodeBlock = false;
  let inList = false;

  lines.forEach(line => {
    // Code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        html += '</pre>';
        inCodeBlock = false;
      } else {
        html += '<pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto;">';
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      html += escapeHtml(line) + '\n';
      return;
    }

    // Headers
    if (line.startsWith('# ')) {
      html += `<h1 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">${escapeHtml(line.substring(2))}</h1>`;
    } else if (line.startsWith('## ')) {
      html += `<h2 style="color: #34495e; margin-top: 30px;">${escapeHtml(line.substring(3))}</h2>`;
    } else if (line.startsWith('### ')) {
      html += `<h3 style="color: #7f8c8d;">${escapeHtml(line.substring(4))}</h3>`;
    } else if (line.startsWith('#### ')) {
      html += `<h4 style="color: #95a5a6;">${escapeHtml(line.substring(5))}</h4>`;
    }
    // Horizontal rules
    else if (line.startsWith('---')) {
      html += '<hr style="border: none; border-top: 2px solid #ecf0f1; margin: 30px 0;" />';
    }
    // Lists
    else if (line.match(/^[\*\-\+]\s/)) {
      if (!inList) {
        html += '<ul style="margin-left: 20px;">';
        inList = true;
      }
      html += `<li>${formatInline(line.substring(2))}</li>`;
    } else if (line.match(/^\d+\.\s/)) {
      if (!inList) {
        html += '<ol style="margin-left: 20px;">';
        inList = true;
      }
      const text = line.replace(/^\d+\.\s/, '');
      html += `<li>${formatInline(text)}</li>`;
    } else {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      // Paragraphs
      if (line.trim()) {
        html += `<p>${formatInline(line)}</p>`;
      }
    }
  });

  if (inCodeBlock) html += '</pre>';
  if (inList) html += '</ul>';

  html += '</body></html>';
  return html;
}

/**
 * Format inline markdown (bold, italic, code, links)
 */
function formatInline(text) {
  // Escape HTML first
  text = escapeHtml(text);

  // Bold
  text = text.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');

  // Italic
  text = text.replace(/\*([^\*]+)\*/g, '<em>$1</em>');

  // Inline code
  text = text.replace(/`([^`]+)`/g, '<code style="background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-family: monospace;">$1</code>');

  // Links (but escaped, so need to unescape the < and >)
  text = text.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" style="color: #3498db;">$1</a>');

  // Emojis (keep as-is)

  return text;
}

/**
 * Escape HTML entities
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

uploadStrugglesDoc().catch(console.error);
