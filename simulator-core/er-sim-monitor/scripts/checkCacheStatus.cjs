#!/usr/bin/env node

/**
 * Check AI Pathway Discovery v7.2 Cache Status
 * - Recent executions
 * - Function performance
 * - Cache sheet existence
 * - Error analysis
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TEST_SCRIPT_ID = '1kkPZU3GsCCuu5IhTEOufmDT1Cb2rSQVB3Y3u1DPf87yoSV4WVtoNvd6i';
const SPREADSHEET_ID = '1W5E8zcsIZjBE6MqQ0-8U-0BWz2DPlqHueMQKKGbPQKE';

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

async function checkCacheStatus() {
  console.log('\n🔍 AI PATHWAY DISCOVERY v7.2 - CACHE STATUS CHECK\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });
  const sheets = google.sheets({ version: 'v4', auth });

  // 1. Check recent executions
  console.log('📊 RECENT EXECUTIONS (Last 10):\n');

  try {
    const executions = await script.processes.list({
      userProcessFilter: {
        scriptId: TEST_SCRIPT_ID,
        types: ['APPS_SCRIPT_FUNCTION']
      },
      pageSize: 10
    });

    if (executions.data.processes && executions.data.processes.length > 0) {
      executions.data.processes.forEach((exec, idx) => {
        const func = exec.projectName || 'Unknown';
        const status = exec.processStatus === 'COMPLETED' ? '✅' :
                      exec.processStatus === 'RUNNING' ? '🔄' :
                      exec.processStatus === 'FAILED' ? '❌' : '⚠️';
        const duration = exec.duration ? `${exec.duration}s` : 'N/A';
        const time = new Date(exec.startTime).toLocaleString();

        console.log(`${idx + 1}. ${status} ${func}`);
        console.log(`   Status: ${exec.processStatus}`);
        console.log(`   Duration: ${duration}`);
        console.log(`   Time: ${time}`);

        if (exec.processStatus === 'FAILED') {
          console.log(`   ❌ Error: ${exec.executionError || 'Unknown error'}`);
        }
        console.log('');
      });
    } else {
      console.log('   No recent executions found.\n');
    }
  } catch (e) {
    console.log(`   ⚠️  Could not fetch executions: ${e.message}\n`);
  }

  // 2. Check for cache sheet
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📋 CACHE SHEET STATUS:\n');

  try {
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      fields: 'sheets.properties'
    });

    const cacheSheet = spreadsheet.data.sheets.find(
      sheet => sheet.properties.title === 'Pathway_Analysis_Cache'
    );

    if (cacheSheet) {
      console.log('✅ Cache sheet EXISTS: "Pathway_Analysis_Cache"');
      console.log(`   Sheet ID: ${cacheSheet.properties.sheetId}`);
      console.log(`   Hidden: ${cacheSheet.properties.hidden ? 'Yes' : 'No'}`);

      // Try to read cache data
      try {
        const cacheData = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: 'Pathway_Analysis_Cache!A1:B2'
        });

        if (cacheData.data.values && cacheData.data.values.length > 1) {
          const timestamp = cacheData.data.values[1][0];
          const jsonData = cacheData.data.values[1][1];

          console.log(`   ✅ Cache data found!`);
          console.log(`   Timestamp: ${timestamp}`);

          const cacheDate = new Date(timestamp);
          const now = new Date();
          const hoursOld = ((now - cacheDate) / (1000 * 60 * 60)).toFixed(1);

          console.log(`   Age: ${hoursOld} hours old`);
          console.log(`   Valid: ${hoursOld < 24 ? '✅ Yes (< 24 hours)' : '⚠️ No (> 24 hours, needs refresh)'}`);

          if (jsonData) {
            const dataSize = (jsonData.length / 1024).toFixed(1);
            console.log(`   Data size: ${dataSize} KB`);

            try {
              const parsed = JSON.parse(jsonData);
              const caseCount = parsed.allCases ? parsed.allCases.length : 0;
              console.log(`   Cases cached: ${caseCount}`);

              if (caseCount > 0 && parsed.allCases[0]) {
                const fieldCount = Object.keys(parsed.allCases[0]).length;
                console.log(`   Fields per case: ${fieldCount}`);
              }
            } catch (e) {
              console.log(`   ⚠️  Could not parse JSON data`);
            }
          }
        } else {
          console.log(`   ⚠️  Cache sheet exists but is EMPTY`);
          console.log(`   Action: Run "💾 Pre-Cache Rich Data" button`);
        }
      } catch (e) {
        console.log(`   ⚠️  Could not read cache data: ${e.message}`);
      }
    } else {
      console.log('❌ Cache sheet NOT FOUND: "Pathway_Analysis_Cache"');
      console.log('   Expected: Hidden sheet created on first cache run');
      console.log('   Action: Run "💾 Pre-Cache Rich Data" button to create');
    }
  } catch (e) {
    console.log(`   ❌ Could not check spreadsheet: ${e.message}`);
  }

  // 3. Check for AI discovery functions
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🔧 DEPLOYED FUNCTIONS:\n');

  try {
    const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });

    const phase2File = project.data.files.find(f => f.name === 'Categories_Pathways_Feature_Phase2');

    if (phase2File) {
      const code = phase2File.source;

      const criticalFunctions = [
        'preCacheRichData',
        'performCacheWithProgress',
        'analyzeCatalog_',
        'getOrCreateHolisticAnalysis_',
        'performHolisticAnalysis_',
        'showAIPathwaysStandardWithLogs',
        'showAIPathwaysRadicalWithLogs'
      ];

      criticalFunctions.forEach(func => {
        const exists = code.includes(`function ${func}`);
        console.log(`${exists ? '✅' : '❌'} ${func}()`);
      });

      // Check for cache logic
      console.log('\n🧩 CACHE LOGIC VERIFICATION:\n');

      const cacheChecks = [
        { label: 'Tier 1: Cache retrieval', pattern: /Pathway_Analysis_Cache/ },
        { label: 'Tier 2: Timeout protection', pattern: /MAX_TIME.*4.*60.*1000/ },
        { label: 'Tier 3: Lightweight fallback', pattern: /Last resort.*lightweight/ },
        { label: '24-hour cache validity', pattern: /hoursDiff < 24/ },
        { label: 'Auto-cache on success', pattern: /return analysis.*Success/ }
      ];

      cacheChecks.forEach(check => {
        const exists = check.pattern.test(code);
        console.log(`${exists ? '✅' : '❌'} ${check.label}`);
      });
    } else {
      console.log('❌ Categories_Pathways_Feature_Phase2.gs not found in project');
    }
  } catch (e) {
    console.log(`   ❌ Could not check functions: ${e.message}`);
  }

  // 4. Check triggers
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('⏰ INSTALLED TRIGGERS:\n');

  try {
    const triggers = await script.projects.triggers.list({ scriptId: TEST_SCRIPT_ID });

    if (triggers.data.triggers && triggers.data.triggers.length > 0) {
      triggers.data.triggers.forEach((trigger, idx) => {
        console.log(`${idx + 1}. Function: ${trigger.triggerFunction}`);
        console.log(`   Type: ${trigger.eventType}`);
        if (trigger.timeBased) {
          console.log(`   Schedule: ${trigger.timeBased.type || 'Custom'}`);
        }
        console.log('');
      });
    } else {
      console.log('   No triggers installed (manual execution only)');
    }
  } catch (e) {
    console.log(`   ⚠️  Could not check triggers: ${e.message}`);
  }

  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('💡 NEXT STEPS:\n');

  console.log('If cache sheet is missing or empty:');
  console.log('   1. Open your Google Sheet');
  console.log('   2. Go to Bird\'s Eye View (Pathway Chain Builder menu)');
  console.log('   3. Click "💾 Pre-Cache Rich Data" button');
  console.log('   4. Wait for progress modal to complete');
  console.log('   5. Run this check again to verify cache was created\n');

  console.log('If cache exists and is valid:');
  console.log('   1. Click "🤖 AI: Discover Novel Pathways" button');
  console.log('   2. Should complete in <2 seconds (using cache)');
  console.log('   3. Check execution log for "Using cached holistic analysis"\n');

  console.log('═══════════════════════════════════════════════════════════════\n');
}

checkCacheStatus().catch(console.error);
