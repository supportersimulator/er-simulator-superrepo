#!/usr/bin/env node

/**
 * MAP COMPLETE CACHE SEQUENCE
 *
 * Traces the EXACT sequence of function calls from menu click to cached data
 * with actual function names and their interactions
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

async function map() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading current production...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const code = content.data.files.find(f => f.name === 'Code').source;

    console.log('🗺️  COMPLETE CACHE SEQUENCE MAP\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Map all the key functions
    const functions = [
      'runPathwayChainBuilder',
      'refreshHeaders',
      'getFieldSelectorRoughDraft',
      'getAvailableFields',
      'getRecommendedFields',
      'getStaticRecommendedFields_',
      'showFieldSelector',
      'getColumnIndexByHeader_',
      'saveFieldSelectionAndStartCache',
      'performCacheWithProgress',
      'getOrCreateHolisticAnalysis_'
    ];

    const functionDetails = {};

    functions.forEach(funcName => {
      const regex = new RegExp(`function ${funcName.replace('_', '_')}\\([^)]*\\)`);
      const match = code.match(regex);

      if (match) {
        const funcStart = code.indexOf(match[0]);
        const linesBefore = code.substring(0, funcStart).split('\n').length;

        // Extract what this function does with cache
        const funcBody = code.substring(funcStart, funcStart + 2000);

        const details = {
          line: linesBefore,
          reads: [],
          writes: [],
          calls: []
        };

        // Check what cache properties it reads
        if (funcBody.includes('CACHED_MERGED_KEYS')) {
          const operation = funcBody.includes('getProperty(\'CACHED_MERGED_KEYS\')') ? 'READ' : '';
          if (operation) details.reads.push('CACHED_MERGED_KEYS');
        }
        if (funcBody.includes('SELECTED_CACHE_FIELDS')) {
          const operation = funcBody.includes('getProperty(\'SELECTED_CACHE_FIELDS\')') ? 'READ' : '';
          if (operation) details.reads.push('SELECTED_CACHE_FIELDS');
        }
        if (funcBody.includes('AI_RECOMMENDED_FIELDS')) {
          const operation = funcBody.includes('getProperty(\'AI_RECOMMENDED_FIELDS\')') ? 'READ' : '';
          if (operation) details.reads.push('AI_RECOMMENDED_FIELDS');
        }

        // Check what cache properties it writes
        if (funcBody.includes('setProperty(\'CACHED_MERGED_KEYS\'')) {
          details.writes.push('CACHED_MERGED_KEYS');
        }
        if (funcBody.includes('setProperty(\'SELECTED_CACHE_FIELDS\'')) {
          details.writes.push('SELECTED_CACHE_FIELDS');
        }
        if (funcBody.includes('setProperty(\'AI_RECOMMENDED_FIELDS\'')) {
          details.writes.push('AI_RECOMMENDED_FIELDS');
        }

        // Check what other functions it calls
        functions.forEach(otherFunc => {
          if (otherFunc !== funcName && funcBody.includes(otherFunc + '(')) {
            details.calls.push(otherFunc);
          }
        });

        functionDetails[funcName] = details;
      }
    });

    // Print the sequence
    console.log('USER ACTION: Clicks "🧩 Categories & Pathways" menu\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const sequence = [
      {
        step: '1',
        function: 'runPathwayChainBuilder',
        description: 'Entry point - Background preparation',
        details: functionDetails.runPathwayChainBuilder
      },
      {
        step: '1.1',
        function: 'refreshHeaders',
        description: 'Read Row 2 from sheet → cache CACHED_MERGED_KEYS',
        details: functionDetails.refreshHeaders
      },
      {
        step: '1.2',
        function: 'getFieldSelectorRoughDraft',
        description: 'Initialize 35 defaults if not saved',
        details: functionDetails.getFieldSelectorRoughDraft
      },
      {
        step: '1.3',
        function: 'getAvailableFields',
        description: 'Get all fields from CACHED_MERGED_KEYS',
        details: functionDetails.getAvailableFields
      },
      {
        step: '1.4',
        function: 'getRecommendedFields',
        description: 'Call OpenAI API → validate → cache AI_RECOMMENDED_FIELDS',
        details: functionDetails.getRecommendedFields
      },
      {
        step: '1.5',
        function: 'getOrCreateHolisticAnalysis_',
        description: 'Get or generate pathway analysis',
        details: functionDetails.getOrCreateHolisticAnalysis_
      },
      {
        step: '2',
        function: 'Pathway UI Displays',
        description: 'Modal shows with cache button ready',
        details: null
      },
      {
        step: '3',
        function: 'showFieldSelector',
        description: 'User clicks cache button → modal opens',
        details: functionDetails.showFieldSelector
      },
      {
        step: '3.1',
        function: 'getFieldSelectorRoughDraft',
        description: 'Get cached data instantly (already populated)',
        details: functionDetails.getFieldSelectorRoughDraft
      },
      {
        step: '3.2',
        function: 'Field Selector Modal HTML',
        description: '3-section layout renders with pre-cached data',
        details: null
      },
      {
        step: '4',
        function: 'saveFieldSelectionAndStartCache',
        description: 'User clicks "Continue to Cache" → save selection',
        details: functionDetails.saveFieldSelectionAndStartCache
      },
      {
        step: '4.1',
        function: 'performCacheWithProgress',
        description: 'Start batch processing (25 rows at a time)',
        details: functionDetails.performCacheWithProgress
      }
    ];

    sequence.forEach(item => {
      if (!item.details) {
        console.log(`STEP ${item.step}: ${item.function}`);
        console.log(`  Description: ${item.description}\n`);
        return;
      }

      console.log(`STEP ${item.step}: ${item.function}() [Line ${item.details.line}]`);
      console.log(`  Description: ${item.description}`);

      if (item.details.reads.length > 0) {
        console.log(`  Reads: ${item.details.reads.join(', ')}`);
      }

      if (item.details.writes.length > 0) {
        console.log(`  Writes: ${item.details.writes.join(', ')}`);
      }

      if (item.details.calls.length > 0) {
        console.log(`  Calls: ${item.details.calls.join(', ')}`);
      }

      console.log();
    });

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('KEY CACHE PROPERTIES:\n');
    console.log('CACHED_MERGED_KEYS:');
    console.log('  - Created by: refreshHeaders() [Step 1.1]');
    console.log('  - Read by: getFieldSelectorRoughDraft, getAvailableFields, getRecommendedFields');
    console.log('  - Format: ["Case_Organization_Case_ID", ...]\n');

    console.log('SELECTED_CACHE_FIELDS:');
    console.log('  - Created by: getFieldSelectorRoughDraft() [Step 1.2] if not exists');
    console.log('  - Updated by: saveFieldSelectionAndStartCache() [Step 4]');
    console.log('  - Read by: getFieldSelectorRoughDraft, getRecommendedFields');
    console.log('  - Format: ["Case_Organization_Case_ID", ...] (35 defaults or user selection)\n');

    console.log('AI_RECOMMENDED_FIELDS:');
    console.log('  - Created by: getRecommendedFields() [Step 1.4]');
    console.log('  - Read by: showFieldSelector() HTML (pre-cached for instant display)');
    console.log('  - Format: ["Field_Name_1", "Field_Name_2", ...] (validated exact matches)\n');

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

map();
