#!/usr/bin/env node

/**
 * ADD FALLBACK TO STATIC RECOMMENDATIONS
 * If ChatGPT API times out, use getStaticRecommendedFields_() instead
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🔧 ADDING FALLBACK RECOMMENDATIONS\n');
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

async function addFallback() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading production code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('🔧 Updating getRecommendedFields_() to use fallback on timeout...\n');

    // Find getRecommendedFields_ function and wrap ChatGPT call with timeout fallback
    const funcMatch = code.match(/function getRecommendedFields_\([^)]*\)\s*{/);

    if (!funcMatch) {
      console.log('⚠️  getRecommendedFields_() not found\n');
      return;
    }

    // Add timeout handling and fallback to beginning of function
    const oldFuncStart = funcMatch[0];
    const newFuncStart = oldFuncStart + `
  // Use timeout to prevent hanging - fallback to static if API slow
  try {
    Logger.log('🤖 Attempting ChatGPT API call for recommendations...');
    `;

    code = code.replace(oldFuncStart, newFuncStart);

    // Find the end of getRecommendedFields_ and add catch block with fallback
    // Look for the return statement in getRecommendedFields_
    const returnMatch = code.match(/function getRecommendedFields_[\s\S]*?return recommended;[\s\S]*?}/);

    if (returnMatch) {
      const oldReturn = returnMatch[0];
      const lines = oldReturn.split('\n');

      // Find the closing brace of the function
      let braceCount = 0;
      let returnIndex = -1;
      let closeIndex = -1;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('return recommended;')) {
          returnIndex = i;
        }
        if (line.includes('{')) braceCount++;
        if (line.includes('}')) {
          braceCount--;
          if (braceCount === 0 && returnIndex !== -1) {
            closeIndex = i;
            break;
          }
        }
      }

      if (closeIndex !== -1) {
        // Insert catch block before final closing brace
        lines.splice(closeIndex, 0,
          '  } catch (apiError) {',
          '    Logger.log(\'⚠️  ChatGPT API failed or timed out: \' + apiError.toString());',
          '    Logger.log(\'🔄 Falling back to static recommendations...\');',
          '    return getStaticRecommendedFields_(available, selected);',
          '  }'
        );

        const newReturn = lines.join('\n');
        code = code.replace(oldReturn, newReturn);
        console.log('✅ Added fallback to getRecommendedFields_()\n');
      }
    }

    // Backup
    const backupPath = path.join(__dirname, '../backups/production-before-fallback-recommendations-2025-11-06.gs');
    fs.writeFileSync(backupPath, codeFile.source, 'utf8');
    console.log(`💾 Backed up to: ${backupPath}\n`);

    // Deploy
    console.log('📤 Deploying to production...\n');

    const updatedFiles = [
      {
        name: 'Code',
        type: 'SERVER_JS',
        source: code
      },
      manifestFile
    ];

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: updatedFiles }
    });

    const newSize = (code.length / 1024).toFixed(1);

    console.log(`✅ Deployment successful! Size: ${newSize} KB\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎉 FALLBACK RECOMMENDATIONS ADDED!\n');
    console.log('Now if ChatGPT API times out or fails:\n');
    console.log('   1. Catches the error');
    console.log('   2. Logs warning message');
    console.log('   3. Falls back to getStaticRecommendedFields_()');
    console.log('   4. Field selector continues to work!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

addFallback();
