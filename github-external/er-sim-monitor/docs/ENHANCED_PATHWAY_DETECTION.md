# Enhanced Pathway Detection System

## Overview
This system provides **high-sensitivity, clinically granular pathway discovery** that goes far beyond simple system-based groupings. Instead of just "Cardiovascular" or "Respiratory", it finds specific, educationally meaningful clusters.

## Detection Strategies

### 1. **Diagnosis-Specific Pathways** (Most Granular)
These identify cases with the same or related diagnoses:

- **Acute Coronary Syndrome Spectrum** 🫀
  - STEMI, NSTEMI, Unstable Angina
  - Minimum: 4 cases | Ideal: 6+ cases
  - Teaches ACS recognition patterns and management algorithms

- **Heart Failure Variants** 💔
  - Acute decompensation, flash pulmonary edema, chronic CHF exacerbations
  - Minimum: 3 cases | Ideal: 5+ cases
  - Covers acute vs chronic presentations

- **Obstructive Airway Disease Mastery** 🌬️
  - COPD and asthma exacerbations
  - Minimum: 3 cases | Ideal: 5+ cases
  - Teaches bronchodilator management and severity assessment

- **Sepsis Recognition & Management** 🦠
  - Sepsis, septic shock, severe infections
  - Minimum: 3 cases | Ideal: 5+ cases
  - Time-critical bundle completion training

- **Stroke & TIA: Time is Brain** 🧠
  - Ischemic stroke, hemorrhagic stroke, TIA
  - Minimum: 3 cases | Ideal: 5+ cases
  - Thrombolytic decision-making practice

### 2. **Presentation-Based Pathways** (Symptom-Driven)
These group cases by chief complaint, teaching differential diagnosis:

- **Undifferentiated Chest Pain: Diagnostic Mastery** 💢
  - Excludes obvious MIs - focuses on diagnostic uncertainty
  - Wide differential: cardiac, pulmonary, GI, MSK
  - Minimum: 4 cases | Ideal: 6+ cases

- **Dyspnea Differential: Systematic Approach** 😮‍💨
  - Shortness of breath with various etiologies
  - Cardiac, pulmonary, and metabolic causes
  - Minimum: 4 cases | Ideal: 6+ cases

- **Altered Mental Status: Complete Workup** 🤔
  - Metabolic, toxic, infectious, structural, psychiatric
  - Systematic AMS evaluation training
  - Minimum: 4 cases | Ideal: 6+ cases

### 3. **Acuity-Based Pathways** (Time-Sensitivity)
Cases grouped by urgency level:

- **Life-Threatening Emergencies: Rapid Assessment** 🚨
  - Cardiac arrest, shock, unstable patients
  - Requires immediate recognition and intervention
  - Minimum: 5 cases | Ideal: 7+ cases

### 4. **Age-Demographic Pathways** (Population-Specific)
Cases tailored to specific age groups:

- **Pediatric Emergency Medicine Essentials** 👶
  - Age-specific assessment, dosing, and management
  - Automatically detects ages <18 years
  - Minimum: 4 cases | Ideal: 6+ cases

- **Geriatric Emergencies & Atypical Presentations** 👴
  - Polypharmacy, atypical symptoms, geriatric syndromes
  - Automatically detects ages ≥65 years
  - Includes falls, delirium, polypharmacy
  - Minimum: 4 cases | Ideal: 6+ cases

### 5. **Procedural Skill Pathways** (Hands-On Training)
Cases requiring specific procedural skills:

- **Advanced Airway Management Skills** 🫁
  - Intubation, difficult airway, RSI, mechanical ventilation
  - Minimum: 3 cases | Ideal: 5+ cases

- **ACLS Protocols: Cardiac Arrest Management** 💓
  - VFib, VTach, PEA, asystole algorithms
  - Systematic ACLS practice
  - Minimum: 4 cases | Ideal: 6+ cases

## How It Works

### Smart Detection Logic
The system analyzes:
1. **Diagnosis field** - Primary diagnosis text
2. **Spark Title** - Chief complaint and patient presentation
3. **Learning Outcomes** - Educational objectives
4. **Age** - Extracted from spark title (e.g., "55 M" → 55 years old)
5. **Category** - System-based classification

### Confidence Scoring
Each pathway receives a confidence score (0-1):
- **0.95**: Excellent match, 12+ cases
- **0.90-0.94**: Strong match, 7-11 cases
- **0.85-0.89**: Good match, 6 cases
- **0.75-0.84**: Acceptable match, 4-5 cases
- **0.70-0.74**: Minimal match, 3 cases

### Expected Output
**Target**: 7±3 pathways (4-10 pathways total)
- Sorted by confidence score (highest first)
- Each pathway includes:
  - Unique ID
  - Descriptive name
  - Logic type (diagnosis, presentation, acuity, demographic, procedural)
  - Icon for visual recognition
  - Confidence score
  - Case count
  - Educational rationale
  - Suggested case IDs

## Benefits Over Previous System

### Before (Low Sensitivity):
- "Cardiovascular System Mastery" (76 cases)
- "Respiratory System Mastery" (45 cases)
- "ACLS Protocol Series" (57 cases)

**Problems:**
- Too broad - doesn't distinguish MI from CHF from arrhythmia
- Hard to build a focused learning sequence
- Mixes completely different clinical scenarios

### After (High Sensitivity):
- "Acute Coronary Syndrome Spectrum" (6 cases) - ACS only
- "Heart Failure: Acute & Chronic Variants" (5 cases) - CHF only
- "ACLS Protocols: Cardiac Arrest Management" (8 cases) - Arrests only
- "Undifferentiated Chest Pain: Diagnostic Mastery" (7 cases) - DDx focus
- "Dyspnea Differential: Systematic Approach" (6 cases) - SOB focus

**Advantages:**
- ✅ Clinically meaningful groupings
- ✅ Easier to sequence from simple → complex
- ✅ Clear educational objectives
- ✅ Better alignment with real clinical patterns
- ✅ More useful launch pads for pathway building

## Integration

Replace this function in [Categories_Pathways_Feature_Phase2.gs](../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs):

```javascript
function identifyPathwayOpportunities_(cases, systemDist) {
  // OLD: Basic system-based detection
}
```

With:

```javascript
function identifyPathwayOpportunitiesEnhanced_(cases, systemDist) {
  // NEW: Granular, multi-dimensional detection
}
```

Then update the calling code:
```javascript
const pathwayOpportunities = identifyPathwayOpportunitiesEnhanced_(allCases, systemDistribution);
```

## Future Enhancements

Potential additional pathway types:
- **Trauma Mechanisms** (Blunt vs penetrating, MOI-based)
- **Toxicology Syndromes** (Sympathomimetic, anticholinergic, etc.)
- **Environmental Emergencies** (Heat stroke, hypothermia, altitude)
- **Obstetric Emergencies** (Pregnancy complications)
- **Psychiatric Emergencies** (Suicidal ideation, psychosis, agitation)
- **Procedure Complexity** (Simple vs complex procedures)
- **Diagnostic Uncertainty Level** (Clear diagnosis vs diagnostic dilemmas)

## Testing

To test locally, copy the function into Google Apps Script and run:

```javascript
function testEnhancedPathways() {
  const analysis = analyzeCatalog_();
  Logger.log('Found ' + analysis.topPathways.length + ' pathways:');
  analysis.topPathways.forEach(function(pw) {
    Logger.log(pw.icon + ' ' + pw.name + ' (' + pw.caseCount + ' cases, ' +
               (pw.confidence * 100).toFixed(0) + '% confidence)');
  });
}
```
