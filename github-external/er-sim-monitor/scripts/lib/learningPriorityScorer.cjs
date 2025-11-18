/**
 * Learning Priority Scorer
 *
 * Determines EDUCATIONAL PRIORITY independent of complexity.
 * Priority reflects what should be learned FIRST based on:
 * - Critical clinical pearls (e.g., no nitro in inferior MI)
 * - Common organizational pain points (e.g., patient communication)
 * - Residency curriculum standards
 * - High-impact teaching moments
 * - Market value for decision-makers (boards, program directors)
 *
 * Priority Scale: 1-10
 * 10 = Must learn FIRST (critical foundation, common pain point)
 * 5 = Standard teaching order
 * 1 = Can wait until later (nice to know, rare variant)
 *
 * Final Case_ID Sequence = Sort by PRIORITY DESC, then COMPLEXITY ASC
 * Result: High-priority simple cases first, then complexity increases
 */

// High-priority clinical pearls that MUST be taught first
const CRITICAL_TEACHING_POINTS = {
  // AMI variants with critical contraindications
  'inferior mi': {
    priority: 10,
    rationale: 'CRITICAL: Nitro contraindicated (preload dependent), RV involvement, must master first'
  },
  'inferior wall mi': {
    priority: 10,
    rationale: 'CRITICAL: Nitro contraindicated (preload dependent), foundational teaching'
  },
  'inferior myocardial infarction': {
    priority: 10,
    rationale: 'CRITICAL: Nitro contraindicated, must learn before other MI types'
  },
  'right ventricular infarction': {
    priority: 10,
    rationale: 'CRITICAL: Preload dependent, fluid management key, associated with inferior MI'
  },

  // Other high-priority cardiac
  'stemi': {
    priority: 9,
    rationale: 'Time-critical emergency, door-to-balloon time, foundational MI management'
  },
  'acute coronary syndrome': {
    priority: 9,
    rationale: 'Broad category, must differentiate subtypes, high frequency'
  },

  // High-priority respiratory emergencies
  'tension pneumothorax': {
    priority: 10,
    rationale: 'CRITICAL: Immediate needle decompression, life-threatening, cannot wait'
  },
  'pneumothorax': {
    priority: 8,
    rationale: 'Common emergency, must recognize early'
  },
  'severe asthma': {
    priority: 9,
    rationale: 'Common, life-threatening, frequent ED presentation'
  },
  'asthma exacerbation': {
    priority: 9,
    rationale: 'High volume, stepwise management critical'
  },

  // High-priority neuro emergencies
  'stroke': {
    priority: 10,
    rationale: 'CRITICAL: Time is brain, tPA window, high frequency, must master first'
  },
  'ischemic stroke': {
    priority: 10,
    rationale: 'Time-critical, tPA eligibility, foundational'
  },
  'hemorrhagic stroke': {
    priority: 9,
    rationale: 'Contraindication to tPA, must differentiate from ischemic'
  },
  'subarachnoid hemorrhage': {
    priority: 9,
    rationale: 'Worst headache of life, cannot miss, high mortality'
  },

  // High-priority GI emergencies
  'perforated': {
    priority: 9,
    rationale: 'Surgical emergency, peritonitis, time-critical'
  },
  'appendicitis': {
    priority: 9,
    rationale: 'Most common surgical emergency, high frequency'
  },
  'gi bleed': {
    priority: 9,
    rationale: 'High volume, hemodynamic instability, must stabilize'
  },

  // Trauma priorities
  'massive hemorrhage': {
    priority: 10,
    rationale: 'CRITICAL: ATLS priority, MTP activation, cannot delay'
  },
  'airway obstruction': {
    priority: 10,
    rationale: 'CRITICAL: Cannot breathe = cannot live, ATLS A priority'
  },
  'tension pneumothorax trauma': {
    priority: 10,
    rationale: 'CRITICAL: Immediate decompression, ATLS priority'
  },

  // Pediatric priorities
  'febrile infant': {
    priority: 10,
    rationale: 'CRITICAL: Sepsis risk, cannot miss, special considerations <28 days'
  },
  'kawasaki': {
    priority: 9,
    rationale: 'Cannot miss diagnosis, coronary aneurysm risk, time-sensitive'
  },
  'pediatric sepsis': {
    priority: 10,
    rationale: 'High mortality, rapid progression, must recognize early'
  },

  // Critical endocrine
  'dka': {
    priority: 10,
    rationale: 'CRITICAL: Life-threatening, common, complex management, cannot miss'
  },
  'diabetic ketoacidosis': {
    priority: 10,
    rationale: 'High mortality if missed, detailed protocol required'
  },
  'hypoglycemia': {
    priority: 10,
    rationale: 'Immediate intervention, brain damage risk, very common'
  },

  // Sepsis (universal priority)
  'sepsis': {
    priority: 10,
    rationale: 'CRITICAL: Time to antibiotics, high mortality, universal ED concern'
  },
  'septic shock': {
    priority: 10,
    rationale: 'Life-threatening, early goal-directed therapy, cannot delay'
  },

  // Anaphylaxis
  'anaphylaxis': {
    priority: 10,
    rationale: 'CRITICAL: Immediate epinephrine, airway compromise, cannot delay'
  }
};

