/**
 * AI Priority Researcher
 *
 * Uses OpenAI API to deeply research each case and determine:
 * 1. Critical clinical pearls (like inferior MI nitro contraindication)
 * 2. Organizational priorities (what residencies/boards value most)
 * 3. Optimal learning sequence (what must be taught first and why)
 * 4. Hidden teaching opportunities
 *
 * Philosophy: "Uncover the gold we don't know exists"
 */

const OpenAI = require('openai');
require('dotenv').config();

let openaiClient = null;

/**
 * Initialize OpenAI client with API key from Google Sheets settings
 */
async function initializeOpenAI(sheets, spreadsheetId) {
  try {
    // Try to get API key from hidden settings sheet (cell B2)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'settings!B2'
    });

    const apiKey = response.data.values?.[0]?.[0];

    if (!apiKey) {
      // Fallback to .env file
      if (process.env.OPENAI_API_KEY) {
        openaiClient = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });
        console.log('✅ Using OpenAI API key from .env file');
        return openaiClient;
      }
      throw new Error('OpenAI API key not found in settings sheet (B2) or .env file');
    }

    openaiClient = new OpenAI({
      apiKey: apiKey
    });
    console.log('✅ Using OpenAI API key from Google Sheets settings');
    return openaiClient;

  } catch (error) {
    // Fallback to .env file
    if (process.env.OPENAI_API_KEY) {
      openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      console.log('⚠️  Could not read settings sheet, using .env file');
      return openaiClient;
    }
    throw new Error('OpenAI API key not found. Please add to settings sheet (B2) or .env file');
  }
}

function getOpenAIClient() {
  if (!openaiClient) {
    throw new Error('OpenAI client not initialized. Call initializeOpenAI() first.');
  }
  return openaiClient;
}

/**
 * Research a single case to determine educational priority and sequencing
 */
