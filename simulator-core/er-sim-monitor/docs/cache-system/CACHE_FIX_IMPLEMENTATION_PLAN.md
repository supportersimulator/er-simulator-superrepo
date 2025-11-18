# Cache Fix Implementation Plan
**Date**: 2025-11-06
**Goal**: Fix `performHolisticAnalysis_()` to extract all 27 fields using header cache + 25-row batching

## Current State Analysis

### What Works (KEEP AS-IS):
✅ `refreshHeaders()` - Maps headers dynamically, stores in CACHED_HEADER2
✅ `getColumnIndexByHeader_()` - Looks up column indices by name
✅ `resolveColumnIndices_()` - Resolves multiple columns at once
✅ Cache button UI with live progress logs
✅ System distribution analysis
✅ Pathway opportunity detection
✅ 24-hour cache validity check

### What's Broken (NEEDS FIX):
❌ `performHolisticAnalysis_()` only extracts 6 fields (should be 27)
❌ Processes ALL rows at once (should batch 25 at a time)
❌ Hardcoded fallback indices may be wrong if columns moved

## Implementation Strategy

### Step 1: Define Complete Field Map (ALL 27 FIELDS)

Create comprehensive `fieldMap` object with all 27 fields from README:

```javascript
const fieldMap = {
  // BASIC INFO (3 fields)
  caseId: { header: 'Case_Organization_Case_ID', fallback: 0 },
  sparkTitle: { header: 'Case_Organization_Spark_Title', fallback: 1 },
  pathway: { header: 'Case_Organization_Pathway_or_Course_Name', fallback: 5 },

  // LEARNING CONTENT (4 fields)
  preSimOverview: { header: 'Case_Organization_Pre_Sim_Overview', fallback: 9 },
  postSimOverview: { header: 'Case_Organization_Post_Sim_Overview', fallback: 10 },
  learningOutcomes: { header: 'CME_and_Educational_Content_CME_Learning_Objective', fallback: 191 },
  learningObjectives: { header: 'Set_the_Stage_Context_Educational_Goal', fallback: 34 },

  // METADATA (4 fields)
  category: { header: 'Case_Organization_Medical_Category', fallback: 11 },
  difficulty: { header: 'Case_Organization_Difficulty_Level', fallback: 6 },
  setting: { header: 'Set_the_Stage_Context_Environment_Type', fallback: 38 },
  chiefComplaint: { header: 'Patient_Demographics_and_Clinical_Data_Presenting_Complaint', fallback: 66 },

  // DEMOGRAPHICS (3 fields)
  age: { header: 'Patient_Demographics_and_Clinical_Data_Age', fallback: 62 },
  gender: { header: 'Patient_Demographics_and_Clinical_Data_Gender', fallback: 63 },
  patientName: { header: 'Patient_Demographics_and_Clinical_Data_Patient_Name', fallback: 61 },

  // VITALS (1 field - JSON with 5 subfields)
  initialVitals: { header: 'Monitor_Vital_Signs_Initial_Vitals', fallback: 55 },

  // CLINICAL CONTEXT (4 fields)
  examFindings: { header: 'Patient_Demographics_and_Clinical_Data_Exam_Positive_Findings', fallback: 73 },
  medications: { header: 'Patient_Demographics_and_Clinical_Data_Current_Medications', fallback: 68 },
  pastMedicalHistory: { header: 'Patient_Demographics_and_Clinical_Data_Past_Medical_History', fallback: 67 },
  allergies: { header: 'Patient_Demographics_and_Clinical_Data_Allergies', fallback: 69 },

  // ENVIRONMENT (3 fields)
  environmentType: { header: 'Set_the_Stage_Context_Environment_Type', fallback: 38 },
  dispositionPlan: { header: 'Situation_and_Environment_Details_Disposition_Plan', fallback: 48 },
  context: { header: 'Set_the_Stage_Context_Clinical_Vignette', fallback: 36 },

  // Also need diagnosis for existing logic
  diagnosis: { header: 'Case_Orientation_Chief_Diagnosis', fallback: 7 }
};
```

### Step 2: Add Batch Processing Logic

Modify the main loop in `performHolisticAnalysis_()`:

**BEFORE (processes all rows at once):**
```javascript
for (let i = 2; i < data.length; i++) {
  // Process row
  allCases.push(caseItem);
}
```

