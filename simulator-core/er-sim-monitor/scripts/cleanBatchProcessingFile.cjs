#!/usr/bin/env node

/**
 * CLEAN BATCH PROCESSING FILE
 * Removes ATSR and Pathways functions from "ER Sim - ATSR Tool (Standalone)"
 * via Apps Script API
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PROJECT_ID = '1KBkujOTXGDmmhWOFm-ifxoMjXM5pRwwM5FpFBtPWK8eoE99fr4lla1OE'; // ER Sim - ATSR Tool (Standalone)

console.log('\n🧹 CLEANING BATCH PROCESSING FILE\n');
console.log('═══════════════════════════════════════════════════════════════\n');

// Functions to remove
const FUNCTIONS_TO_REMOVE = [
  // ATSR functions
  'runATSRTitleGenerator',
  'parseATSRResponse_',
  'buildATSRUltimateUI_',
  'generateMysteriousSparkTitles',
  'saveATSRData',
  'applyATSRSelectionsWithDefiningAndMemory',

  // Pathways functions
  'runPathwayChainBuilder',
  'showFieldSelector',
  'getRecommendedFields_',
  'preCacheRichData',
  'analyzeCatalogWithMultiLayerCache_'
];

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

function removeFunctionFromCode(code, functionName) {
  // Match function declaration through its closing brace
  // This regex handles nested braces
  const lines = code.split('\n');
  const result = [];
  let skipMode = false;
  let braceDepth = 0;
  let inTargetFunction = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this line starts a function we want to remove
    const funcMatch = line.match(/^function\s+(\w+)\s*\(/);
    if (funcMatch && FUNCTIONS_TO_REMOVE.includes(funcMatch[1])) {
      skipMode = true;
      inTargetFunction = true;
      braceDepth = 0;
      console.log(`   Found ${funcMatch[1]} at line ${i + 1}`);
      continue; // Don't add this line
    }

    if (skipMode) {
      // Count braces to find function end
      for (const char of line) {
        if (char === '{') braceDepth++;
        if (char === '}') braceDepth--;
      }

      // If we're back to depth 0, function is complete
      if (braceDepth === 0 && inTargetFunction) {
        skipMode = false;
        inTargetFunction = false;
        console.log(`   Removed through line ${i + 1}`);
        continue; // Don't add the closing brace line
      }
      continue; // Skip lines inside the function
    }

    result.push(line);
  }

  return result.join('\n');
}

async function cleanProject() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Reading project...\n');
    const project = await script.projects.getContent({ scriptId: PROJECT_ID });

    const files = project.data.files;
    console.log(`Found ${files.length} file(s)\n`);

    // Process each file
    const cleanedFiles = files.map(file => {
      if (file.type !== 'SERVER_JS') {
        return file; // Keep non-code files as-is
      }

      console.log(`\n🔍 Processing ${file.name}.gs...`);

      let originalCode = file.source;
      let cleanedCode = originalCode;
      let removedCount = 0;

      // Remove each target function
      FUNCTIONS_TO_REMOVE.forEach(funcName => {
        const before = cleanedCode;
        cleanedCode = removeFunctionFromCode(cleanedCode, funcName);
        if (before !== cleanedCode) {
          removedCount++;
        }
      });

      if (removedCount > 0) {
        console.log(`✅ Removed ${removedCount} function(s) from ${file.name}.gs`);

        // Calculate size reduction
        const originalSize = (originalCode.length / 1024).toFixed(1);
        const newSize = (cleanedCode.length / 1024).toFixed(1);
        console.log(`   Size: ${originalSize} KB → ${newSize} KB (saved ${(originalSize - newSize).toFixed(1)} KB)`);
      } else {
        console.log(`   No target functions found in ${file.name}.gs`);
      }

      return {
        name: file.name,
        type: file.type,
        source: cleanedCode
      };
    });

    console.log('\n═══════════════════════════════════════════════════════════════\n');
    console.log('💾 Uploading cleaned code...\n');

    await script.projects.updateContent({
      scriptId: PROJECT_ID,
      requestBody: {
        files: cleanedFiles
      }
    });

    console.log('✅ Successfully cleaned project!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📋 SUMMARY:\n');
    console.log(`Removed ${FUNCTIONS_TO_REMOVE.length} function types:`);
    console.log('\nATSR Functions (6):');
    console.log('  - runATSRTitleGenerator');
    console.log('  - parseATSRResponse_');
    console.log('  - buildATSRUltimateUI_');
    console.log('  - generateMysteriousSparkTitles');
    console.log('  - saveATSRData');
    console.log('  - applyATSRSelectionsWithDefiningAndMemory');
    console.log('\nPathways Functions (5):');
    console.log('  - runPathwayChainBuilder');
    console.log('  - showFieldSelector');
    console.log('  - getRecommendedFields_');
    console.log('  - preCacheRichData');
    console.log('  - analyzeCatalogWithMultiLayerCache_');
    console.log('\n═══════════════════════════════════════════════════════════════\n');
    console.log('🎯 NEXT STEPS:\n');
    console.log('1. Open project in Apps Script editor');
    console.log('2. Verify the code looks correct');
    console.log('3. Rename project to "Core Batch Processing & Quality Engine"');
    console.log('4. Save\n');

    // Save backup of cleaned code
    const backupDir = path.join(__dirname, '../backups/cleaned-batch-processing');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    cleanedFiles.forEach(file => {
      if (file.type === 'SERVER_JS') {
        const filePath = path.join(backupDir, `${file.name}.gs`);
        fs.writeFileSync(filePath, file.source, 'utf8');
      }
    });

    console.log(`📄 Backup saved to: ${backupDir}\n`);

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

cleanProject();
