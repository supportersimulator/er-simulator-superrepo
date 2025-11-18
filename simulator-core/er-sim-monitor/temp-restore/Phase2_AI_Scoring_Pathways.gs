/**
 * PHASE 2: AI PERSUASION & RANKING SYSTEM
 *
 * Three-factor scoring system for pathway suggestions:
 * 1. Educational Value (50%)
 * 2. Novelty (25%)
 * 3. Market Validation (25%)
 *
 * Plus sequence rationale explaining WHY each case is positioned where it is.
 */

// ============================================================================
// AI SCORING PROMPTS
// ============================================================================

var EDUCATIONAL_VALUE_PROMPT = `
You are an expert in emergency medicine education and curriculum design.

Evaluate this pathway's EDUCATIONAL VALUE on a scale of 1-10.

PATHWAY TO EVALUATE:
Name: {PATHWAY_NAME}
Description: {PATHWAY_DESCRIPTION}
Cases: {CASE_COUNT} cases
Target Learner: {TARGET_LEARNER}
Learning Outcomes: {LEARNING_OUTCOMES}
Case Sequence: {CASE_SEQUENCE}

EVALUATION CRITERIA:

1. LEARNING OUTCOMES CLARITY (3 points)
   - Are outcomes specific and measurable?
   - Can success be objectively assessed?
   - Do outcomes align with target learner level?

2. PEDAGOGICAL PROGRESSION (3 points)
   - Does case sequence build logically?
   - Is difficulty progression appropriate?
   - Does each case prepare for the next?

3. SKILL GAP FILLING (2 points)
   - Does this address an unmet educational need?
   - Is this a critical competency for EM residents?
   - Would learners struggle without this pathway?

4. RETENTION & APPLICATION (2 points)
   - Will learners remember this after 6 months?
   - Can they apply this in real clinical practice?
   - Does sequence maximize retention?

RETURN JSON:
{
  "educational_value_score": 8,
  "clarity_score": 3,
  "progression_score": 2,
  "gap_filling_score": 2,
  "retention_score": 1,
  "reasoning": "Clear outcomes focused on anchoring bias recognition. Progression from subtle to obvious traps is pedagogically sound. Fills critical gap in cognitive debiasing training. However, retention may be challenged without repeated exposure.",
  "strengths": ["Specific measurable outcomes", "Logical progression", "Addresses bias blind spot"],
  "weaknesses": ["May need spaced repetition to stick"]
}
`;

var NOVELTY_PROMPT = `
You are a medical education innovation consultant who has reviewed thousands of EM curricula.

Evaluate this pathway's NOVELTY on a scale of 1-10.

PATHWAY TO EVALUATE:
Name: {PATHWAY_NAME}
Description: {PATHWAY_DESCRIPTION}
Cases: {CASE_COUNT} cases
Logic Type: {LOGIC_TYPE}

EVALUATION CRITERIA:

1. UNEXPECTEDNESS (4 points)
   - How surprising is this grouping?
   - Would expert educators say "I never thought of that"?
   - Does it challenge conventional curriculum design?

2. DIFFERENTIATION (3 points)
   - Is this different from standard organ system groupings?
   - Does it offer a fresh perspective?
   - Would this stand out in a curriculum catalog?

3. CREATIVE CONNECTIONS (3 points)
   - Does it reveal non-obvious patterns?
   - Are cases connected in unexpected ways?
   - Does it cross traditional boundaries?

REFERENCE POINTS FOR SCORING:
- 1-3: Standard grouping (e.g., "All Cardiac Cases")
- 4-6: Moderately creative (e.g., "Cardiac Cases by Difficulty")
- 7-8: Highly creative (e.g., "When Chest Pain Isn't Cardiac")
- 9-10: Revolutionary (e.g., "Cases Where Doing Nothing Was Right")

RETURN JSON:
{
  "novelty_score": 9,
  "unexpectedness_score": 4,
  "differentiation_score": 3,
  "creative_connections_score": 2,
  "reasoning": "This is a highly unexpected grouping. Most curricula organize by diagnosis, not by cognitive bias exposure. The connection of cases through 'diagnostic traps that fool experts' is creative and non-obvious. Expert educators would find this fresh and innovative.",
  "comparison_to_traditional": "Traditional: Organize by organ system. This pathway: Organize by cognitive error pattern.",
  "innovation_level": "High - Addresses 'how we think' not 'what we know'"
}
`;

