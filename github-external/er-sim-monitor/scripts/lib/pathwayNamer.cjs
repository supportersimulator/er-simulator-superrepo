/**
 * Pathway Namer
 *
 * Generates OUTCOME-FOCUSED marketing names for case series pathways.
 * Names appeal to organizational decision-makers (boards, program directors)
 * by describing the RESULT STATE they want to achieve.
 *
 * Philosophy: "Sell the result, not the process"
 */

// Pathway names organized by system/category
// Format: "Desired Outcome State" that organizations want to achieve
const PATHWAY_NAMES = {
  // Cardiovascular pathways
  CARD: {
    default: 'Cardiac Excellence',
    foundational: 'Cardiac Mastery Foundations',
    advanced: 'Advanced Cardiac Decision-Making',
    critical: 'Life-Saving Cardiac Interventions'
  },

  // Respiratory pathways
  RESP: {
    default: 'Respiratory Excellence',
    foundational: 'Airway & Breathing Mastery',
    advanced: 'Advanced Respiratory Management',
    critical: 'Critical Airway Rescue'
  },

  // Neurological pathways
  NEUR: {
    default: 'Neurological Excellence',
    foundational: 'Stroke & Neuro Foundations',
    advanced: 'Advanced Neuro Decision-Making',
    critical: 'Time-Critical Neuro Emergencies'
  },

  // Gastrointestinal pathways
  GAST: {
    default: 'GI Emergency Excellence',
    foundational: 'Acute Abdomen Mastery',
    advanced: 'Complex GI Management',
    critical: 'Surgical Emergency Recognition'
  },

  // Renal/Genitourinary pathways
  RENA: {
    default: 'Renal & GU Excellence',
    foundational: 'Kidney Emergency Foundations',
    advanced: 'Advanced Renal Management'
  },

  // Endocrine pathways
  ENDO: {
    default: 'Metabolic Excellence',
    foundational: 'Endocrine Emergency Mastery',
    advanced: 'Complex Metabolic Management',
    critical: 'Life-Threatening Endocrine Crises'
  },

  // Hematology/Oncology pathways
  HEME: {
    default: 'Hematologic Excellence',
    foundational: 'Bleeding & Clotting Mastery',
    advanced: 'Advanced Hematologic Management'
  },

  // Musculoskeletal pathways
  MUSC: {
    default: 'Orthopedic Excellence',
    foundational: 'MSK Emergency Foundations',
    advanced: 'Complex Orthopedic Management'
  },

  // Dermatology pathways
  DERM: {
    default: 'Dermatologic Excellence',
    foundational: 'Skin Emergency Mastery'
  },

  // Infectious Disease pathways
  INFD: {
    default: 'Sepsis Excellence',
    foundational: 'Infection Control Mastery',
    advanced: 'Advanced Sepsis Management',
    critical: 'Life-Saving Infection Response'
  },

  // Immunology/Allergy pathways
  IMMU: {
    default: 'Anaphylaxis Excellence',
    foundational: 'Allergic Emergency Mastery',
    critical: 'Rapid Anaphylaxis Response'
  },

  // Obstetrics pathways
  OBST: {
    default: 'Maternal Safety Excellence',
    foundational: 'OB Emergency Foundations',
    advanced: 'High-Risk OB Management',
    critical: 'Life-Saving Maternal Interventions'
  },

  // Gynecology pathways
  GYNE: {
    default: 'Gynecologic Excellence',
    foundational: 'GYN Emergency Foundations',
    advanced: 'Complex GYN Management'
  },

  // Trauma pathways
  TRAU: {
    default: 'Trauma Excellence',
    foundational: 'ATLS Mastery',
    advanced: 'Advanced Trauma Management',
    critical: 'Life-Saving Trauma Interventions'
  },

  // Toxicology pathways
  TOXI: {
    default: 'Toxicology Excellence',
    foundational: 'Overdose Management Foundations',
    advanced: 'Advanced Toxicology Management',
    critical: 'Critical Poisoning Response'
  },

  // Psychiatry pathways
  PSYC: {
    default: 'Behavioral Health Excellence',
    foundational: 'Psychiatric Emergency Foundations',
    advanced: 'Complex Behavioral Management',
    critical: 'Crisis De-escalation Mastery'
  },

  // Environmental pathways
  ENVI: {
    default: 'Environmental Emergency Excellence',
    foundational: 'Environmental Injury Foundations',
    advanced: 'Complex Environmental Management'
  },

  // Multisystem pathways
  MULT: {
    default: 'Comprehensive Emergency Excellence',
    foundational: 'Multi-System Foundations',
    advanced: 'Complex Multi-System Management',
    critical: 'Critical Multi-Organ Failure'
  }
};

