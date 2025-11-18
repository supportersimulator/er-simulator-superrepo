/**
 * Complexity Scorer
 *
 * Calculates scenario complexity (0-15 scale) based on:
 * - Patient factors (age extremes, pregnancy, comorbidities)
 * - Diagnosis factors (rare conditions, multisystem involvement)
 * - Acuity factors (stable → critical)
 * - Clinical complexity (number of interventions, complications)
 *
 * Used to sequence cases from simple → complex within pathways
 */

const { extractAge } = require('./diagnosisClassifier.cjs');

// Severity keywords
const ACUITY_KEYWORDS = {
  critical: ['critical', 'life-threatening', 'cardiac arrest', 'code blue', 'unresponsive', 'shock', 'severe'],
  emergent: ['emergent', 'urgent', 'acute', 'emergency', 'immediate', 'rapid'],
  urgent: ['unstable', 'deteriorating', 'worsening', 'concerning'],
  stable: ['stable', 'stable condition', 'routine', 'uncomplicated']
};

// Rare/complex conditions (higher complexity)
const RARE_CONDITIONS = [
  'rare', 'unusual', 'atypical', 'complex', 'complicated',
  'multisystem', 'multi-organ', 'septic shock', 'cardiogenic shock',
  'subarachnoid hemorrhage', 'aortic dissection', 'ruptured aaa',
  'massive pe', 'stemi with complications', 'malignant hyperthermia'
];

// Comorbidity keywords
const COMORBIDITY_KEYWORDS = [
  'diabetic', 'hypertensive', 'copd', 'chf', 'renal failure',
  'immunocompromised', 'cancer', 'chemotherapy', 'transplant',
  'multiple comorbidities'
];

// Pregnancy adds complexity
const PREGNANCY_KEYWORDS = [
  'pregnant', 'pregnancy', 'gravid', 'prenatal', 'obstetric',
  'eclampsia', 'preeclampsia'
];

function detectAcuity(text) {
  const lower = text.toLowerCase();

  if (ACUITY_KEYWORDS.critical.some(k => lower.includes(k))) {
    return 'critical';
  }
  if (ACUITY_KEYWORDS.emergent.some(k => lower.includes(k))) {
    return 'emergent';
  }
  if (ACUITY_KEYWORDS.urgent.some(k => lower.includes(k))) {
    return 'urgent';
  }
  if (ACUITY_KEYWORDS.stable.some(k => lower.includes(k))) {
    return 'stable';
  }

  // Default to urgent if can't determine
  return 'urgent';
}

function detectRareCondition(text) {
  const lower = text.toLowerCase();
  return RARE_CONDITIONS.some(k => lower.includes(k));
}

function detectComorbidities(text) {
  const lower = text.toLowerCase();
  let count = 0;
  for (const keyword of COMORBIDITY_KEYWORDS) {
    if (lower.includes(keyword)) count++;
  }
  return count;
}

function detectPregnancy(text) {
  const lower = text.toLowerCase();
  return PREGNANCY_KEYWORDS.some(k => lower.includes(k));
}

function detectMultisystem(text) {
  const lower = text.toLowerCase();
  return lower.includes('multisystem') || lower.includes('multi-system') || lower.includes('multi-organ');
}

function calculateComplexity(scenario) {
  let score = 0;

  const sparkTitle = scenario.sparkTitle || scenario.spark_title || '';
  const revealTitle = scenario.revealTitle || scenario.reveal_title || '';
  const combinedText = `${sparkTitle} ${revealTitle}`;

  // 1. Age factors (0-2 points)
  const age = extractAge(sparkTitle);
  if (age !== null) {
    if (age > 75 || age < 2) {
      score += 2; // Very young or very old = complex
    } else if (age > 65 || age < 5) {
      score += 1; // Elderly or young child = moderately complex
    }
  }

  // 2. Pregnancy (0-2 points)
  if (detectPregnancy(combinedText)) {
    score += 2;
  }

  // 3. Acuity level (0-3 points)
  const acuity = detectAcuity(combinedText);
  const acuityScores = {
    'stable': 0,
    'urgent': 1,
    'emergent': 2,
    'critical': 3
  };
  score += acuityScores[acuity] || 1;

  // 4. Rare/complex condition (0-2 points)
  if (detectRareCondition(combinedText)) {
    score += 2;
  }

  // 5. Multisystem involvement (0-2 points)
  if (detectMultisystem(combinedText)) {
    score += 2;
  }

  // 6. Comorbidities (0-2 points)
  const comorbidityCount = detectComorbidities(combinedText);
  score += Math.min(comorbidityCount, 2);

  // 7. Clinical keywords indicating complexity (0-2 points)
  const complexityKeywords = [
    'complications', 'deteriorating', 'failed', 'refractory',
    'resistant', 'advanced', 'severe'
  ];
  let complexityCount = 0;
  for (const keyword of complexityKeywords) {
    if (combinedText.toLowerCase().includes(keyword)) {
      complexityCount++;
    }
  }
  score += Math.min(Math.floor(complexityCount / 2), 2);

  // Cap at 15
  score = Math.min(score, 15);

  return {
    score,
    age,
    acuity,
    isRare: detectRareCondition(combinedText),
    isMultisystem: detectMultisystem(combinedText),
    hasComorbidities: comorbidityCount > 0,
    isPregnancy: detectPregnancy(combinedText),
    breakdown: {
      ageScore: age > 75 || age < 2 ? 2 : (age > 65 || age < 5 ? 1 : 0),
      pregnancyScore: detectPregnancy(combinedText) ? 2 : 0,
      acuityScore: acuityScores[acuity] || 1,
      rareScore: detectRareCondition(combinedText) ? 2 : 0,
      multisystemScore: detectMultisystem(combinedText) ? 2 : 0,
      comorbidityScore: Math.min(comorbidityCount, 2),
      clinicalComplexityScore: Math.min(Math.floor(complexityCount / 2), 2)
    }
  };
}

function getComplexityLabel(score) {
  if (score <= 3) return 'Simple';
  if (score <= 6) return 'Moderate';
  if (score <= 9) return 'Intermediate';
  if (score <= 12) return 'Advanced';
  return 'Complex';
}

function compareComplexity(scenarioA, scenarioB) {
  const complexityA = calculateComplexity(scenarioA);
  const complexityB = calculateComplexity(scenarioB);

  // Return -1 if A is simpler (should come first)
  // Return 1 if B is simpler (should come first)
  // Return 0 if equal
  return complexityA.score - complexityB.score;
}

module.exports = {
  calculateComplexity,
  getComplexityLabel,
  compareComplexity,
  detectAcuity,
  detectRareCondition,
  detectMultisystem,
  detectPregnancy,
  detectComorbidities
};
