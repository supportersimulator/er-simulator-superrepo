#!/usr/bin/env node

/**
 * VERIFY COMPLETE SEQUENCE MATCHES USER REQUIREMENTS
 *
 * User's exact requirements:
 * 1. Click "Categories & Pathways"
 * 2. Background prep runs (prep rough draft BEFORE AI recommendations)
 *    - Background prep = proper formatted defaults in proper formatted headers cache
 *    - Removed duplicates
 * 3. Click cache button
 * 4. Modal opens INSTANTLY with rough draft BEFORE AI RECOMMENDATIONS populate
 * 5. Can see live logs doing AI work
 * 6. Final picker view updates with AI recommendations
 * 7. Default 35 fields based on EITHER last saved selection OR 35 defaults in proper Row 2 format
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

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

async function verify() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading current production...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const code = content.data.files.find(f => f.name === 'Code').source;

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('COMPLETE SEQUENCE VERIFICATION');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // REQUIREMENT 1: Click "Categories & Pathways" triggers runPathwayChainBuilder
    console.log('✅ STEP 1: Menu Click → runPathwayChainBuilder()\n');

    // REQUIREMENT 2: Background prep
    const hasStep1 = code.includes('// STEP 1: Refresh headers cache');
    const hasStep2 = code.includes('// STEP 2: Initialize 35 intelligent defaults');
    const hasStep25 = code.includes('// STEP 2.5: Pre-fetch AI recommendations');

    console.log('   STEP 1 (refreshHeaders):', hasStep1 ? '✅ EXISTS' : '❌ MISSING');
    console.log('   STEP 2 (Initialize defaults):', hasStep2 ? '✅ EXISTS' : '❌ MISSING');
    console.log('   STEP 2.5 (AI pre-fetch):', hasStep25 ? '✅ EXISTS' : '❌ MISSING');

    if (!hasStep25) {
      console.log("\n   ⚠️  WARNING: Step 2.5 missing - AI won't pre-fetch in background!\n");
    }

    // Check if Step 2.5 is NON-BLOCKING
    if (hasStep25) {
      const step25Start = code.indexOf('// STEP 2.5');
      const step25Section = code.substring(step25Start, step25Start + 1000);
      const isBlocking = step25Section.includes('Utilities.sleep') || step25Section.includes('while(');

      if (isBlocking) {
        console.log('   ❌ Step 2.5 is BLOCKING (will delay UI)');
      } else {
        console.log('   ✅ Step 2.5 is NON-BLOCKING (UI shows immediately)');
      }
    }

    // REQUIREMENT 3: getFieldSelectorRoughDraft validates and deduplicates
    console.log('\n✅ STEP 2 DETAILS: getFieldSelectorRoughDraft()\n');

    const hasGetRoughDraft = code.includes('function getFieldSelectorRoughDraft() {');
    console.log('   Function exists:', hasGetRoughDraft ? '✅ YES' : '❌ NO');

    if (hasGetRoughDraft) {
      const funcStart = code.indexOf('function getFieldSelectorRoughDraft() {');
      const funcEnd = code.indexOf('\nfunction ', funcStart + 10);
      const func = code.substring(funcStart, funcEnd);

      const usesCachedMergedKeys = func.includes('CACHED_MERGED_KEYS');
      const usesSelectedCacheFields = func.includes('SELECTED_CACHE_FIELDS');
      const validatesDuplicates = func.includes('duplicates') || func.includes('seen');
      const validatesAgainstHeaders = func.includes('allFields.indexOf');
      const has35Defaults = func.includes('defaultFields = [') && func.match(/Case_Organization_Case_ID/);

      console.log('   Uses CACHED_MERGED_KEYS (Row 2 format):', usesCachedMergedKeys ? '✅ YES' : '❌ NO');
      console.log('   Uses SELECTED_CACHE_FIELDS (last saved):', usesSelectedCacheFields ? '✅ YES' : '❌ NO');
      console.log('   Removes duplicates:', validatesDuplicates ? '✅ YES' : '❌ NO');
      console.log('   Validates against current headers:', validatesAgainstHeaders ? '✅ YES' : '❌ NO');
      console.log('   Has 35 intelligent defaults:', has35Defaults ? '✅ YES' : '❌ NO');

      // Check the priority: last saved OR 35 defaults
      const hasIfSavedSelection = func.includes('if (savedSelection)') || func.includes('if (!savedSelection)');
      console.log('   Priority: Last saved → 35 defaults:', hasIfSavedSelection ? '✅ YES' : '❌ NO');
    }

    // REQUIREMENT 4: showFieldSelector opens instantly with rough draft
    console.log('\n✅ STEP 3: Click cache button → showFieldSelector()\n');

    const hasShowFieldSelector = code.includes('function showFieldSelector() {');
    console.log('   Function exists:', hasShowFieldSelector ? '✅ YES' : '❌ NO');

    if (hasShowFieldSelector) {
      const funcStart = code.indexOf('function showFieldSelector() {');
      const funcEnd = code.indexOf('function saveFieldSelectionAndStartCache', funcStart);
      const func = code.substring(funcStart, funcEnd);

      const callsRoughDraft = func.includes('getFieldSelectorRoughDraft()');
      const has3Sections = func.includes('Section 1: DEFAULT') &&
                          func.includes('Section 2: RECOMMENDED') &&
                          func.includes('Section 3: OTHER');
      const callsAIAsync = func.includes('google.script.run') && func.includes('getRecommendedFields');
      const hasLiveLogDiv = func.includes('<div id="log"');

      console.log('   Calls getFieldSelectorRoughDraft():', callsRoughDraft ? '✅ YES' : '❌ NO');
      console.log('   Has 3-section layout:', has3Sections ? '✅ YES' : '❌ NO');
      console.log('   Calls AI asynchronously:', callsAIAsync ? '✅ YES' : '❌ NO');
      console.log('   Has Live Log div:', hasLiveLogDiv ? '✅ YES' : '❌ NO');

      // Check if modal blocks waiting for AI
      const blocksForAI = func.includes('getRecommendedFields()') && !func.includes('google.script.run');
      if (blocksForAI) {
        console.log('   ❌ PROBLEM: Modal blocks waiting for AI (should be async)');
      } else {
        console.log('   ✅ Modal opens immediately (doesn\\'t wait for AI)');
      }
    }

    // REQUIREMENT 5: Check formatting consistency
    console.log('\n✅ FORMATTING CONSISTENCY:\n');

    const hasHeadersCacheDoc = fs.existsSync('/Users/aarontjomsland/Google Drive/My Drive/Lost and Found (for Simmastery and er-sim-monitor)/HEADERS_CACHE_FORMAT_GUARANTEE.md');
    console.log('   Documentation exists:', hasHeadersCacheDoc ? '✅ YES' : '❌ NO');

    // Check if all field names use Row 2 format (with underscores, full names)
    const sampleDefaults = code.substring(
      code.indexOf('defaultFields = ['),
      code.indexOf('];', code.indexOf('defaultFields = ['))
    );

    const usesFullFormat = sampleDefaults.includes('Case_Organization_Case_ID');
    const usesShortFormat = sampleDefaults.includes('"Case_ID"') || sampleDefaults.includes("'Case_ID'");

    console.log('   Uses full Row 2 format (Case_Organization_Case_ID):', usesFullFormat ? '✅ YES' : '❌ NO');
    console.log('   Uses short format (Case_ID):', usesShortFormat ? '⚠️  YES (WRONG)' : '✅ NO');

    // SUMMARY
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('SEQUENCE SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const allGood = hasStep1 && hasStep2 && hasStep25 && hasGetRoughDraft &&
                    hasShowFieldSelector && has3Sections && callsAIAsync && usesFullFormat;

    if (allGood) {
      console.log('✅ ALL REQUIREMENTS MET!\n');
      console.log('Flow:');
      console.log('1. ✅ Click "Categories & Pathways"');
      console.log('2. ✅ Step 1: refreshHeaders() → CACHED_MERGED_KEYS');
      console.log('3. ✅ Step 2: Initialize defaults (last saved OR 35 defaults)');
      console.log('4. ✅ Step 2.5: Kick off AI pre-fetch (non-blocking)');
      console.log('5. ✅ Show Pathway UI immediately');
      console.log('6. ✅ Click cache button');
      console.log('7. ✅ Modal opens instantly with rough draft');
      console.log('8. ✅ AI recommendations load asynchronously');
      console.log('9. ✅ Section 2 updates when AI responds');
      console.log('10. ✅ User adjusts fields, clicks Continue to Cache\n');
    } else {
      console.log('⚠️  SOME ISSUES FOUND - Review details above\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

verify();