// Special pathway names for communication/patient experience
const COMMUNICATION_PATHWAY_NAMES = {
  // Primary patient experience pathway
  patient_experience: {
    default: 'Exceptional Patient Experience',
    foundational: 'Patient Communication Foundations',
    advanced: 'Advanced Empathy & Engagement',
    critical: 'Difficult Conversation Mastery'
  },

  // Specific communication focus areas
  breaking_bad_news: 'Compassionate Communication Excellence',
  angry_patient: 'De-escalation & Safety Excellence',
  shared_decision: 'Patient Partnership Excellence',
  cultural_competency: 'Inclusive Care Excellence',
  end_of_life: 'Palliative Care Excellence'
};

// Market value priorities (what sells to decision-makers)
const MARKET_VALUE_PATHWAYS = {
  // HCAHPS-focused pathways
  hcahps: {
    default: 'Superior Patient Satisfaction',
    advanced: 'HCAHPS Score Optimization'
  },

  // Litigation risk reduction
  litigation: {
    default: 'Risk Mitigation Excellence',
    advanced: 'Defensive Medicine Mastery'
  },

  // Cost reduction pathways
  cost_reduction: {
    default: 'Cost-Effective Care Excellence',
    advanced: 'Length of Stay Optimization'
  },

  // Readmission prevention
  readmission: {
    default: 'Readmission Prevention Excellence',
    advanced: 'Transition of Care Mastery'
  }
};

/**
 * Determine pathway complexity tier based on scenario priority and complexity
 */
function getPathwayTier(priority, complexity) {
  // Foundational: High priority (9-10), regardless of complexity
  if (priority >= 9) {
    return 'foundational';
  }

  // Critical: High complexity (12+)
  if (complexity >= 12) {
    return 'critical';
  }

  // Advanced: Moderate-high complexity (7-11)
  if (complexity >= 7) {
    return 'advanced';
  }

  // Default: Standard cases
  return 'default';
}

/**
 * Generate pathway name for a given scenario
 */
function generatePathwayName(scenario) {
  const system = scenario.system;
  const priority = scenario.priority || 5;
  const complexity = scenario.complexity || 5;
  const tier = getPathwayTier(priority, complexity);

  // Check if this is a communication/patient experience case
  const combinedText = (scenario.sparkTitle + ' ' + scenario.revealTitle).toLowerCase();
  if (combinedText.includes('patient communication') ||
      combinedText.includes('patient experience') ||
      combinedText.includes('breaking bad news') ||
      combinedText.includes('angry patient') ||
      combinedText.includes('difficult conversation')) {
    return COMMUNICATION_PATHWAY_NAMES.patient_experience[tier] ||
           COMMUNICATION_PATHWAY_NAMES.patient_experience.default;
  }

  // Get pathway names for this system
  const pathwaySet = PATHWAY_NAMES[system];
  if (!pathwaySet) {
    return 'Emergency Medicine Excellence';
  }

  // Return tier-specific name or default
  return pathwaySet[tier] || pathwaySet.default;
}

/**
 * Group scenarios by pathway name
 * This enables "Exceptional Patient Experience" to contain all communication cases
 */