async function researchCasePriority(scenario) {
  const prompt = `You are an expert emergency medicine educator and curriculum designer with deep knowledge of:
- Critical clinical pearls and "cannot miss" teaching points
- Emergency medicine residency program priorities
- Hospital board priorities (HCAHPS, litigation risk, cost reduction)
- ACGME EM Milestones and competency progression
- Medical education sequencing theory

Analyze this emergency medicine simulation case and provide a comprehensive educational priority assessment.

**CASE DETAILS:**
- **Spark Title (Patient Presentation)**: ${scenario.sparkTitle || 'N/A'}
- **Reveal Title (Diagnosis)**: ${scenario.revealTitle || 'N/A'}
- **Current Case_ID**: ${scenario.currentCaseId || 'N/A'}

**YOUR TASK:**
Perform deep research and reasoning to determine:

1. **CRITICAL CLINICAL PEARLS** (Like "Inferior MI: NO NITRO - preload dependent!")
   - What is the #1 teaching point residents MUST master from this case?
   - Are there any critical contraindications, "cannot miss" diagnoses, or life-saving interventions?
   - What mistakes do residents commonly make with this condition?

2. **ORGANIZATIONAL PRIORITIES**
   - **Residency Program Directors**: Why would they prioritize teaching this case early vs late?
   - **Hospital Boards**: Does this relate to HCAHPS scores, litigation risk, or cost reduction?
   - **Medical Societies**: Is this an ACGME Milestone 1 competency or board exam priority?

3. **LEARNING SEQUENCE LOGIC**
   - Should this be taught FIRST (foundational), MIDDLE (building on basics), or LATER (advanced)?
   - What prerequisite knowledge must residents have BEFORE this case?
   - What other cases should follow AFTER mastering this one?

4. **EDUCATIONAL PRIORITY SCORE** (1-10 scale)
   - **10 = FOUNDATIONAL** (Must teach FIRST! Critical pearl, common mistake, life-threatening)
     Example: Inferior MI (nitro contraindicated), Tension pneumothorax (immediate decompression)
   - **9 = HIGH PRIORITY** (Teach early, high-stakes, frequent presentation)
   - **5 = STANDARD** (Normal teaching sequence)
   - **1 = ADVANCED** (Rare variant, can wait until later)

5. **PATHWAY GROUPING**
   - What learning pathway does this belong to? (e.g., "Cardiac Mastery Foundations", "Exceptional Patient Experience")
   - What is the marketing-focused outcome name for this pathway? (Sell the RESULT, not the process)

**OUTPUT FORMAT (JSON):**
{
  "priority": 10,
  "priorityLabel": "FOUNDATIONAL (Teach First!)",
  "criticalPearl": "Inferior MI: Nitro contraindicated due to preload dependence - can cause catastrophic hypotension",
  "commonMistakes": [
    "Giving nitro to all chest pain patients without checking lead II, III, aVF",
    "Missing RV involvement signs (JVD, clear lungs, hypotension)"
  ],
  "residencyPriority": {
    "reasoning": "Must be taught FIRST in AMI series - prevents fatal medication error",
    "milestoneLevel": "EM Milestone 1 - Emergency Stabilization",
    "boardRelevance": "High-yield ABEM board topic, common oral board scenario"
  },
  "organizationalPriority": {
    "litigationRisk": "High - missed diagnosis or wrong treatment is top lawsuit",
    "hcahpsImpact": "Medium - door-to-balloon time affects quality metrics",
    "costImpact": "High - early recognition reduces ICU days and complications"
  },
  "sequenceReasoning": "Must be Case #1 or #2 in cardiac pathway. Residents need to master this contraindication BEFORE learning other MI management, otherwise they'll develop unsafe habits.",
  "prerequisiteKnowledge": ["ECG basics", "Chest pain differential"],
  "followUpCases": ["Anterior MI (can give nitro)", "Lateral MI", "STEMI with complications"],
  "pathwaySuggestion": {
    "name": "Life-Saving Cardiac Interventions",
    "tier": "foundational",
    "marketingPitch": "Prevent fatal medication errors and reduce MI mortality through evidence-based cardiac emergency training."
  },
  "hiddenValue": "This case teaches THE most important contraindication in all of cardiology - worth its weight in gold for patient safety.",
  "confidence": 0.95
}

**IMPORTANT**:
- Be brutally honest about priority - not everything is priority 10
- Only mark priority 10 if there's a CRITICAL pearl or "cannot miss" teaching point
- Consider what emergency medicine residencies actually teach first (not just complexity)
- Think like a program director: What do I NEED my residents to know before they take their first shift?

Provide your response as valid JSON only (no markdown, no code blocks).`;

  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: 'gpt-4o', // Use GPT-4o for deep reasoning
      messages: [
        {
          role: 'system',
          content: 'You are an expert emergency medicine educator specializing in curriculum design and educational sequencing. You have deep knowledge of clinical pearls, residency program priorities, and optimal teaching sequences. Always provide responses in valid JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent, factual analysis
      max_tokens: 2000
    });

    const content = response.choices[0].message.content.trim();

    // Parse JSON response
    const result = JSON.parse(content);

    return {
      ...result,
      aiGenerated: true,
      model: 'gpt-4o',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error researching case priority:', error.message);

    // Return fallback to manual scoring if API fails
    return {
      priority: 5,
      priorityLabel: 'Standard Priority',
      criticalPearl: null,
      error: error.message,
      aiGenerated: false,
      fallbackUsed: true
    };
  }
}

/**
 * Research multiple cases in a system/category to determine optimal sequence
 */
