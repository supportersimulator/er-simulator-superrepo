/**
 * Marketing Genius Pathway Namer
 *
 * Uses OpenAI API to channel marketing legends Frank Kern and Alex Hormozi
 * to create pathway names that SELL to decision-makers.
 *
 * Philosophy: "Name it like the legends would - sell the outcome, not the feature"
 */

const OpenAI = require('openai');
require('dotenv').config();

let openaiClient = null;

/**
 * Initialize OpenAI client (call this from main script after reading settings)
 */
function initializeOpenAI(client) {
  openaiClient = client;
}

function getOpenAIClient() {
  if (!openaiClient) {
    throw new Error('OpenAI client not initialized. Call initializeOpenAI() first.');
  }
  return openaiClient;
}

/**
 * Generate marketing-optimized pathway name using AI
 */
async function generateMarketingName(pathwayData) {
  const {
    systemName,
    scenarios,
    clinicalPearls = [],
    organizationalPriorities = {},
    targetAudience = 'hospital organizations and emergency medicine residency programs'
  } = pathwayData;

  // Build case descriptions for context
  const caseDescriptions = scenarios.slice(0, 10).map((s, idx) =>
    `${idx + 1}. ${s.revealTitle || 'Unknown'} (Priority: ${s.priority || 5}/10)`
  ).join('\n');

  // Build clinical pearls summary
  const pearlsSummary = clinicalPearls.length > 0
    ? clinicalPearls.slice(0, 5).join('\n   - ')
    : 'Foundation knowledge for emergency medicine practice';

  // Build organizational value summary
  const orgValue = {
    litigationImpact: organizationalPriorities.litigationRisk || 'Medium',
    hcahpsImpact: organizationalPriorities.hcahpsImpact || 'Medium',
    costImpact: organizationalPriorities.costImpact || 'Medium',
    safetyImpact: organizationalPriorities.safetyImpact || 'High'
  };

  const prompt = `You are channeling the marketing genius of Frank Kern and Alex Hormozi to name a medical education pathway.

**CONTEXT:**
This is a series of ${scenarios.length} emergency medicine simulation cases focused on ${systemName} emergencies.

**TARGET AUDIENCE:**
${targetAudience}
- Hospital Chief Medical Officers (CMOs)
- Emergency Medicine Residency Program Directors
- Hospital Board Members
- Chief Nursing Officers
- Quality & Safety Directors

**WHAT THEY CARE ABOUT (in order):**
1. Patient safety (malpractice reduction)
2. Revenue impact (HCAHPS scores, reimbursement)
3. Cost reduction (fewer complications, shorter LOS)
4. Regulatory compliance (Joint Commission, CMS)
5. Competitive advantage (best residents, best outcomes)

**PATHWAY CASES** (${scenarios.length} total):
${caseDescriptions}
${scenarios.length > 10 ? '... (' + (scenarios.length - 10) + ' more cases)' : ''}

**CRITICAL CLINICAL PEARLS:**
   - ${pearlsSummary}

**ORGANIZATIONAL VALUE:**
- Litigation Risk Reduction: ${orgValue.litigationImpact}
- HCAHPS Score Impact: ${orgValue.hcahpsImpact}
- Cost Savings: ${orgValue.costImpact}
- Patient Safety: ${orgValue.safetyImpact}

**YOUR TASK:**
Create 3 pathway name options that would make Frank Kern and Alex Hormozi proud.

**FRANK KERN STYLE:**
- Speaks directly to the pain point or desired outcome
- Uses power words that trigger emotion (breakthrough, mastery, transformation)
- Focuses on the END STATE they want to achieve
- Examples: "The Bulletproof Heart Attack Protocol", "Zero-Miss Stroke Mastery"

**ALEX HORMOZI STYLE:**
- VALUE-PACKED name that promises specific outcome
- Uses "to" framework (X to Y transformation)
- Quantifiable if possible (e.g., "30-Day Cardiac Excellence")
- Examples: "From Errors to Excellence: Cardiac Edition", "$100K Savings: Sepsis Mastery"

**RULES:**
1. NEVER use generic terms like "Training" or "Course" or "Module"
2. ALWAYS focus on the OUTCOME (what they get), not the process (what we do)
3. MUST appeal to decision-makers' priorities (safety, revenue, cost, risk)
4. Should sound premium and high-value (this is an upsell!)
5. Maximum 5-7 words (punchy, memorable)

**EXAMPLES OF GREAT NAMES:**
- "Zero-Lawsuit Cardiac Confidence" (fear-based, outcome-focused)
- "The $2M Sepsis Shield" (value quantified, protection focused)
- "Bulletproof Stroke Response" (confidence + action)
- "30-Day HCAHPS Breakthrough" (time-bound outcome)
- "The Litigation-Proof EM Practice" (ultimate fear resolution)

**OUTPUT FORMAT (JSON):**
{
  "frankKernName": "The Bulletproof Cardiac Response",
  "frankKernReasoning": "Appeals to fear of medical errors (bulletproof), focuses on outcome (response), power word that triggers confidence",
  "alexHormoziName": "From Errors to Excellence: Cardiac Mastery",
  "alexHormoziReasoning": "Clear transformation (errors → excellence), value-packed (mastery), premium positioning",
  "hybridName": "Bulletproof Cardiac Excellence",
  "hybridReasoning": "Combines Kern's emotional power (bulletproof) with Hormozi's value promise (excellence)",
  "recommendedName": "Bulletproof Cardiac Excellence",
  "recommendedReasoning": "Best of both: emotional safety trigger + value promise. Appeals to CMO's #1 fear (lawsuits) and #1 goal (excellence)",
  "tagline": "Eliminate cardiac medication errors and reduce litigation risk by 80%",
  "marketingPitch": "Your cardiac team will master the critical contraindications and time-critical interventions that separate excellent programs from average ones. Every case teaches the clinical pearls that prevent million-dollar lawsuits.",
  "targetPainPoint": "Fear of missed MI diagnosis and medication errors (top cardiac lawsuits)",
  "targetDesiredOutcome": "Zero cardiac medication errors, reduced litigation exposure, improved door-to-balloon times",
  "confidence": 0.95
}

**IMPORTANT:**
- Think like a CMO making a $50K purchase decision
- What would make them say "We NEED this" to their board?
- Focus on safety, revenue, and risk reduction
- Make it sound premium and exclusive

Provide your response as valid JSON only (no markdown, no code blocks).`;

  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a marketing genius who has studied Frank Kern and Alex Hormozi extensively. You specialize in creating high-converting program names for B2B healthcare sales. Always provide responses in valid JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7, // Higher temperature for creative naming
      max_tokens: 1500
    });

    const content = response.choices[0].message.content.trim();
    const result = JSON.parse(content);

    return {
      ...result,
      systemName,
      scenarioCount: scenarios.length,
      aiGenerated: true,
      model: 'gpt-4o',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error generating marketing name:', error.message);

    // Fallback to generic name
    return {
      recommendedName: `${systemName} Excellence`,
      frankKernName: `${systemName} Mastery`,
      alexHormoziName: `${systemName} Excellence Program`,
      hybridName: `${systemName} Excellence`,
      error: error.message,
      aiGenerated: false,
      fallbackUsed: true
    };
  }
}

