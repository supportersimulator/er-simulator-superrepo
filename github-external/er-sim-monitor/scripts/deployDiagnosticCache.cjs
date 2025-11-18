#!/usr/bin/env node

/**
 * Deploy diagnostic version of analyzeCatalog_() to debug cache issue
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

async function deployDiagnostic() {
  console.log('\n🔧 DEPLOYING DIAGNOSTIC CACHE VERSION\n');
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

    // 3. Read diagnostic version
    const diagnosticPath = path.join(__dirname, 'analyzeCatalogWithDiagnostics.gs');
    const diagnosticCode = fs.readFileSync(diagnosticPath, 'utf8');

    console.log('📝 Loaded diagnostic version with enhanced logging\n');

    // 4. Replace analyzeCatalog_() function
    const currentCode = phase2File.source;

    // Find existing function boundaries
    const functionStart = currentCode.indexOf('function analyzeCatalog_()');

    if (functionStart === -1) {
      console.log('❌ Could not find analyzeCatalog_() function\n');
      return;
    }

    // Find the end of the function (next function or end of file)
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

    // Extract just the function body from diagnostic code
    const diagnosticFunctionStart = diagnosticCode.indexOf('function analyzeCatalog_()');
    const diagnosticFunctionBody = diagnosticCode.substring(diagnosticFunctionStart);

    // Replace old function with new diagnostic version
    const newCode = currentCode.substring(0, functionStart) +
                   diagnosticFunctionBody +
                   currentCode.substring(functionEnd);

    console.log('✅ Replaced function with diagnostic version\n');

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
    console.log('✅ DIAGNOSTIC VERSION DEPLOYED SUCCESSFULLY\n');
    console.log('   File: Categories_Pathways_Feature_Phase2.gs');
    console.log('   Size: ' + newSizeKB + ' KB\n');
    console.log('📊 ENHANCED LOGGING ADDED:\n');
    console.log('   • Cache sheet detection');
    console.log('   • Timestamp parsing');
    console.log('   • Cache age calculation');
    console.log('   • JSON parsing steps');
    console.log('   • Tier progression');
    console.log('   • Error details\n');
    console.log('🎯 NEXT STEPS:\n');
    console.log('   1. Open your Google Sheet');
    console.log('   2. Click "🤖 AI: Discover Novel Pathways" button');
    console.log('   3. Let it run (may take up to 6 minutes)');
    console.log('   4. After completion, go to Extensions → Apps Script');
    console.log('   5. Click "Executions" (left sidebar)');
    console.log('   6. Find the most recent execution');
    console.log('   7. Check the logs for [CACHE DEBUG] messages');
    console.log('   8. Share the log output with me\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('\n❌ Deployment failed: ' + e.message + '\n');
    if (e.stack) {
      console.log('Stack trace:', e.stack);
    }
  }
}

deployDiagnostic().catch(console.error);