// Patient communication priorities (for Patient Experience Pathway)
const COMMUNICATION_PRIORITIES = {
  'difficult conversation': {
    priority: 10,
    rationale: 'Top organizational complaint, board priority, critical for satisfaction scores'
  },
  'breaking bad news': {
    priority: 10,
    rationale: 'Most common complaint, high litigation risk, HCAHPS impact'
  },
  'angry patient': {
    priority: 10,
    rationale: 'Frequent pain point, de-escalation critical, violence prevention'
  },
  'empathy': {
    priority: 9,
    rationale: 'Foundation for all communication, HCAHPS driver, board priority'
  },
  'shared decision making': {
    priority: 9,
    rationale: 'Patient autonomy, reduces litigation, board-level priority'
  },
  'informed consent': {
    priority: 9,
    rationale: 'Legal requirement, frequent complaint, organizational risk'
  },
  'cultural sensitivity': {
    priority: 8,
    rationale: 'DEI initiative, organizational priority, patient safety'
  },
  'language barrier': {
    priority: 8,
    rationale: 'Common challenge, interpreter use, safety concern'
  },
  'family dynamics': {
    priority: 7,
    rationale: 'Frequent challenge, visitor policy conflicts'
  },
  'end of life': {
    priority: 10,
    rationale: 'Most emotionally charged, frequent complaint, palliative care integration'
  }
};

// Residency teaching sequence priorities
const RESIDENCY_CURRICULUM_PRIORITIES = {
  // EM Milestones - must master early
  'chest pain': {
    priority: 10,
    rationale: 'EM Milestone 1, most common chief complaint, cannot miss life threats'
  },
  'shortness of breath': {
    priority: 10,
    rationale: 'EM Milestone 1, high-risk chief complaint, multiple etiologies'
  },
  'altered mental status': {
    priority: 10,
    rationale: 'EM Milestone 1, broad differential, common presentation'
  },
  'abdominal pain': {
    priority: 9,
    rationale: 'EM Milestone 2, high volume, surgical vs non-surgical'
  },
  'headache': {
    priority: 9,
    rationale: 'EM Milestone 2, cannot miss SAH, high frequency'
  },
  'syncope': {
    priority: 9,
    rationale: 'EM Milestone 2, risk stratification critical, cardiac vs benign'
  },

  // Procedures - high priority skills
  'intubation': {
    priority: 10,
    rationale: 'Critical procedure, cannot have failure, must master early'
  },
  'central line': {
    priority: 9,
    rationale: 'Common procedure, infection risk, technique critical'
  },
  'chest tube': {
    priority: 9,
    rationale: 'Life-saving procedure, technique critical'
  }
};

// Market value priorities (what sells to decision-makers)
const MARKET_VALUE_PRIORITIES = {
  // High HCAHPS impact
  'patient satisfaction': {
    priority: 10,
    rationale: 'Direct revenue impact, CMS reimbursement tied to HCAHPS'
  },
  'wait time communication': {
    priority: 10,
    rationale: 'Top complaint, board priority, easy improvement'
  },
  'pain management': {
    priority: 10,
    rationale: 'HCAHPS question, frequent complaint, litigation risk'
  },

  // High litigation risk
  'missed diagnosis': {
    priority: 10,
    rationale: 'Most common lawsuit, organizational risk, teaching priority'
  },
  'documentation': {
    priority: 9,
    rationale: 'Legal protection, billing compliance, organizational mandate'
  },

  // High cost conditions
  'readmission': {
    priority: 9,
    rationale: 'CMS penalty, revenue loss, board priority'
  },
  'length of stay': {
    priority: 8,
    rationale: 'Cost driver, throughput, board metric'
  }
};

