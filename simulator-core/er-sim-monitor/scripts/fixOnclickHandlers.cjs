#!/usr/bin/env node

/**
 * FIX ONCLICK HANDLERS
 *
 * The category/pathway list items have broken onclick handlers that
 * use this.textContent.trim() which generates malformed JavaScript.
 *
 * We need to pass the actual category/pathway name as a properly quoted parameter.
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const SCOPES = [
  'https://www.googleapis.com/auth/script.projects',
  'https://www.googleapis.com/auth/drive'
];

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, '..', 'config', 'credentials.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function fixOnclickHandlers() {
  console.log('🔧 Fixing onclick handlers in Phase2_Enhanced_Categories_With_AI.gs\n');

  try {
    // Load credentials
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Load token
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(token);

    const script = google.script({ version: 'v1', auth: oAuth2Client });

    // Get current project content
    console.log('📥 Fetching current Apps Script project...');
    const projectResponse = await script.projects.getContent({ scriptId: SCRIPT_ID });
    const files = projectResponse.data.files;

    // Find the Phase2 file
    const phase2File = files.find(f => f.name === 'Phase2_Enhanced_Categories_With_AI');

    if (!phase2File) {
      console.error('❌ Phase2_Enhanced_Categories_With_AI file not found!');
      return;
    }

    console.log('✅ Found file:', phase2File.name);
    console.log('   Original size:', phase2File.source.length, 'characters\n');

    let content = phase2File.source;

    // Fix 1: Category list onclick handler
    console.log('🔧 Fix 1: Category list onclick handlers');

    const oldCategoryPattern = `      <div class="list-item" onclick="viewCategory(this.textContent.trim())">
        <span class="item-label">\${cat}</span>
        <span class="item-count">\${count}</span>
      </div>`;

    const newCategoryPattern = `      <div class="list-item" onclick="viewCategory('\${cat.replace(/'/g, "\\\\'")}')">
        <span class="item-label">\${cat}</span>
        <span class="item-count">\${count}</span>
      </div>`;

    if (content.includes(oldCategoryPattern)) {
      content = content.replace(oldCategoryPattern, newCategoryPattern);
      console.log('   ✅ Fixed category onclick handler');
    } else {
      console.log('   ⚠️  Category pattern not found (may already be fixed)');
    }

    // Fix 2: Pathway list onclick handler
    console.log('\n🔧 Fix 2: Pathway list onclick handlers');

    const oldPathwayPattern = `      <div class="list-item" onclick="viewPathway(this.textContent.trim())">
        <span class="item-label">\${path}</span>
        <span class="item-count">\${count}</span>
      </div>`;

    const newPathwayPattern = `      <div class="list-item" onclick="viewPathway('\${path.replace(/'/g, "\\\\'")}')">
        <span class="item-label">\${path}</span>
        <span class="item-count">\${count}</span>
      </div>`;

    if (content.includes(oldPathwayPattern)) {
      content = content.replace(oldPathwayPattern, newPathwayPattern);
      console.log('   ✅ Fixed pathway onclick handler');
    } else {
      console.log('   ⚠️  Pathway pattern not found (may already be fixed)');
    }

    console.log('\n   Fixed size:', content.length, 'characters\n');

    // Update the file
    phase2File.source = content;

    // Deploy the fixed version
    console.log('🚀 Deploying fixed version to Apps Script...');

    await script.projects.updateContent({
      scriptId: SCRIPT_ID,
      requestBody: {
        files: files.map(f => {
          if (f.name === 'Phase2_Enhanced_Categories_With_AI') {
            return phase2File;
          }
          return f;
        })
      }
    });

    console.log('✅ Deployment successful!\n');

    // Save backup locally
    const backupPath = path.join(__dirname, '..', 'backups', 'Phase2_Enhanced_Categories_With_AI_ONCLICK_FIXED.gs');
    fs.writeFileSync(backupPath, content);
    console.log('💾 Backup saved to:', backupPath);

    console.log('\n🎉 Onclick handlers fixed and deployed!');
    console.log('\n📝 What was fixed:');
    console.log('   - Category list: Changed from this.textContent.trim() to direct parameter');
    console.log('   - Pathway list: Changed from this.textContent.trim() to direct parameter');
    console.log('   - Added proper quote escaping for category/pathway names');
    console.log('   - Generated HTML will now have valid onclick attributes\n');

    console.log('🧪 Testing Instructions:');
    console.log('   1. Refresh Google Sheets (F5)');
    console.log('   2. Open Categories & Pathways panel');
    console.log('   3. Check console - should see NO "Unexpected token }" errors');
    console.log('   4. Click a category name - should work without errors\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

fixOnclickHandlers();
