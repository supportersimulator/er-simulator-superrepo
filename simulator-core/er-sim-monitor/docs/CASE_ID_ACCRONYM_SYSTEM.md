# 📋 CASE ID ACCRONYM SYSTEM
## Symptom-Based Triage Conventions (ER Nurse Standard)

**Date**: 2025-11-09
**Version**: 2.0 - FINALIZED BY AARON
**Source**: https://docs.google.com/spreadsheets/d/1PvZMOb1fvN20iKztTdeqm7wtInfbad9Rbr_kTbzfBy8/edit
**Philosophy**: Use chief complaint/presentation accronyms (NOT diagnosis) to preserve learning value

---

## 🎯 WHY SYMPTOM-BASED ACCRONYMS?

**Problem with Diagnosis-Based IDs**:
- `CARD101` → "Oh, it's cardiac" (spoils the learning)
- Learner knows diagnosis before seeing case
- Reduces diagnostic reasoning practice

**Solution with Symptom-Based IDs**:
- `CP101` → "Chest pain" (doesn't reveal diagnosis)
- Could be MI, PE, pneumonia, GERD, anxiety, etc.
- Preserves diagnostic uncertainty
- Matches real ER triage workflow

**Example**:
```
PATHWAY 1: "When Chest Pain Isn't What You Think"
CP101 - 58M chest pain → Turns out to be aortic dissection
CP102 - 45F chest pain → Turns out to be pulmonary embolism
CP103 - 62M chest pain → Turns out to be MI (actually is cardiac!)
CP104 - 35F chest pain → Turns out to be panic attack

Learner never knows diagnosis until they work through H&P!
```

---

## 📚 COMPLETE ACCRONYM LIBRARY

### **PRIMARY SYMPTOMS (Common Chief Complaints)**

| Accronym | Chief Complaint / Triage Category | Pre-Experience Category | Post-Experience Categories |
|----------|----------------------------------|------------------------|---------------------------|
| **CP** | Chest Pain | Chest Pain Cases | Cardiovascular, Pulmonary, Gastrointestinal |
| **SOB** | Respiratory Distress (severe) | Shortness of Breath Cases | Pulmonary, Critical Care |
| **ABD** | Abdominal Pain | Abdominal Pain Cases | Gastrointestinal, Obstetrics/Gynecology, Renal/Genitourinary |
| **HA** | Headache | Headache Cases | Neurologic, Infectious Disease, Cardiovascular |
| **AMS** | Altered Mental Status | Altered Mental Status Cases | Neurologic, Endocrine/Metabolic, Toxicology |
| **SYNC** | Syncope / Near Syncope | Syncope Cases | Cardiovascular, Neurologic, Endocrine/Metabolic |
| **SZ** | Seizure | Seizure Cases | Neurologic, Endocrine/Metabolic, Toxicology |
| **DIZZ** | Dizziness / Vertigo | Dizziness Cases | Neurologic, Cardiovascular, HEENT |
| **WEAK** | Weakness / Fatigue | Weakness Cases | Neurologic, Endocrine/Metabolic, Hematologic/Oncologic |
| **NT** | Numbness / Tingling | Numbness & Tingling Cases | Neurologic, Endocrine/Metabolic, Toxicology |
| **GLF** | Ground Level Fall | Fall Cases | Trauma, Neurologic, Cardiovascular |

### **INJURY/TRAUMA CATEGORIES**

| Accronym | Chief Complaint / Triage Category | Example Cases |
|----------|----------------------------------|---------------|
| **TR** | Trauma (general, blunt/penetrating) | Multiple trauma, GSW, stab wound |
| **MVC** | Motor Vehicle Collision | MVA with multiple injuries |
| **BURN** | Burn Injury | Thermal, chemical, electrical burns |
| **FX** | Fracture / Orthopedic Injury | Long bone fracture, hip fracture, wrist fracture |
| **HEAD** | Head Injury / Head Trauma | Concussion, epidural hematoma, skull fracture |
| **LAC** | Laceration / Wound | Simple lac, complex lac requiring repair |

### **SYSTEM-SPECIFIC SYMPTOMS**

| Accronym | Chief Complaint / Triage Category | Example Cases |
|----------|----------------------------------|---------------|
| **GI** | GI Complaint (non-painful) | N/V, diarrhea, GI bleed, constipation |
| **GU** | Genitourinary Complaint | Dysuria, hematuria, urinary retention, kidney stone |
| **GYN** | Gynecologic Complaint | Vaginal bleeding, pelvic pain, ectopic pregnancy |
| **OB** | Obstetric Emergency | Preeclampsia, eclampsia, pregnancy complications |
| **DERM** | Dermatologic Complaint | Rash, cellulitis, abscess, allergic reaction |
| **EYE** | Eye Complaint | Red eye, vision loss, trauma, foreign body |
| **ENT** | ENT Complaint | Epistaxis, foreign body, throat pain, tinnitus |
| **PSY** | Psychiatric Emergency | Suicidal ideation, psychosis, agitation, overdose |

### **SPECIAL PRESENTATIONS**

| Accronym | Chief Complaint / Triage Category | Example Cases |
|----------|----------------------------------|---------------|
| **CARD** | Cardiac Arrest / Code Blue | VFib, asystole, PEA |
| **RESP** | Respiratory Distress (severe) | Respiratory failure, intubation cases |
| **SHOCK** | Shock (undifferentiated) | Septic, cardiogenic, hypovolemic, anaphylactic |
| **TOXY** | Toxicologic Emergency / Overdose | Drug OD, poisoning, toxic ingestion |
| **ENV** | Environmental Emergency | Hypothermia, hyperthermia, altitude, diving |
| **ENDO** | Endocrine Emergency | DKA, hypoglycemia, thyroid storm, adrenal crisis |
| **HEME** | Hematologic Emergency | Sickle cell crisis, thrombocytopenia, coagulopathy |
| **INFX** | Infectious Disease / Sepsis | Meningitis, sepsis, fever + rash |

### **PEDIATRIC PREFIX: P + ACCRONYM**

| Accronym | Chief Complaint / Triage Category | Example Cases |
|----------|----------------------------------|---------------|
| **PCP** | Pediatric Chest Pain | Costochondritis, myocarditis, pneumonia |
| **PSOB** | Pediatric Shortness of Breath | Asthma, bronchiolitis, foreign body |
| **PABD** | Pediatric Abdominal Pain | Appendicitis, intussusception, gastroenteritis |
| **PFEQ** | Pediatric Fever (unspecified) | Febrile seizure, meningitis, viral illness |
| **PSZ** | Pediatric Seizure | Febrile seizure, epilepsy, metabolic |
| **PTR** | Pediatric Trauma | Multiple trauma, NAT (non-accidental trauma) |
| **PRESP** | Pediatric Respiratory Distress | RSV, croup, epiglottitis |
| **PDEHD** | Pediatric Dehydration | Gastroenteritis, DKA |

---

## 🔢 CASE ID FORMAT

**Standard Format**:
```
[ACCRONYM][PATHWAY_NUMBER][CASE_SEQUENCE]

Examples:
CP101 - First case in first Chest Pain pathway
CP102 - Second case in first Chest Pain pathway
CP201 - First case in second Chest Pain pathway
SOB301 - First case in third Shortness of Breath pathway
```

**Breakdown**:
- **Positions 1-4**: Accronym (2-4 characters)
  - `CP` (2 chars) for Chest Pain
  - `SOB` (3 chars) for Shortness of Breath
  - `ALOC` (4 chars) for Altered LOC
  - `PSOB` (4 chars) for Pediatric Shortness of Breath

- **Position 5**: Pathway number (1-9)
  - `1` = First pathway in this symptom category
  - `2` = Second pathway in this symptom category
  - `9` = Ninth pathway (max)

- **Positions 6-7**: Case sequence (01-99)
  - `01` = First case in pathway
  - `06` = Sixth case in pathway
  - `12` = Twelfth case in pathway

**Examples**:
```
CP101  = Chest Pain, Pathway 1, Case 1
CP106  = Chest Pain, Pathway 1, Case 6
CP201  = Chest Pain, Pathway 2, Case 1
SOB301 = Shortness of Breath, Pathway 3, Case 1
PABD101 = Pediatric Abdominal Pain, Pathway 1, Case 1
```

---

## 📊 ACCRONYM SELECTION RULES

### **Priority Order for Accronym Selection**:

1. **Chief Complaint First** (if clear)
   - Patient presents with chest pain → `CP`
   - Patient presents with SOB → `SOB`
   - Patient presents with headache → `HA`

2. **Dominant Symptom Second** (if multiple)
   - Patient has chest pain + SOB → Choose dominant: `CP` or `SOB`
   - Use pathway theme to decide

3. **System-Based Third** (if symptom unclear)
   - GI bleed without pain → `GI`
   - UTI with dysuria → `GU`
   - Rash/cellulitis → `DERM`

4. **Special Presentation Fourth** (if critical)
   - Cardiac arrest → `CARD`
   - Shock state → `SHOCK`
   - Toxic ingestion → `TOXY`

### **Example Decision Tree**:
```
Case: 65M presents with chest pain, found to have PE

Chief Complaint: Chest pain → Use `CP` accronym
Diagnosis: PE (doesn't matter - symptom-based!)
Case ID: CP101 (if first case in first CP pathway)

Learner sees: "CP101 - 65M Chest Pain"
Learner doesn't see: "PE" or "Pulmonary Embolism" until they diagnose it!
```

---

## 🎯 PATHWAY EXAMPLES WITH SYMPTOM-BASED IDs

### **Example Pathway 1: "When Chest Pain Fools You"**

**Logic Type**: Diagnostic Traps / Mimickers
**Accronym**: `CP` (Chest Pain)
**Pathway Number**: 1 (first CP pathway)

```
CP101 - 58M Chest Pain → Aortic Dissection (NOT MI!)
CP102 - 45F Chest Pain → Pulmonary Embolism (NOT MI!)
CP103 - 62M Chest Pain → Pneumonia with Pleurisy (NOT MI!)
CP104 - 35F Chest Pain → Panic Attack (NOT MI!)
CP105 - 51M Chest Pain → GERD (NOT MI!)
CP106 - 67M Chest Pain → STEMI (Finally, actually MI!)
```

**Learning Value**: All present with chest pain, but only one is MI. Fights anchoring bias.

---

### **Example Pathway 2: "Shortness of Breath: Critical vs Benign"**

**Logic Type**: Visual-Spatial (Waveform/Imaging)
**Accronym**: `SOB` (Shortness of Breath)
**Pathway Number**: 1 (first SOB pathway)

```
SOB101 - 28F Shortness of Breath → Panic Attack (benign)
SOB102 - 55M Shortness of Breath → COPD Exacerbation (manageable)
SOB103 - 45F Shortness of Breath → Pulmonary Embolism (critical!)
SOB104 - 72M Shortness of Breath → CHF (critical!)
SOB105 - 19M Shortness of Breath → Spontaneous Pneumothorax (critical!)
```

**Learning Value**: Progression from benign to critical, teaches when to escalate.

---

### **Example Pathway 3: "Pediatric Fever: When to Worry"**

**Logic Type**: Logical-Mathematical (Algorithmic Thinking)
**Accronym**: `PFEQ` (Pediatric Fever Unspecified)
**Pathway Number**: 1 (first PFEQ pathway)

```
PFEQ101 - 18mo Fever → Viral URI (benign)
PFEQ102 - 6mo Fever → UTI (needs antibiotics)
PFEQ103 - 3yo Fever → Pneumonia (moderate severity)
PFEQ104 - 8mo Fever → Meningitis (critical!)
PFEQ105 - 2yo Fever + Rash → Kawasaki Disease (critical!)
```

**Learning Value**: Algorithmic approach to pediatric fever, when to LP, when to admit.

---

## 🔄 ACCRONYM ASSIGNMENT WORKFLOW

### **When Creating Pathways**:

```
Step 1: AI discovers pathway
        ↓
Step 2: Aaron reviews cases in pathway
        ↓
Step 3: Identify dominant symptom/presentation
        ↓
Step 4: Select accronym from library
        ↓
Step 5: Assign pathway number (1, 2, 3...)
        ↓
Step 6: Assign case sequence (01, 02, 03...)
        ↓
Step 7: Generate Case IDs (CP101, CP102, etc.)
```

### **Example Workflow**:
```
Pathway: "The Great Mimickers: Cardiac Presentations"
Cases: 8 cases, all present with chest pain or cardiac symptoms

Dominant Symptom: Chest Pain
Selected Accronym: CP
Pathway Number: 2 (second CP pathway Aaron approves)
Case IDs: CP201, CP202, CP203, CP204, CP205, CP206, CP207, CP208
```

---

## 📝 CUSTOM ACCRONYM CREATION

**If Standard Accronyms Don't Fit**:

Aaron can create custom accronyms (2-4 characters max):

**Process**:
1. Identify unique presentation pattern
2. Create memorable accronym (ER triage style)
3. Add to library
4. Use for future pathways

**Example Custom Accronyms**:
- `PREG` - Pregnancy-related emergency
- `CODE` - Code blue / cardiac arrest
- `MASS` - Mass casualty / disaster
- `PEDS` - General pediatric emergency
- `GERI` - Geriatric emergency (fall, polypharmacy, etc.)

---

## ✅ FINAL ACCRONYM LIBRARY (APPROVED)

**Total Standard Accronyms**: 35+
**Max Characters**: 4
**Style**: ER Triage Chief Complaint Conventions
**Philosophy**: Symptom/Presentation-Based (NOT Diagnosis-Based)

**Categories**:
- 11 Primary Symptoms (CP, SOB, ABD, HA, AMS, SYNC, SZ, DIZZ, WEAK, NT, GLF)
- 6 Injury/Trauma (TR, MVC, BURN, FX, HEAD, LAC)
- 8 System-Specific (GI, GU, GYN, PSY, DERM, EYE, ENT, OB)
- 9 Special Presentations (CARD, RESP, SHOCK, TOXY, ENV, ENDO, HEME, INFX)
- 8+ Pediatric (P + symptom: PCP, PSOB, PABD, PFEQ, etc.)

**Custom Accronyms**: Unlimited (Aaron creates as needed)

---

## 🚀 READY TO USE

This accronym system is now the **official Case ID standard** for the Pathways project.

**Next Steps**:
1. Integrate into Case ID numbering system
2. Add accronym selector to pathway application UI
3. Build accronym library dropdown (pre-populated + custom)
4. Test with first approved pathway

---

_Generated by Atlas (Claude Code) - 2025-11-08_
_Status: ✅ APPROVED - Official Case ID Accronym System_
_Ready for Phase 7 (Application) Implementation_
