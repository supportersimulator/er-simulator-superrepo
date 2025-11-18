#!/usr/bin/env node

/**
 * Verify that dynamic header resolution is properly integrated
 * across all relevant functions in the Apps Script project
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TEST_SCRIPT_ID = '1kkPZU3GsCCuu5IhTEOufmDT1Cb2rSQVB3Y3u1DPf87yoSV4WVtoNvd6i';

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
  console.log('\n🔍 VERIFYING DYNAMIC HEADER INTEGRATION\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });

    // Files to check
    const enrichmentFile = project.data.files.find(f => f.name === 'Multi_Step_Cache_Enrichment');
    const phase2File = project.data.files.find(f => f.name === 'Categories_Pathways_Feature_Phase2');

    let allChecks = [];

    // Check 1: Multi_Step_Cache_Enrichment has helper function
    console.log('📦 MULTI-STEP CACHE ENRICHMENT\n');

    if (enrichmentFile) {
      const enrichCode = enrichmentFile.source;

      const checks = [
        { name: 'getColumnIndexByHeader_() exists', test: enrichCode.includes('function getColumnIndexByHeader_') },
        { name: 'refreshHeaders() called in enrichAllCacheLayers()', test: enrichCode.includes('refreshHeaders()') && enrichCode.match(/enrichAllCacheLayers[\s\S]{0,500}refreshHeaders/) },
        { name: 'Dynamic column resolution in enrichCacheLayer_()', test: enrichCode.includes('getColumnIndexByHeader_') && enrichCode.match(/enrichCacheLayer_[\s\S]{0,2000}getColumnIndexByHeader_/) },
        { name: 'CACHED_HEADER2 property used', test: enrichCode.includes('CACHED_HEADER2') }
      ];

      checks.forEach(check => {
        console.log(`   ${check.test ? '✅' : '❌'} ${check.name}`);
        allChecks.push(check);
      });
      console.log('');
    } else {
      console.log('   ❌ File not found\n');
    }

    // Check 2: Categories_Pathways_Feature_Phase2 has integration
    console.log('🔄 CATEGORIES & PATHWAYS FEATURE\n');

    if (phase2File) {
      const phase2Code = phase2File.source;

      const checks = [
        { name: 'refreshHeaders() function exists', test: phase2Code.includes('function refreshHeaders()') },
        { name: 'getColumnIndexByHeader_() function exists', test: phase2Code.includes('function getColumnIndexByHeader_') },
        { name: 'resolveColumnIndices_() function exists', test: phase2Code.includes('function resolveColumnIndices_') },
        { name: 'discoverNovelPathwaysWithAI_() calls refreshHeaders()', test: phase2Code.match(/discoverNovelPathwaysWithAI_[\s\S]{0,300}refreshHeaders/) },
        { name: 'getOrCreateHolisticAnalysis_() calls refreshHeaders()', test: phase2Code.match(/getOrCreateHolisticAnalysis_[\s\S]{0,300}refreshHeaders/) },
        { name: 'performHolisticAnalysis_() uses resolveColumnIndices_()', test: phase2Code.match(/performHolisticAnalysis_[\s\S]{0,1000}resolveColumnIndices_/) },
        { name: 'analyzeCatalog_() uses dynamic resolution', test: phase2Code.match(/(analyzeCatalog_|analyzeCatalogWithMultiLayerCache_)[\s\S]{0,2000}resolveColumnIndices_/) }
      ];

      checks.forEach(check => {
        console.log(`   ${check.test ? '✅' : '❌'} ${check.name}`);
        allChecks.push(check);
      });
      console.log('');
    } else {
      console.log('   ❌ File not found\n');
    }

    // Summary
    const passedChecks = allChecks.filter(c => c.test).length;
    const totalChecks = allChecks.length;
    const percentage = Math.round((passedChecks / totalChecks) * 100);

    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`📊 VERIFICATION RESULTS: ${passedChecks}/${totalChecks} checks passed (${percentage}%)\n`);

    if (percentage === 100) {
      console.log('✅ ALL CHECKS PASSED - Integration is complete!\n');
      console.log('🎯 WHAT THIS MEANS:\n');
      console.log('   • Cache button calls refreshHeaders() before caching');
      console.log('   • Discovery buttons call refreshHeaders() before analysis');
      console.log('   • All column lookups use current header mappings');
      console.log('   • System adapts automatically to schema changes\n');
      console.log('🚀 NEXT STEPS:\n');
      console.log('   1. Test in Google Sheet (click any discovery button)');
      console.log('   2. Check execution logs for "✅ Refreshed X header mappings"');
      console.log('   3. Try inserting a column and verify system adapts\n');
    } else if (percentage >= 80) {
      console.log('⚠️  MOSTLY COMPLETE - Some optional checks failed\n');
      console.log('Failed checks:');
      allChecks.filter(c => !c.test).forEach(c => {
        console.log(`   • ${c.name}`);
      });
      console.log('\nCore functionality should work, but review failed checks.\n');
    } else {
      console.log('❌ INTEGRATION INCOMPLETE - Multiple checks failed\n');
      console.log('Failed checks:');
      allChecks.filter(c => !c.test).forEach(c => {
        console.log(`   • ${c.name}`);
      });
      console.log('\nPlease re-run integration scripts.\n');
    }
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('\n❌ Verification failed: ' + e.message + '\n');
    if (e.stack) {
      console.log(e.stack);
    }
  }
}

verify().catch(console.error);