var MARKET_VALIDATION_PROMPT = `
You are an expert in emergency medicine education market trends and proven curriculum structures.

Evaluate this pathway's MARKET VALIDATION on a scale of 1-10.

PATHWAY TO EVALUATE:
Name: {PATHWAY_NAME}
Description: {PATHWAY_DESCRIPTION}
Target Learner: {TARGET_LEARNER}
Progression Style: {PROGRESSION_STYLE}

PROVEN SUCCESSFUL PATTERNS (Reference):
1. OnlineMedEd: Organ system → Clinical presentation → Board prep
2. Rosh Review: Subject-based, difficulty-tiered, exam-focused
3. EM:RAP: C3 (foundational) → Main (mixed) → Crunch Time (advanced)
4. Best-selling EM courses: ACLS, ATLS, Ultrasound, Procedures

EVALUATION CRITERIA:

1. STRUCTURAL ALIGNMENT (4 points)
   - Does pathway structure match proven winners?
   - Is progression similar to successful courses?
   - Does it follow recognized learning frameworks?

2. NAMING/MARKETING APPEAL (2 points)
   - Does name clearly communicate value?
   - Would this sell well in a course catalog?
   - Is naming style similar to best-sellers?

3. TARGET AUDIENCE DEMAND (2 points)
   - Is target learner segment in high demand?
   - Do residents/attendings seek this content?
   - Is there proven market need?

4. ADOPTION LIKELIHOOD (2 points)
   - Would program directors use this?
   - Does it fit existing curricula?
   - Is it easy to integrate?

RETURN JSON:
{
  "market_validation_score": 7,
  "structural_alignment_score": 2,
  "naming_appeal_score": 2,
  "audience_demand_score": 2,
  "adoption_likelihood_score": 1,
  "reasoning": "While cognitive bias training isn't a traditional EM curriculum staple, there's growing market demand (Harvard, Stanford offer similar courses). Structure doesn't perfectly match OnlineMedEd/Rosh, but aligns with emerging 'thinking skills' trend. Naming is compelling. Target audience (PGY2-3) is large segment. Adoption may be challenged by non-traditional focus.",
  "similar_successful_products": ["Harvard Critical Thinking in Medicine", "Stanford Diagnostic Excellence"],
  "market_demand_level": "Growing - Cognitive bias awareness is emerging trend",
  "pricing_comparable": "Premium pricing justified by novelty and depth"
}
`;

var PERSUASION_NARRATIVE_PROMPT = `
You are a senior medical educator consultant pitching pathway ideas to a program director.

Write a compelling 2-3 sentence persuasion narrative for this pathway.

PATHWAY TO EVALUATE:
Name: {PATHWAY_NAME}
Description: {PATHWAY_DESCRIPTION}
Cases: {CASE_COUNT} cases
Educational Value: {EDU_SCORE}/10
Novelty: {NOVELTY_SCORE}/10
Market Validation: {MARKET_SCORE}/10

YOUR TASK:
Write a persuasive "pitch" that:
1. Hooks attention (why this matters NOW)
2. Explains unique value (what traditional pathways miss)
3. Creates urgency (why build this pathway)

TONE: Confident, evidence-based, inspiring
LENGTH: 2-3 sentences (50-80 words)
STYLE: Active voice, specific benefits, compelling

BAD EXAMPLE (too generic):
"This pathway covers important diagnostic skills. Residents will learn to recognize common conditions. It's a good addition to your curriculum."

GOOD EXAMPLE (compelling):
"These aren't just diagnostic errors—they're the cases that fool even 20-year attendings. Each case presents with textbook symptoms pointing to Diagnosis A, but the answer is actually Diagnosis B. This pathway trains your residents to recognize when 'too perfect' presentations should trigger diagnostic skepticism, not confirmation."

RETURN JSON:
{
  "persuasion_narrative": "Your compelling 2-3 sentence pitch here",
  "hook": "Opening hook sentence",
  "unique_value": "What traditional pathways miss",
  "urgency": "Why build this now"
}
`;