**AFTER (processes 25 rows at a time with progress):**
```javascript
const BATCH_SIZE = 25;
const totalDataRows = data.length - 2; // Subtract 2 header rows
const totalBatches = Math.ceil(totalDataRows / BATCH_SIZE);

Logger.log(`📊 Processing ${totalDataRows} cases in ${totalBatches} batches of ${BATCH_SIZE}`);

for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
  const batchStart = 2 + (batchNum * BATCH_SIZE); // Data starts at row 3 (index 2)
  const batchEnd = Math.min(batchStart + BATCH_SIZE, data.length);
  const rowsInBatch = batchEnd - batchStart;

  Logger.log(`🔄 Batch ${batchNum + 1}/${totalBatches}: Processing rows ${batchStart + 1}-${batchEnd} (${rowsInBatch} cases)`);

  for (let i = batchStart; i < batchEnd; i++) {
    // Extract ALL 27 fields per case
    const caseItem = {
      row: i + 1,

      // BASIC INFO
      caseId: data[i][indices.caseId] || '',
      sparkTitle: data[i][indices.sparkTitle] || '',
      pathway: data[i][indices.pathway] || '',

      // LEARNING CONTENT
      preSimOverview: data[i][indices.preSimOverview] || '',
      postSimOverview: data[i][indices.postSimOverview] || '',
      learningOutcomes: data[i][indices.learningOutcomes] || '',
      learningObjectives: data[i][indices.learningObjectives] || '',

      // METADATA
      category: data[i][indices.category] || '',
      difficulty: data[i][indices.difficulty] || '',
      setting: data[i][indices.setting] || '',
      chiefComplaint: data[i][indices.chiefComplaint] || '',

      // DEMOGRAPHICS
      age: data[i][indices.age] || '',
      gender: data[i][indices.gender] || '',
      patientName: data[i][indices.patientName] || '',

      // VITALS (parse JSON)
      initialVitals: tryParseVitals_(data[i][indices.initialVitals]),

      // CLINICAL CONTEXT (truncate long fields)
      examFindings: truncateField_(data[i][indices.examFindings], 200),
      medications: truncateField_(data[i][indices.medications], 150),
      pastMedicalHistory: truncateField_(data[i][indices.pastMedicalHistory], 200),
      allergies: data[i][indices.allergies] || '',

      // ENVIRONMENT
      environmentType: data[i][indices.environmentType] || '',
      dispositionPlan: data[i][indices.dispositionPlan] || '',
      context: truncateField_(data[i][indices.context], 300),

      // ALSO KEEP DIAGNOSIS FOR EXISTING LOGIC
      diagnosis: data[i][indices.diagnosis] || ''
    };

    allCases.push(caseItem);

    // Track system distribution (KEEP EXISTING LOGIC)
    const system = extractPrimarySystem_(caseItem.category);
    systemDistribution[system] = (systemDistribution[system] || 0) + 1;

    // Track pathway assignment (KEEP EXISTING LOGIC)
    if (caseItem.pathway && caseItem.pathway.trim() !== '') {
      pathwayDistribution[caseItem.pathway] = (pathwayDistribution[caseItem.pathway] || 0) + 1;
    } else {
      unassignedCount++;
    }
  }

  // Log batch progress
  const percentComplete = Math.round(((batchNum + 1) / totalBatches) * 100);
  Logger.log(`✅ Batch ${batchNum + 1}/${totalBatches} complete (${percentComplete}% done)`);
  Logger.log('');
}

Logger.log(`✅ All ${totalDataRows} cases processed successfully`);
```

### Step 3: Add Helper Functions

Add two small helper functions:

```javascript
/**
 * Try to parse vitals JSON, return object with hr, bp, rr, spo2
 */
function tryParseVitals_(vitalsJson) {
  if (!vitalsJson || typeof vitalsJson !== 'string') return null;

  try {
    const vitals = JSON.parse(vitalsJson);
    return {
      hr: vitals.hr || null,
      bpSys: vitals.bp?.sys || null,
      bpDia: vitals.bp?.dia || null,
      rr: vitals.rr || null,
      spo2: vitals.spo2 || null
    };
  } catch (e) {
    return null;
  }
}

/**
 * Truncate field to max length to avoid cache bloat
 */
function truncateField_(value, maxLength) {
  if (!value || typeof value !== 'string') return '';
  if (value.length <= maxLength) return value;
  return value.substring(0, maxLength) + '...';
}
```

## What We're NOT Changing

✅ **Keep all existing functions:**
- `refreshHeaders()` - No changes
- `getColumnIndexByHeader_()` - No changes
- `resolveColumnIndices_()` - No changes
- `getOrCreateHolisticAnalysis_()` - No changes
- `identifyPathwayOpportunities_()` - No changes
- `generateHolisticInsights_()` - No changes
- `extractPrimarySystem_()` - No changes

✅ **Keep all existing logic:**
- System distribution tracking
- Pathway distribution tracking
- Unassigned count tracking
- 24-hour cache validity
- Cache sheet structure (timestamp, analysis_json)

✅ **Keep all existing UI:**
- Cache progress window
- Live terminal logs
- Progress bar
- Error handling

## Testing Plan

1. **Pull currently deployed Phase2 from TEST**
2. **Create backup of current version**
3. **Apply changes to local copy**
4. **Test locally with small dataset first**
5. **Deploy to TEST**
6. **Test cache button:**
   - Verify refreshHeaders() runs first
   - Verify batch processing logs appear
   - Verify all 27 fields are extracted
   - Verify cache completes successfully
   - Verify no timeouts
7. **Test pathway discovery:**
   - Verify AI can see all 27 fields
   - Verify pathway suggestions work
   - Verify 6 logic types work correctly

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Breaking existing pathway analysis | Keep all existing system/pathway distribution logic intact |
| Timeout with large datasets | 25-row batching with progress logs |
| Wrong column indices | Use header cache with dynamic resolution |
| Cache bloat | Truncate long text fields (200-300 chars) |
| JSON parsing errors | Try/catch with null fallback |

## Success Criteria

✅ Cache button completes without timeout
✅ All 27 fields extracted per case
✅ Batch progress logs show in terminal
✅ System distribution analysis still works
✅ Pathway suggestions still work
✅ No breaking changes to existing UI
✅ Header cache properly resolves all columns

## Next Steps

1. Get user approval on this plan
2. Pull current Phase2 from TEST
3. Create backup
4. Implement changes incrementally
5. Test thoroughly
6. Deploy to TEST
