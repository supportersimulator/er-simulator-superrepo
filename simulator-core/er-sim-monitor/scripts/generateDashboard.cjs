#!/usr/bin/env node

/**
 * System Analytics Dashboard
 *
 * Generates comprehensive analytics and insights:
 * - Pathway distribution and stats
 * - Category breakdown
 * - Complexity vs Priority matrix
 * - Foundational case percentages
 * - Coverage gaps analysis
 * - Naming quality metrics
 */

const fs = require('fs');
const path = require('path');

const PATHWAY_METADATA_PATH = path.join(__dirname, '..', 'AI_ENHANCED_PATHWAY_METADATA.json');
const CASE_MAPPING_PATH = path.join(__dirname, '..', 'AI_ENHANCED_CASE_ID_MAPPING.json');
const OVERVIEWS_PATH = path.join(__dirname, '..', 'AI_CASE_OVERVIEWS.json');

const CATEGORY_LABELS = {
  'CARD': 'Cardiac',
  'RESP': 'Respiratory',
  'NEUR': 'Neurological',
  'GAST': 'Gastrointestinal',
  'RENA': 'Renal',
  'ENDO': 'Endocrine',
  'HEME': 'Hematology',
  'MUSC': 'Musculoskeletal',
  'DERM': 'Dermatology',
  'INFD': 'Infectious Disease',
  'IMMU': 'Immunology',
  'OBST': 'Obstetrics',
  'GYNE': 'Gynecology',
  'TRAU': 'Trauma',
  'TOXI': 'Toxicology',
  'PSYC': 'Psychiatry',
  'ENVI': 'Environmental',
  'MULT': 'Multisystem'
};

