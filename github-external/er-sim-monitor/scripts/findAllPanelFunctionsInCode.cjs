/**
 * Find All Panel Functions in Code.gs
 *
 * User says features are in Code.gs - let's find all panel builder functions
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Finding All Panel Functions in Code.gs\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oAuth2Client });
  const scriptId = process.env.APPS_SCRIPT_ID;

  const project = await script.projects.getContent({ scriptId });
  const codeFile = project.data.files.find(f => f.name === 'Code');

  if (!codeFile) {
    console.log('❌ Code.gs not found\n');
    return;
  }

  const code = codeFile.source;

  console.log('🔍 Panel Builder Functions in Code.gs:\n');

  // Find all functions that look like panel builders
  const panelFuncRegex = /function (build[a-zA-Z_]+)\(\)/g;
  const functions = [];
  let match;

  while ((match = panelFuncRegex.exec(code)) !== null) {
    functions.push(match[1]);
  }

  if (functions.length === 0) {
    console.log('❌ No panel builder functions found\n');
    return;
  }

  console.log(`Found ${functions.length} panel builder functions:\n`);

  for (const funcName of functions) {
    console.log(`📋 ${funcName}()`);

    // Find the function body
    const funcStart = code.indexOf(`function ${funcName}(`);
    if (funcStart === -1) continue;

    // Get a chunk of the function to analyze
    const funcChunk = code.substring(funcStart, funcStart + 5000);

    // Check for key features
    const features = {
      'Live Logs': funcChunk.includes('Live Logs') || funcChunk.includes('getAILogs'),
      'Copy Logs': funcChunk.includes('Copy Logs') || funcChunk.includes('copyAILogs'),
      'Select Rows': funcChunk.includes('aiCatMode') || funcChunk.includes('Specific Rows'),
      'Run AI': funcChunk.includes('Run AI Categorization'),
      'Retry Failed': funcChunk.includes('Retry Failed'),
      'Apply to Master': funcChunk.includes('Apply') && funcChunk.includes('Master'),
      'Export CSV': funcChunk.includes('Export') && funcChunk.includes('CSV'),
      'Clear Results': funcChunk.includes('Clear Results'),
    };

    console.log('   Features:');
    for (const [name, has] of Object.entries(features)) {
      if (has) console.log(`     ✅ ${name}`);
    }

    // Count matches
    const matchCount = Object.values(features).filter(Boolean).length;
    if (matchCount >= 6) {
      console.log(`   🎯 HIGH MATCH (${matchCount}/8) - THIS IS LIKELY THE ONE!\n`);
    } else if (matchCount > 0) {
      console.log(`   (${matchCount}/8 matches)\n`);
    } else {
      console.log('');
    }
  }

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🔍 Now checking which function is actually called by menu:\n');

  // Find the onOpen function to see which panel is opened
  const onOpenMatch = code.match(/function onOpen[^{]*\{[\s\S]{0,2000}/);
  if (onOpenMatch) {
    const onOpenCode = onOpenMatch[0];

    // Look for menu items
    const menuRegex = /\.addItem\(['"']([^'"']+)['"'],\s*['"']([^'"']+)['"']\)/g;
    let menuMatch;

    console.log('Menu Items:');
    while ((menuMatch = menuRegex.exec(onOpenCode)) !== null) {
      const menuText = menuMatch[1];
      const functionName = menuMatch[2];

      if (menuText.toLowerCase().includes('ai') || menuText.toLowerCase().includes('categor')) {
        console.log(`  "${menuText}" → ${functionName}()`);
      }
    }
    console.log('');
  }

  console.log('══════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
