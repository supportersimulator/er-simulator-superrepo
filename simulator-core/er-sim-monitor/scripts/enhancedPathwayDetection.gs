/**
 * ENHANCED PATHWAY DETECTION SYSTEM
 *
 * This implements high-sensitivity, clinically granular pathway discovery
 * Goal: Find 7±3 meaningful pathways that are more specific than just system-based
 *
 * Detection strategies:
 * 1. Diagnosis-specific clusters (e.g., "ACS Spectrum", "Heart Failure Variants")
 * 2. Presentation-based pathways (e.g., "Undifferentiated Chest Pain", "Dyspnea Workup")
 * 3. Procedural skill pathways (e.g., "Airway Management Cases", "Resuscitation Skills")
 * 4. Age-demographic pathways (e.g., "Pediatric Emergencies", "Geriatric Syndromes")
 * 5. Acuity-based pathways (e.g., "Time-Critical Emergencies", "Diagnostic Challenges")
 * 6. Complexity-based pathways (e.g., "Multi-System Cases", "Atypical Presentations")
 * 7. Protocol-driven pathways (e.g., "ACLS Protocols", "PALS Algorithms")
 */

function identifyPathwayOpportunitiesEnhanced_(cases, systemDist) {
  const opportunities = [];

  // ========== DIAGNOSIS-SPECIFIC PATHWAYS ==========

  // Acute Coronary Syndrome Spectrum
  const acsCases = cases.filter(function(c) {
    const combined = (c.diagnosis || '' + ' ' + c.sparkTitle || '' + ' ' + c.learningOutcomes || '').toUpperCase();
    return combined.indexOf('STEMI') !== -1 ||
           combined.indexOf('NSTEMI') !== -1 ||
           combined.indexOf('UNSTABLE ANGINA') !== -1 ||
           combined.indexOf('MYOCARDIAL INFARCTION') !== -1 ||
           combined.indexOf('ACS') !== -1;
  });

  if (acsCases.length >= 4) {
    opportunities.push({
      id: 'acs_spectrum_001',
      name: 'Acute Coronary Syndrome Spectrum',
      logicType: 'diagnosis',
      icon: '🫀',
      confidence: acsCases.length >= 6 ? 0.95 : 0.85,
      caseCount: acsCases.length,
      rationale: 'Comprehensive coverage of STEMI, NSTEMI, and unstable angina presentations for mastering ACS recognition and management',
      suggestedCases: acsCases.map(function(c) { return c.caseId; })
    });
  }

  // Heart Failure Variants
  const hfCases = cases.filter(function(c) {
    const combined = (c.diagnosis || '' + ' ' + c.sparkTitle || '').toUpperCase();
    return (combined.indexOf('HEART FAILURE') !== -1 ||
            combined.indexOf('CHF') !== -1 ||
            combined.indexOf('CONGESTIVE') !== -1 ||
            combined.indexOf('PULMONARY EDEMA') !== -1) &&
           combined.indexOf('RENAL') === -1; // Exclude renal failure
  });

  if (hfCases.length >= 3) {
    opportunities.push({
      id: 'hf_variants_001',
      name: 'Heart Failure: Acute & Chronic Variants',
      logicType: 'diagnosis',
      icon: '💔',
      confidence: hfCases.length >= 5 ? 0.90 : 0.80,
      caseCount: hfCases.length,
      rationale: 'Cases spanning acute decompensation, flash pulmonary edema, and chronic CHF exacerbations',
      suggestedCases: hfCases.map(function(c) { return c.caseId; })
    });
  }

  // Respiratory Distress Etiologies
  const copdAsthCases = cases.filter(function(c) {
    const combined = (c.diagnosis || '' + ' ' + c.sparkTitle || '').toUpperCase();
    return combined.indexOf('COPD') !== -1 ||
           combined.indexOf('ASTHMA') !== -1 ||
           combined.indexOf('BRONCHOSPASM') !== -1 ||
           combined.indexOf('EXACERBATION') !== -1;
  });

  if (copdAsthCases.length >= 3) {
    opportunities.push({
      id: 'obstructive_airway_001',
      name: 'Obstructive Airway Disease Mastery',
      logicType: 'diagnosis',
      icon: '🌬️',
      confidence: copdAsthCases.length >= 5 ? 0.88 : 0.78,
      caseCount: copdAsthCases.length,
      rationale: 'COPD and asthma exacerbations with varying severity and treatment approaches',
      suggestedCases: copdAsthCases.map(function(c) { return c.caseId; })
    });
  }

  // Sepsis & Infectious Emergencies
  const sepsisCases = cases.filter(function(c) {
    const combined = (c.diagnosis || '' + ' ' + c.sparkTitle || '' + ' ' + c.learningOutcomes || '').toUpperCase();
    return combined.indexOf('SEPSIS') !== -1 ||
           combined.indexOf('SEPTIC') !== -1 ||
           combined.indexOf('BACTEREMIA') !== -1 ||
           combined.indexOf('SEVERE INFECTION') !== -1;
  });

  if (sepsisCases.length >= 3) {
    opportunities.push({
      id: 'sepsis_001',
      name: 'Sepsis Recognition & Management',
      logicType: 'diagnosis',
      icon: '🦠',
      confidence: sepsisCases.length >= 5 ? 0.92 : 0.82,
      caseCount: sepsisCases.length,
      rationale: 'Time-critical sepsis cases requiring rapid source identification and bundle completion',
      suggestedCases: sepsisCases.map(function(c) { return c.caseId; })
    });
  }

  // Stroke & Neurovascular Emergencies
  const strokeCases = cases.filter(function(c) {
    const combined = (c.diagnosis || '' + ' ' + c.sparkTitle || '').toUpperCase();
    return combined.indexOf('STROKE') !== -1 ||
           combined.indexOf('CVA') !== -1 ||
           combined.indexOf('TIA') !== -1 ||
           combined.indexOf('CEREBROVASCULAR') !== -1;
  });

  if (strokeCases.length >= 3) {
    opportunities.push({
      id: 'stroke_001',
      name: 'Stroke & TIA: Time is Brain',
      logicType: 'diagnosis',
      icon: '🧠',
      confidence: strokeCases.length >= 5 ? 0.93 : 0.83,
      caseCount: strokeCases.length,
      rationale: 'Ischemic and hemorrhagic stroke presentations with thrombolytic decision-making',
      suggestedCases: strokeCases.map(function(c) { return c.caseId; })
    });
  }

  // ========== PRESENTATION-BASED PATHWAYS ==========

  // Undifferentiated Chest Pain
  const chestPainCases = cases.filter(function(c) {
    const spark = (c.sparkTitle || '').toUpperCase();
    const dx = (c.diagnosis || '').toUpperCase();
    return (spark.indexOf('CHEST PAIN') !== -1 || spark.indexOf('CHEST DISCOMFORT') !== -1) &&
           dx.indexOf('STEMI') === -1; // Exclude obvious MIs
  });

  if (chestPainCases.length >= 4) {
    opportunities.push({
      id: 'chest_pain_ddx_001',
      name: 'Undifferentiated Chest Pain: Diagnostic Mastery',
      logicType: 'presentation',
      icon: '💢',
      confidence: chestPainCases.length >= 6 ? 0.87 : 0.77,
      caseCount: chestPainCases.length,
      rationale: 'Wide differential diagnosis requiring systematic evaluation: cardiac, pulmonary, GI, MSK',
      suggestedCases: chestPainCases.map(function(c) { return c.caseId; })
    });
  }

  // Dyspnea Workup
  const dyspneaCases = cases.filter(function(c) {
    const spark = (c.sparkTitle || '').toUpperCase();
    return spark.indexOf('SHORT') !== -1 && spark.indexOf('BREATH') !== -1 ||
           spark.indexOf('DYSPNEA') !== -1 ||
           spark.indexOf('DIFFICULTY BREATHING') !== -1 ||
           spark.indexOf('CAN\'T BREATHE') !== -1;
  });

  if (dyspneaCases.length >= 4) {
    opportunities.push({
      id: 'dyspnea_workup_001',
      name: 'Dyspnea Differential: Systematic Approach',
      logicType: 'presentation',
      icon: '😮‍💨',
      confidence: dyspneaCases.length >= 6 ? 0.86 : 0.76,
      caseCount: dyspneaCases.length,
      rationale: 'Shortness of breath cases spanning cardiac, pulmonary, and metabolic etiologies',
      suggestedCases: dyspneaCases.map(function(c) { return c.caseId; })
    });
  }

  // Altered Mental Status
  const amsCases = cases.filter(function(c) {
    const combined = (c.sparkTitle || '' + ' ' + c.diagnosis || '').toUpperCase();
    return combined.indexOf('CONFUSED') !== -1 ||
           combined.indexOf('ALTERED') !== -1 ||
           combined.indexOf('UNRESPONSIVE') !== -1 ||
           combined.indexOf('LETHARGIC') !== -1 ||
           combined.indexOf('AMS') !== -1 ||
           combined.indexOf('MENTAL STATUS') !== -1;
  });

  if (amsCases.length >= 4) {
    opportunities.push({
      id: 'ams_workup_001',
      name: 'Altered Mental Status: Complete Workup',
      logicType: 'presentation',
      icon: '🤔',
      confidence: amsCases.length >= 6 ? 0.89 : 0.79,
      caseCount: amsCases.length,
      rationale: 'Systematic approach to AMS: metabolic, toxic, infectious, structural, and psychiatric causes',
      suggestedCases: amsCases.map(function(c) { return c.caseId; })
    });
  }

  // ========== ACUITY/TIME-SENSITIVITY PATHWAYS ==========

  // Life-Threatening Emergencies
  const criticalCases = cases.filter(function(c) {
    const combined = (c.diagnosis || '' + ' ' + c.sparkTitle || '' + ' ' + c.learningOutcomes || '').toUpperCase();
    return combined.indexOf('ARREST') !== -1 ||
           combined.indexOf('SHOCK') !== -1 ||
           combined.indexOf('UNSTABLE') !== -1 ||
           combined.indexOf('CRITICAL') !== -1 ||
           combined.indexOf('LIFE-THREATENING') !== -1 ||
           combined.indexOf('EMERGENCY') !== -1 && combined.indexOf('HYPERTENSIVE') !== -1;
  });

  if (criticalCases.length >= 5) {
    opportunities.push({
      id: 'critical_emergencies_001',
      name: 'Life-Threatening Emergencies: Rapid Assessment',
      logicType: 'acuity',
      icon: '🚨',
      confidence: criticalCases.length >= 7 ? 0.94 : 0.84,
      caseCount: criticalCases.length,
      rationale: 'High-acuity cases requiring immediate recognition and intervention within minutes',
      suggestedCases: criticalCases.map(function(c) { return c.caseId; })
    });
  }

  // ========== AGE-DEMOGRAPHIC PATHWAYS ==========

  // Pediatric Emergencies
  const pedsCases = cases.filter(function(c) {
    const combined = (c.sparkTitle || '' + ' ' + c.diagnosis || '' + ' ' + c.category || '').toUpperCase();
    const ageMatch = (c.sparkTitle || '').match(/\((\d+)\s*[MY]\)/i);
    const isPeds = (ageMatch && ((ageMatch[1].indexOf('M') !== -1) || (parseInt(ageMatch[1]) < 18)));

    return isPeds ||
           combined.indexOf('PEDIATRIC') !== -1 ||
           combined.indexOf('CHILD') !== -1 ||
           combined.indexOf('INFANT') !== -1 ||
           combined.indexOf('PEDS') !== -1;
  });

  if (pedsCases.length >= 4) {
    opportunities.push({
      id: 'pediatric_001',
      name: 'Pediatric Emergency Medicine Essentials',
      logicType: 'demographic',
      icon: '👶',
      confidence: pedsCases.length >= 6 ? 0.91 : 0.81,
      caseCount: pedsCases.length,
      rationale: 'Age-specific assessment, dosing, and management for pediatric emergencies',
      suggestedCases: pedsCases.map(function(c) { return c.caseId; })
    });
  }

  // Geriatric Syndromes
  const geriatricCases = cases.filter(function(c) {
    const ageMatch = (c.sparkTitle || '').match(/\((\d+)\s*[MY]\)/i);
    const isGeriatric = (ageMatch && ageMatch[1].indexOf('Y') !== -1 && parseInt(ageMatch[1]) >= 65);
    const combined = (c.diagnosis || '' + ' ' + c.learningOutcomes || '').toUpperCase();
    const hasGeriatricSyndrome = combined.indexOf('FALL') !== -1 ||
                                  combined.indexOf('DELIRIUM') !== -1 ||
                                  combined.indexOf('POLYPHARMACY') !== -1;

    return isGeriatric || hasGeriatricSyndrome;
  });

  if (geriatricCases.length >= 4) {
    opportunities.push({
      id: 'geriatric_001',
      name: 'Geriatric Emergencies & Atypical Presentations',
      logicType: 'demographic',
      icon: '👴',
      confidence: geriatricCases.length >= 6 ? 0.87 : 0.77,
      caseCount: geriatricCases.length,
      rationale: 'Age-related considerations: polypharmacy, atypical symptoms, and geriatric syndromes',
      suggestedCases: geriatricCases.map(function(c) { return c.caseId; })
    });
  }

  // ========== PROCEDURAL SKILL PATHWAYS ==========

  // Airway Management Cases
  const airwayCases = cases.filter(function(c) {
    const combined = (c.diagnosis || '' + ' ' + c.learningOutcomes || '').toUpperCase();
    return combined.indexOf('INTUBATION') !== -1 ||
           combined.indexOf('AIRWAY') !== -1 ||
           combined.indexOf('VENTILATION') !== -1 ||
           combined.indexOf('RSI') !== -1 ||
           combined.indexOf('MECHANICAL VENTILATOR') !== -1;
  });

  if (airwayCases.length >= 3) {
    opportunities.push({
      id: 'airway_mgmt_001',
      name: 'Advanced Airway Management Skills',
      logicType: 'procedural',
      icon: '🫁',
      confidence: airwayCases.length >= 5 ? 0.90 : 0.80,
      caseCount: airwayCases.length,
      rationale: 'Cases requiring intubation, difficult airway management, and post-intubation care',
      suggestedCases: airwayCases.map(function(c) { return c.caseId; })
    });
  }

  // Resuscitation Skills (ACLS)
  const aclsCases = cases.filter(function(c) {
    const combined = (c.sparkTitle || '' + ' ' + c.diagnosis || '' + ' ' + c.category || '').toUpperCase();
    return combined.indexOf('CARDIAC ARREST') !== -1 ||
           combined.indexOf('VTACH') !== -1 ||
           combined.indexOf('VFIB') !== -1 ||
           combined.indexOf('ASYSTOLE') !== -1 ||
           combined.indexOf('PEA') !== -1 ||
           combined.indexOf('ACLS') !== -1;
  });

  if (aclsCases.length >= 4) {
    opportunities.push({
      id: 'acls_protocol_001',
      name: 'ACLS Protocols: Cardiac Arrest Management',
      logicType: 'procedural',
      icon: '💓',
      confidence: aclsCases.length >= 6 ? 0.95 : 0.85,
      caseCount: aclsCases.length,
      rationale: 'Systematic practice of ACLS algorithms for VFib, VTach, PEA, and asystole',
      suggestedCases: aclsCases.map(function(c) { return c.caseId; })
    });
  }

  // Sort by confidence and return top 10
  opportunities.sort(function(a, b) { return b.confidence - a.confidence; });

  return opportunities.slice(0, 10);
}