/**
 * Batch generate marketing names for all pathways
 */
async function batchGeneratePathwayNames(pathwaysData, options = {}) {
  const {
    rateLimit = 50,
    onProgress = null
  } = options;

  const results = {};
  const delayMs = (60 * 1000) / rateLimit;

  console.log('🎯 Generating marketing-optimized pathway names...');
  console.log('   Channeling Frank Kern & Alex Hormozi...');
  console.log('');

  let idx = 0;
  for (const [pathwayKey, pathwayData] of Object.entries(pathwaysData)) {
    console.log(`   [${idx + 1}/${Object.keys(pathwaysData).length}] Naming "${pathwayKey}"...`);

    // Delay to respect rate limit
    if (idx > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    const result = await generateMarketingName(pathwayData);

    if (onProgress) {
      onProgress({
        current: idx + 1,
        total: Object.keys(pathwaysData).length,
        pathwayKey,
        result
      });
    }

    results[pathwayKey] = result;
    idx++;
  }

  console.log('');
  console.log('✅ Marketing names generated for ' + Object.keys(results).length + ' pathways!');
  console.log('');

  return results;
}

/**
 * Compare generic vs marketing-optimized names
 */
function compareNames(genericName, marketingNames) {
  return {
    generic: {
      name: genericName,
      style: 'Descriptive',
      appeal: 'Low (features-focused)',
      example: 'Cardiac Training Module'
    },
    frankKern: {
      name: marketingNames.frankKernName,
      style: 'Emotional + Power Words',
      appeal: 'High (fear + confidence)',
      reasoning: marketingNames.frankKernReasoning
    },
    alexHormozi: {
      name: marketingNames.alexHormoziName,
      style: 'Value-Packed + Transformation',
      appeal: 'High (clear ROI)',
      reasoning: marketingNames.alexHormoziReasoning
    },
    recommended: {
      name: marketingNames.recommendedName,
      style: 'Hybrid (Best of Both)',
      appeal: 'Maximum (emotion + value)',
      reasoning: marketingNames.recommendedReasoning,
      tagline: marketingNames.tagline
    }
  };
}

/**
 * Generate complete marketing package for pathway
 */
function generateMarketingPackage(marketingNames, pathwayData) {
  return {
    pathwayName: marketingNames.recommendedName,
    tagline: marketingNames.tagline,
    elevatorPitch: marketingNames.marketingPitch,

    targetAudience: {
      primary: 'Hospital Chief Medical Officers (CMOs)',
      secondary: 'Emergency Medicine Residency Program Directors',
      tertiary: 'Hospital Board Members, CNOs, Quality Directors'
    },

    valueProposition: {
      painPoint: marketingNames.targetPainPoint,
      desiredOutcome: marketingNames.targetDesiredOutcome,
      uniqueValue: 'AI-researched clinical pearls + outcome-focused sequencing'
    },

    messaging: {
      headline: marketingNames.recommendedName,
      subheadline: marketingNames.tagline,
      benefitStatements: [
        'Reduce litigation risk through mastery of critical contraindications',
        'Improve patient outcomes with evidence-based clinical pearls',
        'Boost HCAHPS scores through systematic excellence training',
        'Reduce costs by preventing complications and reducing length of stay'
      ]
    },

    socialProof: {
      ideal: 'Trusted by 50+ leading emergency departments nationwide',
      alternative: 'Based on ACGME EM Milestones and board-exam standards'
    },

    callToAction: {
      primary: `Start ${marketingNames.recommendedName} Today`,
      secondary: 'Schedule Demo',
      tertiary: 'Download Pathway Overview'
    },

    pricing: {
      position: 'Premium',
      justification: 'AI-discovered clinical pearls + litigation risk reduction',
      anchor: 'Compare to: $2M average medical malpractice settlement'
    }
  };
}

module.exports = {
  initializeOpenAI,
  generateMarketingName,
  batchGeneratePathwayNames,
  compareNames,
  generateMarketingPackage
};
