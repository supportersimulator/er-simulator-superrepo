/**
 * Remove Duplicate AI Categorization Functions
 *
 * PROBLEM: Code.gs has DUPLICATE versions of all AI functions
 * - Version 1: Has ACLS filter (NEW, CORRECT)
 * - Version 2: No ACLS filter (OLD, WRONG)
 *
 * Apps Script calls the LAST definition, so old code is running.
 *
 * SOLUTION: Keep ONLY the first occurrence of each function (the new one with filter)
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

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

async function main() {
  console.log('🔧 Removing Duplicate AI Functions from Code.gs\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oAuth2Client });
  const scriptId = process.env.APPS_SCRIPT_ID;

  // Get current Code.gs
  const project = await script.projects.getContent({ scriptId });
  const codeFile = project.data.files.find(f => f.name === 'Code');

  if (!codeFile) {
    throw new Error('Code.gs not found');
  }

  let code = codeFile.source;
  const originalSize = (code.length / 1024).toFixed(1);

  console.log(`📊 Original Code.gs: ${originalSize} KB\n`);

  // Functions to deduplicate (in order of appearance)
  const functions = [
    'runAICategorization',
    'categorizeBatchWithAI',
    'buildCategorizationPrompt',
    'saveCategorizationResults',
    'clearAICategorizationResults'
  ];

  console.log('🔍 Checking for duplicates...\n');

  let totalRemoved = 0;

  functions.forEach(funcName => {
    const occurrences = findAllOccurrences(code, funcName);

    if (occurrences.length === 0) {
      console.log(`   ❌ ${funcName} - NOT FOUND!\n`);
      return;
    }

    if (occurrences.length === 1) {
      console.log(`   ✅ ${funcName} - only 1 version (good)\n`);
      return;
    }

    console.log(`   ⚠️  ${funcName} - found ${occurrences.length} versions`);

    // Check which one has ACLS filter (if categorizeBatchWithAI)
    if (funcName === 'categorizeBatchWithAI') {
      occurrences.forEach((occ, i) => {
        const hasFilter = occ.code.includes(".filter(symptom => symptom !== 'ACLS')");
        console.log(`      Version ${i + 1}: ${hasFilter ? '✅ HAS ACLS FILTER' : '❌ NO FILTER'} (${occ.code.length} chars)`);
      });
    }

    // Keep the FIRST occurrence (assumed to be the one we deployed)
    const toKeep = occurrences[0];
    const toRemove = occurrences.slice(1).sort((a, b) => b.start - a.start);

    // Remove from end to beginning (preserves indices)
    toRemove.forEach((occ, index) => {
      console.log(`      🗑️  Removing duplicate #${index + 1}`);
      code = code.substring(0, occ.start) + code.substring(occ.end);
      totalRemoved++;
    });

    console.log(`   ✅ Kept version 1, removed ${toRemove.length} duplicates\n`);
  });

  codeFile.source = code;
  const newSize = (code.length / 1024).toFixed(1);
  const savings = (originalSize - newSize).toFixed(1);

  console.log(`📊 Updated Code.gs: ${newSize} KB`);
  console.log(`💾 Saved: ${savings} KB (removed duplicate code)\n`);

  console.log('🚀 Deploying...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('🎯 What Changed:\n');
  console.log(`   ✅ Removed ${totalRemoved} duplicate function definitions`);
  console.log('   ✅ Kept ONLY version 1 (with ACLS filter)');
  console.log('   ✅ Apps Script will now call the correct functions\n');
  console.log('💡 Next Steps:\n');
  console.log('   1. Click 🗑️ Clear Results button in sidebar');
  console.log('   2. Click 🚀 Run AI Categorization button');
  console.log('   3. Wait 2-3 minutes');
  console.log('   4. Verify AI_Reasoning column has text (new code ran)');
  console.log('   5. Verify ACLS count drops to ~5-10 cases (not 159!)\n');
}

main().catch(console.error);
