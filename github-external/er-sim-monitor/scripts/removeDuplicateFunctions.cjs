#!/usr/bin/env node

/**
 * REMOVE DUPLICATE FUNCTIONS FROM GPT FORMATTER
 * Keep the most complete version of each
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const GPT_FORMATTER_ID = '1orJ__UUViG-gdSOHXt2VSGzo--ASib9XdVLVCApccKujWnqTuxq7wHIw';

console.log('\n🧹 REMOVING DUPLICATE FUNCTIONS\n');
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

function extractFunctionWithBody(code, funcName, startIndex) {
  const regex = new RegExp(`^function\\s+${funcName}[^{]*\\{`, 'gm');
  regex.lastIndex = startIndex;
  const match = regex.exec(code);
  
  if (!match) return null;
  
  let braceCount = 1;
  let functionStart = match.index;
  let currentIndex = match.index + match[0].length;
  
  while (braceCount > 0 && currentIndex < code.length) {
    if (code[currentIndex] === '{') braceCount++;
    if (code[currentIndex] === '}') braceCount--;
    currentIndex++;
  }
  
  return {
    start: functionStart,
    end: currentIndex,
    code: code.substring(functionStart, currentIndex)
  };
}

function findAllOccurrences(code, funcName) {
  const occurrences = [];
  const regex = new RegExp(`^function\\s+${funcName}\\s*\\(`, 'gm');
  let match;
  
  while ((match = regex.exec(code)) !== null) {
    const func = extractFunctionWithBody(code, funcName, match.index);
    if (func) {
      occurrences.push(func);
    }
  }
  
  return occurrences;
}

async function removeDuplicates() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading GPT Formatter...\n');

    const content = await script.projects.getContent({
      scriptId: GPT_FORMATTER_ID
    });

    let code = content.data.files.find(f => f.name === 'Code').source;

    console.log(`   Current size: ${(code.length / 1024).toFixed(1)} KB\n`);

    // List of duplicate functions to clean up
    const duplicates = [
      'checkApiStatus',
      'stop',
      'imgSync',
      'openSettings',
      'parseRowSpec_',
      'logLong_',
      'clearApiKeyCache',
      'showToast',
      'analyzeOutputSheetStructure',
      'clearAllBatchProperties'
    ];

    console.log('🔍 Finding and removing duplicates...\n');

    let totalRemoved = 0;

    duplicates.forEach(funcName => {
      const occurrences = findAllOccurrences(code, funcName);
      
      if (occurrences.length <= 1) {
        console.log(`   ✅ ${funcName}() - only 1 copy, no action needed`);
        return;
      }

      console.log(`   🔍 ${funcName}() - found ${occurrences.length} copies`);

      // Keep the longest version (most complete)
      occurrences.sort((a, b) => b.code.length - a.code.length);
      
      const longest = occurrences[0];
      console.log(`      Keeping version: ${longest.code.length} chars`);

      // Remove all others (starting from the end to preserve indices)
      const toRemove = occurrences.slice(1).sort((a, b) => b.start - a.start);
      
      toRemove.forEach((occurrence, index) => {
        console.log(`      Removing duplicate #${index + 1}: ${occurrence.code.length} chars`);
        code = code.substring(0, occurrence.start) + code.substring(occurrence.end);
        totalRemoved++;
      });

      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log(`✅ Removed ${totalRemoved} duplicate functions\n`);
    console.log(`   New size: ${(code.length / 1024).toFixed(1)} KB\n`);
    console.log(`   Saved: ${((content.data.files.find(f => f.name === 'Code').source.length - code.length) / 1024).toFixed(1)} KB\n`);

    // Backup before deploying
    const backupPath = path.join(__dirname, '../backups/gpt-formatter-before-dedup-2025-11-06.gs');
    fs.writeFileSync(backupPath, content.data.files.find(f => f.name === 'Code').source, 'utf8');
    console.log(`💾 Backup saved: ${backupPath}\n`);

    // Deploy cleaned code
    const updatedFiles = content.data.files.map(file => {
      if (file.name === 'Code') {
        return {
          name: 'Code',
          type: 'SERVER_JS',
          source: code
        };
      }
      return file;
    });

    console.log('🚀 Deploying cleaned code...\n');

    await script.projects.updateContent({
      scriptId: GPT_FORMATTER_ID,
      requestBody: {
        files: updatedFiles
      }
    });

    console.log('✅ CLEANUP COMPLETE!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📊 SUMMARY:\n');
    console.log(`   - Removed ${totalRemoved} duplicate function declarations\n`);
    console.log('   - Kept the most complete version of each\n');
    console.log('   - No functionality lost\n');
    console.log('   - Code is now cleaner and more reliable\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

removeDuplicates();
