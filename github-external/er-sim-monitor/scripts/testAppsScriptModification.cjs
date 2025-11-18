#!/usr/bin/env node

/**
 * Test Apps Script Modification
 *
 * Tests programmatic write access to the Apps Script project by:
 * 1. Reading the current Code.gs content
 * 2. Adding a test comment with unique identifier
 * 3. Updating the Apps Script with modified content
 * 4. Reading it back to verify the test word appears
 * 5. Removing the test word by restoring original content
 * 6. Verifying the test word is gone
 *
 * Usage:
 *   node scripts/testAppsScriptModification.cjs
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

// OAuth2 credentials
const OAUTH_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const OAUTH_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const APPS_SCRIPT_ID = process.env.APPS_SCRIPT_ID;

// Test identifier
const TEST_WORD = 'TEST_MODIFICATION_ACTIVE_12345';
const TEST_COMMENT = `// ${TEST_WORD} - This is a test comment to verify write access\n`;

/**
 * Load OAuth2 token from disk
 */
function loadToken() {
  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error(`Token file not found at ${TOKEN_PATH}. Run 'npm run auth-google' first.`);
  }
  const tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  return tokenData;
}

/**
 * Create authenticated Apps Script API client
 */
function createAppsScriptClient() {
  const oauth2Client = new google.auth.OAuth2(
    OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );

  const token = loadToken();
  oauth2Client.setCredentials(token);

  return google.script({ version: 'v1', auth: oauth2Client });
}

/**
 * Main test function
 */
async function testAppsScriptModification() {
  console.log('');
  console.log('🧪 TESTING APPS SCRIPT MODIFICATION');
  console.log('════════════════════════════════════════════════════');
  console.log(`Script ID: ${APPS_SCRIPT_ID}`);
  console.log(`Test Word: ${TEST_WORD}`);
  console.log('════════════════════════════════════════════════════');
  console.log('');

  try {
    const script = createAppsScriptClient();

    // STEP 1: Read current content
    console.log('📖 STEP 1: Reading current Apps Script content...');
    const contentResponse = await script.projects.getContent({
      scriptId: APPS_SCRIPT_ID
    });

    const content = contentResponse.data;
    const files = content.files || [];

    // Find Code.gs file
    const codeFile = files.find(f => f.name === 'Code' && f.type === 'SERVER_JS');
    if (!codeFile) {
      throw new Error('Code.gs file not found in project');
    }

    const originalSource = codeFile.source;
    console.log(`✅ Read ${originalSource.length} characters from Code.gs`);
    console.log('');

    // Check if test word already exists
    if (originalSource.includes(TEST_WORD)) {
      console.log('⚠️  Test word already exists in script! Cleaning up first...');
      const cleanedSource = originalSource.replace(new RegExp(`${TEST_COMMENT}`, 'g'), '');

      const cleanFiles = files.map(f => {
        if (f.name === 'Code' && f.type === 'SERVER_JS') {
          return { ...f, source: cleanedSource };
        }
        return f;
      });

      await script.projects.updateContent({
        scriptId: APPS_SCRIPT_ID,
        requestBody: { files: cleanFiles }
      });

      console.log('✅ Cleaned up existing test word');
      console.log('');
    }

    // STEP 2: Add test word
    console.log('📝 STEP 2: Injecting test word into Code.gs...');
    const modifiedSource = TEST_COMMENT + originalSource;

    // Update the files array with modified content
    const modifiedFiles = files.map(f => {
      if (f.name === 'Code' && f.type === 'SERVER_JS') {
        return {
          name: f.name,
          type: f.type,
          source: modifiedSource
        };
      }
      return f;
    });

    // Update Apps Script project
    await script.projects.updateContent({
      scriptId: APPS_SCRIPT_ID,
      requestBody: {
        files: modifiedFiles
      }
    });

    console.log(`✅ Injected test comment at beginning of Code.gs`);
    console.log('');

    // STEP 3: Read back to verify
    console.log('🔍 STEP 3: Reading back to verify test word appears...');
    const verifyResponse = await script.projects.getContent({
      scriptId: APPS_SCRIPT_ID
    });

    const verifyFiles = verifyResponse.data.files || [];
    const verifyCodeFile = verifyFiles.find(f => f.name === 'Code' && f.type === 'SERVER_JS');

    if (!verifyCodeFile) {
      throw new Error('Code.gs file not found during verification');
    }

    const verifySource = verifyCodeFile.source;
    const testWordExists = verifySource.includes(TEST_WORD);

    if (testWordExists) {
      console.log(`✅ SUCCESS: Test word "${TEST_WORD}" found in script!`);
      console.log('   Write access confirmed.');
    } else {
      throw new Error('Test word not found in script after update');
    }
    console.log('');

    // STEP 4: Remove test word
    console.log('🧹 STEP 4: Removing test word (cleaning up)...');

    // Restore original content
    const cleanupFiles = files.map(f => {
      if (f.name === 'Code' && f.type === 'SERVER_JS') {
        return {
          name: f.name,
          type: f.type,
          source: originalSource
        };
      }
      return f;
    });

    await script.projects.updateContent({
      scriptId: APPS_SCRIPT_ID,
      requestBody: {
        files: cleanupFiles
      }
    });

    console.log('✅ Removed test comment');
    console.log('');

    // STEP 5: Verify test word is gone
    console.log('🔍 STEP 5: Verifying test word is removed...');
    const finalResponse = await script.projects.getContent({
      scriptId: APPS_SCRIPT_ID
    });

    const finalFiles = finalResponse.data.files || [];
    const finalCodeFile = finalFiles.find(f => f.name === 'Code' && f.type === 'SERVER_JS');

    if (!finalCodeFile) {
      throw new Error('Code.gs file not found during final verification');
    }

    const finalSource = finalCodeFile.source;
    const testWordGone = !finalSource.includes(TEST_WORD);

    if (testWordGone) {
      console.log(`✅ SUCCESS: Test word removed from script!`);
      console.log('   Cleanup completed successfully.');
    } else {
      throw new Error('Test word still found in script after cleanup');
    }
    console.log('');

    console.log('════════════════════════════════════════════════════');
    console.log('✅ TEST COMPLETE - ALL STEPS PASSED');
    console.log('');
    console.log('Results:');
    console.log('  ✅ Read access: Working');
    console.log('  ✅ Write access: Working');
    console.log('  ✅ Modification verification: Working');
    console.log('  ✅ Cleanup: Working');
    console.log('');
    console.log('You can now safely update the Apps Script programmatically.');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ TEST FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');

    if (error.message.includes('insufficient authentication scopes')) {
      console.error('💡 Solution: You need script.projects scope (not just readonly)');
      console.error('');
      console.error('   Run: npm run auth-google');
      console.error('');
    } else if (error.message.includes('Permission denied')) {
      console.error('💡 Solution: Check Apps Script sharing permissions');
      console.error('');
      console.error('   Make sure the OAuth client has write access to this script');
      console.error('');
    }

    process.exit(1);
  }
}

// Run test
if (require.main === module) {
  testAppsScriptModification().catch(console.error);
}

module.exports = { testAppsScriptModification };
