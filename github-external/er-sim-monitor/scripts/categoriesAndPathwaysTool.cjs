#!/usr/bin/env node

/**
 * Categories & Pathways Tool with AI Counsel
 *
 * Interactive menu system for organizing cases by medical system categories
 * and learning pathways with AI guidance.
 *
 * Features:
 * - View cases by medical system category (CARD, RESP, NEUR, GAST, etc.)
 * - View/edit pathway case sequences (drag-and-drop style reordering)
 * - Generate alternative pathway names (like spark/diagnosis title generator)
 * - Get AI reasoning for case placement in different pathways
 * - Move cases between pathways and categories with intelligent sequencing
 * - Refine naming conventions (avoid "bulletproof"/"lawsuit" unless relevant)
 *
 * Categories (Medical Systems):
 * - CARD (Cardiac), RESP (Respiratory), NEUR (Neurological)
 * - GAST (Gastrointestinal), RENA (Renal), ENDO (Endocrine)
 * - HEME (Hematology), MUSC (Musculoskeletal), DERM (Dermatology)
 * - INFD (Infectious Disease), IMMU (Immunology), OBST (Obstetrics)
 * - GYNE (Gynecology), TRAU (Trauma), TOXI (Toxicology)
 * - PSYC (Psychiatry), ENVI (Environmental), MULT (Multisystem)
 *
 * Pathways (Learning Sequences):
 * - Educational progressions within or across categories
 * - Foundational → Advanced sequencing
 *
 * Philosophy:
 * - Use "Mastery" only for foundational/basics-focused pathways
 * - Avoid legal/tactical language unless clinically relevant
 * - Prioritize medical accuracy and learning progression
 */

const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
require('dotenv').config();

const PATHWAY_METADATA_PATH = path.join(__dirname, '..', 'AI_ENHANCED_PATHWAY_METADATA.json');
const CASE_MAPPING_PATH = path.join(__dirname, '..', 'AI_ENHANCED_CASE_ID_MAPPING.json');

let openaiClient = null;

function initializeOpenAI() {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openaiClient;
}

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

function askQuestion(rl, question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer.trim());
    });
  });
}

/**
 * Generate multiple alternative pathway names (like spark/diagnosis title generator)
 */
async function generatePathwayNameOptions(pathwayData, count = 10) {
  const client = initializeOpenAI();

  const prompt = `You are an expert emergency medicine educator creating pathway names for simulation training.

**PATHWAY DATA:**
- Current Name: ${pathwayData.name}
- Scenario Count: ${pathwayData.scenarioCount} cases
- Average Priority: ${pathwayData.avgPriority}/10
- Average Complexity: ${pathwayData.avgComplexity}/5
- Foundational Cases: ${pathwayData.foundationalCases}
- Tier: ${pathwayData.tier}
- First Case: ${pathwayData.firstCaseId}
- Last Case: ${pathwayData.lastCaseId}

**NAMING GUIDELINES:**

✅ **DO:**
- Use "Mastery" ONLY if pathway focuses on foundational basics (many foundational cases)
- Use clinical/educational language (Foundations, Essentials, Core Skills, Proficiency)
- Be specific to medical system (Cardiac, Neuro, Airway, etc.)
- Emphasize learning progression (Basics to Advanced, Step-by-Step)
- Use terms like Excellence, Proficiency, Expertise, Command, Precision

❌ **DON'T:**
- Use "Bulletproof" or "Lawsuit" unless case involves legal medicine or gunshot wounds
- Use tactical/military language ("Zero-Lawsuit", "Trauma-Proof") unless trauma-specific
- Overuse "Mastery" for advanced pathways (reserve for basics)
- Use fear-based marketing (litigation focus)
- Use generic corporate buzzwords

**EXAMPLES OF GOOD NAMES:**
- "Cardiac Foundations" (for basics)
- "Advanced Airway Mastery" (foundational skills)
- "Stroke Recognition Excellence" (clinical focus)
- "Sepsis Response Proficiency" (action-oriented)
- "Neurological Assessment Essentials" (educational)

**EXAMPLES OF BAD NAMES:**
- "Bulletproof Cardiac Excellence" (unless about penetrating trauma)
- "Zero-Lawsuit Neuro Mastery" (fear-based, not educational)
- "Trauma-Proof ER Triumph" (overly tactical)
- "Litigation Shield: Airway Edition" (legal focus inappropriate)

Generate exactly ${count} alternative pathway names that follow these guidelines.

Return ONLY valid JSON in this format:
{
  "options": [
    {
      "name": "Pathway Name 1",
      "rationale": "Brief explanation of why this name fits (1 sentence)",
      "tier": "foundational" or "advanced",
      "focusArea": "What this name emphasizes"
    },
    ...
  ]
}`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.9, // High creativity for diverse options
    max_tokens: 2000
  });

  const content = response.choices[0].message.content.trim();

  // Extract JSON (handle markdown code fences)
  let jsonContent = content;
  if (content.startsWith('```')) {
    jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  }

  return JSON.parse(jsonContent);
}

