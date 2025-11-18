#!/usr/bin/env node

/**
 * PHASE 2: SCORING ENGINE
 *
 * Calculates 3-factor scores and generates AI persuasion narratives
 */

const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const prompts = require('./phase2_scoring_prompts.cjs');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Score a pathway across all 3 dimensions
 */
async function scorePathway(pathway) {
  console.log(`\n🎯 Scoring pathway: "${pathway.name}"\n`);

  try {
    // 1. Educational Value Score
    console.log('📊 Calculating Educational Value...');
    const eduPrompt = prompts.EDUCATIONAL_VALUE_PROMPT
      .replace('{PATHWAY_NAME}', pathway.name)
      .replace('{PATHWAY_DESCRIPTION}', pathway.description)
      .replace('{CASE_COUNT}', pathway.caseIds.length)
      .replace('{TARGET_LEARNER}', pathway.targetLearner || 'PGY1-3')
      .replace('{LEARNING_OUTCOMES}', JSON.stringify(pathway.learningOutcomes || []))
      .replace('{CASE_SEQUENCE}', JSON.stringify(pathway.caseSequence || []));

    const eduResponse = await callOpenAI(eduPrompt);
    const eduScore = parseJSON(eduResponse);

    console.log(`   ✅ Educational Value: ${eduScore.educational_value_score}/10`);

    // 2. Novelty Score
    console.log('💡 Calculating Novelty...');
    const noveltyPrompt = prompts.NOVELTY_PROMPT
      .replace('{PATHWAY_NAME}', pathway.name)
      .replace('{PATHWAY_DESCRIPTION}', pathway.description)
      .replace('{CASE_COUNT}', pathway.caseIds.length)
      .replace('{LOGIC_TYPE}', pathway.logicType || 'Unknown');

    const noveltyResponse = await callOpenAI(noveltyPrompt);
    const noveltyScore = parseJSON(noveltyResponse);

    console.log(`   ✅ Novelty: ${noveltyScore.novelty_score}/10`);

    // 3. Market Validation Score
    console.log('📈 Calculating Market Validation...');
    const marketPrompt = prompts.MARKET_VALIDATION_PROMPT
      .replace('{PATHWAY_NAME}', pathway.name)
      .replace('{PATHWAY_DESCRIPTION}', pathway.description)
      .replace('{TARGET_LEARNER}', pathway.targetLearner || 'PGY1-3')
      .replace('{PROGRESSION_STYLE}', pathway.progressionStyle || 'Sequential');

    const marketResponse = await callOpenAI(marketPrompt);
    const marketScore = parseJSON(marketResponse);

    console.log(`   ✅ Market Validation: ${marketScore.market_validation_score}/10`);

    // 4. Calculate Composite Score
    const compositeScore = calculateCompositeScore(
      eduScore.educational_value_score,
      noveltyScore.novelty_score,
      marketScore.market_validation_score
    );

    console.log(`\n🏆 Composite Score: ${compositeScore.score}/10 (${compositeScore.tier})`);

    // 5. Generate Persuasion Narrative
    console.log('\n✍️  Generating AI Persuasion Narrative...');
    const persuasionPrompt = prompts.PERSUASION_NARRATIVE_PROMPT
      .replace('{PATHWAY_NAME}', pathway.name)
      .replace('{PATHWAY_DESCRIPTION}', pathway.description)
      .replace('{CASE_COUNT}', pathway.caseIds.length)
      .replace('{EDU_SCORE}', eduScore.educational_value_score)
      .replace('{NOVELTY_SCORE}', noveltyScore.novelty_score)
      .replace('{MARKET_SCORE}', marketScore.market_validation_score);

    const persuasionResponse = await callOpenAI(persuasionPrompt);
    const persuasion = parseJSON(persuasionResponse);

    console.log(`\n💬 Persuasion: "${persuasion.persuasion_narrative}"\n`);

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
    console.error('❌ Scoring error:', error.message);
    throw error;
  }
}

/**
 * Calculate composite score with weighted formula
 */
function calculateCompositeScore(eduScore, noveltyScore, marketScore) {
  const weights = {
    educational: 0.50,  // 50%
    novelty: 0.25,      // 25%
    market: 0.25        // 25%
  };

  const composite =
    (eduScore * weights.educational) +
    (noveltyScore * weights.novelty) +
    (marketScore * weights.market);

  const tier = getTier(composite);

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
function getTier(score) {
  if (score >= 9.0) return 'S-Tier (Must Build)';
  if (score >= 8.0) return 'A-Tier (Highly Recommended)';
  if (score >= 7.0) return 'B-Tier (Good)';
  if (score >= 6.0) return 'C-Tier (Consider)';
  return 'D-Tier (Low Priority)';
}

/**
 * Call OpenAI API
 */
async function callOpenAI(prompt) {
  const response = await openai.chat.completions.create({
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
    max_tokens: 1000
  });

  return response.choices[0].message.content;
}

/**
 * Parse JSON from OpenAI response
 */
function parseJSON(response) {
  // Remove markdown code blocks if present
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
 * Test the scoring engine
 */
async function testScoringEngine() {
  console.log('🧪 Testing Scoring Engine\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const testPathway = {
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

  const scoringResult = await scorePathway(testPathway);

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📊 COMPLETE SCORING RESULT:\n');
  console.log(JSON.stringify(scoringResult, null, 2));
  console.log('\n═══════════════════════════════════════════════════════════════\n');

  // Save result
  const outputPath = path.join(__dirname, '../data/test_pathway_scoring.json');
  fs.writeFileSync(outputPath, JSON.stringify(scoringResult, null, 2));
  console.log(`💾 Saved result to: ${outputPath}\n`);
}

// Run test if executed directly
if (require.main === module) {
  testScoringEngine().catch(console.error);
}

module.exports = {
  scorePathway,
  calculateCompositeScore,
  getTier
};
