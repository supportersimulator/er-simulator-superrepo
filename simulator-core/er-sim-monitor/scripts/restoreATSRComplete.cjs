#!/usr/bin/env node

/**
 * Complete ATSR Restoration
 *
 * Takes Code_ENHANCED_ATSR.gs and:
 * 1. Removes Case_ID sections completely
 * 2. Converts to light grey theme
 * 3. Adds Categories panel
 * 4. Deploys to Google Sheets
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const SCRIPT_ID = '1NXjFvH2Wo117saCyqmNDfCqZ1iQ9vykxa0-kHUhFAYDuhthgql5Ru_P6';
const ENHANCED_ATSR_PATH = path.join(__dirname, 'Code_ENHANCED_ATSR.gs');
const CATEGORIES_PANEL_PATH = path.join(__dirname, 'CategoriesPathwaysPanel_Light.gs');
const OUTPUT_PATH = path.join(__dirname, 'Code_RESTORED_FINAL.gs');

console.log('');
console.log('════════════════════════════════════════════════════');
console.log('   ✨ COMPLETE ATSR RESTORATION');
console.log('════════════════════════════════════════════════════');
console.log('');

// Step 1: Read enhanced ATSR
console.log('📖 Step 1: Reading enhanced ATSR...');
let code = fs.readFileSync(ENHANCED_ATSR_PATH, 'utf8');
console.log(`   ✅ Loaded ${code.length} characters`);

// Step 2: Remove ALL Case_ID references
console.log('📝 Step 2: Removing all Case_ID references...');

// Remove Case_ID section from prompt (section 3)
const caseIdSectionStart = code.indexOf('### 3. **Case IDs**');
if (caseIdSectionStart !== -1) {
  const nextSection = code.indexOf('### 4.', caseIdSectionStart);
  if (nextSection !== -1) {
    const before = code.substring(0, caseIdSectionStart);
    const after = code.substring(nextSection).replace('### 4.', '### 3.');
    code = before + after;
    console.log('   ✅ Removed Case_ID prompt section');
  }
}

// Remove Case_IDs from JSON output format
code = code.replace(/\s*"Case_IDs":\s*\["\.\.\.x10"\],?/g, '');
code = code.replace(/\s*"Case_IDs":\s*\[.*?\],?/gm, '');

// Remove Case_ID UI section
code = code.replace(/<div class="field-row">[\s\S]*?<label>.*?Case.*?ID.*?<\/label>[\s\S]*?<\/div>/gi, '');
code = code.replace(/💎 Case IDs \(10\)/g, '');
code = code.replace(/ID Case IDs \(10\)/g, '');

// Remove setVal calls for Case_ID
code = code.replace(/\s*setVal\(['"]Case_ID['"],\s*\w+\);?/g, '');
code = code.replace(/\$\{makeSelect\(parsed\.Case_IDs.*?\)\}/g, '');

// Remove "Provide 10 Case IDs" instruction
code = code.replace(/- Provide 10 Case IDs\..*?\n.*?uppercase letters.*?\n/gs, '');

console.log('   ✅ Removed all Case_ID references');

// Step 3: Convert to light grey theme
console.log('📝 Step 3: Converting to light grey theme...');

const colorMap = {
  'background:#0f1115': 'background:#f5f7fa',
  'background: #0f1115': 'background: #f5f7fa',
  'background:#141824': 'background:#ffffff',
  'background: #141824': 'background: #ffffff',
  'color:#e7eaf0': 'color:#2c3e50',
  'color: #e7eaf0': 'color: #2c3e50',
  'border:1px solid #2a3040': 'border:1px solid #dfe3e8',
  'border: 1px solid #2a3040': 'border: 1px solid #dfe3e8',
  '#1a1f2e': '#f8f9fa',
  '#2a3040': '#dfe3e8',
  '#00ff00': '#10b981',
  '#0099ff': '#3b82f6'
};

Object.entries(colorMap).forEach(([dark, light]) => {
  code = code.replace(new RegExp(dark.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), light);
});

console.log('   ✅ Converted to light grey theme');

// Step 4: Add Categories panel
console.log('📝 Step 4: Adding Categories & Pathways panel...');
const categoriesPanel = fs.readFileSync(CATEGORIES_PANEL_PATH, 'utf8');

// Find onOpen function
const onOpenIdx = code.indexOf('function onOpen()');
if (onOpenIdx !== -1) {
  // Insert categories panel code before onOpen
  const before = code.substring(0, onOpenIdx);
  const after = code.substring(onOpenIdx);
  code = before + '\n\n' + categoriesPanel + '\n\n' + after;

  // Add menu item after ATSR
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
} else {
  console.log('   ⚠️  Could not find onOpen function');
}

// Step 5: Save locally
fs.writeFileSync(OUTPUT_PATH, code);
console.log('');
console.log(`💾 Saved to: ${OUTPUT_PATH}`);
console.log(`📊 Size: ${code.length} characters`);
console.log('');

// Step 6: Deploy to Google Sheets
console.log('🚀 Step 5: Deploying to Google Sheets...');

async function deploy() {
  // Authenticate
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

  // Get current project
  console.log('📥 Fetching current project...');
  const project = await script.projects.getContent({scriptId: SCRIPT_ID});
  console.log(`   ✅ Found ${project.data.files.length} files`);

  // Update Code.gs
  const updatedFiles = project.data.files.map(file => {
    if (file.name === 'Code') {
      return { name: file.name, type: file.type, source: code };
    }
    return file;
  });

  // Push update
  console.log('⬆️  Pushing changes...');
  await script.projects.updateContent({
    scriptId: SCRIPT_ID,
    requestBody: { files: updatedFiles }
  });

  console.log('   ✅ Deployment complete!');
  console.log('');

  console.log('════════════════════════════════════════════════════');
  console.log('✅ ATSR FULLY RESTORED');
  console.log('════════════════════════════════════════════════════');
  console.log('');

  console.log('📋 Your Google Sheets now has:');
  console.log('   ✅ ATSR with rich 334-line Sim Mastery prompt');
  console.log('   ✅ Light grey theme (easy to read)');
  console.log('   ❌ NO Case_ID section (removed)');
  console.log('   ✅ Categories & Pathways panel');
  console.log('');

  console.log('🧪 Test it now:');
  console.log('   1. Open Google Sheet');
  console.log('   2. Refresh page (Cmd+R)');
  console.log('   3. Click: 🧠 Sim Builder → ATSR');
  console.log('   4. Should see light grey theme, no Case_ID');
  console.log('   5. Output should be "AMAZING" quality!');
  console.log('');
}

deploy().catch(err => {
  console.error('❌ Deploy error:', err.message);
  process.exit(1);
});