/**
 * Analyze case fit for alternative pathways with AI reasoning
 */
async function analyzeCasePathwayFit(caseData, currentPathway, allPathways) {
  const client = initializeOpenAI();

  const pathwayNames = Object.keys(allPathways).filter(p => p !== currentPathway);

  const prompt = `You are an expert emergency medicine educator analyzing case placement in learning pathways.

**CASE DATA:**
- Case ID: ${caseData.caseId}
- Reveal Title: ${caseData.revealTitle}
- Learning Priority: ${caseData.learningPriority}/10
- Complexity: ${caseData.complexity}/5
- Current Pathway: ${currentPathway}

**AI RESEARCH SUMMARY:**
${caseData.aiResearch ? caseData.aiResearch.summary : 'N/A'}

**AVAILABLE ALTERNATIVE PATHWAYS:**
${pathwayNames.slice(0, 10).map((p, i) => `${i + 1}. ${p} (${allPathways[p].scenarioCount} cases, Avg Priority: ${allPathways[p].avgPriority})`).join('\n')}

Analyze which alternative pathways this case could fit into and WHY.

For each pathway, provide:
1. **Fit Score** (0-10): How well does this case belong?
2. **Reasoning**: Why it does or doesn't fit (clinical education perspective)
3. **Recommended Sequence Position**: Where in the pathway sequence (early, middle, late) and why
4. **Prerequisite Cases**: What should be learned first?

Return ONLY valid JSON in this format:
{
  "alternatives": [
    {
      "pathwayName": "Alternative Pathway Name",
      "fitScore": 8,
      "reasoning": "This case teaches X which builds on pathway's focus on Y...",
      "sequencePosition": "middle",
      "sequenceRationale": "Should follow basic cases but precede advanced complications",
      "prerequisiteConcepts": ["Concept 1", "Concept 2"]
    },
    ...
  ],
  "currentPathwayAnalysis": {
    "fitScore": 9,
    "reasoning": "Why current placement makes sense",
    "sequenceOptimal": true
  }
}`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3, // Lower for analytical reasoning
    max_tokens: 2500
  });

  const content = response.choices[0].message.content.trim();

  let jsonContent = content;
  if (content.startsWith('```')) {
    jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  }

  return JSON.parse(jsonContent);
}

/**
 * Get AI recommendation for optimal case sequence within pathway
 */
async function recommendCaseSequence(pathwayCases, pathwayName) {
  const client = initializeOpenAI();

  const caseList = pathwayCases.map(c => `- ${c.caseId}: ${c.revealTitle} (Priority: ${c.learningPriority}, Complexity: ${c.complexity})`).join('\n');

  const prompt = `You are an expert emergency medicine educator optimizing the learning sequence for a simulation pathway.

**PATHWAY:** ${pathwayName}
**CURRENT CASES (${pathwayCases.length}):**
${caseList}

Design the optimal learning sequence from basics to advanced.

Principles:
1. Start with foundational concepts (lower complexity, high priority)
2. Build progressively (prerequisites before dependent skills)
3. Group related clinical pearls together
4. End with complex synthesis cases

Return ONLY valid JSON:
{
  "recommendedSequence": [
    {
      "caseId": "CARD0001",
      "sequenceNumber": 1,
      "rationale": "Why this case should be first/here"
    },
    ...
  ],
  "sequencingPrinciple": "Overall strategy explanation"
}`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 3000
  });

  const content = response.choices[0].message.content.trim();

  let jsonContent = content;
  if (content.startsWith('```')) {
    jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  }

  return JSON.parse(jsonContent);
}

/**
 * Main menu
 */
