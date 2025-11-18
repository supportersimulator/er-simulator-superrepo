#!/usr/bin/env node

/**
 * Deploy enhanced version with global log capture
 * Replaces:
 * 1. showAIDiscoveryWithStreamingLogs_() - with copy button
 * 2. getDebugLogsForCopy() - reads from global array
 * 3. analyzeCatalog_() - stores debug logs in global array
 * 4. Adds CACHE_DEBUG_LOGS global variable
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
  console.log('\n🔧 DEPLOYING GLOBAL LOG CAPTURE SYSTEM\n');
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

    let currentCode = phase2File.source;

    // 3. Add CACHE_DEBUG_LOGS global variable at the top of AI discovery section
    const aiDiscoveryLogsLine = currentCode.indexOf('var AI_DISCOVERY_LOGS = [];');
    if (aiDiscoveryLogsLine !== -1) {
      currentCode = currentCode.substring(0, aiDiscoveryLogsLine) +
                   'var AI_DISCOVERY_LOGS = [];\nvar CACHE_DEBUG_LOGS = [];\n' +
                   currentCode.substring(aiDiscoveryLogsLine + 'var AI_DISCOVERY_LOGS = [];'.length);
      console.log('✅ Added CACHE_DEBUG_LOGS global variable\n');
    }

    // 4. Read enhanced code
    const enhancedPath = path.join(__dirname, 'enhancedLogModalWithGlobalLogs.gs');
    const enhancedCode = fs.readFileSync(enhancedPath, 'utf8');

    // 5. Replace showAIDiscoveryWithStreamingLogs_()
    const modalFuncStart = currentCode.indexOf('function showAIDiscoveryWithStreamingLogs_(creativityMode)');
    if (modalFuncStart === -1) {
      console.log('❌ Could not find showAIDiscoveryWithStreamingLogs_()\n');
      return;
    }

    let braceCount = 0;
    let inFunction = false;
    let modalFuncEnd = modalFuncStart;

    for (let i = modalFuncStart; i < currentCode.length; i++) {
      if (currentCode[i] === '{') {
        braceCount++;
        inFunction = true;
      } else if (currentCode[i] === '}') {
        braceCount--;
        if (inFunction && braceCount === 0) {
          modalFuncEnd = i + 1;
          break;
        }
      }
    }

    // Extract new modal function from enhanced code
    const newModalStart = enhancedCode.indexOf('function showAIDiscoveryWithStreamingLogs_(creativityMode)');
    const newModalEnd = enhancedCode.indexOf('function getDebugLogsForCopy()');
    const newModalCode = enhancedCode.substring(newModalStart, newModalEnd);

    currentCode = currentCode.substring(0, modalFuncStart) +
                 newModalCode +
                 currentCode.substring(modalFuncEnd);

    console.log('✅ Replaced showAIDiscoveryWithStreamingLogs_() with enhanced version\n');

    // 6. Replace getDebugLogsForCopy()
    const getDebugStart = currentCode.indexOf('function getDebugLogsForCopy()');
    if (getDebugStart !== -1) {
      // Find end of existing function
      braceCount = 0;
      inFunction = false;
      let getDebugEnd = getDebugStart;

      for (let i = getDebugStart; i < currentCode.length; i++) {
        if (currentCode[i] === '{') {
          braceCount++;
          inFunction = true;
        } else if (currentCode[i] === '}') {
          braceCount--;
          if (inFunction && braceCount === 0) {
            getDebugEnd = i + 1;
            break;
          }
        }
      }

      // Extract new getDebugLogsForCopy from enhanced code
      const newGetDebugStart = enhancedCode.indexOf('function getDebugLogsForCopy()');
      const newGetDebugEnd = enhancedCode.indexOf('function analyzeCatalog_()');
      const newGetDebugCode = enhancedCode.substring(newGetDebugStart, newGetDebugEnd);

      currentCode = currentCode.substring(0, getDebugStart) +
                   newGetDebugCode +
                   currentCode.substring(getDebugEnd);

      console.log('✅ Replaced getDebugLogsForCopy() with global array version\n');
    }

    // 7. Replace analyzeCatalog_()
    const analyzeCatalogStart = currentCode.indexOf('function analyzeCatalog_()');
    if (analyzeCatalogStart === -1) {
      console.log('❌ Could not find analyzeCatalog_()\n');
      return;
    }

    braceCount = 0;
    inFunction = false;
    let analyzeCatalogEnd = analyzeCatalogStart;

    for (let i = analyzeCatalogStart; i < currentCode.length; i++) {
      if (currentCode[i] === '{') {
        braceCount++;
        inFunction = true;
      } else if (currentCode[i] === '}') {
        braceCount--;
        if (inFunction && braceCount === 0) {
          analyzeCatalogEnd = i + 1;
          break;
        }
      }
    }

    // Extract new analyzeCatalog from enhanced code
    const newAnalyzeCatalogStart = enhancedCode.indexOf('function analyzeCatalog_()');
    const newAnalyzeCatalogCode = enhancedCode.substring(newAnalyzeCatalogStart);

    currentCode = currentCode.substring(0, analyzeCatalogStart) +
                 newAnalyzeCatalogCode;

    console.log('✅ Replaced analyzeCatalog_() with global log capture version\n');

    // 8. Update the file
    phase2File.source = currentCode;

    // 9. Deploy
    console.log('🚀 Deploying to Google Apps Script...\n');

    await script.projects.updateContent({
      scriptId: TEST_SCRIPT_ID,
      requestBody: {
        files: project.data.files
      }
    });

    const newSizeKB = (currentCode.length / 1024).toFixed(1);

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ GLOBAL LOG CAPTURE SYSTEM DEPLOYED\n');
    console.log('   File: Categories_Pathways_Feature_Phase2.gs');
    console.log('   Size: ' + newSizeKB + ' KB\n');
    console.log('🎯 WHAT CHANGED:\n');
    console.log('   • Added CACHE_DEBUG_LOGS global array');
    console.log('   • analyzeCatalog_() now stores all [CACHE DEBUG] logs');
    console.log('   • Copy button reads from global array (not Logger.getLog())');
    console.log('   • Logs persist across execution context\n');
    console.log('🧪 HOW TO USE:\n');
    console.log('   1. Open your Google Sheet');
    console.log('   2. Click "🤖 AI: Discover Novel Pathways"');
    console.log('   3. After execution (even if it times out)');
    console.log('   4. Click "📋 Copy Debug Logs" button');
    console.log('   5. Paste the logs to me!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('\n❌ Deployment failed: ' + e.message + '\n');
    if (e.stack) {
      console.log('Stack trace:', e.stack);
    }
  }
}

deploy().catch(console.error);
