#!/usr/bin/env node

/**
 * Restore ORIGINAL ATSR with Editable UI
 *
 * Uses apps-script-backup/Code.gs as the source
 * - Keeps the editable text field UI
 * - Converts to light grey theme
 * - Removes Case_ID section
 * - Adds Categories panel
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const SCRIPT_ID = '1NXjFvH2Wo117saCyqmNDfCqZ1iQ9vykxa0-kHUhFAYDuhthgql5Ru_P6';
const BACKUP_PATH = path.join(__dirname, '../apps-script-backup/Code.gs');
const CATEGORIES_PANEL_PATH = path.join(__dirname, 'CategoriesPathwaysPanel_Light.gs');
const OUTPUT_PATH = path.join(__dirname, 'Code_ORIGINAL_RESTORED.gs');

console.log('');
console.log('════════════════════════════════════════════════════');
console.log('   🎯 RESTORING ORIGINAL ATSR WITH EDITABLE UI');
console.log('════════════════════════════════════════════════════');
console.log('');

// Step 1: Read backup
console.log('📖 Step 1: Reading backup Code.gs...');
let code = fs.readFileSync(BACKUP_PATH, 'utf8');
console.log(`   ✅ Loaded ${code.length} characters`);

// Step 2: Remove Case_ID section from UI
console.log('📝 Step 2: Removing Case_ID section...');

// Find and remove the Case_ID card (lines 2070-2074)
const caseIdCardStart = code.indexOf('<div class="card">\n      <h3>🆔 Case IDs (10)</h3>');
if (caseIdCardStart !== -1) {
  const caseIdCardEnd = code.indexOf('</div>\n\n    <div class="card">', caseIdCardStart);
  if (caseIdCardEnd !== -1) {
    const before = code.substring(0, caseIdCardStart);
    const after = code.substring(caseIdCardEnd + 11); // +11 to skip "</div>\n\n    "
    code = before + after;
    console.log('   ✅ Removed Case_ID UI card');
  }
}

// Remove Case_IDs from prompt output format
code = code.replace(/\s*"Case_IDs":\s*\["\.\.\.x10"\],?/g, '');

// Remove Case_ID from data saving
code = code.replace(/\s*setVal\(['"]Case_ID['"],\s*caseID\);?/g, '');
code = code.replace(/const caseID\s*=\s*getTxt\(['"]caseID['"]\);?/g, '');

console.log('   ✅ Removed Case_ID references');

// Step 3: Convert to light grey theme
console.log('📝 Step 3: Converting to light grey theme...');

const colorMap = {
  'background:#0f1115': 'background:#f5f7fa',
  'background: #0f1115': 'background: #f5f7fa',
  'background:#1b1f2a': 'background:#e8edf2',
  'background: #1b1f2a': 'background: #e8edf2',
  'background:#141824': 'background:#ffffff',
  'background: #141824': 'background: #ffffff',
  'color:#e7eaf0': 'color:#2c3e50',
  'color: #e7eaf0': 'color: #2c3e50',
  'border:1px solid #2a3040': 'border:1px solid #dfe3e8',
  'border: 1px solid #2a3040': 'border: 1px solid #dfe3e8',
  'border:1px solid #30384b': 'border:1px solid #cbd5e0',
  'border: 1px solid #30384b': 'border: 1px solid #cbd5e0',
  '#2357ff': '#3b82f6',
  '#2a3040': '#e2e8f0'
};

Object.entries(colorMap).forEach(([dark, light]) => {
  code = code.replace(new RegExp(dark.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), light);
});

console.log('   ✅ Converted to light grey theme');

// Step 4: Add Categories panel
console.log('📝 Step 4: Adding Categories & Pathways panel...');
const categoriesPanel = fs.readFileSync(CATEGORIES_PANEL_PATH, 'utf8');

const onOpenIdx = code.indexOf('function onOpen()');
if (onOpenIdx !== -1) {
  const before = code.substring(0, onOpenIdx);
  const after = code.substring(onOpenIdx);
  code = before + '\n\n' + categoriesPanel + '\n\n' + after;

  // Add menu item
  const atsrMenuIdx = code.indexOf("addItem(`${ICONS.wand} ATSR");
  if (atsrMenuIdx !== -1) {
    const lines = code.split('\n');
    const atsrLineIdx = lines.findIndex(line => line.includes("addItem(`${ICONS.wand} ATSR"));
    if (atsrLineIdx !== -1) {
      lines.splice(atsrLineIdx + 1, 0, "    .addItem('📂 Categories & Pathways', 'openCategoriesPathwaysPanel')");
      code = lines.join('\n');
      console.log('   ✅ Added Categories menu item');
    }
  }

  console.log('   ✅ Added Categories panel');
}

// Step 5: Save locally
fs.writeFileSync(OUTPUT_PATH, code);
console.log('');
console.log(`💾 Saved to: ${OUTPUT_PATH}`);
console.log(`📊 Size: ${code.length} characters`);
console.log('');

// Step 6: Deploy
console.log('🚀 Step 5: Deploying to Google Sheets...');

async function deploy() {
  console.log('🔐 Authenticating...');
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const {client_id, client_secret, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const tokenPath = path.join(__dirname, '../config/token.json');
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  oAuth2Client.setCredentials(token);
  console.log('   ✅ Authenticated');

  const script = google.script({version: 'v1', auth: oAuth2Client});

  console.log('📥 Fetching current project...');
  const project = await script.projects.getContent({scriptId: SCRIPT_ID});
  console.log(`   ✅ Found ${project.data.files.length} files`);

  const updatedFiles = project.data.files.map(file => {
    if (file.name === 'Code') {
      return { name: file.name, type: file.type, source: code };
    }
    return file;
  });

  console.log('⬆️  Pushing changes...');
  await script.projects.updateContent({
    scriptId: SCRIPT_ID,
    requestBody: { files: updatedFiles }
  });

  console.log('   ✅ Deployment complete!');
  console.log('');

  console.log('════════════════════════════════════════════════════');
  console.log('✅ ORIGINAL ATSR RESTORED');
  console.log('════════════════════════════════════════════════════');
  console.log('');

  console.log('📋 Your ATSR now has:');
  console.log('   ✅ Big diagnosis heading at top');
  console.log('   ✅ Case Summary with Key Intervention & Core Takeaway');
  console.log('   ✅ Large editable panels for Spark Titles & Reveal Titles');
  console.log('   ✅ "Save" and "Save & Continue" buttons');
  console.log('   ✅ Light grey theme');
  console.log('   ❌ NO Case_ID section');
  console.log('   ✅ Categories & Pathways panel');
  console.log('');

  console.log('🧪 Test it now:');
  console.log('   1. Open Google Sheet');
  console.log('   2. Refresh page (Cmd+R)');
  console.log('   3. Click: 🧠 Sim Builder → ATSR');
  console.log('   4. You should see the original UI with editable text fields!');
  console.log('');
}

deploy().catch(err => {
  console.error('❌ Deploy error:', err.message);
  process.exit(1);
});