async function mainMenu() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  📂 CATEGORIES & PATHWAYS TOOL');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('Interactive AI-powered case organization system');
  console.log('Manage medical system categories and learning pathways');
  console.log('');

  // Load data
  console.log('📖 Loading pathway and case data...');

  if (!fs.existsSync(PATHWAY_METADATA_PATH)) {
    console.error('❌ ERROR: AI_ENHANCED_PATHWAY_METADATA.json not found!');
    process.exit(1);
  }

  if (!fs.existsSync(CASE_MAPPING_PATH)) {
    console.error('❌ ERROR: AI_ENHANCED_CASE_ID_MAPPING.json not found!');
    process.exit(1);
  }

  const pathways = JSON.parse(fs.readFileSync(PATHWAY_METADATA_PATH, 'utf8'));
  const cases = JSON.parse(fs.readFileSync(CASE_MAPPING_PATH, 'utf8'));

  console.log(`   ✅ Loaded ${Object.keys(pathways).length} pathways`);
  console.log(`   ✅ Loaded ${cases.length} cases`);
  console.log('');

  // Build pathway → cases map
  const pathwayCasesMap = {};
  Object.keys(pathways).forEach(p => {
    pathwayCasesMap[p] = cases.filter(c => c.pathwayName === p);
  });

  // Build category (system) → cases map
  const categoryCasesMap = {};
  cases.forEach(c => {
    if (c.system) {
      if (!categoryCasesMap[c.system]) {
        categoryCasesMap[c.system] = [];
      }
      categoryCasesMap[c.system].push(c);
    }
  });

  const rl = createInterface();

  let running = true;

  while (running) {
    console.log('══════════════════════════════════════════════════════════════');
    console.log('📋 MAIN MENU');
    console.log('══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('📂 CATEGORY MANAGEMENT:');
    console.log('1. View Cases by Medical Category (CARD, RESP, NEUR, etc.)');
    console.log('2. Move Case to Different Category');
    console.log('');
    console.log('🧩 PATHWAY MANAGEMENT:');
    console.log('3. View/Edit Pathway Case Sequence');
    console.log('4. Generate Alternative Pathway Names');
    console.log('5. Analyze Case Fit for Alternative Pathways');
    console.log('6. Recommend Optimal Case Sequence (AI)');
    console.log('7. Move Case to Different Pathway');
    console.log('');
    console.log('💾 DATA MANAGEMENT:');
    console.log('8. Export Updated Pathway & Category Metadata');
    console.log('9. Exit');
    console.log('');

    const choice = await askQuestion(rl, 'Select option (1-9): ');

    switch (choice) {
      case '1':
        await viewCasesByCategory(rl, categoryCasesMap);
        break;
      case '2':
        await moveCaseCategory(rl, cases, categoryCasesMap);
        break;
      case '3':
        await viewEditPathwaySequence(rl, pathways, pathwayCasesMap);
        break;
      case '4':
        await generateAlternativeNames(rl, pathways);
        break;
      case '5':
        await analyzeCaseFit(rl, pathways, cases, pathwayCasesMap);
        break;
      case '6':
        await recommendSequence(rl, pathways, pathwayCasesMap);
        break;
      case '7':
        await moveCase(rl, pathways, cases, pathwayCasesMap);
        break;
      case '8':
        await exportMetadata(rl, pathways, cases);
        break;
      case '9':
        running = false;
        console.log('');
        console.log('✅ Exiting Categories & Pathways Tool');
        console.log('');
        break;
      default:
        console.log('❌ Invalid option');
    }
  }

  rl.close();
}

/**
 * View Cases by Medical Category
 */
async function viewCasesByCategory(rl, categoryCasesMap) {
  console.log('');
  console.log('─────────────────────────────────────────');
  console.log('📂 SELECT MEDICAL CATEGORY');
  console.log('─────────────────────────────────────────');
  console.log('');

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

  const categories = Object.keys(categoryCasesMap).sort();
  categories.forEach((cat, idx) => {
    const count = categoryCasesMap[cat].length;
    const label = CATEGORY_LABELS[cat] || cat;
    console.log(`${idx + 1}. ${cat} - ${label} (${count} cases)`);
  });
  console.log('');

  const choice = await askQuestion(rl, `Select category (1-${categories.length}) or 0 to cancel: `);

  if (choice === '0') return;

  const categoryIndex = parseInt(choice) - 1;
  if (categoryIndex < 0 || categoryIndex >= categories.length) {
    console.log('❌ Invalid selection');
    return;
  }

  const category = categories[categoryIndex];
  const categoryCases = categoryCasesMap[category] || [];
  const label = CATEGORY_LABELS[category] || category;

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log(`📂 CATEGORY: ${category} - ${label}`);
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log(`Total Cases: ${categoryCases.length}`);
  console.log('');
  console.log('Cases in this category:');
  console.log('');

  categoryCases.forEach((caseData, idx) => {
    console.log(`  ${idx + 1}. ${caseData.caseId} - ${caseData.revealTitle}`);
    console.log(`     Pathway: ${caseData.pathwayName}`);
    console.log(`     Priority: ${caseData.learningPriority}/10 | Complexity: ${caseData.complexity}/5`);
    console.log('');
  });

  console.log('💡 Note: Use "Move Case to Different Category" to reassign cases');
  console.log('');
}

