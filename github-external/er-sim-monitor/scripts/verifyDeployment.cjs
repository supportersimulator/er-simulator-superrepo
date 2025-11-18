#!/usr/bin/env node

/**
 * Simplified AI Pathway Discovery v7.2 Deployment Verification
 * Focuses on what we CAN reliably check via Apps Script API
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

async function verifyDeployment() {
  console.log('\n✅ AI PATHWAY DISCOVERY v7.2 - DEPLOYMENT VERIFICATION\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  let allChecks = [];

  // 1. Get deployed code
  console.log('📦 CHECKING DEPLOYED CODE...\n');

  try {
    const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });
    const phase2File = project.data.files.find(f => f.name === 'Categories_Pathways_Feature_Phase2');

    if (!phase2File) {
      console.log('❌ Categories_Pathways_Feature_Phase2.gs not found');
      allChecks.push({ name: 'File exists', passed: false });
      return;
    }

    const code = phase2File.source;
    const sizeKB = (code.length / 1024).toFixed(1);

    console.log(`✅ File found: Categories_Pathways_Feature_Phase2.gs`);
    console.log(`   Size: ${sizeKB} KB`);
    allChecks.push({ name: 'File exists', passed: true });

    // 2. Check file size
    if (parseFloat(sizeKB) < 150) {
      console.log(`✅ File size OK (${sizeKB} KB < 150 KB limit)`);
      allChecks.push({ name: 'File size within limits', passed: true });
    } else {
      console.log(`❌ File size too large (${sizeKB} KB > 150 KB limit)`);
      allChecks.push({ name: 'File size within limits', passed: false });
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('🔧 FUNCTION DEPLOYMENT CHECK:\n');

    // 3. Check critical functions
    const requiredFunctions = [
      { name: 'preCacheRichData', description: 'Pre-cache UI modal' },
      { name: 'performCacheWithProgress', description: 'Backend cache processing' },
      { name: 'analyzeCatalog_', description: 'Smart 3-tier caching wrapper' },
      { name: 'getOrCreateHolisticAnalysis_', description: 'Cache management' },
      { name: 'performHolisticAnalysis_', description: 'Full rich analysis (210+ cases)' },
      { name: 'showAIPathwaysStandardWithLogs', description: 'Standard mode AI discovery' },
      { name: 'showAIPathwaysRadicalWithLogs', description: 'Radical mode AI discovery' }
    ];

    let allFunctionsPresent = true;

    requiredFunctions.forEach(func => {
      const regex = new RegExp(`function ${func.name}\\s*\\(`);
      const exists = regex.test(code);

      if (exists) {
        console.log(`✅ ${func.name}()`);
        console.log(`   → ${func.description}`);
      } else {
        console.log(`❌ ${func.name}() - MISSING`);
        allFunctionsPresent = false;
      }
    });

    allChecks.push({ name: 'All required functions present', passed: allFunctionsPresent });

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('🧩 CACHE LOGIC VERIFICATION:\n');

    // 4. Check cache implementation details
    const cacheChecks = [
      {
        name: 'Tier 1: Cache sheet check',
        pattern: /Pathway_Analysis_Cache/,
        description: 'Checks hidden sheet for cached data'
      },
      {
        name: 'Tier 1: 24-hour validity',
        pattern: /hoursDiff\s*<\s*24/,
        description: 'Cache expires after 24 hours'
      },
      {
        name: 'Tier 2: Timeout protection',
        pattern: /MAX_TIME.*4\s*\*\s*60\s*\*\s*1000/,
        description: '4-minute timeout protection'
      },
      {
        name: 'Tier 3: Lightweight fallback',
        pattern: /Last resort|lightweight|fallback/i,
        description: 'Falls back to basic 6-field analysis'
      },
      {
        name: 'Cache creation on success',
        pattern: /getOrCreateSheet.*Pathway_Analysis_Cache/,
        description: 'Auto-creates cache sheet if missing'
      }
    ];

    let allCacheLogicPresent = true;

    cacheChecks.forEach(check => {
      const exists = check.pattern.test(code);

      if (exists) {
        console.log(`✅ ${check.name}`);
        console.log(`   → ${check.description}`);
      } else {
        console.log(`⚠️  ${check.name} - Pattern not found`);
        console.log(`   → ${check.description}`);
        allCacheLogicPresent = false;
      }
    });

    allChecks.push({ name: 'Cache logic implemented', passed: allCacheLogicPresent });

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('🎨 UI BUTTON VERIFICATION:\n');

    // 5. Check UI button
    const uiChecks = [
      {
        name: 'Pre-cache button',
        pattern: /💾\s*Pre-Cache\s*Rich\s*Data/,
        description: 'Green gradient button in UI'
      },
      {
        name: 'Button onclick handler',
        pattern: /onclick="google\.script\.run\.preCacheRichData\(\)/,
        description: 'Calls preCacheRichData() function'
      },
      {
        name: 'Standard mode button',
        pattern: /🤖\s*AI:\s*Discover\s*Novel\s*Pathways/,
        description: 'Blue button for standard mode'
      },
      {
        name: 'Radical mode button',
        pattern: /🔥\s*AI:\s*Radical\s*Mode/,
        description: 'Orange button for radical mode'
      }
    ];

    let allButtonsPresent = true;

    uiChecks.forEach(check => {
      const exists = check.pattern.test(code);

      if (exists) {
        console.log(`✅ ${check.name}`);
        console.log(`   → ${check.description}`);
      } else {
        console.log(`❌ ${check.name} - NOT FOUND`);
        console.log(`   → ${check.description}`);
        allButtonsPresent = false;
      }
    });

    allChecks.push({ name: 'UI buttons present', passed: allButtonsPresent });

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📊 PROGRESS MODAL VERIFICATION:\n');

    // 6. Check progress modal
    const progressChecks = [
      {
        name: 'Progress bar HTML',
        pattern: /progress-bar.*progress-fill/s,
        description: 'Animated progress bar (0% → 100%)'
      },
      {
        name: 'Live timestamp logging',
        pattern: /timestamp.*MM:SS|elapsed.*timestamp/i,
        description: 'Shows elapsed time (MM:SS format)'
      },
      {
        name: 'Success message',
        pattern: /SUCCESS.*Processed.*cases/i,
        description: 'Shows completion with case count'
      },
      {
        name: 'Auto-close on complete',
        pattern: /setTimeout.*google\.script\.host\.close/,
        description: 'Modal closes after 3 seconds'
      }
    ];

    let allProgressFeaturesPresent = true;

    progressChecks.forEach(check => {
      const exists = check.pattern.test(code);

      if (exists) {
        console.log(`✅ ${check.name}`);
        console.log(`   → ${check.description}`);
      } else {
        console.log(`⚠️  ${check.name} - Pattern not found`);
        console.log(`   → ${check.description}`);
        allProgressFeaturesPresent = false;
      }
    });

    allChecks.push({ name: 'Progress modal features', passed: allProgressFeaturesPresent });

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📋 DEPLOYMENT SUMMARY:\n');

    // Summary
    const passedChecks = allChecks.filter(c => c.passed).length;
    const totalChecks = allChecks.length;
    const passRate = ((passedChecks / totalChecks) * 100).toFixed(0);

    console.log(`   Checks Passed: ${passedChecks}/${totalChecks} (${passRate}%)\n`);

    allChecks.forEach(check => {
      console.log(`   ${check.passed ? '✅' : '❌'} ${check.name}`);
    });

    console.log('\n═══════════════════════════════════════════════════════════════');

    if (passedChecks === totalChecks) {
      console.log('✅ DEPLOYMENT VERIFIED - ALL CHECKS PASSED\n');
      console.log('🎯 NEXT STEPS:\n');
      console.log('   1. Open your Google Sheet');
      console.log('   2. Go to Bird\'s Eye View (Pathway Chain Builder menu)');
      console.log('   3. You should see THREE buttons:');
      console.log('      • 💾 Pre-Cache Rich Data (green)');
      console.log('      • 🤖 AI: Discover Novel Pathways (blue)');
      console.log('      • 🔥 AI: Radical Mode (orange)');
      console.log('   4. Click "💾 Pre-Cache Rich Data" first');
      console.log('   5. Watch progress modal (0% → 100%)');
      console.log('   6. Then click "🤖 AI: Discover Novel Pathways"');
      console.log('   7. Should complete in <2 seconds (using cache)\n');
    } else {
      console.log('⚠️  SOME CHECKS FAILED - REVIEW ABOVE\n');
      console.log('🔧 TROUBLESHOOTING:\n');
      console.log('   • Re-deploy the file if functions are missing');
      console.log('   • Check file size if over 150 KB limit');
      console.log('   • Verify code was copied correctly\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log(`\n❌ Error checking deployment: ${e.message}\n`);
    console.log('Stack trace:', e.stack);
  }
}

verifyDeployment().catch(console.error);
