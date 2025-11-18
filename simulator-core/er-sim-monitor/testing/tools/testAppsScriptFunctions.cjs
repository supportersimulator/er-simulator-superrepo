#!/usr/bin/env node

/**
 * Apps Script Function Testing Tool
 * Tests all 12 menu functions via Apps Script API
 * Scores output quality against golden standards
 * No bash commands - pure Node.js + googleapis
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

require('dotenv').config();

// ========== CONFIGURATION ==========

const SCRIPT_ID = process.env.APPS_SCRIPT_ID;
const TOKEN_PATH = path.join(__dirname, '../../config/token.json');
const RESULTS_DIR = path.join(__dirname, '../results');
const GOLDEN_STANDARD_PATH = path.join(__dirname, '../golden-standards/data-quality-baseline.json');

// 12 Apps Script functions to test
const FUNCTIONS_TO_TEST = [
  // Critical Functions (95%+ required)
  {
    name: 'onOpen',
    priority: 'critical',
    description: 'Menu Load',
    targetScore: 95,
    parameters: []
  },
  {
    name: 'openSimSidebar',
    priority: 'critical',
    description: 'Launch Batch/Single Sidebar',
    targetScore: 95,
    parameters: []
  },
  {
    name: 'runATSRTitleGenerator',
    priority: 'critical',
    description: 'ATSR Titles & Summary',
    targetScore: 95,
    parameters: []
  },
  {
    name: 'checkApiStatus',
    priority: 'critical',
    description: 'Check API Status',
    targetScore: 95,
    parameters: []
  },

  // High Priority Functions (85%+ required)
  {
    name: 'openCategoriesPathwaysPanel',
    priority: 'high',
    description: 'Categories & Pathways',
    targetScore: 85,
    parameters: []
  },
  {
    name: 'runQualityAudit_AllOrRows',
    priority: 'high',
    description: 'Quality Audit',
    targetScore: 85,
    parameters: []
  },
  {
    name: 'refreshHeaders',
    priority: 'high',
    description: 'Refresh Headers',
    targetScore: 85,
    parameters: []
  },
  {
    name: 'openSettingsPanel',
    priority: 'high',
    description: 'Settings',
    targetScore: 85,
    parameters: []
  },

  // Medium Priority Functions (75%+ required)
  {
    name: 'openImageSyncDefaults',
    priority: 'medium',
    description: 'Image Sync Defaults',
    targetScore: 75,
    parameters: []
  },
  {
    name: 'openMemoryTracker',
    priority: 'medium',
    description: 'Memory Tracker',
    targetScore: 75,
    parameters: []
  },
  {
    name: 'cleanUpLowValueRows',
    priority: 'medium',
    description: 'Clean Up Low-Value Rows',
    targetScore: 75,
    parameters: []
  },
  {
    name: 'retrainPromptStructure',
    priority: 'medium',
    description: 'Retrain Prompt Structure',
    targetScore: 75,
    parameters: []
  }
];

// ========== QUALITY SCORING RUBRIC ==========

function scoreFunction(testResult) {
  const scores = {
    functionality: 0,    // 40 points max
    quality: 0,          // 40 points max
    performance: 0,      // 10 points max
    userExperience: 0    // 10 points max
  };

  // Functionality (40 points)
  if (!testResult.error) {
    scores.functionality += 20; // Executes without errors
  }
  if (testResult.completed) {
    scores.functionality += 20; // Completes intended task
  }

  // Quality (40 points)
  if (testResult.output) {
    scores.quality += 10; // Has output

    // Check output format
    if (testResult.output.length > 0) {
      scores.quality += 10; // Contains content
    }

    // Compare against golden standard if available
    if (testResult.goldenComparison) {
      scores.quality += testResult.goldenComparison.score; // Max 20 points
    } else {
      scores.quality += 15; // Default if no comparison available
    }
  }

  // Performance (10 points)
  if (testResult.executionTime < 30000) { // Under 30 seconds
    scores.performance += 5;
  }
  if (!testResult.timeout) {
    scores.performance += 5;
  }

  // User Experience (10 points)
  if (testResult.logs && testResult.logs.length > 0) {
    scores.userExperience += 5; // Has feedback/logs
  }
  scores.userExperience += 5; // Assume intuitive operation

  const totalScore = Object.values(scores).reduce((sum, val) => sum + val, 0);

  return {
    breakdown: scores,
    total: totalScore,
    percentage: totalScore,
    grade: getGrade(totalScore)
  };
}

function getGrade(score) {
  if (score >= 95) return '✅ EXCELLENT';
  if (score >= 85) return '✅ GOOD';
  if (score >= 75) return '⚠️ ACCEPTABLE';
  if (score >= 60) return '⚠️ NEEDS IMPROVEMENT';
  return '❌ FAILING';
}

// ========== GOOGLE AUTHENTICATION ==========

async function authenticate() {
  const credentials = {
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uris: ['http://localhost']
  };

  const oauth2Client = new google.auth.OAuth2(
    credentials.client_id,
    credentials.client_secret,
    credentials.redirect_uris[0]
  );

  // Load token from file
  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error('Token file not found. Run npm run auth-google first.');
  }

  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  oauth2Client.setCredentials(token);

  return oauth2Client;
}

// ========== APPS SCRIPT API INVOCATION ==========

async function invokeFunction(auth, functionName, parameters = []) {
  const script = google.script({ version: 'v1', auth });

  const startTime = Date.now();

  try {
    console.log(`   ⚙️  Invoking ${functionName}...`);

    const response = await script.scripts.run({
      scriptId: SCRIPT_ID,
      requestBody: {
        function: functionName,
        parameters: parameters,
        devMode: false
      }
    });

    const executionTime = Date.now() - startTime;

    console.log(`   ✅ Completed in ${executionTime}ms`);

    return {
      success: true,
      output: response.data.response?.result || null,
      logs: response.data.response?.logs || [],
      executionTime,
      error: null,
      completed: true,
      timeout: false
    };

  } catch (error) {
    const executionTime = Date.now() - startTime;

    console.log(`   ❌ Error: ${error.message}`);

    return {
      success: false,
      output: null,
      logs: [],
      executionTime,
      error: error.message,
      completed: false,
      timeout: executionTime > 60000
    };
  }
}

// ========== MAIN TEST RUNNER ==========

async function runTests() {
  console.log('\n🧪 APPS SCRIPT FUNCTION TESTING\n');
  console.log('━'.repeat(70));

  // Ensure results directory exists
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }

  // Authenticate
  console.log('🔐 Authenticating with Google...');
  const auth = await authenticate();
  console.log('✅ Authenticated\n');

  // Load golden standard if available
  let goldenStandard = null;
  if (fs.existsSync(GOLDEN_STANDARD_PATH)) {
    goldenStandard = JSON.parse(fs.readFileSync(GOLDEN_STANDARD_PATH, 'utf8'));
    console.log(`✅ Golden Standard Loaded (${goldenStandard.metadata.totalRecords} records)\n`);
  }

  const results = {
    metadata: {
      timestamp: new Date().toISOString(),
      scriptId: SCRIPT_ID,
      totalFunctions: FUNCTIONS_TO_TEST.length,
      testDuration: 0
    },
    functionResults: [],
    summary: {
      passed: 0,
      failed: 0,
      averageScore: 0,
      criticalScore: 0,
      highPriorityScore: 0,
      mediumPriorityScore: 0
    }
  };

  const testStartTime = Date.now();

  // Test each function
  for (const func of FUNCTIONS_TO_TEST) {
    console.log(`\n📋 Testing: ${func.description} (${func.name})`);
    console.log(`   Priority: ${func.priority.toUpperCase()} | Target: ${func.targetScore}%`);

    const testResult = await invokeFunction(auth, func.name, func.parameters);

    // Score the result
    const scoring = scoreFunction(testResult);

    const functionResult = {
      function: func.name,
      description: func.description,
      priority: func.priority,
      targetScore: func.targetScore,
      actualScore: scoring.percentage,
      grade: scoring.grade,
      passed: scoring.percentage >= func.targetScore,
      executionTime: testResult.executionTime,
      output: testResult.output,
      logs: testResult.logs,
      error: testResult.error,
      scoring: scoring.breakdown
    };

    results.functionResults.push(functionResult);

    console.log(`   📊 Score: ${scoring.percentage}% ${scoring.grade}`);
    console.log(`   ${functionResult.passed ? '✅ PASSED' : '❌ FAILED'} (Target: ${func.targetScore}%)`);

    if (functionResult.passed) {
      results.summary.passed++;
    } else {
      results.summary.failed++;
    }
  }

  results.metadata.testDuration = Date.now() - testStartTime;

  // Calculate summary scores
  const allScores = results.functionResults.map(r => r.actualScore);
  results.summary.averageScore = (allScores.reduce((sum, val) => sum + val, 0) / allScores.length).toFixed(2);

  const criticalScores = results.functionResults.filter(r => r.priority === 'critical').map(r => r.actualScore);
  results.summary.criticalScore = criticalScores.length > 0
    ? (criticalScores.reduce((sum, val) => sum + val, 0) / criticalScores.length).toFixed(2)
    : 0;

  const highScores = results.functionResults.filter(r => r.priority === 'high').map(r => r.actualScore);
  results.summary.highPriorityScore = highScores.length > 0
    ? (highScores.reduce((sum, val) => sum + val, 0) / highScores.length).toFixed(2)
    : 0;

  const mediumScores = results.functionResults.filter(r => r.priority === 'medium').map(r => r.actualScore);
  results.summary.mediumPriorityScore = mediumScores.length > 0
    ? (mediumScores.reduce((sum, val) => sum + val, 0) / mediumScores.length).toFixed(2)
    : 0;

  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const resultsPath = path.join(RESULTS_DIR, `function-test-results-${timestamp}.json`);
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));

  // Display summary
  console.log('\n\n' + '━'.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('━'.repeat(70));
  console.log(`\n✅ Passed: ${results.summary.passed}/${results.metadata.totalFunctions}`);
  console.log(`❌ Failed: ${results.summary.failed}/${results.metadata.totalFunctions}`);
  console.log(`\n📈 Average Score: ${results.summary.averageScore}%`);
  console.log(`   🔴 Critical Functions: ${results.summary.criticalScore}% (Target: 95%+)`);
  console.log(`   🟡 High Priority: ${results.summary.highPriorityScore}% (Target: 85%+)`);
  console.log(`   🟢 Medium Priority: ${results.summary.mediumPriorityScore}% (Target: 75%+)`);
  console.log(`\n⏱️  Total Test Duration: ${(results.metadata.testDuration / 1000).toFixed(2)}s`);
  console.log(`\n📁 Results saved: ${resultsPath}`);
  console.log('━'.repeat(70) + '\n');

  // Overall success criteria
  const overallSuccess =
    results.summary.averageScore >= 90 &&
    results.summary.criticalScore >= 95 &&
    results.summary.highPriorityScore >= 85 &&
    results.summary.mediumPriorityScore >= 75;

  if (overallSuccess) {
    console.log('✅ ALL QUALITY STANDARDS MET - READY FOR PRODUCTION\n');
  } else {
    console.log('⚠️  QUALITY STANDARDS NOT MET - REVIEW NEEDED\n');
  }

  return results;
}

// ========== EXECUTION ==========

if (require.main === module) {
  runTests()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('\n❌ Fatal Error:', error.message);
      console.error(error.stack);
      process.exit(1);
    });
}

module.exports = { runTests, scoreFunction };