/**
 * Move Case to Different Category
 */
async function moveCaseCategory(rl, cases, categoryCasesMap) {
  console.log('');
  console.log('─────────────────────────────────────────');
  console.log('🔄 MOVE CASE TO DIFFERENT CATEGORY');
  console.log('─────────────────────────────────────────');
  console.log('');

  const caseId = await askQuestion(rl, 'Enter Case ID to move (e.g., CARD0001): ');

  const caseData = cases.find(c => c.caseId === caseId || c.newId === caseId || c.oldId === caseId);

  if (!caseData) {
    console.log(`❌ Case ${caseId} not found`);
    return;
  }

  console.log('');
  console.log(`📋 Case: ${caseData.revealTitle}`);
  console.log(`   Current Category: ${caseData.system}`);
  console.log('');

  const AVAILABLE_CATEGORIES = [
    'CARD', 'RESP', 'NEUR', 'GAST', 'RENA', 'ENDO',
    'HEME', 'MUSC', 'DERM', 'INFD', 'IMMU', 'OBST',
    'GYNE', 'TRAU', 'TOXI', 'PSYC', 'ENVI', 'MULT'
  ];

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

  console.log('Available Categories:');
  console.log('');

  AVAILABLE_CATEGORIES.forEach((cat, idx) => {
    const label = CATEGORY_LABELS[cat];
    console.log(`${idx + 1}. ${cat} - ${label}`);
  });
  console.log('');

  const choice = await askQuestion(rl, `Select new category (1-${AVAILABLE_CATEGORIES.length}) or 0 to cancel: `);

  if (choice === '0') return;

  const categoryIndex = parseInt(choice) - 1;
  if (categoryIndex < 0 || categoryIndex >= AVAILABLE_CATEGORIES.length) {
    console.log('❌ Invalid selection');
    return;
  }

  const newCategory = AVAILABLE_CATEGORIES[categoryIndex];
  const newLabel = CATEGORY_LABELS[newCategory];

  console.log('');
  console.log(`✅ Would move ${caseId} from "${caseData.system}" → "${newCategory} (${newLabel})"`);
  console.log('   (Export metadata to save changes)');
  console.log('');
  console.log('⚠️  Note: Moving categories will affect Case_ID prefixes');
  console.log('   Example: CARD0001 moving to RESP would become RESP0001');
  console.log('');

  // Update in memory (would need to handle Case_ID renumbering)
  caseData.system = newCategory;
}

/**
 * View/Edit Pathway Case Sequence
 */
async function viewEditPathwaySequence(rl, pathways, pathwayCasesMap) {
  console.log('');
  console.log('─────────────────────────────────────────');
  console.log('📊 SELECT PATHWAY');
  console.log('─────────────────────────────────────────');
  console.log('');

  const pathwayNames = Object.keys(pathways);
  pathwayNames.forEach((name, idx) => {
    console.log(`${idx + 1}. ${name} (${pathways[name].scenarioCount} cases)`);
  });
  console.log('');

  const choice = await askQuestion(rl, `Select pathway (1-${pathwayNames.length}) or 0 to cancel: `);

  if (choice === '0') return;

  const pathwayIndex = parseInt(choice) - 1;
  if (pathwayIndex < 0 || pathwayIndex >= pathwayNames.length) {
    console.log('❌ Invalid selection');
    return;
  }

  const pathwayName = pathwayNames[pathwayIndex];
  const pathwayCases = pathwayCasesMap[pathwayName] || [];

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log(`📋 PATHWAY: ${pathwayName}`);
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log(`Total Cases: ${pathwayCases.length}`);
  console.log('');
  console.log('Current Sequence:');
  console.log('');

  pathwayCases.forEach((caseData, idx) => {
    console.log(`  ${idx + 1}. ${caseData.caseId} - ${caseData.revealTitle}`);
    console.log(`     Priority: ${caseData.learningPriority}/10 | Complexity: ${caseData.complexity}/5`);
  });
  console.log('');

  // For now, just display. Full drag-and-drop editing would require more complex UI.
  console.log('💡 Note: Manual reordering will be implemented in next version');
  console.log('   Use Option 4 to get AI recommendations for optimal sequence');
  console.log('');
}