async function researchPathwaySequence(scenarios, systemName) {
  const caseDescriptions = scenarios.map((s, idx) =>
    `${idx + 1}. ${s.revealTitle || 'Unknown'} (Current ID: ${s.currentCaseId})`
  ).join('\n');

  const prompt = `You are an expert emergency medicine curriculum designer planning the optimal teaching sequence for a series of related cases.

**SYSTEM/CATEGORY**: ${systemName}

**CASES IN THIS PATHWAY** (${scenarios.length} total):
${caseDescriptions}

**YOUR TASK:**
Design the optimal learning sequence for these cases based on:
1. **Foundational concepts first** (prerequisites for everything else)
2. **Critical clinical pearls** (life-saving knowledge, common mistakes)
3. **Residency program priorities** (what they need to teach early)
4. **Progressive complexity** (simple → complex within same priority)

**CONSIDER:**
- Which case contains the CRITICAL teaching point that residents MUST master first?
- Are there any "cannot miss" diagnoses or contraindications?
- What order would an EM residency program actually teach these?
- What builds upon what? (e.g., can't teach "MI with complications" before "basic MI")

**OUTPUT FORMAT (JSON):**
{
  "systemName": "${systemName}",
  "pathwayName": "Cardiac Mastery Foundations",
  "marketingPitch": "Prevent fatal medication errors and master time-critical cardiac interventions",
  "recommendedSequence": [
    {
      "caseNumber": 1,
      "currentCaseId": "CARD001",
      "revealTitle": "Inferior MI",
      "priority": 10,
      "reasoning": "MUST be first - teaches critical nitro contraindication. Foundation for all MI management.",
      "teachingPoint": "Inferior MI: NO NITRO - preload dependent"
    },
    {
      "caseNumber": 2,
      "currentCaseId": "CARD002",
      "revealTitle": "Anterior MI",
      "priority": 9,
      "reasoning": "After learning inferior MI contraindication, teach standard STEMI where nitro IS appropriate",
      "teachingPoint": "Standard STEMI management, door-to-balloon time"
    }
  ],
  "sequencingPrinciples": [
    "Critical contraindications first (inferior MI nitro)",
    "Common presentations before rare variants",
    "Stable before unstable",
    "Single-system before multi-system"
  ],
  "confidence": 0.9
}

Provide your response as valid JSON only (no markdown, no code blocks).`;

  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert emergency medicine curriculum designer specializing in optimal teaching sequences. Always provide responses in valid JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 3000
    });

    const content = response.choices[0].message.content.trim();
    const result = JSON.parse(content);

    return {
      ...result,
      aiGenerated: true,
      model: 'gpt-4o',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error researching pathway sequence:', error.message);

    return {
      systemName,
      error: error.message,
      aiGenerated: false,
      fallbackUsed: true
    };
  }
}

/**
 * Batch research all cases in a system with rate limiting
 */
async function batchResearchCases(scenarios, options = {}) {
  const {
    rateLimit = 50, // Requests per minute (OpenAI limit is 500/min for paid tier)
    batchSize = 10,
    onProgress = null
  } = options;

  const results = [];
  const delayMs = (60 * 1000) / rateLimit; // Delay between requests

  console.log(`🔬 Starting AI research on ${scenarios.length} cases...`);
  console.log(`   Rate limit: ${rateLimit} requests/min`);
  console.log('');

  for (let i = 0; i < scenarios.length; i += batchSize) {
    const batch = scenarios.slice(i, i + batchSize);

    console.log(`📚 Researching batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(scenarios.length / batchSize)} (${batch.length} cases)...`);

    // Process batch in parallel (respecting rate limit)
    const batchPromises = batch.map(async (scenario, batchIdx) => {
      // Delay to respect rate limit
      await new Promise(resolve => setTimeout(resolve, batchIdx * delayMs));

      const result = await researchCasePriority(scenario);

      if (onProgress) {
        onProgress({
          current: i + batchIdx + 1,
          total: scenarios.length,
          scenario,
          result
        });
      }

      return {
        ...scenario,
        aiResearch: result
      };
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    console.log(`   ✅ Completed ${results.length}/${scenarios.length} cases`);
    console.log('');
  }

  console.log(`🎉 Research complete! Analyzed ${results.length} cases`);
  console.log('');

  return results;
}

/**
 * Compare AI research with manual priority scoring
 */
function compareWithManualScoring(scenario, aiResult, manualResult) {
  return {
    caseId: scenario.currentCaseId,
    revealTitle: scenario.revealTitle,
    aiPriority: aiResult.priority,
    manualPriority: manualResult.priority,
    priorityDifference: aiResult.priority - manualResult.priority,
    aiCriticalPearl: aiResult.criticalPearl,
    manualRationale: manualResult.rationales?.[0],
    agreement: Math.abs(aiResult.priority - manualResult.priority) <= 1 ? 'Strong' :
                Math.abs(aiResult.priority - manualResult.priority) <= 2 ? 'Moderate' : 'Weak',
    confidence: aiResult.confidence,
    recommendation: aiResult.priority > manualResult.priority + 2 ?
      'AI found critical pearl - consider increasing priority' :
      aiResult.priority < manualResult.priority - 2 ?
      'AI suggests lower priority - review reasoning' :
      'Priorities align - no action needed'
  };
}

module.exports = {
  initializeOpenAI,
  researchCasePriority,
  researchPathwaySequence,
  batchResearchCases,
  compareWithManualScoring
};
