#!/usr/bin/env node

/**
 * SMART MERGE - Only add unique functions from Title Optimizer
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TITLE_OPTIMIZER_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf';
const GPT_FORMATTER_ID = '1orJ__UUViG-gdSOHXt2VSGzo--ASib9XdVLVCApccKujWnqTuxq7wHIw';

console.log('\n🔀 SMART MERGE: Adding unique functions only\n');
console.log('═══════════════════════════════════════════════════════════════\n');

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

function extractUniqueFunctions(titleCode, gptCode) {
  // Get all function names from both
  const titleFunctions = [...titleCode.matchAll(/^function\s+(\w+)/gm)].map(m => m[1]);
  const gptFunctions = [...gptCode.matchAll(/^function\s+(\w+)/gm)].map(m => m[1]);
  
  // Find unique functions in Title Optimizer
  const uniqueFunctionNames = titleFunctions.filter(f => !gptFunctions.includes(f));
  
  console.log(`   Found ${uniqueFunctionNames.length} unique functions in Title Optimizer\n`);
  
  if (uniqueFunctionNames.length === 0) {
    return '';
  }
  
  // Extract each unique function with its full body
  let uniqueCode = '\n// ==================== UNIQUE FUNCTIONS FROM TITLE OPTIMIZER ====================\n\n';
  
  uniqueFunctionNames.forEach(funcName => {
    // Find the function in titleCode
    const regex = new RegExp(`^function\\s+${funcName}[^{]*\\{`, 'gm');
    const match = regex.exec(titleCode);
    
    if (match) {
      let braceCount = 1;
      let startIndex = match.index;
      let currentIndex = match.index + match[0].length;
      
      // Find matching closing brace
      while (braceCount > 0 && currentIndex < titleCode.length) {
        if (titleCode[currentIndex] === '{') braceCount++;
        if (titleCode[currentIndex] === '}') braceCount--;
        currentIndex++;
      }
      
      const functionCode = titleCode.substring(startIndex, currentIndex);
      uniqueCode += `${functionCode}\n\n`;
      console.log(`   ✅ Extracted: ${funcName}()`);
    }
  });
  
  return uniqueCode;
}

async function smartMerge() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading projects...\n');

    const [titleProject, gptProject] = await Promise.all([
      script.projects.getContent({ scriptId: TITLE_OPTIMIZER_ID }),
      script.projects.getContent({ scriptId: GPT_FORMATTER_ID })
    ]);

    const titleCode = titleProject.data.files.find(f => f.name === 'Code').source;
    const gptCode = gptProject.data.files.find(f => f.name === 'Code').source;

    console.log(`   Title Optimizer: ${(titleCode.length / 1024).toFixed(1)} KB`);
    console.log(`   GPT Formatter: ${(gptCode.length / 1024).toFixed(1)} KB\n`);
    
    console.log('🔍 Extracting unique functions...\n');
    
    const uniqueFunctions = extractUniqueFunctions(titleCode, gptCode);
    
    if (!uniqueFunctions || uniqueFunctions.trim() === '') {
      console.log('✅ No unique functions to add - GPT Formatter already complete!\n');
      return;
    }
    
    const combinedCode = gptCode + uniqueFunctions;
    
    console.log(`\n   Combined: ${(combinedCode.length / 1024).toFixed(1)} KB\n`);

    const updatedFiles = gptProject.data.files.map(file => {
      if (file.name === 'Code') {
        return {
          name: 'Code',
          type: 'SERVER_JS',
          source: combinedCode
        };
      }
      return file;
    });

    console.log('🚀 Deploying to GPT Formatter...\n');

    await script.projects.updateContent({
      scriptId: GPT_FORMATTER_ID,
      requestBody: {
        files: updatedFiles
      }
    });

    console.log('✅ SMART MERGE COMPLETE!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎯 NOW DELETE TITLE OPTIMIZER PROJECT\n');
    console.log('   Then refresh spreadsheet for clean single menu!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

smartMerge();