function groupByPathway(scenarios) {
  const pathways = {};

  for (const scenario of scenarios) {
    const pathwayName = generatePathwayName(scenario);

    if (!pathways[pathwayName]) {
      pathways[pathwayName] = [];
    }

    pathways[pathwayName].push({
      ...scenario,
      pathwayName
    });
  }

  return pathways;
}

/**
 * Generate pathway metadata for Django/API export
 */
function generatePathwayMetadata(pathwayName, scenarios) {
  // Calculate average priority and complexity
  const avgPriority = scenarios.reduce((sum, s) => sum + (s.priority || 5), 0) / scenarios.length;
  const avgComplexity = scenarios.reduce((sum, s) => sum + (s.complexity || 5), 0) / scenarios.length;

  // Count foundational cases
  const foundationalCount = scenarios.filter(s => s.isFoundational).length;
  const criticalPearlCount = scenarios.filter(s => s.isCriticalPearl).length;

  // Determine pathway tier
  const tier = getPathwayTier(avgPriority, avgComplexity);

  return {
    name: pathwayName,
    tier,
    scenarioCount: scenarios.length,
    avgPriority: Math.round(avgPriority * 10) / 10,
    avgComplexity: Math.round(avgComplexity * 10) / 10,
    foundationalCases: foundationalCount,
    criticalPearls: criticalPearlCount,
    firstCaseId: scenarios[0].newId || scenarios[0].currentCaseId,
    lastCaseId: scenarios[scenarios.length - 1].newId || scenarios[scenarios.length - 1].currentCaseId,
    description: generatePathwayDescription(pathwayName, scenarios),
    marketingPitch: generateMarketingPitch(pathwayName, scenarios)
  };
}

/**
 * Generate pathway description (for clinician users)
 */
function generatePathwayDescription(pathwayName, scenarios) {
  const count = scenarios.length;
  const foundational = scenarios.filter(s => s.isFoundational).length;

  if (pathwayName.includes('Patient Experience')) {
    return count + ' progressive communication scenarios designed to transform patient interactions. ' +
           'Starts with foundational empathy skills (' + foundational + ' cases), advances to complex conversations.';
  }

  return count + ' progressive scenarios building from fundamental concepts (' + foundational + ' foundational cases) ' +
         'to advanced clinical decision-making. Designed for mastery-based learning.';
}

/**
 * Generate marketing pitch (for decision-makers/buyers)
 */
function generateMarketingPitch(pathwayName, scenarios) {
  // Extract outcome focus from pathway name
  const outcome = pathwayName;

  if (pathwayName.includes('Patient Experience')) {
    return 'Transform HCAHPS scores and reduce patient complaints through evidence-based communication training. ' +
           'Your staff will master the difficult conversations that drive satisfaction scores and reduce litigation risk.';
  }

  if (pathwayName.includes('Cardiac')) {
    return 'Reduce missed MI diagnoses and improve door-to-balloon times. ' +
           'Your team will master time-critical cardiac interventions that save lives and reduce liability.';
  }

  if (pathwayName.includes('Sepsis')) {
    return 'Reduce sepsis mortality and meet core measures compliance. ' +
           'Your staff will master early recognition and intervention protocols that improve outcomes and reduce penalties.';
  }

  if (pathwayName.includes('Trauma')) {
    return 'Improve trauma outcomes and reduce preventable deaths. ' +
           'Your team will master ATLS protocols and life-saving interventions.';
  }

  // Generic outcome-focused pitch
  return 'Achieve ' + outcome + ' through progressive, mastery-based training. ' +
         'Your team will build confidence and competence from foundations to advanced practice.';
}

module.exports = {
  generatePathwayName,
  groupByPathway,
  generatePathwayMetadata,
  getPathwayTier,
  PATHWAY_NAMES,
  COMMUNICATION_PATHWAY_NAMES,
  MARKET_VALUE_PATHWAYS
};