var SEQUENCE_RATIONALE_PROMPT = `
You are an expert medical educator explaining pathway design decisions.

Analyze this pathway's case sequence and explain WHY each case is positioned where it is.

PATHWAY INFORMATION:
Name: {PATHWAY_NAME}
Description: {PATHWAY_DESCRIPTION}
Logic Type: {LOGIC_TYPE}
Target Learner: {TARGET_LEARNER}

COMPLETE CASE SEQUENCE:
{CASE_SEQUENCE_JSON}

YOUR TASK:
For EACH case in the sequence, explain:

1. **Position Rationale** - Why does this case belong at THIS position?
2. **Prerequisites** - What foundation from previous cases does this build on?
3. **Progression Logic** - How does this case advance the learner's skill?
4. **Preparation** - What does this case prepare the learner for next?

EDUCATIONAL PRINCIPLES TO CONSIDER:
- Scaffolding: Simple → Complex
- Cognitive Load: Low → High
- Pattern Recognition: Typical → Atypical
- Uncertainty: High Certainty → Diagnostic Ambiguity
- Clinical Acuity: Stable → Unstable

FORMAT YOUR RESPONSE AS JSON:
{
  "overall_sequence_philosophy": "Brief explanation of the overall sequencing strategy (2-3 sentences)",
  "case_rationales": [
    {
      "position": 1,
      "case_id": "CP101",
      "case_title": "58M Chest Pain",
      "position_rationale": "Why this case is FIRST - what makes it the ideal starting point?",
      "prerequisites": "None - this is the foundation",
      "progression_logic": "What skill/concept does this case introduce?",
      "prepares_for": "What does this case set up for Case 2?"
    },
    {
      "position": 2,
      "case_id": "CP102",
      "case_title": "45F Chest Pain",
      "position_rationale": "Why this case comes SECOND - what makes it the logical next step?",
      "prerequisites": "Builds on Case 1's foundation of...",
      "progression_logic": "How does this case escalate complexity from Case 1?",
      "prepares_for": "What pattern does this establish for Case 3?"
    }
    // ... continue for all cases
  ],
  "key_transitions": [
    {
      "from_case": "CP101",
      "to_case": "CP102",
      "transition_rationale": "Why moving from Case 1 → Case 2 creates the ideal learning moment"
    }
    // ... for critical transitions
  ]
}

BE SPECIFIC: Avoid generic explanations like "builds on previous knowledge." Instead say "Builds on Case 1's pattern of typical chest pain by introducing atypical presentation of PE."

EXAMPLE GOOD RATIONALE:
"Case 1 (CP101) establishes baseline recognition of TYPICAL chest pain presentation. Case 2 (CP102) introduces the first 'trap' - a case that LOOKS like typical MI but is actually PE. This teaches learners to question their initial impression BEFORE locking into a diagnosis."

EXAMPLE BAD RATIONALE:
"Case 1 teaches chest pain. Case 2 continues chest pain learning."
`;

// ============================================================================
// CORE SCORING FUNCTIONS
// ============================================================================

/**
 * Score a pathway across all 3 dimensions
 */
function scorePathway(pathway) {
  Logger.log('🎯 Scoring pathway: "' + pathway.name + '"');

  try {
    var apiKey = getOpenAIKey_();

    // 1. Educational Value Score
    Logger.log('📊 Calculating Educational Value...');
    var eduPrompt = EDUCATIONAL_VALUE_PROMPT
      .replace('{PATHWAY_NAME}', pathway.name)
      .replace('{PATHWAY_DESCRIPTION}', pathway.description)
      .replace('{CASE_COUNT}', pathway.caseIds.length)
      .replace('{TARGET_LEARNER}', pathway.targetLearner || 'PGY1-3')
      .replace('{LEARNING_OUTCOMES}', JSON.stringify(pathway.learningOutcomes || []))
      .replace('{CASE_SEQUENCE}', JSON.stringify(pathway.caseSequence || []));

    var eduResponse = callOpenAI_(eduPrompt, apiKey);
    var eduScore = parseOpenAIJSON_(eduResponse);

    Logger.log('   ✅ Educational Value: ' + eduScore.educational_value_score + '/10');

    // 2. Novelty Score
    Logger.log('💡 Calculating Novelty...');
    var noveltyPrompt = NOVELTY_PROMPT
      .replace('{PATHWAY_NAME}', pathway.name)
      .replace('{PATHWAY_DESCRIPTION}', pathway.description)
      .replace('{CASE_COUNT}', pathway.caseIds.length)
      .replace('{LOGIC_TYPE}', pathway.logicType || 'Unknown');

    var noveltyResponse = callOpenAI_(noveltyPrompt, apiKey);
    var noveltyScore = parseOpenAIJSON_(noveltyResponse);

    Logger.log('   ✅ Novelty: ' + noveltyScore.novelty_score + '/10');

    // 3. Market Validation Score
    Logger.log('📈 Calculating Market Validation...');
    var marketPrompt = MARKET_VALIDATION_PROMPT
      .replace('{PATHWAY_NAME}', pathway.name)
      .replace('{PATHWAY_DESCRIPTION}', pathway.description)
      .replace('{TARGET_LEARNER}', pathway.targetLearner || 'PGY1-3')
      .replace('{PROGRESSION_STYLE}', pathway.progressionStyle || 'Sequential');

    var marketResponse = callOpenAI_(marketPrompt, apiKey);
    var marketScore = parseOpenAIJSON_(marketResponse);

    Logger.log('   ✅ Market Validation: ' + marketScore.market_validation_score + '/10');

    // 4. Calculate Composite Score
    var compositeScore = calculateCompositeScore(
      eduScore.educational_value_score,
      noveltyScore.novelty_score,
      marketScore.market_validation_score
    );

    Logger.log('🏆 Composite Score: ' + compositeScore.score + '/10 (' + compositeScore.tier + ')');

    // 5. Generate Persuasion Narrative
    Logger.log('✍️  Generating AI Persuasion Narrative...');
    var persuasionPrompt = PERSUASION_NARRATIVE_PROMPT
      .replace('{PATHWAY_NAME}', pathway.name)
      .replace('{PATHWAY_DESCRIPTION}', pathway.description)
      .replace('{CASE_COUNT}', pathway.caseIds.length)
      .replace('{EDU_SCORE}', eduScore.educational_value_score)
      .replace('{NOVELTY_SCORE}', noveltyScore.novelty_score)
      .replace('{MARKET_SCORE}', marketScore.market_validation_score);

    var persuasionResponse = callOpenAI_(persuasionPrompt, apiKey);
    var persuasion = parseOpenAIJSON_(persuasionResponse);

    Logger.log('💬 Persuasion: "' + persuasion.persuasion_narrative + '"');

    // Return complete scoring object
    return {
      pathway_id: pathway.id,
      pathway_name: pathway.name,
      educational_value: eduScore,
      novelty: noveltyScore,
      market_validation: marketScore,
      composite_score: compositeScore.score,
      tier: compositeScore.tier,
      persuasion: persuasion,
      scored_at: new Date().toISOString()
    };

  } catch (error) {
    Logger.log('❌ Scoring error: ' + error.message);
    throw error;
  }
}

