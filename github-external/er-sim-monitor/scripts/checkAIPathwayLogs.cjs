#!/usr/bin/env node

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

async function checkLogs() {
  console.log('\n🔍 CHECKING AI PATHWAY DISCOVERY EXECUTION LOGS\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    // Get recent executions
    const executions = await script.projects.deployments.list({
      scriptId: TEST_SCRIPT_ID
    });

    console.log('📊 Recent Script Activity:\n');
    
    // Try to read the script content to check for syntax errors
    const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });
    
    const phase2File = project.data.files.find(f => f.name === 'Categories_Pathways_Feature_Phase2');
    
    if (phase2File) {
      console.log('✅ Phase2 file found in project');
      console.log(`   Size: ${(phase2File.source.length / 1024).toFixed(1)} KB`);
      
      // Check if AI functions exist
      const hasDiscoverFunc = phase2File.source.indexOf('discoverNovelPathwaysWithAI_') !== -1;
      const hasShowFunc = phase2File.source.indexOf('showAIDiscoveredPathways') !== -1;
      const hasStandardFunc = phase2File.source.indexOf('showAIPathwaysStandard') !== -1;
      const hasRadicalFunc = phase2File.source.indexOf('showAIPathwaysRadical') !== -1;
      
      console.log('\n🔧 AI Functions Check:');
      console.log(`   discoverNovelPathwaysWithAI_: ${hasDiscoverFunc ? '✅' : '❌'}`);
      console.log(`   showAIDiscoveredPathways: ${hasShowFunc ? '✅' : '❌'}`);
      console.log(`   showAIPathwaysStandard: ${hasStandardFunc ? '✅' : '❌'}`);
      console.log(`   showAIPathwaysRadical: ${hasRadicalFunc ? '✅' : '❌'}`);
      
      // Check for potential issues
      console.log('\n🔍 Potential Issues:');
      
      // Check for SpreadsheetApp typo
      if (phase2File.source.indexOf('Spreadsheet App') !== -1) {
        console.log('   ❌ FOUND: "Spreadsheet App" (should be "SpreadsheetApp")');
      }
      
      // Check API key retrieval
      const hasApiKeyCheck = phase2File.source.indexOf("settingsSheet.getRange('B2')") !== -1;
      console.log(`   API Key retrieval code: ${hasApiKeyCheck ? '✅' : '❌'}`);
      
      // Check OpenAI endpoint
      const hasOpenAIUrl = phase2File.source.indexOf('api.openai.com') !== -1;
      console.log(`   OpenAI API endpoint: ${hasOpenAIUrl ? '✅' : '❌'}`);
      
      // Look for syntax issues in the AI function
      const discoverFuncStart = phase2File.source.indexOf('function discoverNovelPathwaysWithAI_');
      if (discoverFuncStart !== -1) {
        const funcSnippet = phase2File.source.substring(discoverFuncStart, discoverFuncStart + 500);
        console.log('\n📝 Function signature:');
        console.log('   ' + funcSnippet.split('\n')[0]);
        console.log('   ' + funcSnippet.split('\n')[1]);
        console.log('   ' + funcSnippet.split('\n')[2]);
      }
      
    } else {
      console.log('❌ Phase2 file NOT found in project');
    }

  } catch (error) {
    console.log('❌ Error checking logs:', error.message);
  }

  console.log('\n═══════════════════════════════════════════════════════════════\n');
}

checkLogs().catch(console.error);
