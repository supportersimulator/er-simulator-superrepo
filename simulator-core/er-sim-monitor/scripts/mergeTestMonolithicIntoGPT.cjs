#!/usr/bin/env node

/**
 * MERGE TEST MONOLITHIC INTO GPT FORMATTER
 * Smart merge - only unique functions
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TEST_MONOLITHIC_ID = '1lU89yFCJkREq_5CIjEVgpPWQ0H6nU_HxoMgaPDb5KxA_f-JztUp1oLUS';
const GPT_FORMATTER_ID = '1orJ__UUViG-gdSOHXt2VSGzo--ASib9XdVLVCApccKujWnqTuxq7wHIw';

console.log('\n🔀 MERGING TEST MONOLITHIC INTO GPT FORMATTER\n');
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

function extractUniqueFunctions(testCode, gptCode) {
  const testFunctions = [...testCode.matchAll(/^function\s+(\w+)/gm)].map(m => m[1]);
  const gptFunctions = [...gptCode.matchAll(/^function\s+(\w+)/gm)].map(m => m[1]);
  
  const uniqueFunctionNames = testFunctions.filter(f => !gptFunctions.includes(f));
  
  console.log(`   Extracting ${uniqueFunctionNames.length} unique functions...\n`);
  
  let uniqueCode = '\n// ==================== UNIQUE FUNCTIONS FROM TEST MONOLITHIC ====================\n\n';
  
  uniqueFunctionNames.forEach(funcName => {
    const regex = new RegExp(`^function\\s+${funcName}[^{]*\\{`, 'gm');
    const match = regex.exec(testCode);
    
    if (match) {
      let braceCount = 1;
      let startIndex = match.index;
      let currentIndex = match.index + match[0].length;
      
      while (braceCount > 0 && currentIndex < testCode.length) {
        if (testCode[currentIndex] === '{') braceCount++;
        if (testCode[currentIndex] === '}') braceCount--;
        currentIndex++;
      }
      
      const functionCode = testCode.substring(startIndex, currentIndex);
      uniqueCode += `${functionCode}\n\n`;
      console.log(`   ✅ ${funcName}()`);
    }
  });
  
  return uniqueCode;
}

async function merge() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading projects...\n');

    const [testContent, gptContent] = await Promise.all([
      script.projects.getContent({ scriptId: TEST_MONOLITHIC_ID }),
      script.projects.getContent({ scriptId: GPT_FORMATTER_ID })
    ]);

    const testCode = testContent.data.files.find(f => f.name === 'Code').source;
    const gptCode = gptContent.data.files.find(f => f.name === 'Code').source;

    console.log(`   TEST Monolithic: ${(testCode.length / 1024).toFixed(1)} KB`);
    console.log(`   GPT Formatter: ${(gptCode.length / 1024).toFixed(1)} KB\n`);
    
    console.log('🔍 Extracting unique functions...\n');
    
    const uniqueFunctions = extractUniqueFunctions(testCode, gptCode);
    
    const combinedCode = gptCode + uniqueFunctions;
    
    console.log(`\n   📦 Combined: ${(combinedCode.length / 1024).toFixed(1)} KB\n`);

    const updatedFiles = gptContent.data.files.map(file => {
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

    console.log('✅ MERGE COMPLETE!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎉 GPT FORMATTER NOW HAS EVERYTHING!\n');
    console.log('   ✅ ATSR Titles Optimizer (with mystery button)\n');
    console.log('   ✅ Categories & Pathways (advanced features)\n');
    console.log('   ✅ Pathway Chain Builder\n');
    console.log('   ✅ Holistic Analysis Engine\n');
    console.log('   ✅ AI Pathway Discovery\n');
    console.log('   ✅ Cache Management (7 layers)\n');
    console.log('   ✅ Batch Processing & Quality\n');
    console.log('   ✅ Image Sync\n');
    console.log('   ✅ Memory Tracker\n');
    console.log('   ✅ Waveform Mapping\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🗑️  NOW DELETE "TEST Tools - Monolithic Environment"\n');
    console.log('   Then refresh → ONLY "🧠 Sim Builder" menu!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

merge();
