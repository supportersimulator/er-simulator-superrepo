#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { execSync } = require('child_process');
require('dotenv').config();

const SHEET_NAME = 'Master Scenario Convert';

console.log('\n🚀 MASTER TEST RUNNER - COMPREHENSIVE QUALITY VERIFICATION\n');
console.log('━'.repeat(70) + '\n');
console.log('This will test ALL ATSR functions against golden standard baseline');
console.log('and generate a comprehensive quality report with creative verification.\n');
console.log('━'.repeat(70) + '\n');

async function runAllTests() {
  const startTime = Date.now();

  // Auth
  const credentialsPath = path.join(__dirname, '../../config/credentials.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const {client_id, client_secret, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const tokenPath = path.join(__dirname, '../../config/token.json');
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  oAuth2Client.setCredentials(token);

  const sheets = google.sheets({version: 'v4', auth: oAuth2Client});

  // Load golden standard baseline
  const baselinePath = path.join(__dirname, '../golden-standards/data-quality-baseline.json');
  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));

  console.log('📊 Golden Standard Loaded:');
  console.log(`   Total Records: ${baseline.metadata.totalRecords}`);
  console.log(`   Lowercase Keys: ${baseline.qualityScores.lowercaseKeys}`);
  console.log(`   BP Objects: ${baseline.qualityScores.bpObjects}`);
  console.log(`   Valid Waveforms: ${baseline.qualityScores.validWaveforms}`);
  console.log(`   Required Fields: ${baseline.qualityScores.requiredFields}\n`);

  // Get current live data from spreadsheet
  console.log('📡 Fetching live spreadsheet data...\n');

  const dataResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SHEET_NAME}!3:200`
  });

  const rows = dataResponse.data.values || [];
  console.log(`✅ Loaded ${rows.length} rows from live spreadsheet\n`);

  // Test Suite
  const testSuite = {
    vitalsValidation: { tested: 0, passed: 0, failed: 0, details: [] },
    sparkTitles: { tested: 0, passed: 0, failed: 0, details: [] },
    revealTitles: { tested: 0, passed: 0, failed: 0, details: [] },
    preSimOverviews: { tested: 0, passed: 0, failed: 0, details: [] },
    postSimOverviews: { tested: 0, passed: 0, failed: 0, details: [] },
    categories: { tested: 0, passed: 0, failed: 0, details: [] }
  };

  // Test 1: Vitals Validation (Compare against golden standard)
  console.log('🧪 Test 1: Vitals Data Quality Validation\n');

  const vitalsTests = [];
  for (let i = 0; i < Math.min(rows.length, 189); i++) {
    const row = rows[i];
    const vitalsRaw = row[55]; // Column BD

    testSuite.vitalsValidation.tested++;

    if (!vitalsRaw) {
      testSuite.vitalsValidation.failed++;
      continue;
    }

    try {
      const vitalsObj = JSON.parse(vitalsRaw);

      // Check against golden standard criteria
      const checks = {
        lowercaseKeys: Object.keys(vitalsObj).every(k => k === k.toLowerCase()),
        bpIsObject: vitalsObj.bp && typeof vitalsObj.bp === 'object',
        validWaveform: ['sinus_ecg', 'afib_ecg', 'vtach_ecg', 'vfib_ecg', 'asystole_ecg', 'nsr_ecg', 'stemi_ecg', 'nstemi_ecg'].includes(vitalsObj.waveform),
        hasRequiredFields: vitalsObj.hr !== undefined && vitalsObj.spo2 !== undefined && vitalsObj.bp !== undefined && vitalsObj.rr !== undefined
      };

      const allPassed = Object.values(checks).every(v => v);

      if (allPassed) {
        testSuite.vitalsValidation.passed++;
      } else {
        testSuite.vitalsValidation.failed++;
        testSuite.vitalsValidation.details.push({
          rowNum: i + 3,
          caseId: row[0],
          failedChecks: Object.keys(checks).filter(k => !checks[k])
        });
      }
    } catch (e) {
      testSuite.vitalsValidation.failed++;
      testSuite.vitalsValidation.details.push({
        rowNum: i + 3,
        caseId: row[0],
        error: 'Invalid JSON'
      });
    }
  }

  console.log(`   Tested: ${testSuite.vitalsValidation.tested}`);
  console.log(`   ✅ Passed: ${testSuite.vitalsValidation.passed}`);
  console.log(`   ❌ Failed: ${testSuite.vitalsValidation.failed}`);
  console.log(`   Score: ${((testSuite.vitalsValidation.passed / testSuite.vitalsValidation.tested) * 100).toFixed(2)}%\n`);

  // Test 2: Spark Titles Quality
  console.log('🧪 Test 2: Spark Title Quality\n');

  const sparkQualityCriteria = {
    hasContent: 0,
    underMaxLength: 0,
    hasEngagingElements: 0
  };

  for (let i = 0; i < Math.min(rows.length, 189); i++) {
    const row = rows[i];
    const sparkTitle = row[7]; // Column H

    testSuite.sparkTitles.tested++;

    if (!sparkTitle || sparkTitle.trim() === '') {
      testSuite.sparkTitles.failed++;
      continue;
    }

    sparkQualityCriteria.hasContent++;

    // Check quality criteria
    const isUnder100 = sparkTitle.length <= 100;
    const hasEngaging = /[?!]/.test(sparkTitle) || /[\u{1F300}-\u{1F9FF}]/u.test(sparkTitle);

    if (isUnder100) sparkQualityCriteria.underMaxLength++;
    if (hasEngaging) sparkQualityCriteria.hasEngagingElements++;

    if (isUnder100 && hasEngaging) {
      testSuite.sparkTitles.passed++;
    } else {
      testSuite.sparkTitles.failed++;
    }
  }

  console.log(`   Tested: ${testSuite.sparkTitles.tested}`);
  console.log(`   ✅ Passed: ${testSuite.sparkTitles.passed}`);
  console.log(`   ❌ Failed: ${testSuite.sparkTitles.failed}`);
  console.log(`   Score: ${((testSuite.sparkTitles.passed / testSuite.sparkTitles.tested) * 100).toFixed(2)}%\n`);

  // Test 3: Reveal Titles Quality
  console.log('🧪 Test 3: Reveal Title Quality\n');

  for (let i = 0; i < Math.min(rows.length, 189); i++) {
    const row = rows[i];
    const revealTitle = row[8]; // Column I

    testSuite.revealTitles.tested++;

    if (!revealTitle || revealTitle.trim() === '') {
      testSuite.revealTitles.failed++;
      continue;
    }

    // Check quality: should be medical diagnosis format
    const isUnder200 = revealTitle.length <= 200;
    const hasMedicalTerms = /\b(syndrome|disease|failure|infection|ischemia|infarction|embolism|hemorrhage)\b/i.test(revealTitle);

    if (isUnder200 && hasMedicalTerms) {
      testSuite.revealTitles.passed++;
    } else {
      testSuite.revealTitles.failed++;
    }
  }

  console.log(`   Tested: ${testSuite.revealTitles.tested}`);
  console.log(`   ✅ Passed: ${testSuite.revealTitles.passed}`);
  console.log(`   ❌ Failed: ${testSuite.revealTitles.failed}`);
  console.log(`   Score: ${((testSuite.revealTitles.passed / testSuite.revealTitles.tested) * 100).toFixed(2)}%\n`);

  // Test 4: Pre-Sim Overviews
  console.log('🧪 Test 4: Pre-Sim Overview Quality\n');

  for (let i = 0; i < Math.min(rows.length, 189); i++) {
    const row = rows[i];
    const preSimOverview = row[9]; // Column J

    testSuite.preSimOverviews.tested++;

    if (!preSimOverview || preSimOverview.trim() === '') {
      testSuite.preSimOverviews.failed++;
      continue;
    }

    // Quality criteria: should be substantial content
    const hasMinLength = preSimOverview.length >= 50;
    const hasStructure = preSimOverview.includes('.') && preSimOverview.split('.').length >= 2;

    if (hasMinLength && hasStructure) {
      testSuite.preSimOverviews.passed++;
    } else {
      testSuite.preSimOverviews.failed++;
    }
  }

  console.log(`   Tested: ${testSuite.preSimOverviews.tested}`);
  console.log(`   ✅ Passed: ${testSuite.preSimOverviews.passed}`);
  console.log(`   ❌ Failed: ${testSuite.preSimOverviews.failed}`);
  console.log(`   Score: ${((testSuite.preSimOverviews.passed / testSuite.preSimOverviews.tested) * 100).toFixed(2)}%\n`);

  // Test 5: Post-Sim Overviews
  console.log('🧪 Test 5: Post-Sim Overview Quality\n');

  for (let i = 0; i < Math.min(rows.length, 189); i++) {
    const row = rows[i];
    const postSimOverview = row[10]; // Column K

    testSuite.postSimOverviews.tested++;

    if (!postSimOverview || postSimOverview.trim() === '') {
      testSuite.postSimOverviews.failed++;
      continue;
    }

    // Quality criteria
    const hasMinLength = postSimOverview.length >= 50;
    const hasStructure = postSimOverview.includes('.') && postSimOverview.split('.').length >= 2;

    if (hasMinLength && hasStructure) {
      testSuite.postSimOverviews.passed++;
    } else {
      testSuite.postSimOverviews.failed++;
    }
  }

  console.log(`   Tested: ${testSuite.postSimOverviews.tested}`);
  console.log(`   ✅ Passed: ${testSuite.postSimOverviews.passed}`);
  console.log(`   ❌ Failed: ${testSuite.postSimOverviews.failed}`);
  console.log(`   Score: ${((testSuite.postSimOverviews.passed / testSuite.postSimOverviews.tested) * 100).toFixed(2)}%\n`);

  // Test 6: Categories
  console.log('🧪 Test 6: Medical Categories\n');

  const validCategories = ['Cardiac', 'Respiratory', 'Neuro', 'GI', 'Trauma', 'Pediatric', 'OB/GYN', 'Toxicology', 'Other'];

  for (let i = 0; i < Math.min(rows.length, 189); i++) {
    const row = rows[i];
    const category = row[5]; // Column F

    testSuite.categories.tested++;

    if (!category || category.trim() === '') {
      testSuite.categories.failed++;
      continue;
    }

    if (validCategories.includes(category)) {
      testSuite.categories.passed++;
    } else {
      testSuite.categories.failed++;
    }
  }

  console.log(`   Tested: ${testSuite.categories.tested}`);
  console.log(`   ✅ Passed: ${testSuite.categories.passed}`);
  console.log(`   ❌ Failed: ${testSuite.categories.failed}`);
  console.log(`   Score: ${((testSuite.categories.passed / testSuite.categories.tested) * 100).toFixed(2)}%\n`);

  // Calculate Overall Score
  const totalTested = Object.values(testSuite).reduce((sum, test) => sum + test.tested, 0);
  const totalPassed = Object.values(testSuite).reduce((sum, test) => sum + test.passed, 0);
  const overallScore = ((totalPassed / totalTested) * 100).toFixed(2);

  // Generate comprehensive report
  const executionTime = Date.now() - startTime;

  const report = {
    timestamp: new Date().toISOString(),
    executionTime: `${(executionTime / 1000).toFixed(2)}s`,
    goldenStandardBaseline: baseline.qualityScores,
    testSuite,
    overallMetrics: {
      totalTests: totalTested,
      totalPassed,
      totalFailed: totalTested - totalPassed,
      overallScore: overallScore + '%'
    },
    passingGrade: overallScore >= 95 ? '✅ EXCELLENT' : overallScore >= 85 ? '✅ GOOD' : overallScore >= 75 ? '⚠️ ACCEPTABLE' : '❌ NEEDS IMPROVEMENT'
  };

  // Save report
  const reportPath = path.join(__dirname, '../results/master-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Display final results
  console.log('━'.repeat(70));
  console.log('📊 COMPREHENSIVE TEST RESULTS\n');
  console.log(`   Total Tests: ${totalTested}`);
  console.log(`   Total Passed: ${totalPassed}`);
  console.log(`   Total Failed: ${totalTested - totalPassed}`);
  console.log(`   Overall Score: ${overallScore}%`);
  console.log(`   Grade: ${report.passingGrade}`);
  console.log(`   Execution Time: ${report.executionTime}\n`);
  console.log('━'.repeat(70));
  console.log(`✅ Full report saved: ${reportPath}\n`);

  return report;
}

if (require.main === module) {
  runAllTests().catch(err => {
    console.error('❌ Master test failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  });
}

module.exports = { runAllTests };
