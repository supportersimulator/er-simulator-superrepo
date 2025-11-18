#!/usr/bin/env node

/**
 * Check Code.gs for runAICategorization and panel functions
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🔍 Checking Code.gs for AI Categorization Functions\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  const token = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'token.json'), 'utf-8'));
  const credentials = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'credentials.json'), 'utf-8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed;

  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oAuth2Client });
  const scriptId = process.env.APPS_SCRIPT_ID;

  const project = await script.projects.getContent({ scriptId });
  const codeFile = project.data.files.find(f => f.name === 'Code');

  if (!codeFile) {
    console.log('❌ Code.gs not found\n');
    return;
  }

  console.log('✅ Found Code.gs (', Math.round(codeFile.source.length / 1024), 'KB )\n');

  // Search for runAICategorization function
  const runAIMatch = codeFile.source.match(/function runAICategorization\([^)]*\)\s*{/);

  if (runAIMatch) {
    console.log('⚠️  FOUND: runAICategorization() in Code.gs\n');

    // Find the line number
    const lines = codeFile.source.split('\n');
    let lineNum = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('function runAICategorization')) {
        lineNum = i + 1;
        break;
      }
    }

    console.log('Location: Line', lineNum);
    console.log('\n📄 Function signature:\n');
    console.log(runAIMatch[0]);
    console.log('\n');

    // Show surrounding context
    const startLine = Math.max(0, lineNum - 3);
    const endLine = Math.min(lines.length, lineNum + 10);

    console.log('Context (lines', startLine + 1, '-', endLine + 1, '):\n');
    for (let i = startLine; i < endLine; i++) {
      console.log(`${i + 1}: ${lines[i]}`);
    }
    console.log('\n');
  } else {
    console.log('✅ NO runAICategorization() in Code.gs (good!)\n');
  }

  // Check for other panel-related functions
  const hasOpenPanel = codeFile.source.includes('function openCategoriesPathwaysPanel');
  const hasBuildPanel = codeFile.source.includes('function buildCategoriesPathwaysMainMenu_');

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('Function Presence in Code.gs:\n');
  console.log('runAICategorization():', runAIMatch ? '❌ YES (COLLISION!)' : '✅ NO (good)');
  console.log('openCategoriesPathwaysPanel():', hasOpenPanel ? '✅ YES' : '❌ NO');
  console.log('buildCategoriesPathwaysMainMenu_():', hasBuildPanel ? '❌ YES (might collide)' : '✅ NO (good)');
  console.log('\n');

  if (runAIMatch) {
    console.log('🚨 COLLISION DETECTED!\n');
    console.log('Code.gs has runAICategorization() which CONFLICTS with');
    console.log('the one in Phase2_Enhanced_Categories_With_AI.gs\n');
    console.log('In Apps Script, when functions have the same name,');
    console.log('the LAST loaded file wins. Others are silently overwritten.\n');
    console.log('SOLUTION: Remove runAICategorization() from Code.gs\n');
  }

  // Save Code.gs for inspection
  fs.writeFileSync('/tmp/Code_gs_current.gs', codeFile.source);
  console.log('💾 Saved Code.gs to: /tmp/Code_gs_current.gs\n');
}

main().catch(console.error);
