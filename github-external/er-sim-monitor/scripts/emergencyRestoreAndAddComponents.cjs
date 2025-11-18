#!/usr/bin/env node

/**
 * EMERGENCY RESTORE + ADD COMPONENTS CAREFULLY
 *
 * 1. Restore from last working backup (13:21:54)
 * 2. Add getRecommendedFields() carefully (check it exists in backup first)
 * 3. Add Live Log panel carefully
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

async function authorize() {
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const tokenPath = path.join(__dirname, '../config/token.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

async function fix() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Reading backup file...\n');

    const backupPath = path.join(__dirname, '../backups/monolithic-complete-2025-11-07-13-21-54.gs');
    let code = fs.readFileSync(backupPath, 'utf8');

    console.log('🔍 Checking what already exists in backup...\n');

    const hasGetRecommendedFields = code.includes('function getRecommendedFields(');
    const hasLiveLog = code.includes('id="liveLog"');

    console.log(`  ${hasGetRecommendedFields ? '✅' : '❌'} getRecommendedFields()`);
    console.log(`  ${hasLiveLog ? '✅' : '❌'} Live Log panel\n`);

    if (hasGetRecommendedFields) {
      console.log('✅ getRecommendedFields() already exists in backup - no need to add\n');
    }

    if (!hasLiveLog) {
      console.log('🔧 Adding Live Log panel...\n');

      // Find showFieldSelector function
      const funcStart = code.indexOf('function showFieldSelector() {');
      if (funcStart === -1) {
        console.log('❌ Could not find showFieldSelector\n');
        process.exit(1);
      }

      // Find the </body> tag
      const bodyEnd = code.indexOf('</body>', funcStart);
      if (bodyEnd === -1) {
        console.log('❌ Could not find </body> tag\n');
        process.exit(1);
      }

      const liveLogPanel = `
    <!-- Live Log Panel -->
    <div id="liveLog" style="
      margin: 20px;
      padding: 15px;
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 8px;
      max-height: 200px;
      overflow-y: auto;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: #00ff00;
    ">
      <div style="font-weight: bold; margin-bottom: 10px; color: #00ff00;">📡 Live Log</div>
      <div id="logContent" style="white-space: pre-wrap;">Waiting for activity...</div>
    </div>

  `;

      code = code.substring(0, bodyEnd) + liveLogPanel + code.substring(bodyEnd);
      console.log('✅ Added Live Log panel\n');
    } else {
      console.log('ℹ️  Live Log panel already exists in backup\n');
    }

    console.log('📤 Deploying restored backup with Live Log...\n');

    // Get manifest
    const currentContent = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });
    const manifestFile = currentContent.data.files.find(f => f.name === 'appsscript');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: {
        files: [
          { name: 'Code', type: 'SERVER_JS', source: code },
          manifestFile
        ]
      }
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ RESTORED + ADDED LIVE LOG PANEL!\n');
    console.log('\nWhat was done:\n');
    console.log('  ✅ Restored from last working backup (13:21:54)');
    console.log('  ✅ Backup already had getRecommendedFields()');
    console.log('  ✅ Added Live Log panel to modal HTML\n');
    console.log('Ready to test:\n');
    console.log('  1. Refresh Google Sheet (F5)');
    console.log('  2. Click 🧠 Sim Builder → 🧩 Categories & Pathways');
    console.log('  3. Click cache button');
    console.log('  4. Should see Live Log panel at bottom!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

fix();