/**
 * Generate Alternative Pathway Names
 */
async function generateAlternativeNames(rl, pathways) {
  console.log('');
  console.log('─────────────────────────────────────────');
  console.log('✨ SELECT PATHWAY TO RENAME');
  console.log('─────────────────────────────────────────');
  console.log('');

  const pathwayNames = Object.keys(pathways);
  pathwayNames.forEach((name, idx) => {
    console.log(`${idx + 1}. ${name}`);
  });
  console.log('');

  const choice = await askQuestion(rl, `Select pathway (1-${pathwayNames.length}) or 0 to cancel: `);

  if (choice === '0') return;

  const pathwayIndex = parseInt(choice) - 1;
  if (pathwayIndex < 0 || pathwayIndex >= pathwayNames.length) {
    console.log('❌ Invalid selection');
    return;
  }

  const pathwayName = pathwayNames[pathwayIndex];
  const pathwayData = pathways[pathwayName];

  console.log('');
  console.log(`🧠 Generating alternative names for: ${pathwayName}`);
  console.log('   (This may take 10-15 seconds...)');
  console.log('');

  const options = await generatePathwayNameOptions(pathwayData, 10);

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log(`✨ ALTERNATIVE NAMES FOR: ${pathwayName}`);
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  options.options.forEach((option, idx) => {
    console.log(`${idx + 1}. ${option.name}`);
    console.log(`   Tier: ${option.tier} | Focus: ${option.focusArea}`);
    console.log(`   Rationale: ${option.rationale}`);
    console.log('');
  });

  const selectChoice = await askQuestion(rl, `Select name to apply (1-${options.options.length}) or 0 to skip: `);

  if (selectChoice !== '0') {
    const selectedIndex = parseInt(selectChoice) - 1;
    if (selectedIndex >= 0 && selectedIndex < options.options.length) {
      const newName = options.options[selectedIndex].name;
      console.log('');
      console.log(`✅ Would rename "${pathwayName}" → "${newName}"`);
      console.log('   (Export metadata to save changes)');
      console.log('');

      // Update in memory (would need to handle case mapping updates too)
      // For now, just show what would happen
    }
  }
}

/**
 * Analyze Case Fit for Alternative Pathways
 */
async function analyzeCaseFit(rl, pathways, cases, pathwayCasesMap) {
  console.log('');
  console.log('─────────────────────────────────────────');
  console.log('🔍 SELECT CASE TO ANALYZE');
  console.log('─────────────────────────────────────────');
  console.log('');

  const caseId = await askQuestion(rl, 'Enter Case ID (e.g., CARD0001): ');

  const caseData = cases.find(c => c.caseId === caseId);

  if (!caseData) {
    console.log(`❌ Case ${caseId} not found`);
    return;
  }

  console.log('');
  console.log(`🧠 Analyzing case fit: ${caseData.revealTitle}`);
  console.log('   (This may take 15-20 seconds...)');
  console.log('');

  const analysis = await analyzeCasePathwayFit(caseData, caseData.pathwayName, pathways);

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log(`🔍 CASE FIT ANALYSIS: ${caseId}`);
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log(`📋 Current Pathway: ${caseData.pathwayName}`);
  console.log(`   Fit Score: ${analysis.currentPathwayAnalysis.fitScore}/10`);
  console.log(`   Reasoning: ${analysis.currentPathwayAnalysis.reasoning}`);
  console.log('');
  console.log('🔄 Alternative Pathways (ranked by fit):');
  console.log('');

  const ranked = analysis.alternatives.sort((a, b) => b.fitScore - a.fitScore);

  ranked.slice(0, 5).forEach((alt, idx) => {
    console.log(`${idx + 1}. ${alt.pathwayName} (Fit: ${alt.fitScore}/10)`);
    console.log(`   Reasoning: ${alt.reasoning}`);
    console.log(`   Recommended Position: ${alt.sequencePosition}`);
    console.log(`   Sequence Rationale: ${alt.sequenceRationale}`);
    if (alt.prerequisiteConcepts && alt.prerequisiteConcepts.length > 0) {
      console.log(`   Prerequisites: ${alt.prerequisiteConcepts.join(', ')}`);
    }
    console.log('');
  });
}