function loadJSON(filePath, name) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ ERROR: ${name} not found at ${filePath}`);
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`❌ ERROR: Failed to parse ${name}: ${error.message}`);
    return null;
  }
}

function createBarChart(data, maxWidth = 50) {
  const maxValue = Math.max(...data.map(d => d.value));

  return data.map(item => {
    const barWidth = Math.round((item.value / maxValue) * maxWidth);
    const bar = '█'.repeat(barWidth);
    const label = item.label.padEnd(30, ' ');
    const count = String(item.value).padStart(3, ' ');
    return `${label} ${bar} ${count}`;
  }).join('\n');
}

function analyzePathways(pathways, cases) {
  const pathwayStats = [];

  Object.entries(pathways).forEach(([name, data]) => {
    const pathwayCases = cases.filter(c => c.pathwayName === name);
    const foundationalCount = pathwayCases.filter(c => c.isFoundational).length;
    const avgComplexity = pathwayCases.reduce((sum, c) => sum + (c.complexity || 0), 0) / pathwayCases.length;
    const avgPriority = pathwayCases.reduce((sum, c) => sum + (c.priority || 0), 0) / pathwayCases.length;

    pathwayStats.push({
      name,
      scenarioCount: data.scenarioCount,
      foundationalCases: foundationalCount,
      foundationalPercent: (foundationalCount / data.scenarioCount * 100).toFixed(0),
      avgComplexity: avgComplexity.toFixed(1),
      avgPriority: avgPriority.toFixed(1),
      systemFocus: data.systemFocus
    });
  });

  return pathwayStats.sort((a, b) => b.scenarioCount - a.scenarioCount);
}

function analyzeCategories(cases) {
  const categoryStats = {};

  cases.forEach(c => {
    const system = c.system || 'UNKNOWN';
    if (!categoryStats[system]) {
      categoryStats[system] = {
        code: system,
        label: CATEGORY_LABELS[system] || system,
        count: 0,
        foundational: 0,
        avgComplexity: 0,
        avgPriority: 0,
        cases: []
      };
    }

    categoryStats[system].count++;
    if (c.isFoundational) categoryStats[system].foundational++;
    categoryStats[system].cases.push(c);
  });

  // Calculate averages
  Object.values(categoryStats).forEach(stat => {
    stat.avgComplexity = (stat.cases.reduce((sum, c) => sum + (c.complexity || 0), 0) / stat.count).toFixed(1);
    stat.avgPriority = (stat.cases.reduce((sum, c) => sum + (c.priority || 0), 0) / stat.count).toFixed(1);
    stat.foundationalPercent = (stat.foundational / stat.count * 100).toFixed(0);
    delete stat.cases; // Remove case list from output
  });

  return Object.values(categoryStats).sort((a, b) => b.count - a.count);
}

function analyzeComplexityPriorityMatrix(cases) {
  const matrix = {
    highPriorityLowComplexity: [], // Foundational essentials
    highPriorityHighComplexity: [], // Critical advanced cases
    lowPriorityLowComplexity: [],  // Nice-to-have basics
    lowPriorityHighComplexity: []  // Specialized edge cases
  };

  cases.forEach(c => {
    const complexity = c.complexity || 0;
    const priority = c.priority || 0;

    if (priority >= 4 && complexity <= 3) {
      matrix.highPriorityLowComplexity.push(c);
    } else if (priority >= 4 && complexity >= 4) {
      matrix.highPriorityHighComplexity.push(c);
    } else if (priority <= 3 && complexity <= 3) {
      matrix.lowPriorityLowComplexity.push(c);
    } else {
      matrix.lowPriorityHighComplexity.push(c);
    }
  });

  return matrix;
}

function analyzeCoverageGaps(pathways, cases) {
  const gaps = [];

  // Check for pathways with < 5 cases (might need expansion)
  Object.entries(pathways).forEach(([name, data]) => {
    if (data.scenarioCount < 5) {
      gaps.push({
        type: 'Small Pathway',
        name,
        count: data.scenarioCount,
        recommendation: 'Consider expanding or merging with related pathway'
      });
    }
  });

  // Check for categories with < 3 cases (underrepresented)
  const categoryStats = analyzeCategories(cases);
  categoryStats.forEach(stat => {
    if (stat.count < 3) {
      gaps.push({
        type: 'Underrepresented Category',
        name: stat.label,
        count: stat.count,
        recommendation: 'Consider adding more cases for this medical system'
      });
    }
  });

  // Check for pathways with < 30% foundational cases
  Object.entries(pathways).forEach(([name, data]) => {
    const pathwayCases = cases.filter(c => c.pathwayName === name);
    const foundationalCount = pathwayCases.filter(c => c.isFoundational).length;
    const foundationalPercent = (foundationalCount / data.scenarioCount * 100);

    if (foundationalPercent < 30 && data.scenarioCount > 10) {
      gaps.push({
        type: 'Low Foundational Ratio',
        name,
        count: foundationalCount,
        total: data.scenarioCount,
        percent: foundationalPercent.toFixed(0),
        recommendation: 'Consider adding more foundational cases to pathway'
      });
    }
  });

  return gaps;
}

function analyzeNamingQuality(pathways) {
  const issues = [];

  Object.entries(pathways).forEach(([name, data]) => {
    const hasBulletproof = name.toLowerCase().includes('bulletproof');
    const hasLawsuit = name.toLowerCase().includes('lawsuit');
    const hasMastery = name.toLowerCase().includes('mastery');

    const pathwayCases = data.scenarioCount;
    const foundationalCases = data.foundationalCases || 0;
    const isFoundational = foundationalCases > (pathwayCases * 0.5);

    if (hasBulletproof) {
      issues.push({
        pathway: name,
        issue: 'Contains "Bulletproof"',
        severity: 'Medium',
        recommendation: 'Use clinical language unless trauma/legal focus'
      });
    }

    if (hasLawsuit) {
      issues.push({
        pathway: name,
        issue: 'Contains "Lawsuit" language',
        severity: 'Medium',
        recommendation: 'Use clinical language unless legal medicine focus'
      });
    }

    if (hasMastery && !isFoundational) {
      issues.push({
        pathway: name,
        issue: 'Uses "Mastery" but not foundational-focused',
        severity: 'Low',
        recommendation: 'Reserve "Mastery" for foundational/basics pathways'
      });
    }
  });

  return issues;
}

async function generateDashboard() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  📊 SYSTEM ANALYTICS DASHBOARD');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  // Load data
  console.log('📖 Loading system data...');
  const pathways = loadJSON(PATHWAY_METADATA_PATH, 'Pathway Metadata');
  const cases = loadJSON(CASE_MAPPING_PATH, 'Case Mapping');
  const overviews = loadJSON(OVERVIEWS_PATH, 'Case Overviews');

  if (!pathways || !cases || !overviews) {
    console.log('');
    console.error('❌ CRITICAL: Cannot proceed without all data files');
    process.exit(1);
  }

  console.log(`   ✅ Loaded ${Object.keys(pathways).length} pathways`);
  console.log(`   ✅ Loaded ${cases.length} cases`);
  console.log(`   ✅ Loaded ${overviews.length} overviews`);
  console.log('');

  // ============================================================
  // SECTION 1: PATHWAY DISTRIBUTION
  // ============================================================
  console.log('─────────────────────────────────────────');
  console.log('📊 PATHWAY DISTRIBUTION');
  console.log('─────────────────────────────────────────');
  console.log('');

  const pathwayStats = analyzePathways(pathways, cases);

  const pathwayChartData = pathwayStats.map(p => ({
    label: p.name.substring(0, 28),
    value: p.scenarioCount
  }));

  console.log(createBarChart(pathwayChartData));
  console.log('');

  console.log('📈 Top 5 Pathways:');
  pathwayStats.slice(0, 5).forEach((p, idx) => {
    console.log(`   ${idx + 1}. ${p.name}`);
    console.log(`      Cases: ${p.scenarioCount} | Foundational: ${p.foundationalPercent}% | Avg Complexity: ${p.avgComplexity}`);
  });
  console.log('');

  // ============================================================
  // SECTION 2: CATEGORY BREAKDOWN
  // ============================================================
  console.log('─────────────────────────────────────────');
  console.log('📂 CATEGORY BREAKDOWN');
  console.log('─────────────────────────────────────────');
  console.log('');

  const categoryStats = analyzeCategories(cases);

  const categoryChartData = categoryStats.slice(0, 10).map(c => ({
    label: c.label,
    value: c.count
  }));

  console.log(createBarChart(categoryChartData));
  console.log('');

  console.log('📊 Category Statistics:');
  categoryStats.slice(0, 8).forEach(c => {
    console.log(`   • ${c.label.padEnd(20, ' ')} ${String(c.count).padStart(3, ' ')} cases | ${c.foundationalPercent}% foundational`);
  });
  console.log('');

  // ============================================================
  // SECTION 3: COMPLEXITY vs PRIORITY MATRIX
  // ============================================================
  console.log('─────────────────────────────────────────');
  console.log('🎯 COMPLEXITY vs PRIORITY MATRIX');
  console.log('─────────────────────────────────────────');
  console.log('');

  const matrix = analyzeComplexityPriorityMatrix(cases);

  console.log('                   LOW COMPLEXITY       HIGH COMPLEXITY');
  console.log('                   ─────────────────    ───────────────');
  console.log(`HIGH PRIORITY      ${String(matrix.highPriorityLowComplexity.length).padStart(4, ' ')} cases          ${String(matrix.highPriorityHighComplexity.length).padStart(4, ' ')} cases`);
  console.log('                   (Foundational        (Critical');
  console.log('                    Essentials)          Advanced)');
  console.log('');
  console.log(`LOW PRIORITY       ${String(matrix.lowPriorityLowComplexity.length).padStart(4, ' ')} cases          ${String(matrix.lowPriorityHighComplexity.length).padStart(4, ' ')} cases`);
  console.log('                   (Nice-to-Have        (Specialized');
  console.log('                    Basics)              Edge Cases)');
  console.log('');

  console.log('💡 Insights:');
  console.log(`   • ${matrix.highPriorityLowComplexity.length} foundational essentials (build these first)`);
  console.log(`   • ${matrix.highPriorityHighComplexity.length} critical advanced cases (require prerequisites)`);
  console.log(`   • ${matrix.lowPriorityHighComplexity.length} specialized edge cases (advanced learners)`);
  console.log('');

  // ============================================================
  // SECTION 4: FOUNDATIONAL CASE ANALYSIS
  // ============================================================
  console.log('─────────────────────────────────────────');
  console.log('🎓 FOUNDATIONAL CASE ANALYSIS');
  console.log('─────────────────────────────────────────');
  console.log('');

  const totalCases = cases.length;
  const foundationalCases = cases.filter(c => c.isFoundational).length;
  const foundationalPercent = (foundationalCases / totalCases * 100).toFixed(1);

  console.log(`Total Cases: ${totalCases}`);
  console.log(`Foundational: ${foundationalCases} (${foundationalPercent}%)`);
  console.log(`Advanced: ${totalCases - foundationalCases} (${(100 - foundationalPercent).toFixed(1)}%)`);
  console.log('');

  console.log('📚 Pathways with Highest Foundational Ratio:');
  pathwayStats
    .filter(p => p.scenarioCount >= 5)
    .sort((a, b) => parseFloat(b.foundationalPercent) - parseFloat(a.foundationalPercent))
    .slice(0, 5)
    .forEach((p, idx) => {
      console.log(`   ${idx + 1}. ${p.name.substring(0, 40)}`);
      console.log(`      ${p.foundationalPercent}% foundational (${p.foundationalCases}/${p.scenarioCount} cases)`);
    });
  console.log('');

  // ============================================================
  // SECTION 5: COVERAGE GAPS
  // ============================================================
  console.log('─────────────────────────────────────────');
  console.log('⚠️  COVERAGE GAPS & RECOMMENDATIONS');
  console.log('─────────────────────────────────────────');
  console.log('');

  const gaps = analyzeCoverageGaps(pathways, cases);

  if (gaps.length === 0) {
    console.log('✅ No significant coverage gaps found!');
  } else {
    gaps.forEach((gap, idx) => {
      console.log(`${idx + 1}. ${gap.type}: ${gap.name}`);
      if (gap.count !== undefined) {
        if (gap.total) {
          console.log(`   Current: ${gap.count}/${gap.total} (${gap.percent}%)`);
        } else {
          console.log(`   Current: ${gap.count} cases`);
        }
      }
      console.log(`   💡 ${gap.recommendation}`);
      console.log('');
    });
  }

  // ============================================================
  // SECTION 6: NAMING QUALITY
  // ============================================================
  console.log('─────────────────────────────────────────');
  console.log('✍️  NAMING QUALITY ANALYSIS');
  console.log('─────────────────────────────────────────');
  console.log('');

  const namingIssues = analyzeNamingQuality(pathways);

  if (namingIssues.length === 0) {
    console.log('✅ All pathway names follow naming guidelines!');
  } else {
    console.log(`⚠️  ${namingIssues.length} naming issues found:`);
    console.log('');
    namingIssues.forEach((issue, idx) => {
      console.log(`${idx + 1}. ${issue.pathway}`);
      console.log(`   Issue: ${issue.issue} (${issue.severity} severity)`);
      console.log(`   💡 ${issue.recommendation}`);
      console.log('');
    });
    console.log('💡 Run: npm run categories-pathways');
    console.log('   Then select Option 4 to generate alternative names');
  }
  console.log('');

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('═══════════════════════════════════════════════════');
  console.log('📈 DASHBOARD SUMMARY');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log(`📊 System Scale:`);
  console.log(`   • ${totalCases} total cases`);
  console.log(`   • ${Object.keys(pathways).length} learning pathways`);
  console.log(`   • ${Object.keys(categoryStats).length} medical categories`);
  console.log('');
  console.log(`🎯 Learning Focus:`);
  console.log(`   • ${foundationalPercent}% foundational cases`);
  console.log(`   • ${matrix.highPriorityLowComplexity.length} foundational essentials`);
  console.log(`   • ${matrix.highPriorityHighComplexity.length} critical advanced cases`);
  console.log('');
  console.log(`⚠️  Action Items:`);
  console.log(`   • ${gaps.length} coverage gaps to address`);
  console.log(`   • ${namingIssues.length} naming improvements recommended`);
  console.log('');
  console.log('💡 Recommended Commands:');
  console.log('   • npm run categories-pathways - Manage organization');
  console.log('   • npm run validate-system - Check data integrity');
  console.log('   • npm run analyze-pathways - Review naming quality');
  console.log('');
}

if (require.main === module) {
  generateDashboard().catch(err => {
    console.error('❌ Dashboard generation failed:', err.message);
    process.exit(1);
  });
}

module.exports = { generateDashboard };
