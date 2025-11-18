#!/usr/bin/env node

/**
 * REMOVE DUPLICATE onOpen() FROM ATSR_Title_Generator_Feature.gs
 * Keeps the onOpen() in Code.gs (main file)
 * Removes the duplicate onOpen() in ATSR_Title_Generator_Feature.gs (feature file)
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PROJECT_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf'; // Title Optimizer

console.log('\n🧹 REMOVING DUPLICATE onOpen() FUNCTION\n');
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

function removeFunctionFromCode(code, functionName) {
  const lines = code.split('\n');
  const result = [];
  let skipMode = false;
  let braceDepth = 0;
  let inTargetFunction = false;
  let startLine = 0;
  let endLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this line starts the function we want to remove
    if (line.includes(`function ${functionName}()`)) {
      skipMode = true;
      inTargetFunction = true;
      braceDepth = 0;
      startLine = i + 1;
      console.log(`   Found ${functionName}() at line ${startLine}`);
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
        endLine = i + 1;
        console.log(`   Removed through line ${endLine} (${endLine - startLine + 1} lines total)`);
        continue; // Don't add the closing brace line
      }
      continue; // Skip lines inside the function
    }

    result.push(line);
  }

  return result.join('\n');
}

async function removeDuplicateOnOpen() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Reading project...\\n');
    const project = await script.projects.getContent({ scriptId: PROJECT_ID });

    const files = project.data.files;
    console.log(`Found ${files.length} file(s)\\n`);

    // Process each file
    const updatedFiles = files.map(file => {
      if (file.name === 'ATSR_Title_Generator_Feature' && file.type === 'SERVER_JS') {
        console.log(`\\n🔍 Processing ${file.name}.gs...`);

        const originalCode = file.source;
        const cleanedCode = removeFunctionFromCode(originalCode, 'onOpen');

        if (originalCode !== cleanedCode) {
          const originalSize = (originalCode.length / 1024).toFixed(1);
          const newSize = (cleanedCode.length / 1024).toFixed(1);
          console.log(`✅ Removed onOpen() function`);
          console.log(`   Size: ${originalSize} KB → ${newSize} KB (saved ${(originalSize - newSize).toFixed(1)} KB)`);
        } else {
          console.log(`   ⚠️  No onOpen() function found to remove`);
        }

        return {
          name: file.name,
          type: file.type,
          source: cleanedCode
        };
      } else {
        // Keep other files unchanged
        return {
          name: file.name,
          type: file.type,
          source: file.source
        };
      }
    });

    console.log('\\n═══════════════════════════════════════════════════════════════\\n');
    console.log('💾 Uploading cleaned code...\\n');

    await script.projects.updateContent({
      scriptId: PROJECT_ID,
      requestBody: {
        files: updatedFiles
      }
    });

    console.log('✅ Successfully removed duplicate onOpen()!\\n');
    console.log('═══════════════════════════════════════════════════════════════\\n');
    console.log('📋 SUMMARY:\\n');
    console.log('✅ KEPT: onOpen() in Code.gs (main menu)');
    console.log('❌ REMOVED: onOpen() duplicate in ATSR_Title_Generator_Feature.gs\\n');
    console.log('🎯 NEXT STEPS:\\n');
    console.log('1. Close and reopen your test spreadsheet');
    console.log('2. Look for "🧪 TEST Tools" menu');
    console.log('3. If still not appearing, try:');
    console.log('   - Go to Extensions → Apps Script');
    console.log('   - Click Run button on onOpen()');
    console.log('   - Authorize the script');
    console.log('   - Close Apps Script and refresh spreadsheet\\n');

    // Save backup of cleaned code
    const backupDir = path.join(__dirname, '../backups/onopen-fix-2025-11-06');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    updatedFiles.forEach(file => {
      if (file.type === 'SERVER_JS') {
        const ext = file.type === 'SERVER_JS' ? '.gs' : '.html';
        const filePath = path.join(backupDir, `${file.name}${ext}`);
        fs.writeFileSync(filePath, file.source, 'utf8');
      }
    });

    console.log(`📄 Backup saved to: ${backupDir}\\n`);

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

removeDuplicateOnOpen();
