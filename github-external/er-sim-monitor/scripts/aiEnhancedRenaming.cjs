#!/usr/bin/env node

/**
 * AI-Enhanced Case_ID Renaming Tool
 *
 * Uses OpenAI API to deeply research each case and discover:
 * - Hidden clinical pearls (like inferior MI nitro contraindication)
 * - Organizational priorities (what residencies/boards value)
 * - Optimal learning sequences (what must be taught first)
 *
 * Combines AI research with manual priority scoring for best results.
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
require('dotenv').config();

const { classifyScenario } = require('./lib/diagnosisClassifier.cjs');
const { calculateComplexity, getComplexityLabel } = require('./lib/complexityScorer.cjs');
const { calculateFinalSequenceScore } = require('./lib/learningPriorityScorer.cjs');
const { generatePathwayName, generatePathwayMetadata, groupByPathway } = require('./lib/pathwayNamer.cjs');
const { initializeOpenAI: initAIPriority, researchCasePriority, researchPathwaySequence, batchResearchCases, compareWithManualScoring } = require('./lib/aiPriorityResearcher.cjs');
const { initializeOpenAI: initAIMarketing, batchGeneratePathwayNames, generateMarketingPackage } = require('./lib/marketingGeniusNamer.cjs');
const { initializeOpenAI: initAIOverviews, batchGenerateOverviews, previewOverviews } = require('./lib/caseOverviewGenerator.cjs');

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
  const dataRows = rows.slice(2);

  console.log('✅ Read ' + dataRows.length + ' scenarios');
  console.log('');

  const scenarios = dataRows.map((row, idx) => ({
    rowNum: idx + 3,
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

async function aiEnhancedAnalysis(scenarios, mode = 'hybrid') {
  console.log('🔬 AI-ENHANCED ANALYSIS MODE');
  console.log('════════════════════════════════════════════════════');
  console.log('');
  console.log('Mode: ' + mode);
  console.log('  - "ai-only": Use only AI research (slower, most accurate)');
  console.log('  - "hybrid": AI + manual scoring (recommended)');
  console.log('  - "compare": Compare AI vs manual (research mode)');
  console.log('');

  const enrichedScenarios = [];

  if (mode === 'ai-only' || mode === 'hybrid' || mode === 'compare') {
    // Run AI research on all cases
    console.log('🧠 Starting AI research (this will take ~5-10 minutes)...');
    console.log('');

    const researched = await batchResearchCases(scenarios, {
      rateLimit: 50, // 50 requests per minute
      batchSize: 10,
      onProgress: (progress) => {
        if (progress.current % 10 === 0) {
          console.log('   Researched ' + progress.current + '/' + progress.total + ' cases...');
        }
      }
    });

    console.log('✅ AI research complete!');
    console.log('');

    // Enrich scenarios with AI + manual data
    for (const scenario of researched) {
      const classification = classifyScenario(scenario);
      const complexity = calculateComplexity(scenario);
      const manualSequencing = calculateFinalSequenceScore(scenario);
      const aiResearch = scenario.aiResearch;

      let finalPriority, finalPriorityLabel, finalRationales;

      if (mode === 'ai-only') {
        // Use AI priority only
        finalPriority = aiResearch.priority || 5;
        finalPriorityLabel = aiResearch.priorityLabel || 'Standard Priority';
        finalRationales = [aiResearch.criticalPearl || 'No critical pearl identified'];
      } else if (mode === 'hybrid') {
        // Hybrid: Use AI priority if higher than manual (trust AI to find hidden gems)
        if (aiResearch.priority > manualSequencing.priority) {
          finalPriority = aiResearch.priority;
          finalPriorityLabel = aiResearch.priorityLabel;
          finalRationales = [
            '🧠 AI-Enhanced: ' + aiResearch.criticalPearl,
            'Manual: ' + (manualSequencing.rationales?.[0] || 'Standard')
          ];
        } else {
          finalPriority = manualSequencing.priority;
          finalPriorityLabel = manualSequencing.priorityLabel;
          finalRationales = manualSequencing.rationales;
        }
      } else {
        // Compare mode: Keep both for analysis
        finalPriority = manualSequencing.priority;
        finalPriorityLabel = manualSequencing.priorityLabel;
        finalRationales = manualSequencing.rationales;
      }

      const enrichedScenario = {
        ...scenario,
        ...classification,
        complexity: complexity.score,
        complexityLabel: getComplexityLabel(complexity.score),
        priority: finalPriority,
        priorityLabel: finalPriorityLabel,
        priorityRationales: finalRationales,
        isCriticalPearl: finalPriority >= 9,
        isFoundational: finalPriority === 10,
        aiResearch: aiResearch,
        manualPriority: manualSequencing.priority,
        prioritySource: mode === 'ai-only' ? 'ai' :
                        mode === 'hybrid' && aiResearch.priority > manualSequencing.priority ? 'ai-enhanced' : 'manual'
      };

      enrichedScenario.pathwayName = generatePathwayName(enrichedScenario);
      enrichedScenarios.push(enrichedScenario);
    }
  }

  return enrichedScenarios;
}

function sortByAiPriority(scenarios) {
  return scenarios.sort((a, b) => {
    // Primary: Priority DESC
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }
    // Secondary: Complexity ASC
    return a.complexity - b.complexity;
  });
}

function groupBySystem(scenarios) {
  const groups = {};

  for (const scenario of scenarios) {
    const groupKey = scenario.system;
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(scenario);
  }

  // Sort each group
  for (const group of Object.values(groups)) {
    sortByAiPriority(group);
  }

  return groups;
}

function generateIdSuggestions(groups) {
  console.log('💡 Generating Case_ID suggestions (AI-enhanced priorities)...');
  console.log('');

  const suggestions = [];
  const usedIds = new Set();

  for (const [system, scenarios] of Object.entries(groups)) {
    console.log('  ' + system + ': ' + scenarios.length + ' scenarios');

    let nextNumber = 1;

    for (const scenario of scenarios) {
      let suggestedId;

      if (scenario.isPediatric) {
        const numStr = nextNumber.toString().padStart(2, '0');
        suggestedId = scenario.prefix + numStr;
      } else {
        const numStr = nextNumber.toString().padStart(4, '0');
        suggestedId = scenario.prefix + numStr;
      }

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

      const criticalPearl = scenario.aiResearch?.criticalPearl || '';
      const prioritySource = scenario.prioritySource === 'ai-enhanced' ? ' 🧠 AI-Enhanced' : '';

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
        priorityLabel: scenario.priorityLabel + prioritySource,
        priorityRationales: scenario.priorityRationales,
        criticalPearl: criticalPearl,
        isCriticalPearl: scenario.isCriticalPearl,
        isFoundational: scenario.isFoundational,
        isPediatric: scenario.isPediatric,
        aiResearch: scenario.aiResearch,
        rationale: system + ' case #' + nextNumber + prioritySource +
                   ', pathway: "' + scenario.pathwayName +
                   '", priority: ' + scenario.priority + '/10 (' + scenario.priorityLabel + ')' +
                   ', complexity: ' + scenario.complexityLabel + ' (' + scenario.complexity + '/15)'
      });

      nextNumber++;
    }
  }

  console.log('✅ Generated ' + suggestions.length + ' suggestions');
  console.log('');

  return suggestions;
}

function showAiEnhancedSummary(suggestions) {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  AI-ENHANCED RENAMING SUMMARY');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  // Count AI enhancements
  const aiEnhanced = suggestions.filter(s => s.priorityLabel.includes('🧠')).length;
  const foundational = suggestions.filter(s => s.isFoundational).length;
  const criticalPearls = suggestions.filter(s => s.criticalPearl).length;

  console.log('📊 AI Research Impact:');
  console.log('   🧠 AI-enhanced priorities: ' + aiEnhanced + ' cases');
  console.log('   🏆 Foundational cases (priority 10): ' + foundational + ' cases');
  console.log('   💎 Critical clinical pearls discovered: ' + criticalPearls + ' cases');
  console.log('');

  // Group by system
  const bySystem = {};
  for (const sug of suggestions) {
    if (!bySystem[sug.system]) {
      bySystem[sug.system] = [];
    }
    bySystem[sug.system].push(sug);
  }

  console.log('📚 By System:');
  for (const [system, sysSuggestions] of Object.entries(bySystem).sort()) {
    const firstNew = sysSuggestions[0].newId;
    const lastNew = sysSuggestions[sysSuggestions.length - 1].newId;
    console.log('   ' + system + ': ' + sysSuggestions.length + ' scenarios (' + firstNew + ' → ' + lastNew + ')');
  }
  console.log('');

  console.log('💎 Top 5 AI-Discovered Critical Pearls:');
  const withPearls = suggestions.filter(s => s.criticalPearl).slice(0, 5);
  for (let i = 0; i < withPearls.length; i++) {
    const sug = withPearls[i];
    console.log('   ' + (i + 1) + '. ' + sug.newId + ': ' + sug.revealTitle.substring(0, 40) + '...');
    console.log('      💎 ' + sug.criticalPearl.substring(0, 80) + '...');
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
  console.log('💾 Applying AI-enhanced renames to Output sheet...');
  console.log('');

  // Build update batch
  const updates = [];

  for (const sug of suggestions) {
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

  // Save comprehensive mapping
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
    criticalPearl: s.criticalPearl,
    isCriticalPearl: s.isCriticalPearl,
    isFoundational: s.isFoundational,
    aiResearch: s.aiResearch ? {
      priority: s.aiResearch.priority,
      criticalPearl: s.aiResearch.criticalPearl,
      commonMistakes: s.aiResearch.commonMistakes,
      sequenceReasoning: s.aiResearch.sequenceReasoning,
      hiddenValue: s.aiResearch.hiddenValue,
      confidence: s.aiResearch.confidence
    } : null,
    revealTitle: s.revealTitle
  }));

  const mappingPath = path.join(__dirname, '..', 'AI_ENHANCED_CASE_ID_MAPPING.json');
  fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));

  console.log('📄 AI-enhanced mapping saved: AI_ENHANCED_CASE_ID_MAPPING.json');
  console.log('');

  // Generate pathway metadata with base information
  const pathways = groupByPathway(suggestions);
  const pathwayMetadata = {};

  for (const [pathwayName, pathwayScenarios] of Object.entries(pathways)) {
    pathwayMetadata[pathwayName] = generatePathwayMetadata(pathwayName, pathwayScenarios);
  }

  console.log('📚 Generating marketing-optimized pathway names...');
  console.log('   Channeling Frank Kern & Alex Hormozi...');
  console.log('');

  // Generate marketing genius names for each pathway
  const pathwayDataForMarketing = {};
  for (const [pathwayName, pathwayScenarios] of Object.entries(pathways)) {
    // Extract clinical pearls from AI research
    const clinicalPearls = pathwayScenarios
      .filter(s => s.aiResearch && s.aiResearch.criticalPearl)
      .map(s => s.aiResearch.criticalPearl)
      .slice(0, 5);

    // Aggregate organizational priorities
    const orgPriorities = {
      litigationRisk: 'High',
      hcahpsImpact: 'Medium',
      costImpact: 'High',
      safetyImpact: 'High'
    };

    pathwayDataForMarketing[pathwayName] = {
      systemName: pathwayScenarios[0]?.system || 'Emergency Medicine',
      scenarios: pathwayScenarios,
      clinicalPearls: clinicalPearls,
      organizationalPriorities: orgPriorities
    };
  }

  const marketingNames = await batchGeneratePathwayNames(pathwayDataForMarketing, {
    rateLimit: 50,
    onProgress: (progress) => {
      // Progress logged by batch function
    }
  });

  // Enhance pathway metadata with marketing names
  for (const [pathwayKey, marketingData] of Object.entries(marketingNames)) {
    if (pathwayMetadata[pathwayKey]) {
      pathwayMetadata[pathwayKey].marketingName = marketingData.recommendedName;
      pathwayMetadata[pathwayKey].frankKernName = marketingData.frankKernName;
      pathwayMetadata[pathwayKey].alexHormoziName = marketingData.alexHormoziName;
      pathwayMetadata[pathwayKey].tagline = marketingData.tagline;
      pathwayMetadata[pathwayKey].marketingPitch = marketingData.marketingPitch;
      pathwayMetadata[pathwayKey].targetPainPoint = marketingData.targetPainPoint;
      pathwayMetadata[pathwayKey].targetDesiredOutcome = marketingData.targetDesiredOutcome;
      pathwayMetadata[pathwayKey].marketingPackage = generateMarketingPackage(marketingData, pathwayDataForMarketing[pathwayKey]);
    }
  }

  const pathwayPath = path.join(__dirname, '..', 'AI_ENHANCED_PATHWAY_METADATA.json');
  fs.writeFileSync(pathwayPath, JSON.stringify(pathwayMetadata, null, 2));

  console.log('✅ AI-enhanced pathway metadata saved: AI_ENHANCED_PATHWAY_METADATA.json');
  console.log('   ' + Object.keys(pathwayMetadata).length + ' unique pathways created');
  console.log('   🎯 Marketing genius names generated by Frank Kern & Alex Hormozi AI');
  console.log('');

  // Show marketing name preview
  console.log('🎯 MARKETING GENIUS PATHWAY NAMES:');
  console.log('');
  let previewCount = 0;
  for (const [pathwayKey, metadata] of Object.entries(pathwayMetadata)) {
    if (previewCount < 5 && metadata.marketingName) {
      console.log('   Original: "' + pathwayKey + '"');
      console.log('   🔥 Frank Kern: "' + metadata.frankKernName + '"');
      console.log('   💎 Alex Hormozi: "' + metadata.alexHormoziName + '"');
      console.log('   ⭐ RECOMMENDED: "' + metadata.marketingName + '"');
      console.log('   📣 Tagline: ' + metadata.tagline);
      console.log('');
      previewCount++;
    }
  }
  if (Object.keys(pathwayMetadata).length > 5) {
    console.log('   (See AI_ENHANCED_PATHWAY_METADATA.json for all ' + Object.keys(pathwayMetadata).length + ' pathways)');
    console.log('');
  }

  // NEW: Generate case overviews (pre-sim + post-sim)
  console.log('═══════════════════════════════════════════════════');
  console.log('📝 GENERATING CASE OVERVIEWS');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('Creating AI-powered case overviews:');
  console.log('  1. PRE-SIM: Sells the case value WITHOUT spoiling mystery');
  console.log('  2. POST-SIM: Reinforces learning with key takeaways');
  console.log('');

  const caseOverviews = await batchGenerateOverviews(suggestions, {
    rateLimit: 25, // Lower rate (2 requests per case = pre + post)
    onProgress: (progress) => {
      // Progress logged by batch function
    }
  });

  // Save case overviews
  const overviewsPath = path.join(__dirname, '..', 'AI_CASE_OVERVIEWS.json');
  fs.writeFileSync(overviewsPath, JSON.stringify(caseOverviews, null, 2));

  console.log('✅ Case overviews saved: AI_CASE_OVERVIEWS.json');
  console.log('   ' + caseOverviews.length + ' cases with pre-sim + post-sim overviews');
  console.log('');

  // Preview one case overview
  if (caseOverviews.length > 0) {
    console.log('📖 PREVIEW: First case overview');
    console.log('');
    previewOverviews(caseOverviews[0]);
  }
}

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  🧠 AI-ENHANCED CASE_ID RENAMING TOOL');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('Uses OpenAI API to discover hidden clinical pearls');
  console.log('and organizational priorities for optimal sequencing.');
  console.log('');

  try {
    // Step 1: Read scenarios
    const { scenarios, sheets, auth } = await readAllScenarios();

    // Step 2: Initialize OpenAI from settings sheet (or fallback to .env)
    console.log('🔑 Initializing OpenAI API...');
    try {
      const openaiClient = await initAIPriority(sheets, SHEET_ID);
      initAIMarketing(openaiClient); // Share client with marketing namer
      initAIOverviews(openaiClient); // Share client with overview generator
      console.log('');
    } catch (error) {
      console.error('❌ ERROR: ' + error.message);
      console.error('');
      console.error('Please add your OpenAI API key to either:');
      console.error('  1. Google Sheets "settings" tab, cell B2 (RECOMMENDED)');
      console.error('  2. .env file: OPENAI_API_KEY=sk-...');
      console.error('');
      process.exit(1);
    }

    // Step 3: Choose mode
    console.log('Select AI research mode:');
    console.log('  1. hybrid (recommended) - AI + manual, best of both');
    console.log('  2. ai-only - Pure AI research (slower, most thorough)');
    console.log('  3. compare - Research mode (compare AI vs manual)');
    console.log('');

    const modeAnswer = await promptUser('Mode [1/2/3 or enter for hybrid]: ');
    const mode = modeAnswer === '2' ? 'ai-only' :
                 modeAnswer === '3' ? 'compare' : 'hybrid';

    // Step 4: AI-enhanced analysis
    const enriched = await aiEnhancedAnalysis(scenarios, mode);

    // Step 5: Group by system
    const groups = groupBySystem(enriched);

    // Step 6: Generate suggestions
    const suggestions = generateIdSuggestions(groups);

    // Step 7: Show summary
    showAiEnhancedSummary(suggestions);

    // Step 8: Prompt user
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    const answer = await promptUser('Apply these AI-enhanced renames? [yes/no/preview]: ');

    if (answer === 'yes' || answer === 'y') {
      await applyRenames(suggestions, sheets, auth);

      console.log('═══════════════════════════════════════════════════');
      console.log('✅ AI-ENHANCED RENAMING COMPLETE!');
      console.log('═══════════════════════════════════════════════════');
      console.log('');
      console.log('Summary:');
      console.log('  ✅ Renamed ' + suggestions.length + ' scenarios');
      console.log('  🧠 AI discovered ' + suggestions.filter(s => s.criticalPearl).length + ' critical pearls');
      console.log('  🏆 ' + suggestions.filter(s => s.isFoundational).length + ' foundational cases');
      console.log('  📚 ' + Object.keys(groups).length + ' pathways created');
      console.log('');
      console.log('Files created:');
      console.log('  - AI_ENHANCED_CASE_ID_MAPPING.json (complete research data)');
      console.log('  - AI_ENHANCED_PATHWAY_METADATA.json (marketing-ready pathways)');
      console.log('');
    } else if (answer === 'preview' || answer === 'p') {
      console.log('');
      console.log('📋 PREVIEW MODE - First 10 AI-enhanced renames:');
      console.log('');

      for (let i = 0; i < Math.min(10, suggestions.length); i++) {
        const sug = suggestions[i];
        console.log('[' + (i + 1) + '] Row ' + sug.rowNum);
        console.log('    Old: ' + sug.oldId + ' → New: ' + sug.newId);
        console.log('    Title: ' + sug.revealTitle.substring(0, 60) + '...');
        console.log('    📚 Pathway: "' + sug.pathwayName + '"');
        console.log('    Priority: ' + sug.priority + '/10 ' + sug.priorityLabel);

        if (sug.criticalPearl) {
          console.log('    💎 CRITICAL PEARL:');
          console.log('       ' + sug.criticalPearl.substring(0, 100) + '...');
        }

        if (sug.aiResearch?.hiddenValue) {
          console.log('    🌟 Hidden Value: ' + sug.aiResearch.hiddenValue.substring(0, 80) + '...');
        }
        console.log('');
      }

      console.log('(Showing 10/' + suggestions.length + ' total renames)');
      console.log('');
      console.log('Run again with "yes" to apply changes.');
    } else {
      console.log('');
      console.log('❌ Cancelled by user');
      console.log('');
    }

  } catch (error) {
    console.error('');
    console.error('❌ AI-ENHANCED RENAMING FAILED');
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

module.exports = { aiEnhancedAnalysis, generateIdSuggestions };
