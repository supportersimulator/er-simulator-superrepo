#!/usr/bin/env node

/**
 * Add menu integration for cache enrichment to onOpen()
 * More flexible pattern matching
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TEST_SCRIPT_ID = '1kkPZU3GsCCuu5IhTEOufmDT1Cb2rSQVB3Y3u1DPf87yoSV4WVtoNvd6i';

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

async function addMenu() {
  console.log('\n🔧 ADDING CACHE MENU TO onOpen()\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });
    const phase2File = project.data.files.find(f => f.name === 'Categories_Pathways_Feature_Phase2');

    if (!phase2File) {
      console.log('❌ Phase2 file not found\n');
      return;
    }

    let code = phase2File.source;

    // Check if already integrated
    if (code.includes('addCacheEnrichmentMenuItems')) {
      console.log('✅ Cache menu already integrated\n');
      return;
    }

    // Strategy 1: Look for function onOpen() with any content
    const onOpenRegex = /function\s+onOpen\s*\(\s*\)\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/s;
    const match = code.match(onOpenRegex);

    if (match) {
      const fullFunction = match[0];
      const functionBody = match[1];

      console.log('✅ Found onOpen() function\n');
      console.log('Function body preview (first 200 chars):');
      console.log(functionBody.substring(0, 200) + '...\n');

      // Find where to insert - look for last menu-related line before closing brace
      // Common patterns: menu.addToUi(), ui.createMenu(), etc.

      // Try to find menu.addToUi()
      if (functionBody.includes('addToUi()')) {
        const modifiedFunction = fullFunction.replace(
          /(.*)(menu\.addToUi\(\);?\s*)/s,
          '$1// Add cache management submenu\n  addCacheEnrichmentMenuItems(menu);\n\n  $2'
        );

        code = code.replace(fullFunction, modifiedFunction);
        console.log('✅ Added cache menu call before menu.addToUi()\n');
      }
      // Try alternative: look for return statement at end
      else if (functionBody.match(/return[^;]*;?\s*$/s)) {
        const modifiedFunction = fullFunction.replace(
          /(.*)(return[^;]*;?\s*\})/s,
          '$1// Add cache management submenu\n  addCacheEnrichmentMenuItems(menu);\n\n  $2'
        );

        code = code.replace(fullFunction, modifiedFunction);
        console.log('✅ Added cache menu call before return statement\n');
      }
      // Fallback: add near end of function
      else {
        const modifiedFunction = fullFunction.replace(
          /(\s*)(\})\s*$/,
          '$1// Add cache management submenu\n$1addCacheEnrichmentMenuItems(menu);\n$1$2'
        );

        code = code.replace(fullFunction, modifiedFunction);
        console.log('✅ Added cache menu call at end of function\n');
      }

      // Deploy
      phase2File.source = code;

      await script.projects.updateContent({
        scriptId: TEST_SCRIPT_ID,
        requestBody: {
          files: project.data.files
        }
      });

      console.log('═══════════════════════════════════════════════════════════════');
      console.log('✅ MENU INTEGRATION COMPLETE\n');
      console.log('🎯 NEXT STEPS:\n');
      console.log('   1. Refresh your Google Sheet (reload the page)');
      console.log('   2. Look for "🗄️ Cache Management" submenu');
      console.log('   3. Try "📦 Cache All Layers (Sequential)"\n');
      console.log('═══════════════════════════════════════════════════════════════\n');

    } else {
      console.log('⚠️  Could not find onOpen() function\n');
      console.log('You may need to add this line manually to your onOpen() function:');
      console.log('   addCacheEnrichmentMenuItems(menu);\n');
    }

  } catch (e) {
    console.log('\n❌ Failed: ' + e.message + '\n');
    if (e.stack) {
      console.log('Stack trace:', e.stack);
    }
  }
}

addMenu().catch(console.error);
