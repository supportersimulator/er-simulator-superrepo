#!/usr/bin/env node

/**
 * FIX SYNTAX ERROR: Line 1236 - Malformed if statement
 *
 * Problem: if (false) // DISABLED - was causing syntax errors {
 * Solution: Remove the entire conditional block (it was disabled anyway)
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

// Your Apps Script project ID
const SCRIPT_ID = process.env.APPS_SCRIPT_ID || '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

async function fixSyntaxError() {
  console.log('🔧 Fixing syntax error in Phase2_Enhanced_Categories_With_AI.gs\n');

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

    // Fix the syntax error on line 1236
    console.log('🔧 Applying fix...');
    console.log('   Problem: if (false) // DISABLED - was causing syntax errors {');
    console.log('   Solution: Remove the entire disabled block\n');

    // The problematic section is:
    // if (false) // DISABLED - was causing syntax errors {
    //   document.getElementById('ai-review-container').classList.add('visible');
    // }

    const badPattern = /if \(false\) \/\/ DISABLED - was causing syntax errors \{\s*document\.getElementById\('ai-review-container'\)\.classList\.add\('visible'\);\s*\}/;

    if (content.match(badPattern)) {
      content = content.replace(badPattern, '// Auto-show AI review container removed (was causing syntax errors)');
      console.log('✅ Removed problematic if (false) block');
    } else {
      // Try alternative fix - just comment out the entire thing
      const altPattern = /if \(false\)[^\n]*\n\s*document\.getElementById\('ai-review-container'\)\.classList\.add\('visible'\);\s*\n\s*\}/;

      if (content.match(altPattern)) {
        content = content.replace(altPattern, '// Auto-show AI review container removed (was causing syntax errors)');
        console.log('✅ Removed problematic if (false) block (alternative pattern)');
      } else {
        console.log('⚠️  Pattern not found exactly, using line-based replacement...');

        // Split by lines and fix line 1236
        const lines = content.split('\n');

        lines.forEach((line, idx) => {
          if (line.includes('if (false) // DISABLED - was causing syntax errors')) {
            console.log('   Found at line', idx + 1);

            // Comment out this line and the next two
            lines[idx] = '    // Auto-show AI review container removed (was causing syntax errors)';
            if (lines[idx + 1].includes("document.getElementById('ai-review-container')")) {
              lines[idx + 1] = '    // ' + lines[idx + 1].trim();
            }
            if (lines[idx + 2].trim() === '}') {
              lines[idx + 2] = '    // ' + lines[idx + 2].trim();
            }
          }
        });

        content = lines.join('\n');
        console.log('✅ Applied line-based fix');
      }
    }

    console.log('   Fixed size:', content.length, 'characters\n');

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
    const backupPath = path.join(__dirname, '..', 'backups', 'Phase2_Enhanced_Categories_With_AI_FIXED.gs');
    fs.writeFileSync(backupPath, content);
    console.log('💾 Backup saved to:', backupPath);

    console.log('\n🎉 Syntax error fixed and deployed!');
    console.log('\n📝 What was fixed:');
    console.log('   - Line 1236: Removed malformed if (false) block');
    console.log('   - This was causing JavaScript syntax errors in the panel');
    console.log('   - The block was disabled anyway, so removing it is safe\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

fixSyntaxError();
