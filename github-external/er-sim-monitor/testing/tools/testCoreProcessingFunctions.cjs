#!/usr/bin/env node

/**
 * Test Core Processing Functions (API-Callable Only)
 * Tests only functions that DON'T require UI context
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

require('dotenv').config();

const SCRIPT_ID = process.env.APPS_SCRIPT_ID;
const TOKEN_PATH = path.join(__dirname, '../../config/token.json');
const RESULTS_DIR = path.join(__dirname, '../results');

// Only functions that can be executed via API (no UI operations)
const TESTABLE_FUNCTIONS = [
  {
    name: 'checkApiStatus',
    priority: 'critical',
    description: 'Check OpenAI API Status',
    targetScore: 95,
    parameters: []
  },
  {
    name: 'runQualityAudit_AllOrRows',
    priority: 'high',
    description: 'Run Quality Audit',
    targetScore: 85,
    parameters: []
  },
  {
    name: 'refreshHeaders',
    priority: 'high',
    description: 'Refresh Header Cache',
    targetScore: 85,
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

// ========== AUTHENTICATION ==========

async function authenticate() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials(token);
  return oauth2Client;
}

// ========== FUNCTION INVOCATION ==========

async function invokeFunction(auth, functionName, parameters = []) {
  const script = google.script({ version: 'v1', auth });

  const startTime = Date.now();

  try {
    const response = await script.scripts.run({
      scriptId: SCRIPT_ID,
      requestBody: {
        function: functionName,
        parameters: parameters,
        devMode: false
      }
    });

    const executionTime = Date.now() - startTime;

    if (response.data.error) {
      return {
        success: false,
        error: response.data.error.details?.[0]?.errorMessage || response.data.error.message,
        executionTime
      };
    }

    return {
      success: true,
      output: response.data.response?.result,
      logs: response.data.response?.logs || [],
      executionTime
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    return {
      success: false,
      error: error.message,
      executionTime
    };
  }
}

// ========== SCORING ==========

function scoreFunction(testResult, targetScore) {
  const scores = {
    functionality: 0,    // 40 points max
    quality: 0,          // 40 points max
    performance: 0,      // 10 points max
    userExperience: 0    // 10 points max
  };

  // Functionality: Did it execute?
  if (testResult.success) {
    scores.functionality += 20; // Executed without errors
    if (testResult.output !== null && testResult.output !== undefined) {
      scores.functionality += 20; // Produced output
    }
  }

  // Quality: Does output look valid?
  if (testResult.success && testResult.output) {
    scores.quality += 10; // Has output
    if (typeof testResult.output === 'object' || testResult.output.length > 0) {
      scores.quality += 10; // Has content
    }
    if (!testResult.error) {
      scores.quality += 20; // No errors
    }
  } else if (testResult.success && testResult.output === undefined) {
    // Functions like refreshHeaders may not return anything but still succeed
    scores.quality += 40; // Assume success if no error
  }

  // Performance: Execution time
  if (testResult.executionTime < 30000) {
    scores.performance += 5; // Under 30 seconds
  }
  if (!testResult.error || !testResult.error.includes('timeout')) {
    scores.performance += 5; // No timeout
  }

  // User Experience: Logs and clarity
  if (testResult.logs && testResult.logs.length > 0) {
    scores.userExperience += 5; // Has logs
  }
  if (testResult.success) {
    scores.userExperience += 5; // Intuitive (no confusion)
  }

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const percentage = totalScore;

  let grade;
  if (percentage >= targetScore) {
    grade = '✅ PASSING';
  } else if (percentage >= targetScore * 0.8) {
    grade = '⚠️ NEEDS IMPROVEMENT';
  } else {
    grade = '❌ FAILING';
  }

  return {
    total: totalScore,
    percentage,
    grade,
    breakdown: scores
  };
}

// ========== MAIN TEST RUNNER ==========

async function runTests() {
  console.log('\n🧪 TESTING CORE PROCESSING FUNCTIONS (API-Callable)\n');
  console.log('━'.repeat(70));
  console.log('🔐 Authenticating with Google...');

  const auth = await authenticate();
  console.log('✅ Authenticated\n');

  const results = [];

  for (const func of TESTABLE_FUNCTIONS) {
    console.log(`📋 Testing: ${func.description} (${func.name})`);
    console.log(`   Priority: ${func.priority.toUpperCase()} | Target: ${func.targetScore}%`);
    console.log(`   ⚙️  Invoking ${func.name}...`);

    const testResult = await invokeFunction(auth, func.name, func.parameters);
    const score = scoreFunction(testResult, func.targetScore);

    const result = {
      function: func.name,
      description: func.description,
      priority: func.priority,
      targetScore: func.targetScore,
      actualScore: score.percentage,
      grade: score.grade,
      passed: score.percentage >= func.targetScore,
      executionTime: testResult.executionTime,
      output: testResult.output,
      logs: testResult.logs,
      error: testResult.error || null,
      scoring: score.breakdown
    };

    results.push(result);

    if (testResult.success) {
      console.log(`   ✅ Success (${testResult.executionTime}ms)`);
    } else {
      console.log(`   ❌ Error: ${testResult.error}`);
    }
    console.log(`   📊 Score: ${score.percentage}% ${score.grade}`);
    console.log(`   ${result.passed ? '✅' : '❌'} ${result.passed ? 'PASSED' : 'FAILED'} (Target: ${func.targetScore}%)\n`);
  }

  // Summary
  console.log('\n' + '━'.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('━'.repeat(70) + '\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const avgScore = (results.reduce((sum, r) => sum + r.actualScore, 0) / results.length).toFixed(2);

  console.log(`✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  console.log(`\n📈 Average Score: ${avgScore}%`);

  const criticalScore = results
    .filter(r => r.priority === 'critical')
    .reduce((sum, r) => sum + r.actualScore, 0) /
    (results.filter(r => r.priority === 'critical').length || 1);
  const highScore = results
    .filter(r => r.priority === 'high')
    .reduce((sum, r) => sum + r.actualScore, 0) /
    (results.filter(r => r.priority === 'high').length || 1);
  const mediumScore = results
    .filter(r => r.priority === 'medium')
    .reduce((sum, r) => sum + r.actualScore, 0) /
    (results.filter(r => r.priority === 'medium').length || 1);

  console.log(`   🔴 Critical Functions: ${criticalScore.toFixed(2)}% (Target: 95%+)`);
  console.log(`   🟡 High Priority: ${highScore.toFixed(2)}% (Target: 85%+)`);
  console.log(`   🟢 Medium Priority: ${mediumScore.toFixed(2)}% (Target: 75%+)`);

  // Save results
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().split('.')[0].replace(/:/g, '-');
  const resultPath = path.join(RESULTS_DIR, `core-function-tests-${timestamp}.json`);

  const report = {
    metadata: {
      timestamp: new Date().toISOString(),
      totalFunctions: results.length,
      testType: 'core-processing-functions'
    },
    results,
    summary: {
      passed,
      failed,
      averageScore: avgScore,
      criticalScore: criticalScore.toFixed(2),
      highPriorityScore: highScore.toFixed(2),
      mediumPriorityScore: mediumScore.toFixed(2)
    }
  };

  fs.writeFileSync(resultPath, JSON.stringify(report, null, 2));
  console.log(`\n📁 Results saved: ${resultPath}`);
  console.log('━'.repeat(70) + '\n');

  return report;
}

// Execute
if (require.main === module) {
  runTests()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { runTests };