/**
 * Calculate composite score with weighted formula
 */
function calculateCompositeScore(eduScore, noveltyScore, marketScore) {
  var weights = {
    educational: 0.50,  // 50%
    novelty: 0.25,      // 25%
    market: 0.25        // 25%
  };

  var composite =
    (eduScore * weights.educational) +
    (noveltyScore * weights.novelty) +
    (marketScore * weights.market);

  var tier = getTier_(composite);

  return {
    score: parseFloat(composite.toFixed(2)),
    tier: tier,
    breakdown: {
      educational: eduScore,
      novelty: noveltyScore,
      market: marketScore
    }
  };
}

/**
 * Get tier classification (S/A/B/C/D)
 */
function getTier_(score) {
  if (score >= 9.0) return 'S-Tier (Must Build)';
  if (score >= 8.0) return 'A-Tier (Highly Recommended)';
  if (score >= 7.0) return 'B-Tier (Good)';
  if (score >= 6.0) return 'C-Tier (Consider)';
  return 'D-Tier (Low Priority)';
}

/**
 * Generate sequence rationale for a pathway
 */
function generateSequenceRationale(pathway) {
  Logger.log('📍 Generating sequence rationale for: "' + pathway.name + '"');

  try {
    var apiKey = getOpenAIKey_();

    // Build case sequence JSON with details
    var caseSequenceJson = pathway.caseSequence.map(function(caseId, index) {
      return {
        position: index + 1,
        case_id: caseId,
        case_title: pathway.caseTitles ? pathway.caseTitles[index] : 'Case Title',
        case_diagnosis: pathway.caseDiagnoses ? pathway.caseDiagnoses[index] : 'Unknown'
      };
    });

    var prompt = SEQUENCE_RATIONALE_PROMPT
      .replace('{PATHWAY_NAME}', pathway.name)
      .replace('{PATHWAY_DESCRIPTION}', pathway.description)
      .replace('{LOGIC_TYPE}', pathway.logicType || 'Unknown')
      .replace('{TARGET_LEARNER}', pathway.targetLearner || 'PGY1-3')
      .replace('{CASE_SEQUENCE_JSON}', JSON.stringify(caseSequenceJson, null, 2));

    Logger.log('🤖 Calling OpenAI to analyze sequence...');

    var response = callOpenAI_(prompt, apiKey);
    var rationale = parseOpenAIJSON_(response);

    Logger.log('✅ Sequence rationale generated!');
    Logger.log('📚 Overall Philosophy: "' + rationale.overall_sequence_philosophy + '"');

    return rationale;

  } catch (error) {
    Logger.log('❌ Sequence rationale error: ' + error.message);
    throw error;
  }
}

