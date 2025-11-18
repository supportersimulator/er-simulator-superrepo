#!/usr/bin/env node

/**
 * Phase 2: Smart Case_ID Renaming Tool
 *
 * Analyzes all scenarios and generates intelligent Case_ID suggestions
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
require('dotenv').config();

const { classifyScenario } = require('./lib/diagnosisClassifier.cjs');
const { calculateComplexity, getComplexityLabel } = require('./lib/complexityScorer.cjs');
const { calculateFinalSequenceScore, sortByLearningSequence } = require('./lib/learningPriorityScorer.cjs');
const { generatePathwayName, generatePathwayMetadata, groupByPathway } = require('./lib/pathwayNamer.cjs');

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

function createGoogleClient() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oauth2Client.setCredentials(token);
  return oauth2Client;
}

async function readAllScenarios() {
  console.log('📖 Reading all scenarios from Output sheet...');

  const auth = createGoogleClient();
  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Master Scenario Convert!A1:J250'
  });

  const rows = response.data.values || [];
  const humanLabels = rows[0] || [];
  const flattenedHeaders = rows[1] || [];
  const dataRows = rows.slice(2);

  console.log('✅ Read ' + dataRows.length + ' scenarios');
  console.log('');

  // Parse scenarios
  const scenarios = dataRows.map((row, idx) => ({
    rowNum: idx + 3, // Actual row in sheet (1-indexed + 2 header rows)
    currentCaseId: row[0] || '',
    sparkTitle: row[1] || '',
    revealTitle: row[2] || '',
    caseSeries: row[3] || '',
    seriesOrder: row[4] || '',
    pathwayName: row[5] || '',
    fullRow: row
  }));

  return { scenarios, sheets, auth };
}

function analyzeAndGroup(scenarios) {
  console.log('🔍 Analyzing scenarios...');
  console.log('');

  const groups = {};

  for (const scenario of scenarios) {
    // Classify system
    const classification = classifyScenario(scenario);
    const complexity = calculateComplexity(scenario);
    const sequencing = calculateFinalSequenceScore(scenario);

    const enrichedScenario = {
      ...scenario,
      ...classification,
      complexity: complexity.score,
      complexityLabel: getComplexityLabel(complexity.score),
      complexityDetails: complexity,
      priority: sequencing.priority,
      priorityLabel: sequencing.priorityLabel,
      priorityRationales: sequencing.rationales,
      isCriticalPearl: sequencing.isCriticalPearl,
      isFoundational: sequencing.isFoundational,
      sequenceScore: sequencing.sequenceScore,
      sortPrimary: sequencing.sortPrimary,
      sortSecondary: sequencing.sortSecondary
    };

    // Add pathway name
    enrichedScenario.pathwayName = generatePathwayName(enrichedScenario);

    // Group by system
    const groupKey = classification.system;
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }

    groups[groupKey].push(enrichedScenario);
  }

  // Sort each group by PRIORITY first (DESC), then COMPLEXITY (ASC)
  for (const group of Object.values(groups)) {
    const sorted = sortByLearningSequence(group);
    // Replace group contents with sorted version
    group.length = 0;
    group.push(...sorted);
  }

  console.log('✅ Grouped into ' + Object.keys(groups).length + ' systems/categories');
  console.log('✅ Sorted by Learning Priority (high→low), then Complexity (simple→complex)');
  console.log('');

  return groups;
}

function generateIdSuggestions(groups) {
  console.log('💡 Generating Case_ID suggestions...');
  console.log('');

  const suggestions = [];
  const usedIds = new Set();

  for (const [system, scenarios] of Object.entries(groups)) {
    console.log('  ' + system + ': ' + scenarios.length + ' scenarios');

    // Track next available number for this system
    let nextNumber = 1;

    for (const scenario of scenarios) {
      let suggestedId;

      if (scenario.isPediatric) {
        // Pediatric: PEDSYSNN (8 chars, 2-digit number)
        const numStr = nextNumber.toString().padStart(2, '0');
        suggestedId = scenario.prefix + numStr;
      } else {
        // Adult: SYSNNNN (7 chars, 4-digit number)
        const numStr = nextNumber.toString().padStart(4, '0');
        suggestedId = scenario.prefix + numStr;
      }

      // Ensure unique (in case of collisions)
      while (usedIds.has(suggestedId)) {
        nextNumber++;
        if (scenario.isPediatric) {
          const numStr = nextNumber.toString().padStart(2, '0');
          suggestedId = scenario.prefix + numStr;
        } else {
          const numStr = nextNumber.toString().padStart(4, '0');
          suggestedId = scenario.prefix + numStr;
        }
      }

      usedIds.add(suggestedId);

      suggestions.push({
        rowNum: scenario.rowNum,
        oldId: scenario.currentCaseId,
        newId: suggestedId,
        system,
        pathwayName: scenario.pathwayName,
        sparkTitle: scenario.sparkTitle,
        revealTitle: scenario.revealTitle,
        complexity: scenario.complexity,
        complexityLabel: scenario.complexityLabel,
        priority: scenario.priority,
        priorityLabel: scenario.priorityLabel,
        priorityRationales: scenario.priorityRationales,
        isCriticalPearl: scenario.isCriticalPearl,
        isFoundational: scenario.isFoundational,
        isPediatric: scenario.isPediatric,
        rationale: system + ' case #' + nextNumber + ', pathway: "' + scenario.pathwayName + '", priority: ' + scenario.priority + '/10 (' + scenario.priorityLabel + '), complexity: ' + scenario.complexityLabel + ' (' + scenario.complexity + '/15)'
      });

      nextNumber++;
    }
  }

  console.log('✅ Generated ' + suggestions.length + ' suggestions');
  console.log('');

  return suggestions;
}

function showSummary(suggestions) {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  RENAMING SUMMARY');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  // Group by system
  const bySystem = {};
  for (const sug of suggestions) {
    if (!bySystem[sug.system]) {
      bySystem[sug.system] = [];
    }
    bySystem[sug.system].push(sug);
  }

  for (const [system, sysSuggestions] of Object.entries(bySystem).sort()) {
    console.log(system + ': ' + sysSuggestions.length + ' scenarios');

    // Count duplicates that will be fixed
    const oldIds = sysSuggestions.map(s => s.oldId);
    const duplicateOldIds = oldIds.filter((id, idx) => oldIds.indexOf(id) !== idx);
    const uniqueDuplicates = [...new Set(duplicateOldIds)];

    if (uniqueDuplicates.length > 0) {
      console.log('  Will fix ' + uniqueDuplicates.length + ' duplicate IDs');
    }

    // Show range
    const firstNew = sysSuggestions[0].newId;
    const lastNew = sysSuggestions[sysSuggestions.length - 1].newId;
    console.log('  New ID range: ' + firstNew + ' → ' + lastNew);
    console.log('');
  }

  console.log('Examples (first 5):');
  for (let i = 0; i < Math.min(5, suggestions.length); i++) {
    const sug = suggestions[i];
    console.log('  Row ' + sug.rowNum + ': ' + sug.oldId + ' → ' + sug.newId);
    console.log('    ' + sug.revealTitle.substring(0, 60) + '...');
    console.log('    📚 Pathway: "' + sug.pathwayName + '"');
    console.log('    Priority: ' + sug.priority + '/10 (' + sug.priorityLabel + ')');
    console.log('    Complexity: ' + sug.complexityLabel + ' (' + sug.complexity + '/15)');
    if (sug.isFoundational) {
      console.log('    🏆 FOUNDATIONAL - Teach First!');
    } else if (sug.isCriticalPearl) {
      console.log('    ⭐ Critical Teaching Point');
    }
    console.log('');
  }
}

async function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function applyRenames(suggestions, sheets, auth) {
  console.log('');
  console.log('💾 Applying renames to Output sheet...');
  console.log('');

  // Build update batch
  const updates = [];

  for (const sug of suggestions) {
    // Update Case_ID (Column A, Row N)
    updates.push({
      range: 'Master Scenario Convert!A' + sug.rowNum,
      values: [[sug.newId]]
    });
  }

  console.log('Updating ' + updates.length + ' rows...');

  // Apply in batches of 100
  const batchSize = 100;
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        data: batch,
        valueInputOption: 'RAW'
      }
    });

    console.log('  Updated ' + Math.min(i + batchSize, updates.length) + '/' + updates.length + ' rows...');
  }

  console.log('✅ All renames applied!');
  console.log('');

  // Save mapping for reference
  const mapping = suggestions.map(s => ({
    rowNum: s.rowNum,
    oldId: s.oldId,
    newId: s.newId,
    system: s.system,
    pathwayName: s.pathwayName,
    priority: s.priority,
    priorityLabel: s.priorityLabel,
    complexity: s.complexity,
    complexityLabel: s.complexityLabel,
    isCriticalPearl: s.isCriticalPearl,
    isFoundational: s.isFoundational,
    revealTitle: s.revealTitle
  }));

  const mappingPath = path.join(__dirname, '..', 'CASE_ID_RENAMING_MAPPING.json');
  fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));

  console.log('📄 Mapping saved: CASE_ID_RENAMING_MAPPING.json');
  console.log('');

  // Generate pathway metadata report
  const pathways = groupByPathway(suggestions);
  const pathwayMetadata = {};

  for (const [pathwayName, pathwayScenarios] of Object.entries(pathways)) {
    pathwayMetadata[pathwayName] = generatePathwayMetadata(pathwayName, pathwayScenarios);
  }

  const pathwayPath = path.join(__dirname, '..', 'PATHWAY_METADATA.json');
  fs.writeFileSync(pathwayPath, JSON.stringify(pathwayMetadata, null, 2));

  console.log('📚 Pathway metadata saved: PATHWAY_METADATA.json');
  console.log('   ' + Object.keys(pathwayMetadata).length + ' unique pathways created');
  console.log('');
}

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  PHASE 2: SMART CASE_ID RENAMING TOOL');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  try {
    // Step 1: Read all scenarios
    const { scenarios, sheets, auth } = await readAllScenarios();

    // Step 2: Analyze and group
    const groups = analyzeAndGroup(scenarios);

    // Step 3: Generate suggestions
    const suggestions = generateIdSuggestions(groups);

    // Step 4: Show summary
    showSummary(suggestions);

    // Step 5: Prompt user
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    const answer = await promptUser('Apply these renames? [yes/no/preview]: ');

    if (answer === 'yes' || answer === 'y') {
      await applyRenames(suggestions, sheets, auth);

      console.log('═══════════════════════════════════════════════════');
      console.log('✅ RENAMING COMPLETE!');
      console.log('═══════════════════════════════════════════════════');
      console.log('');
      console.log('Summary:');
      console.log('  ✅ Renamed ' + suggestions.length + ' scenarios');
      console.log('  ✅ All Case_IDs now unique');
      console.log('  ✅ Grouped by ' + Object.keys(groups).length + ' systems');
      console.log('  ✅ Sequenced by Learning Priority (high→low), then Complexity (simple→complex)');

      // Count foundational cases
      const foundationalCount = suggestions.filter(s => s.isFoundational).length;
      const criticalCount = suggestions.filter(s => s.isCriticalPearl).length;
      if (foundationalCount > 0) {
        console.log('  🏆 ' + foundationalCount + ' Foundational cases (priority 10) - Teach First!');
      }
      if (criticalCount > 0) {
        console.log('  ⭐ ' + criticalCount + ' Critical teaching points (priority 9+)');
      }
      console.log('');
    } else if (answer === 'preview' || answer === 'p') {
      console.log('');
      console.log('📋 PREVIEW MODE - Showing first 20 renames:');
      console.log('');

      for (let i = 0; i < Math.min(20, suggestions.length); i++) {
        const sug = suggestions[i];
        console.log('[' + (i + 1) + '] Row ' + sug.rowNum);
        console.log('    Old: ' + sug.oldId);
        console.log('    New: ' + sug.newId);
        console.log('    Title: ' + sug.revealTitle.substring(0, 60) + '...');
        console.log('    ' + sug.rationale);
        if (sug.priorityRationales && sug.priorityRationales.length > 0) {
          console.log('    Why Priority ' + sug.priority + ': ' + sug.priorityRationales[0].substring(0, 70) + '...');
        }
        console.log('');
      }

      console.log('(Showing 20/' + suggestions.length + ' total renames)');
      console.log('');
      console.log('Run again with "yes" to apply changes.');
    } else {
      console.log('');
      console.log('❌ Cancelled by user');
      console.log('   No changes made to Output sheet');
      console.log('');
    }

  } catch (error) {
    console.error('');
    console.error('❌ RENAMING FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { analyzeAndGroup, generateIdSuggestions };
