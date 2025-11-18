#!/usr/bin/env node

/**
 * PHASE 2: CASE SEQUENCE RATIONALE GENERATOR
 *
 * Explains WHY each case is positioned where it is in the pathway
 */

const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const SEQUENCE_RATIONALE_PROMPT = `
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

/**
 * Generate sequence rationale for a pathway
 */
async function generateSequenceRationale(pathway) {
  console.log(`\n📍 Generating sequence rationale for: "${pathway.name}"\n`);

  try {
    // Build case sequence JSON with details
    const caseSequenceJson = pathway.caseSequence.map((caseId, index) => ({
      position: index + 1,
      case_id: caseId,
      case_title: pathway.caseTitles ? pathway.caseTitles[index] : 'Case Title',
      case_diagnosis: pathway.caseDiagnoses ? pathway.caseDiagnoses[index] : 'Unknown'
    }));

    const prompt = SEQUENCE_RATIONALE_PROMPT
      .replace('{PATHWAY_NAME}', pathway.name)
      .replace('{PATHWAY_DESCRIPTION}', pathway.description)
      .replace('{LOGIC_TYPE}', pathway.logicType || 'Unknown')
      .replace('{TARGET_LEARNER}', pathway.targetLearner || 'PGY1-3')
      .replace('{CASE_SEQUENCE_JSON}', JSON.stringify(caseSequenceJson, null, 2));

    console.log('🤖 Calling OpenAI to analyze sequence...\n');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert medical educator specializing in curriculum sequencing. Return only valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const rationaleText = response.choices[0].message.content;
    const rationale = parseJSON(rationaleText);

    console.log('✅ Sequence rationale generated!\n');
    console.log(`📚 Overall Philosophy: "${rationale.overall_sequence_philosophy}"\n`);

    // Display case rationales
    console.log('📍 CASE-BY-CASE RATIONALE:\n');
    rationale.case_rationales.forEach(cr => {
      console.log(`${cr.position}. ${cr.case_id} - ${cr.case_title}`);
      console.log(`   Why here: ${cr.position_rationale}`);
      console.log(`   Builds on: ${cr.prerequisites}`);
      console.log(`   Advances: ${cr.progression_logic}`);
      console.log(`   Prepares for: ${cr.prepares_for}\n`);
    });

    return rationale;

  } catch (error) {
    console.error('❌ Sequence rationale error:', error.message);
    throw error;
  }
}

/**
 * Parse JSON from OpenAI response
 */
function parseJSON(response) {
  let cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('❌ JSON parse error:', error.message);
    console.error('Response:', response);
    throw error;
  }
}

/**
 * Test the sequence rationale generator
 */
async function testSequenceRationale() {
  console.log('🧪 Testing Sequence Rationale Generator\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const testPathway = {
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

  const rationale = await generateSequenceRationale(testPathway);

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📊 COMPLETE SEQUENCE RATIONALE:\n');
  console.log(JSON.stringify(rationale, null, 2));
  console.log('\n═══════════════════════════════════════════════════════════════\n');

  // Save result
  const fs = require('fs');
  const path = require('path');
  const outputPath = path.join(__dirname, '../data/test_sequence_rationale.json');
  fs.writeFileSync(outputPath, JSON.stringify(rationale, null, 2));
  console.log(`💾 Saved result to: ${outputPath}\n`);
}

// Run test if executed directly
if (require.main === module) {
  testSequenceRationale().catch(console.error);
}

module.exports = {
  generateSequenceRationale
};
