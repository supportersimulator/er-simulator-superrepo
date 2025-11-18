#!/usr/bin/env node

/**
 * PHASE 2: AI SCORING & PERSUASION PROMPTS
 *
 * Three-factor scoring system:
 * 1. Educational Value (50%)
 * 2. Novelty (25%)
 * 3. Market Validation (25%)
 */

const EDUCATIONAL_VALUE_PROMPT = `
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

const NOVELTY_PROMPT = `
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

const MARKET_VALIDATION_PROMPT = `
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

const PERSUASION_NARRATIVE_PROMPT = `
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

module.exports = {
  EDUCATIONAL_VALUE_PROMPT,
  NOVELTY_PROMPT,
  MARKET_VALIDATION_PROMPT,
  PERSUASION_NARRATIVE_PROMPT
};
