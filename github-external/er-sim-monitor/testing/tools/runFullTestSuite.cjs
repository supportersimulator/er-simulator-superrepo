#!/usr/bin/env node

/**
 * Full Test Suite Orchestrator
 * Runs complete testing workflow:
 * 1. Verify deployment
 * 2. Deploy if needed
 * 3. Test all 12 functions
 * 4. Generate comprehensive report
 */

const fs = require('fs');
const path = require('path');

const { verifyDeployment } = require('./verifyDeployment.cjs');
const { deployScript } = require('./deployAppsScript.cjs');
const { runTests } = require('./testAppsScriptFunctions.cjs');

async function runFullTestSuite() {
  console.log('\n🎯 24-HOUR APPS SCRIPT FUNCTION TESTING SUITE\n');
  console.log('━'.repeat(70));
  console.log('Mission: Test ALL functions to highest quality standards');
  console.log('Duration: Comprehensive autonomous testing');
  console.log('━'.repeat(70) + '\n');

  const suiteStartTime = Date.now();
  const report = {
    metadata: {
      startTime: new Date().toISOString(),
      mission: '24-hour comprehensive testing',
      autonomous: true
    },
    phases: {
      deployment: null,
      testing: null,
      analysis: null
    },
    summary: {
      totalDuration: 0,
      success: false,
      readyForProduction: false
    }
  };

  try {
    // ========== PHASE 1: DEPLOYMENT VERIFICATION ==========
    console.log('📋 PHASE 1: DEPLOYMENT VERIFICATION\n');

    const verificationResult = await verifyDeployment();
    report.phases.deployment = verificationResult;

    if (verificationResult.status === 'INCOMPLETE' || !verificationResult.deployed) {
      console.log('\n⚠️  Deployment incomplete - attempting deployment...\n');

      console.log('━'.repeat(70));
      console.log('📋 PHASE 1B: DEPLOYING APPS SCRIPT\n');

      const deploymentResult = await deployScript();
      report.phases.deployment = {
        ...verificationResult,
        redeployment: deploymentResult
      };

      if (!deploymentResult.success) {
        throw new Error('Deployment failed - cannot proceed with testing');
      }

      console.log('✅ Deployment complete - proceeding to testing\n');
    } else {
      console.log('✅ Deployment verified - proceeding to testing\n');
    }

    // Wait a few seconds for deployment to propagate
    console.log('⏳ Waiting 5 seconds for deployment to propagate...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // ========== PHASE 2: FUNCTION TESTING ==========
    console.log('━'.repeat(70));
    console.log('📋 PHASE 2: COMPREHENSIVE FUNCTION TESTING\n');

    const testResults = await runTests();
    report.phases.testing = testResults;

    // ========== PHASE 3: ANALYSIS & REPORTING ==========
    console.log('━'.repeat(70));
    console.log('📋 PHASE 3: ANALYSIS & REPORTING\n');

    const analysis = analyzeResults(testResults);
    report.phases.analysis = analysis;

    // Display analysis
    console.log('📊 Quality Analysis:\n');
    console.log(`   Overall Grade: ${analysis.overallGrade}`);
    console.log(`   Average Score: ${testResults.summary.averageScore}%`);
    console.log(`   Critical Functions: ${testResults.summary.criticalScore}% (Target: 95%+)`);
    console.log(`   High Priority: ${testResults.summary.highPriorityScore}% (Target: 85%+)`);
    console.log(`   Medium Priority: ${testResults.summary.mediumPriorityScore}% (Target: 75%+)`);
    console.log(`\n   Functions Passed: ${testResults.summary.passed}/${testResults.metadata.totalFunctions}`);
    console.log(`   Functions Failed: ${testResults.summary.failed}/${testResults.metadata.totalFunctions}`);

    // Recommendations
    if (analysis.recommendations.length > 0) {
      console.log(`\n📝 Recommendations:\n`);
      analysis.recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`);
      });
    }

    // Failed functions detail
    if (analysis.failedFunctions.length > 0) {
      console.log(`\n❌ Failed Functions:\n`);
      analysis.failedFunctions.forEach(func => {
        console.log(`   • ${func.description} (${func.name})`);
        console.log(`     Score: ${func.actualScore}% (Target: ${func.targetScore}%)`);
        if (func.error) {
          console.log(`     Error: ${func.error}`);
        }
      });
    }

    // Calculate final status
    report.summary.totalDuration = Date.now() - suiteStartTime;
    report.summary.success = analysis.meetsMinimumStandards;
    report.summary.readyForProduction = analysis.readyForProduction;

    // Save comprehensive report
    const resultsDir = path.join(__dirname, '../results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(resultsDir, `comprehensive-test-report-${timestamp}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate markdown summary
    const markdownReport = generateMarkdownReport(report, analysis);
    const markdownPath = path.join(resultsDir, `test-summary-${timestamp}.md`);
    fs.writeFileSync(markdownPath, markdownReport);

    console.log('\n' + '━'.repeat(70));
    console.log('📁 REPORTS GENERATED\n');
    console.log(`   JSON: ${reportPath}`);
    console.log(`   Markdown: ${markdownPath}`);

    console.log('\n' + '━'.repeat(70));

    if (report.summary.readyForProduction) {
      console.log('✅ MISSION SUCCESS - ALL QUALITY STANDARDS MET');
      console.log('   Ready for production use');
    } else if (report.summary.success) {
      console.log('⚠️  MISSION PARTIAL SUCCESS - MINIMUM STANDARDS MET');
      console.log('   Some improvements recommended');
    } else {
      console.log('❌ MISSION INCOMPLETE - QUALITY STANDARDS NOT MET');
      console.log('   Review failed functions and re-test');
    }

    console.log('━'.repeat(70) + '\n');

    return report;

  } catch (error) {
    console.error(`\n❌ Fatal Error: ${error.message}\n`);
    report.summary.success = false;
    report.error = error.message;
    throw error;
  }
}

function analyzeResults(testResults) {
  const analysis = {
    overallGrade: 'UNKNOWN',
    meetsMinimumStandards: false,
    readyForProduction: false,
    recommendations: [],
    failedFunctions: []
  };

  // Determine overall grade
  const avgScore = parseFloat(testResults.summary.averageScore);
  if (avgScore >= 95) {
    analysis.overallGrade = '✅ EXCELLENT';
  } else if (avgScore >= 90) {
    analysis.overallGrade = '✅ VERY GOOD';
  } else if (avgScore >= 85) {
    analysis.overallGrade = '✅ GOOD';
  } else if (avgScore >= 75) {
    analysis.overallGrade = '⚠️ ACCEPTABLE';
  } else if (avgScore >= 60) {
    analysis.overallGrade = '⚠️ NEEDS IMPROVEMENT';
  } else {
    analysis.overallGrade = '❌ FAILING';
  }

  // Check minimum standards
  const criticalScore = parseFloat(testResults.summary.criticalScore);
  const highScore = parseFloat(testResults.summary.highPriorityScore);
  const mediumScore = parseFloat(testResults.summary.mediumPriorityScore);

  analysis.meetsMinimumStandards =
    criticalScore >= 85 &&
    highScore >= 75 &&
    mediumScore >= 65;

  // Check production readiness (higher bar)
  analysis.readyForProduction =
    avgScore >= 90 &&
    criticalScore >= 95 &&
    highScore >= 85 &&
    mediumScore >= 75;

  // Generate recommendations
  if (criticalScore < 95) {
    analysis.recommendations.push(
      `Critical functions scored ${criticalScore}% (Target: 95%+) - Priority: HIGH`
    );
  }

  if (highScore < 85) {
    analysis.recommendations.push(
      `High priority functions scored ${highScore}% (Target: 85%+) - Priority: MEDIUM`
    );
  }

  if (mediumScore < 75) {
    analysis.recommendations.push(
      `Medium priority functions scored ${mediumScore}% (Target: 75%+) - Priority: LOW`
    );
  }

  // Find failed functions
  analysis.failedFunctions = testResults.functionResults.filter(f => !f.passed);

  if (analysis.failedFunctions.length === 0) {
    analysis.recommendations.push('All functions passed their targets - excellent work!');
  }

  return analysis;
}

function generateMarkdownReport(report, analysis) {
  const timestamp = new Date(report.metadata.startTime).toLocaleString();

  let md = `# Apps Script Function Testing Report\n\n`;
  md += `**Generated:** ${timestamp}\n`;
  md += `**Duration:** ${(report.summary.totalDuration / 1000).toFixed(2)}s\n`;
  md += `**Status:** ${report.summary.readyForProduction ? '✅ Production Ready' : '⚠️ Needs Review'}\n\n`;
  md += `---\n\n`;

  md += `## 📊 Summary\n\n`;
  md += `| Metric | Score | Target | Status |\n`;
  md += `|--------|-------|--------|--------|\n`;
  md += `| **Overall Average** | ${report.phases.testing.summary.averageScore}% | 90%+ | ${parseFloat(report.phases.testing.summary.averageScore) >= 90 ? '✅' : '⚠️'} |\n`;
  md += `| **Critical Functions** | ${report.phases.testing.summary.criticalScore}% | 95%+ | ${parseFloat(report.phases.testing.summary.criticalScore) >= 95 ? '✅' : '⚠️'} |\n`;
  md += `| **High Priority** | ${report.phases.testing.summary.highPriorityScore}% | 85%+ | ${parseFloat(report.phases.testing.summary.highPriorityScore) >= 85 ? '✅' : '⚠️'} |\n`;
  md += `| **Medium Priority** | ${report.phases.testing.summary.mediumPriorityScore}% | 75%+ | ${parseFloat(report.phases.testing.summary.mediumPriorityScore) >= 75 ? '✅' : '⚠️'} |\n`;
  md += `| **Functions Passed** | ${report.phases.testing.summary.passed} | ${report.phases.testing.metadata.totalFunctions} | ${report.phases.testing.summary.passed === report.phases.testing.metadata.totalFunctions ? '✅' : '⚠️'} |\n\n`;

  md += `**Overall Grade:** ${analysis.overallGrade}\n\n`;

  md += `---\n\n`;

  md += `## 🎯 Function Results\n\n`;

  // Group by priority
  const critical = report.phases.testing.functionResults.filter(f => f.priority === 'critical');
  const high = report.phases.testing.functionResults.filter(f => f.priority === 'high');
  const medium = report.phases.testing.functionResults.filter(f => f.priority === 'medium');

  md += `### 🔴 Critical Functions\n\n`;
  md += formatFunctionTable(critical);

  md += `### 🟡 High Priority Functions\n\n`;
  md += formatFunctionTable(high);

  md += `### 🟢 Medium Priority Functions\n\n`;
  md += formatFunctionTable(medium);

  if (analysis.recommendations.length > 0) {
    md += `---\n\n`;
    md += `## 📝 Recommendations\n\n`;
    analysis.recommendations.forEach((rec, i) => {
      md += `${i + 1}. ${rec}\n`;
    });
    md += `\n`;
  }

  if (analysis.failedFunctions.length > 0) {
    md += `---\n\n`;
    md += `## ❌ Failed Functions Detail\n\n`;
    analysis.failedFunctions.forEach(func => {
      md += `### ${func.description} (${func.name})\n\n`;
      md += `- **Score:** ${func.actualScore}% (Target: ${func.targetScore}%)\n`;
      md += `- **Status:** ${func.grade}\n`;
      md += `- **Execution Time:** ${func.executionTime}ms\n`;
      if (func.error) {
        md += `- **Error:** ${func.error}\n`;
      }
      md += `\n`;
    });
  }

  md += `---\n\n`;
  md += `*Generated by 24-Hour Autonomous Testing Suite*\n`;

  return md;
}

function formatFunctionTable(functions) {
  let table = `| Function | Score | Target | Status |\n`;
  table += `|----------|-------|--------|--------|\n`;

  functions.forEach(func => {
    const status = func.passed ? '✅ PASS' : '❌ FAIL';
    table += `| ${func.description} | ${func.actualScore}% | ${func.targetScore}% | ${status} |\n`;
  });

  table += `\n`;
  return table;
}

// ========== EXECUTION ==========

if (require.main === module) {
  runFullTestSuite()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('\n❌ Fatal Error:', error.message);
      process.exit(1);
    });
}

module.exports = { runFullTestSuite };