/**
 * Recommend Optimal Case Sequence (AI)
 */
async function recommendSequence(rl, pathways, pathwayCasesMap) {
  console.log('');
  console.log('─────────────────────────────────────────');
  console.log('📊 SELECT PATHWAY FOR SEQUENCE OPTIMIZATION');
  console.log('─────────────────────────────────────────');
  console.log('');

  const pathwayNames = Object.keys(pathways);
  pathwayNames.forEach((name, idx) => {
    console.log(`${idx + 1}. ${name} (${pathways[name].scenarioCount} cases)`);
  });
  console.log('');

  const choice = await askQuestion(rl, `Select pathway (1-${pathwayNames.length}) or 0 to cancel: `);

  if (choice === '0') return;

  const pathwayIndex = parseInt(choice) - 1;
  if (pathwayIndex < 0 || pathwayIndex >= pathwayNames.length) {
    console.log('❌ Invalid selection');
    return;
  }

  const pathwayName = pathwayNames[pathwayIndex];
  const pathwayCases = pathwayCasesMap[pathwayName] || [];

  console.log('');
  console.log(`🧠 Analyzing optimal sequence for: ${pathwayName}`);
  console.log('   (This may take 20-30 seconds...)');
  console.log('');

  const recommendation = await recommendCaseSequence(pathwayCases, pathwayName);

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log(`📋 RECOMMENDED SEQUENCE: ${pathwayName}`);
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log(`Strategy: ${recommendation.sequencingPrinciple}`);
  console.log('');
  console.log('Recommended Order:');
  console.log('');

  recommendation.recommendedSequence.forEach((item, idx) => {
    const caseData = pathwayCases.find(c => c.caseId === item.caseId);
    console.log(`${item.sequenceNumber}. ${item.caseId} - ${caseData ? caseData.revealTitle : 'Unknown'}`);
    console.log(`   Rationale: ${item.rationale}`);
    console.log('');
  });
}

/**
 * Move Case to Different Pathway
 */
async function moveCase(rl, pathways, cases, pathwayCasesMap) {
  console.log('');
  console.log('─────────────────────────────────────────');
  console.log('🔄 MOVE CASE TO DIFFERENT PATHWAY');
  console.log('─────────────────────────────────────────');
  console.log('');

  const caseId = await askQuestion(rl, 'Enter Case ID to move (e.g., CARD0001): ');

  const caseData = cases.find(c => c.caseId === caseId);

  if (!caseData) {
    console.log(`❌ Case ${caseId} not found`);
    return;
  }

  console.log('');
  console.log(`📋 Case: ${caseData.revealTitle}`);
  console.log(`   Current Pathway: ${caseData.pathwayName}`);
  console.log('');
  console.log('Available Pathways:');
  console.log('');

  const pathwayNames = Object.keys(pathways);
  pathwayNames.forEach((name, idx) => {
    console.log(`${idx + 1}. ${name}`);
  });
  console.log('');

  const choice = await askQuestion(rl, `Select destination pathway (1-${pathwayNames.length}) or 0 to cancel: `);

  if (choice === '0') return;

  const pathwayIndex = parseInt(choice) - 1;
  if (pathwayIndex < 0 || pathwayIndex >= pathwayNames.length) {
    console.log('❌ Invalid selection');
    return;
  }

  const newPathway = pathwayNames[pathwayIndex];

  console.log('');
  console.log(`✅ Would move ${caseId} from "${caseData.pathwayName}" → "${newPathway}"`);
  console.log('   (Export metadata to save changes)');
  console.log('');
}

/**
 * Export Updated Metadata
 */
async function exportMetadata(rl, pathways, cases) {
  console.log('');
  console.log('─────────────────────────────────────────');
  console.log('💾 EXPORT UPDATED METADATA');
  console.log('─────────────────────────────────────────');
  console.log('');
  console.log('This feature will be implemented to save:');
  console.log('  - Updated pathway names');
  console.log('  - Reordered case sequences');
  console.log('  - Case pathway assignments');
  console.log('');
  console.log('Coming soon!');
  console.log('');
}

// Run main menu
if (require.main === module) {
  mainMenu().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
}

module.exports = {
  generatePathwayNameOptions,
  analyzeCasePathwayFit,
  recommendCaseSequence
};