// ============================================================================
// API HELPER FUNCTIONS
// ============================================================================

/**
 * Call OpenAI API (reuses existing pattern)
 */
function callOpenAI_(prompt, apiKey) {
  var url = 'https://api.openai.com/v1/chat/completions';

  var payload = {
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are an expert medical education consultant. Return only valid JSON.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 2000
  };

  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + apiKey
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(url, options);
  var json = JSON.parse(response.getContentText());

  if (json.error) {
    throw new Error('OpenAI API Error: ' + json.error.message);
  }

  return json.choices[0].message.content;
}

/**
 * Parse JSON from OpenAI response
 */
function parseOpenAIJSON_(response) {
  // Remove markdown code blocks if present
  var cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    Logger.log('❌ JSON parse error: ' + error.message);
    Logger.log('Response: ' + response);
    throw error;
  }
}

/**
 * Get OpenAI API key (reuses existing pattern)
 */
function getOpenAIKey_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var settingsSheet = ss.getSheetByName('Settings');

  if (!settingsSheet) {
    throw new Error('Settings sheet not found');
  }

  var apiKey = settingsSheet.getRange('B2').getValue();

  if (!apiKey || !apiKey.toString().startsWith('sk-')) {
    throw new Error('Invalid OpenAI API key in Settings!B2');
  }

  return apiKey.toString().trim();
}

// ============================================================================
// TESTING FUNCTIONS
// ============================================================================

/**
 * Test the scoring engine
 */
function testScoringEngine() {
  Logger.log('🧪 Testing Scoring Engine');
  Logger.log('═══════════════════════════════════════════════════════════════');

  var testPathway = {
    id: 'PATH_TEST_001',
    name: 'The Diagnostic Traps Collection',
    description: 'Cases that fool even expert clinicians - chest pain that isn\'t MI, SOB that isn\'t cardiac, etc.',
    logicType: 'Cognitive Bias Exposure',
    caseIds: ['CP101', 'CP102', 'CP103', 'CP104', 'CP105', 'CP106', 'SOB201', 'SOB202'],
    caseSequence: ['CP101', 'CP102', 'CP103', 'CP104', 'CP105', 'CP106', 'SOB201', 'SOB202'],
    targetLearner: 'PGY2-3',
    learningOutcomes: [
      'Recognize anchoring bias in real-time',
      'Apply systematic "break the pattern" thinking',
      'Identify diagnostic red flags that contradict initial impression'
    ],
    progressionStyle: 'Sequential'
  };

  var scoringResult = scorePathway(testPathway);

  Logger.log('═══════════════════════════════════════════════════════════════');
  Logger.log('📊 COMPLETE SCORING RESULT:');
  Logger.log(JSON.stringify(scoringResult, null, 2));
  Logger.log('═══════════════════════════════════════════════════════════════');
}

/**
 * Test sequence rationale generator
 */
function testSequenceRationale() {
  Logger.log('🧪 Testing Sequence Rationale Generator');
  Logger.log('═══════════════════════════════════════════════════════════════');

  var testPathway = {
    name: 'The Diagnostic Traps Collection',
    description: 'Cases that fool even expert clinicians - presentations that look like Diagnosis A but are actually Diagnosis B',
    logicType: 'Cognitive Bias Exposure',
    targetLearner: 'PGY2-3',
    caseSequence: ['CP101', 'CP102', 'CP103', 'CP104', 'CP105', 'CP106', 'SOB201', 'SOB202'],
    caseTitles: [
      '58M Chest Pain - Stable',
      '45F Chest Pain - Mild SOB',
      '62M Chest Pain - Classic Presentation',
      '35F Chest Pain - Anxiety',
      '51M Chest Pain - Chronic',
      '67M Chest Pain - Severe',
      '55M Shortness of Breath - Acute',
      '72F Shortness of Breath - Chronic'
    ],
    caseDiagnoses: [
      'Aortic Dissection (NOT MI)',
      'Pulmonary Embolism (NOT MI)',
      'Pneumonia with Pleurisy (NOT MI)',
      'Panic Attack (NOT MI)',
      'GERD (NOT MI)',
      'STEMI (Finally, actually MI!)',
      'Pulmonary Embolism (NOT CHF)',
      'CHF (Actually cardiac!)'
    ]
  };

  var rationale = generateSequenceRationale(testPathway);

  Logger.log('═══════════════════════════════════════════════════════════════');
  Logger.log('📊 COMPLETE SEQUENCE RATIONALE:');
  Logger.log(JSON.stringify(rationale, null, 2));
  Logger.log('═══════════════════════════════════════════════════════════════');
}
