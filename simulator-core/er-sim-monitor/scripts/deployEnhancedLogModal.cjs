#!/usr/bin/env node

/**
 * Deploy enhanced log modal with "Copy Debug Logs" button
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

async function deploy() {
  console.log('\n🎨 DEPLOYING ENHANCED LOG MODAL WITH COPY BUTTON\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    // 1. Get current project
    console.log('📦 Reading current project...\n');
    const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });

    // 2. Find Phase2 file
    const phase2File = project.data.files.find(f => f.name === 'Categories_Pathways_Feature_Phase2');

    if (!phase2File) {
      console.log('❌ Categories_Pathways_Feature_Phase2.gs not found\n');
      return;
    }

    console.log('✅ Found Categories_Pathways_Feature_Phase2.gs\n');

    // 3. Read enhanced version
    const enhancedPath = path.join(__dirname, 'enhancedLogModalWithCopy.gs');
    const enhancedCode = fs.readFileSync(enhancedPath, 'utf8');

    console.log('📝 Loaded enhanced modal with copy button\n');

    // 4. Replace showAIDiscoveryWithStreamingLogs_() function
    const currentCode = phase2File.source;

    // Find existing function start
    const functionStart = currentCode.indexOf('function showAIDiscoveryWithStreamingLogs_(creativityMode)');

    if (functionStart === -1) {
      console.log('❌ Could not find showAIDiscoveryWithStreamingLogs_() function\n');
      return;
    }

    // Find the end of the function
    let braceCount = 0;
    let inFunction = false;
    let functionEnd = functionStart;

    for (let i = functionStart; i < currentCode.length; i++) {
      if (currentCode[i] === '{') {
        braceCount++;
        inFunction = true;
      } else if (currentCode[i] === '}') {
        braceCount--;
        if (inFunction && braceCount === 0) {
          functionEnd = i + 1;
          break;
        }
      }
    }

    console.log('🔍 Found function at position ' + functionStart + ' to ' + functionEnd);

    // Also need to add the new getDebugLogsForCopy() function
    // Extract both functions from enhanced code
    const enhancedFunctionStart = enhancedCode.indexOf('function showAIDiscoveryWithStreamingLogs_(creativityMode)');
    const enhancedGetDebugStart = enhancedCode.indexOf('function getDebugLogsForCopy()');
    const enhancedFunctions = enhancedCode.substring(enhancedFunctionStart);

    // Replace old function + add new function
    const newCode = currentCode.substring(0, functionStart) +
                   enhancedFunctions +
                   '\n\n' +
                   currentCode.substring(functionEnd);

    console.log('✅ Replaced function with enhanced version\n');
    console.log('✅ Added getDebugLogsForCopy() function\n');

    // 5. Update the file
    phase2File.source = newCode;

    // 6. Deploy
    console.log('🚀 Deploying to Google Apps Script...\n');

    await script.projects.updateContent({
      scriptId: TEST_SCRIPT_ID,
      requestBody: {
        files: project.data.files
      }
    });

    const newSizeKB = (newCode.length / 1024).toFixed(1);

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ ENHANCED LOG MODAL DEPLOYED SUCCESSFULLY\n');
    console.log('   File: Categories_Pathways_Feature_Phase2.gs');
    console.log('   Size: ' + newSizeKB + ' KB\n');
    console.log('🎯 NEW FEATURES:\n');
    console.log('   • 📋 "Copy Debug Logs" button in modal header');
    console.log('   • One-click copy of all [CACHE DEBUG] logs');
    console.log('   • Visual feedback when copied');
    console.log('   • Auto-filters only diagnostic logs\n');
    console.log('🧪 HOW TO USE:\n');
    console.log('   1. Open your Google Sheet');
    console.log('   2. Click "🤖 AI: Discover Novel Pathways" button');
    console.log('   3. After execution completes (or errors)');
    console.log('   4. Click "📋 Copy Debug Logs" button in modal');
    console.log('   5. Paste the logs directly to me!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('\n❌ Deployment failed: ' + e.message + '\n');
    if (e.stack) {
      console.log('Stack trace:', e.stack);
    }
  }
}

deploy().catch(console.error);
