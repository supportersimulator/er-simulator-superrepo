#!/usr/bin/env node

/**
 * Analyze Enhanced_Visual_Panel_With_Toggle.gs
 * Determine its purpose and dependencies
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, '..', 'config', 'credentials.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function analyzeEnhancedVisualPanel() {
  console.log('🔍 Analyzing Enhanced_Visual_Panel_With_Toggle.gs\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  try {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(token);

    const script = google.script({ version: 'v1', auth: oAuth2Client });
    const projectResponse = await script.projects.getContent({ scriptId: SCRIPT_ID });
    const files = projectResponse.data.files;

    const enhancedFile = files.find(f => f.name === 'Enhanced_Visual_Panel_With_Toggle');

    if (!enhancedFile) {
      console.log('❌ Enhanced_Visual_Panel_With_Toggle.gs not found!\n');
      return;
    }

    const content = enhancedFile.source;
    const lines = content.split('\n');

    console.log('📄 File Info:\n');
    console.log(`  Size: ${Math.round(content.length / 1024)} KB`);
    console.log(`  Lines: ${lines.length}\n`);

    // Find all functions
    console.log('══════════════════════════════════════════════════════════════\n');
    console.log('🔧 FUNCTIONS DEFINED:\n');

    const functions = [];
    lines.forEach((line, idx) => {
      const match = line.match(/^function (\w+)\s*\(/);
      if (match) {
        functions.push({
          name: match[1],
          line: idx + 1,
          signature: line.trim()
        });
      }
    });

    functions.forEach(f => {
      console.log(`  ${f.line}: ${f.signature}`);
    });

    // Find external function calls
    console.log('\n══════════════════════════════════════════════════════════════\n');
    console.log('📞 CALLS TO EXTERNAL FUNCTIONS:\n');

    const externalCalls = new Set();

    // Look for calls to Phase2 functions
    if (content.includes('openCategoriesPathwaysPanel')) {
      externalCalls.add('openCategoriesPathwaysPanel (Phase2)');
    }
    if (content.includes('buildCategoriesPathwaysMainMenu_')) {
      externalCalls.add('buildCategoriesPathwaysMainMenu_ (Phase2)');
    }
    if (content.includes('runPathwayChainBuilder')) {
      externalCalls.add('runPathwayChainBuilder (Pathways UI)');
    }
    if (content.includes('buildBirdEyeViewUI_')) {
      externalCalls.add('buildBirdEyeViewUI_ (Pathways UI)');
    }

    if (externalCalls.size > 0) {
      externalCalls.forEach(call => {
        console.log(`  ✅ ${call}`);
      });
    } else {
      console.log('  ❌ No external function calls found\n');
    }

    // Check what it displays
    console.log('\n══════════════════════════════════════════════════════════════\n');
    console.log('🎨 WHAT IT DISPLAYS:\n');

    const uiElements = [];
    if (content.includes('Categories') && content.includes('button')) {
      uiElements.push('Category list/buttons');
    }
    if (content.includes('Pathways') && content.includes('button')) {
      uiElements.push('Pathway list/buttons');
    }
    if (content.includes('AI Categorization') || content.includes('AI Auto-Categorization')) {
      uiElements.push('AI Categorization UI');
    }
    if (content.includes('<button') || content.includes('onclick')) {
      const buttonMatches = content.match(/onclick="([^"]+)"/g) || [];
      uiElements.push(`${buttonMatches.length} button click handlers`);
    }

    uiElements.forEach(el => {
      console.log(`  - ${el}`);
    });

    // Find the specific call to openCategoriesPathwaysPanel
    console.log('\n══════════════════════════════════════════════════════════════\n');
    console.log('🔗 REFERENCE TO openCategoriesPathwaysPanel:\n');

    lines.forEach((line, idx) => {
      if (line.includes('openCategoriesPathwaysPanel') && !line.includes('function openCategoriesPathwaysPanel')) {
        console.log(`  Line ${idx + 1}: ${line.trim()}`);
      }
    });

    // Check if it's just a wrapper
    console.log('\n══════════════════════════════════════════════════════════════\n');
    console.log('💡 PURPOSE ANALYSIS:\n');

    const hasOwnUI = content.includes('buildEnhancedCategoriesTab') || content.includes('<div') || content.includes('<html');
    const callsPhase2 = content.includes('openCategoriesPathwaysPanel');
    const callsPathways = content.includes('runPathwayChainBuilder');

    if (hasOwnUI && !callsPhase2 && !callsPathways) {
      console.log('  📊 STANDALONE TOOL - Has its own UI, no dependencies\n');
    } else if (hasOwnUI && callsPhase2 && !callsPathways) {
      console.log('  🔀 WRAPPER/ROUTER - Shows UI then routes to Phase2 AI Categorization\n');
      console.log('  ⚠️  REDUNDANT - Could be eliminated, call Phase2 directly from menu\n');
    } else if (!hasOwnUI && callsPhase2) {
      console.log('  🔗 SIMPLE WRAPPER - Just calls Phase2, no own UI\n');
      console.log('  ⚠️  REDUNDANT - Unnecessary middle layer\n');
    } else if (callsPathways) {
      console.log('  ⚠️  CONFLICTS - Calls Pathways UI (should use dedicated menu item)\n');
    } else {
      console.log('  ❓ UNCLEAR PURPOSE - Needs manual review\n');
    }

    // Save for inspection
    const savePath = '/tmp/Enhanced_Visual_Panel_With_Toggle.gs';
    fs.writeFileSync(savePath, content);
    console.log('══════════════════════════════════════════════════════════════\n');
    console.log(`💾 Saved to: ${savePath}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

analyzeEnhancedVisualPanel();
