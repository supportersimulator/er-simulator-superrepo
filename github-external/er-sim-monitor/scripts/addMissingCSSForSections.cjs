#!/usr/bin/env node

/**
 * ADD MISSING CSS FOR .section AND .section-header CLASSES
 *
 * Problem: JavaScript creates elements with class="section" and class="section-header default"
 * but the CSS doesn't define these classes
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
  const { client_secret, client_id, redirect_uris} = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

async function fix() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading current production...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('🔧 Adding missing CSS for .section and .section-header...\n');

    // Find the end of the CSS in showFieldSelector (before </style>)
    const showFieldStart = code.indexOf('function showFieldSelector() {');
    const styleEnd = code.indexOf("'</style>' +", showFieldStart);

    if (styleEnd === -1) {
      console.log('❌ Could not find </style> tag\n');
      process.exit(1);
    }

    // Add the missing CSS before </style>
    const newCSS = `'.section { background: white; border-radius: 8px; padding: 15px; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }' +
    '.section-header { font-weight: bold; font-size: 14px; padding: 10px; margin: -15px -15px 10px -15px; border-radius: 8px 8px 0 0; }' +
    '.section-header.default { background: #e8f5e9; color: #2e7d32; }' +
    '.section-header.recommended { background: #fff3e0; color: #e65100; }' +
    '.section-header.other { background: #f5f5f5; color: #666; }' +
    '.ai-checkmark { color: #4caf50; font-weight: bold; }' +
    '.rationale { font-size: 12px; color: #666; font-style: italic; margin-top: 4px; }' +
    `;

    code = code.substring(0, styleEnd) + newCSS + code.substring(styleEnd);

    console.log('✅ Added section CSS\n');

    console.log('📤 Deploying...\n');

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
    console.log('✅ FIXED - ADDED MISSING CSS!\n');
    console.log('\nWhat was added:\n');
    console.log('  - .section - White background, rounded corners, shadow');
    console.log('  - .section-header - Bold header style');
    console.log('  - .section-header.default - Green background for defaults');
    console.log('  - .section-header.recommended - Orange background for AI suggestions');
    console.log('  - .section-header.other - Gray background for other fields');
    console.log('  - .ai-checkmark - Green color for ✓✓');
    console.log('  - .rationale - Italic style for AI rationale text\n');
    console.log('Try now - refresh Google Sheet and click cache button!\n');
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
