/**
 * Diagnosis Classifier
 *
 * Analyzes Reveal_Title to determine:
 * - Primary medical system (CARD, RESP, NEUR, etc.)
 * - Whether pediatric (based on age)
 * - Category if not system-based (TRAU, PSYC, TOXI)
 *
 * Uses keyword matching + pattern recognition
 */

const SYSTEM_KEYWORDS = {
  CARD: [
    'cardiac', 'heart', 'myocardial', 'infarction', 'angina', 'coronary',
    'arrhythmia', 'atrial', 'ventricular', 'tachycardia', 'fibrillation',
    'bradycardia', 'pericarditis', 'endocarditis', 'heart failure', 'ami',
    'stemi', 'nstemi', 'acs', 'acute coronary', 'chest pain'
  ],
  RESP: [
    'respiratory', 'pneumonia', 'pneumothorax', 'asthma', 'copd', 'pulmonary',
    'lung', 'breathing', 'shortness of breath', 'dyspnea', 'hypoxia',
    'respiratory distress', 'wheezing', 'cough', 'bronchitis', 'embolism pe'
  ],
  NEUR: [
    'stroke', 'neurological', 'seizure', 'headache', 'neuro', 'brain',
    'subarachnoid', 'hemorrhage', 'ischemic', 'weakness', 'paralysis',
    'confusion', 'altered mental', 'cva', 'tia', 'intracranial'
  ],
  GAST: [
    'abdominal', 'gastrointestinal', 'gi', 'bowel', 'intestinal', 'appendicitis',
    'cholecystitis', 'pancreatitis', 'diverticulitis', 'obstruction',
    'perforation', 'bleeding gi', 'vomiting', 'nausea', 'diarrhea', 'cholangitis'
  ],
  RENA: [
    'renal', 'kidney', 'urinary', 'uti', 'pyelonephritis', 'acute kidney',
    'renal failure', 'nephrolithiasis', 'hematuria', 'urethral', 'bladder'
  ],
  ENDO: [
    'diabetic', 'diabetes', 'hypoglycemia', 'hyperglycemia', 'dka',
    'thyroid', 'adrenal', 'endocrine', 'metabolic', 'electrolyte'
  ],
  HEME: [
    'anemia', 'bleeding', 'coagulation', 'thrombosis', 'hemophilia',
    'sickle cell', 'leukemia', 'lymphoma', 'hematologic'
  ],
  MUSC: [
    'fracture', 'musculoskeletal', 'orthopedic', 'bone', 'joint',
    'dislocation', 'sprain', 'strain', 'back pain', 'limb'
  ],
  DERM: [
    'rash', 'skin', 'dermatologic', 'cellulitis', 'abscess', 'burn',
    'wound', 'laceration', 'lesion'
  ],
  INFD: [
    'sepsis', 'infection', 'infectious', 'meningitis', 'encephalitis',
    'fever', 'bacteremia', 'viral', 'bacterial'
  ],
  IMMU: [
    'anaphylaxis', 'allergic', 'allergy', 'immunologic', 'hypersensitivity'
  ],
  OBST: [
    'pregnancy', 'pregnant', 'obstetric', 'prenatal', 'maternal',
    'eclampsia', 'preeclampsia', 'labor', 'delivery', 'postpartum'
  ],
  GYNE: [
    'gynecologic', 'ovarian', 'uterine', 'vaginal', 'pelvic', 'menstrual',
    'ectopic', 'torsion ovarian'
  ]
};

const CATEGORY_KEYWORDS = {
  TRAU: [
    'trauma', 'injury', 'fall', 'motor vehicle', 'mvc', 'assault',
    'gunshot', 'stab', 'blunt', 'penetrating', 'polytrauma', 'accident'
  ],
  TOXI: [
    'overdose', 'poisoning', 'intoxication', 'toxic', 'ingestion',
    'toxicology', 'drug', 'alcohol', 'substance'
  ],
  PSYC: [
    'psychiatric', 'mental health', 'depression', 'anxiety', 'psychosis',
    'suicidal', 'agitation', 'behavioral', 'schizophrenia', 'bipolar'
  ],
  ENVI: [
    'hypothermia', 'hyperthermia', 'heat stroke', 'frostbite',
    'environmental', 'drowning', 'lightning', 'altitude'
  ]
};

function extractAge(text) {
  // Look for pattern like "(65 M)", "(5 F)", "(28 Y)", etc.
  const ageMatch = text.match(/\((\d+)\s*[YyMmFf]/);
  if (ageMatch) {
    return parseInt(ageMatch[1]);
  }

  // Look for "65-year-old", "5 year old", etc.
  const ageMatch2 = text.match(/(\d+)[\s-]*year[\s-]*old/i);
  if (ageMatch2) {
    return parseInt(ageMatch2[1]);
  }

  return null;
}

function isPediatric(age) {
  return age !== null && age < 18;
}

function classifySystem(revealTitle) {
  const text = revealTitle.toLowerCase();

  // Check systems first
  let bestMatch = null;
  let bestScore = 0;

  for (const [system, keywords] of Object.entries(SYSTEM_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = system;
    }
  }

  // Check categories if no strong system match
  if (bestScore < 2) {
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      let score = 0;
      for (const keyword of keywords) {
        if (text.includes(keyword.toLowerCase())) {
          score += 1;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = category;
      }
    }
  }

  return bestMatch || 'MULT'; // Default to multisystem if can't classify
}

function generateCaseId(revealTitle, sparkTitle, age) {
  const system = classifySystem(revealTitle);
  const isPed = isPediatric(age);

  // Will be completed with sequence number by caller
  if (isPed) {
    // Pediatric: PEDSYSNN (8 chars)
    const sysCode = system === 'GAST' ? 'GI' :
                    system === 'NEUR' ? 'NE' :
                    system === 'RESP' ? 'RE' :
                    system === 'CARD' ? 'CV' :
                    system === 'RENA' ? 'RN' :
                    system === 'ENDO' ? 'EN' :
                    system === 'HEME' ? 'HE' :
                    system === 'MUSC' ? 'MS' :
                    system === 'DERM' ? 'DM' :
                    system === 'INFD' ? 'ID' :
                    system === 'IMMU' ? 'IM' :
                    system === 'OBST' ? 'OB' :
                    system === 'GYNE' ? 'GY' :
                    system === 'TRAU' ? 'TR' :
                    system === 'TOXI' ? 'TX' :
                    system === 'PSYC' ? 'PS' :
                    system === 'ENVI' ? 'EV' :
                    'MU'; // MULT

    return { prefix: `PED${sysCode}`, isPediatric: true, system };
  } else {
    // Adult: SYSNNNN (7 chars)
    return { prefix: system, isPediatric: false, system };
  }
}

function classifyScenario(scenario) {
  const age = extractAge(scenario.sparkTitle || scenario.spark_title || '');
  const revealTitle = scenario.revealTitle || scenario.reveal_title || '';
  const sparkTitle = scenario.sparkTitle || scenario.spark_title || '';

  const classification = generateCaseId(revealTitle, sparkTitle, age);

  return {
    ...classification,
    age,
    revealTitle,
    sparkTitle
  };
}

module.exports = {
  classifySystem,
  extractAge,
  isPediatric,
  generateCaseId,
  classifyScenario,
  SYSTEM_KEYWORDS,
  CATEGORY_KEYWORDS
};
