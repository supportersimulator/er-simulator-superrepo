#!/usr/bin/env node

/**
 * Dashboard Data Export Utility
 *
 * Exports analytics data to CSV/JSON formats for external analysis:
 * - Pathway statistics (CSV/JSON)
 * - Category breakdown (CSV/JSON)
 * - Complexity/priority matrix (CSV/JSON)
 * - Complete system snapshot (JSON only)
 * - Foundational analysis (CSV/JSON)
 */

const fs = require('fs');
const path = require('path');

const PATHWAY_METADATA_PATH = path.join(__dirname, '..', 'AI_ENHANCED_PATHWAY_METADATA.json');
const CASE_MAPPING_PATH = path.join(__dirname, '..', 'AI_ENHANCED_CASE_ID_MAPPING.json');
const OVERVIEWS_PATH = path.join(__dirname, '..', 'AI_CASE_OVERVIEWS.json');
const EXPORT_DIR = path.join(__dirname, '..', 'exports');

function ensureExportDir() {
  if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
  }
}

function toCSV(data, headers) {
  const rows = [headers.join(',')];

  data.forEach(row => {
    const values = headers.map(header => {
      let value = row[header];
      if (value === undefined || value === null) value = '';
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    rows.push(values.join(','));
  });

  return rows.join('\n');
}

function analyzePathways(pathways, cases) {
  const pathwayStats = [];

  Object.entries(pathways).forEach(([name, data]) => {
    const pathwayCases = cases.filter(c => c.pathwayName === name);
    const foundationalCount = pathwayCases.filter(c => c.isFoundational).length;
    const avgComplexity = pathwayCases.reduce((sum, c) => sum + (c.complexity || 0), 0) / pathwayCases.length;
    const avgPriority = pathwayCases.reduce((sum, c) => sum + (c.priority || 0), 0) / pathwayCases.length;

    pathwayStats.push({
      pathway: name,
      caseCount: data.scenarioCount,
      foundationalCount: foundationalCount,
      foundationalPercent: (foundationalCount / data.scenarioCount * 100).toFixed(1),
      avgComplexity: avgComplexity.toFixed(2),
      avgPriority: avgPriority.toFixed(2),
      systemFocus: data.systemFocus || 'Unknown'
    });
  });

  return pathwayStats.sort((a, b) => b.caseCount - a.caseCount);
}

function analyzeCategories(cases) {
  const categoryStats = {};

  cases.forEach(c => {
    const system = c.system || 'Unknown';
    if (!categoryStats[system]) {
      categoryStats[system] = {
        category: system,
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
  const result = [];
  Object.values(categoryStats).forEach(stat => {
    result.push({
      category: stat.category,
      count: stat.count,
      foundational: stat.foundational,
      foundationalPercent: (stat.foundational / stat.count * 100).toFixed(1),
      avgComplexity: (stat.cases.reduce((sum, c) => sum + (c.complexity || 0), 0) / stat.count).toFixed(2),
      avgPriority: (stat.cases.reduce((sum, c) => sum + (c.priority || 0), 0) / stat.count).toFixed(2)
    });
  });

  return result.sort((a, b) => b.count - a.count);
}

function analyzeComplexityPriorityMatrix(cases) {
  const matrix = {
    highPriorityLowComplexity: [],
    highPriorityHighComplexity: [],
    lowPriorityLowComplexity: [],
    lowPriorityHighComplexity: []
  };

  cases.forEach(c => {
    const complexity = c.complexity || 0;
    const priority = c.priority || 0;

    const row = {
      caseId: c.newId || c.oldId,
      complexity,
      priority,
      isFoundational: c.isFoundational ? 'TRUE' : 'FALSE',
      pathway: c.pathwayName || 'Unknown',
      category: c.system || 'Unknown'
    };

    if (priority >= 7 && complexity <= 3) {
      row.quadrant = 'High Priority Low Complexity';
      matrix.highPriorityLowComplexity.push(row);
    } else if (priority >= 7 && complexity >= 4) {
      row.quadrant = 'High Priority High Complexity';
      matrix.highPriorityHighComplexity.push(row);
    } else if (priority <= 6 && complexity <= 3) {
      row.quadrant = 'Low Priority Low Complexity';
      matrix.lowPriorityLowComplexity.push(row);
    } else {
      row.quadrant = 'Low Priority High Complexity';
      matrix.lowPriorityHighComplexity.push(row);
    }
  });

  return [
    ...matrix.highPriorityLowComplexity,
    ...matrix.highPriorityHighComplexity,
    ...matrix.lowPriorityLowComplexity,
    ...matrix.lowPriorityHighComplexity
  ];
}

function analyzeFoundational(cases) {
  const result = [];

  cases.forEach(c => {
    result.push({
      caseId: c.newId || c.oldId,
      isFoundational: c.isFoundational ? 'TRUE' : 'FALSE',
      complexity: c.complexity || 0,
      priority: c.priority || 0,
      pathway: c.pathwayName || 'Unknown',
      category: c.system || 'Unknown',
      title: c.title || 'Untitled'
    });
  });

  return result;
}

async function exportData(format = 'both') {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  📤 EXPORT DASHBOARD DATA');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  try {
    // Load data
    console.log('1️⃣ Loading system data...');
    const pathways = JSON.parse(fs.readFileSync(PATHWAY_METADATA_PATH, 'utf8'));
    const cases = JSON.parse(fs.readFileSync(CASE_MAPPING_PATH, 'utf8'));
    const overviews = JSON.parse(fs.readFileSync(OVERVIEWS_PATH, 'utf8'));

    console.log(`   ✅ Loaded ${Object.keys(pathways).length} pathways`);
    console.log(`   ✅ Loaded ${cases.length} cases`);
    console.log(`   ✅ Loaded ${overviews.length} overviews`);
    console.log('');

    // Ensure export directory exists
    ensureExportDir();

    // Generate timestamp for filenames
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];

    console.log('2️⃣ Analyzing and exporting data...');
    console.log('');

    const exports = [];

    // Export 1: Pathway Statistics
    if (format === 'csv' || format === 'both') {
      const pathwayStats = analyzePathways(pathways, cases);
      const pathwayCsv = toCSV(pathwayStats, ['pathway', 'caseCount', 'foundationalCount', 'foundationalPercent', 'avgComplexity', 'avgPriority', 'systemFocus']);
      const pathwayCsvPath = path.join(EXPORT_DIR, `pathway-stats-${timestamp}.csv`);
      fs.writeFileSync(pathwayCsvPath, pathwayCsv);
      exports.push(`   ✅ pathway-stats-${timestamp}.csv (${pathwayStats.length} rows)`);
    }

    if (format === 'json' || format === 'both') {
      const pathwayStats = analyzePathways(pathways, cases);
      const pathwayJsonPath = path.join(EXPORT_DIR, `pathway-stats-${timestamp}.json`);
      fs.writeFileSync(pathwayJsonPath, JSON.stringify(pathwayStats, null, 2));
      exports.push(`   ✅ pathway-stats-${timestamp}.json (${pathwayStats.length} entries)`);
    }

    // Export 2: Category Breakdown
    if (format === 'csv' || format === 'both') {
      const categoryStats = analyzeCategories(cases);
      const categoryCsv = toCSV(categoryStats, ['category', 'count', 'foundational', 'foundationalPercent', 'avgComplexity', 'avgPriority']);
      const categoryCsvPath = path.join(EXPORT_DIR, `category-breakdown-${timestamp}.csv`);
      fs.writeFileSync(categoryCsvPath, categoryCsv);
      exports.push(`   ✅ category-breakdown-${timestamp}.csv (${categoryStats.length} rows)`);
    }

    if (format === 'json' || format === 'both') {
      const categoryStats = analyzeCategories(cases);
      const categoryJsonPath = path.join(EXPORT_DIR, `category-breakdown-${timestamp}.json`);
      fs.writeFileSync(categoryJsonPath, JSON.stringify(categoryStats, null, 2));
      exports.push(`   ✅ category-breakdown-${timestamp}.json (${categoryStats.length} entries)`);
    }

    // Export 3: Complexity/Priority Matrix
    if (format === 'csv' || format === 'both') {
      const matrixData = analyzeComplexityPriorityMatrix(cases);
      const matrixCsv = toCSV(matrixData, ['caseId', 'quadrant', 'complexity', 'priority', 'isFoundational', 'pathway', 'category']);
      const matrixCsvPath = path.join(EXPORT_DIR, `complexity-priority-matrix-${timestamp}.csv`);
      fs.writeFileSync(matrixCsvPath, matrixCsv);
      exports.push(`   ✅ complexity-priority-matrix-${timestamp}.csv (${matrixData.length} rows)`);
    }

    if (format === 'json' || format === 'both') {
      const matrixData = analyzeComplexityPriorityMatrix(cases);
      const matrixJsonPath = path.join(EXPORT_DIR, `complexity-priority-matrix-${timestamp}.json`);
      fs.writeFileSync(matrixJsonPath, JSON.stringify(matrixData, null, 2));
      exports.push(`   ✅ complexity-priority-matrix-${timestamp}.json (${matrixData.length} entries)`);
    }

    // Export 4: Foundational Analysis
    if (format === 'csv' || format === 'both') {
      const foundationalData = analyzeFoundational(cases);
      const foundationalCsv = toCSV(foundationalData, ['caseId', 'isFoundational', 'complexity', 'priority', 'pathway', 'category', 'title']);
      const foundationalCsvPath = path.join(EXPORT_DIR, `foundational-analysis-${timestamp}.csv`);
      fs.writeFileSync(foundationalCsvPath, foundationalCsv);
      exports.push(`   ✅ foundational-analysis-${timestamp}.csv (${foundationalData.length} rows)`);
    }

    if (format === 'json' || format === 'both') {
      const foundationalData = analyzeFoundational(cases);
      const foundationalJsonPath = path.join(EXPORT_DIR, `foundational-analysis-${timestamp}.json`);
      fs.writeFileSync(foundationalJsonPath, JSON.stringify(foundationalData, null, 2));
      exports.push(`   ✅ foundational-analysis-${timestamp}.json (${foundationalData.length} entries)`);
    }

    // Export 5: Complete System Snapshot (JSON only)
    const snapshotData = {
      timestamp,
      metadata: {
        totalCases: cases.length,
        totalPathways: Object.keys(pathways).length,
        totalOverviews: overviews.length
      },
      pathways,
      cases,
      overviews
    };
    const snapshotPath = path.join(EXPORT_DIR, `system-snapshot-${timestamp}.json`);
    fs.writeFileSync(snapshotPath, JSON.stringify(snapshotData, null, 2));
    exports.push(`   ✅ system-snapshot-${timestamp}.json (complete data)`);

    console.log('═══════════════════════════════════════════════════');
    console.log('✅ EXPORT COMPLETE');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log(`Exported ${exports.length} files to /exports/:`);
    exports.forEach(e => console.log(e));
    console.log('');
    console.log('💡 Use these files with:');
    console.log('   • Excel/Google Sheets (CSV files)');
    console.log('   • Tableau/Power BI (CSV/JSON)');
    console.log('   • Python/R analysis scripts (JSON)');
    console.log('   • External reporting tools');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Export failed:', error.message);
    console.error('');
    process.exit(1);
  }
}

// Parse command-line arguments
const args = process.argv.slice(2);
let format = 'both';

if (args.includes('--format=csv')) format = 'csv';
else if (args.includes('--format=json')) format = 'json';
else if (args.includes('--format=both')) format = 'both';

if (require.main === module) {
  exportData(format).catch(err => {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
  });
}

module.exports = { exportData };