function calculateLearningPriority(scenario) {
  const sparkTitle = (scenario.sparkTitle || scenario.spark_title || '').toLowerCase();
  const revealTitle = (scenario.revealTitle || scenario.reveal_title || '').toLowerCase();
  const combinedText = `${sparkTitle} ${revealTitle}`;

  let highestPriority = 5; // Default: standard teaching order
  let rationales = [];

  // Check critical teaching points
  for (const [keyword, data] of Object.entries(CRITICAL_TEACHING_POINTS)) {
    if (combinedText.includes(keyword.toLowerCase())) {
      if (data.priority > highestPriority) {
        highestPriority = data.priority;
        rationales = [data.rationale];
      } else if (data.priority === highestPriority) {
        rationales.push(data.rationale);
      }
    }
  }

  // Check communication priorities
  for (const [keyword, data] of Object.entries(COMMUNICATION_PRIORITIES)) {
    if (combinedText.includes(keyword.toLowerCase())) {
      if (data.priority > highestPriority) {
        highestPriority = data.priority;
        rationales = [data.rationale];
      } else if (data.priority === highestPriority) {
        rationales.push(data.rationale);
      }
    }
  }

  // Check residency curriculum priorities
  for (const [keyword, data] of Object.entries(RESIDENCY_CURRICULUM_PRIORITIES)) {
    if (combinedText.includes(keyword.toLowerCase())) {
      if (data.priority > highestPriority) {
        highestPriority = data.priority;
        rationales = [data.rationale];
      } else if (data.priority === highestPriority) {
        rationales.push(data.rationale);
      }
    }
  }

  // Check market value priorities
  for (const [keyword, data] of Object.entries(MARKET_VALUE_PRIORITIES)) {
    if (combinedText.includes(keyword.toLowerCase())) {
      if (data.priority > highestPriority) {
        highestPriority = data.priority;
        rationales = [data.rationale];
      } else if (data.priority === highestPriority) {
        rationales.push(data.rationale);
      }
    }
  }

  return {
    priority: highestPriority,
    priorityLabel: getPriorityLabel(highestPriority),
    rationales: rationales.length > 0 ? rationales : ['Standard teaching order'],
    isCriticalPearl: highestPriority >= 9,
    isFoundational: highestPriority === 10
  };
}

function getPriorityLabel(priority) {
  if (priority === 10) return 'FOUNDATIONAL (Teach First!)';
  if (priority === 9) return 'High Priority (Early)';
  if (priority >= 7) return 'Above Average Priority';
  if (priority >= 5) return 'Standard Priority';
  return 'Lower Priority (Advanced)';
}

/**
 * Combined scoring for final sequence
 *
 * Sorting logic:
 * 1. PRIORITY DESC (10 → 1) - Foundational first
 * 2. COMPLEXITY ASC (0 → 15) - Simple first within same priority
 *
 * Result: High-priority simple cases → High-priority complex cases → Lower priority cases
 */
function calculateFinalSequenceScore(scenario) {
  const complexityScorer = require('./complexityScorer.cjs');

  const priority = calculateLearningPriority(scenario);
  const complexity = complexityScorer.calculateComplexity(scenario);

  // Final sort key: (priority * 100) - complexity
  // This ensures priority dominates, but complexity orders within priority
  const sequenceScore = (priority.priority * 100) - complexity.score;

  return {
    ...priority,
    complexity: complexity.score,
    complexityLabel: complexityScorer.getComplexityLabel(complexity.score),
    sequenceScore,
    sortPrimary: -priority.priority, // Negative for DESC sort (10 first)
    sortSecondary: complexity.score   // Positive for ASC sort (0 first)
  };
}

/**
 * Sort scenarios for optimal learning sequence
 * Use this for final Case_ID number assignment
 */
function sortByLearningSequence(scenarios) {
  return scenarios.map(s => ({
    ...s,
    sequencing: calculateFinalSequenceScore(s)
  })).sort((a, b) => {
    // Primary sort: Priority DESC (high priority first)
    if (a.sequencing.sortPrimary !== b.sequencing.sortPrimary) {
      return a.sequencing.sortPrimary - b.sequencing.sortPrimary;
    }
    // Secondary sort: Complexity ASC (simple first)
    return a.sequencing.sortSecondary - b.sequencing.sortSecondary;
  });
}

module.exports = {
  calculateLearningPriority,
  getPriorityLabel,
  calculateFinalSequenceScore,
  sortByLearningSequence,
  CRITICAL_TEACHING_POINTS,
  COMMUNICATION_PRIORITIES,
  RESIDENCY_CURRICULUM_PRIORITIES,
  MARKET_VALUE_PRIORITIES
};
