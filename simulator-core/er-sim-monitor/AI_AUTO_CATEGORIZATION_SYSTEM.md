# 🤖 AI AUTO-CATEGORIZATION SYSTEM

**Date**: 2025-11-10
**Purpose**: Bulk categorize all 207 scenarios with 1-click AI suggestions + manual review/adjustment

---

## 🎯 OVERVIEW

### **The Problem**
- 207 scenarios need categorization (Symptom + System)
- Manual categorization is time-consuming
- Need consistency across all cases
- Want AI suggestions but with human oversight

### **The Solution**
**1-Click AI Tool** that:
1. Analyzes all 207 cases in Master Scenario Convert
2. Suggests both Symptom Category and System Category for each
3. Shows current values (if any) vs. suggested values
4. Provides dropdown adjustments for each case
5. Bulk applies after Aaron's review

---

## 📊 UI DESIGN: Categories Tab (Two Sections)

### **SECTION 1: AI Bulk Categorization Tool**

```
┌─────────────────────────────────────────────────────────────┐
│ 🤖 AI Auto-Categorization                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Analyze all 207 scenarios and suggest categories           │
│                                                             │
│ Status: 207 total cases                                    │
│         156 uncategorized (empty)                           │
│         51 already categorized                              │
│                                                             │
│ [🔍 Run AI Categorization]                                 │
│                                                             │
│ ⏱️  Estimated time: ~2 minutes                              │
│ 💰 Estimated cost: $0.15 (OpenAI API)                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Step 1: User clicks "Run AI Categorization"**
- Progress modal appears
- AI processes all 207 cases in batches of 25
- Shows progress: "Processing 25/207 cases..."

---

### **SECTION 2: Review & Adjust Interface** (Appears After AI Completes)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ 📋 Review AI Suggestions (207 cases)                          [Export CSV] [⚙️ Settings] │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│ Filter: [All Cases ▼]  Show: [Uncategorized ▼]  Search: [_____________] 🔍        │
│                                                                                     │
│ ┌─────┬──────────┬─────────────────┬────────────────────┬────────────────────────┐│
│ │ ☑️   │ Case ID  │ Current Category│ AI Suggested       │ Actions                ││
│ ├─────┼──────────┼─────────────────┼────────────────────┼────────────────────────┤│
│ │ ☑️   │ GI01234  │ Symptom: (empty)│ Symptom: CP        │ [Keep AI ✓] [Adjust ▼]││
│ │     │          │ System: GI      │ System: Cardiovasc │ Status: 🟡 Modified    ││
│ │     │          │                 │                    │                        ││
│ │     │          │ 58M Chest Pain, │ AI Reasoning:      │                        ││
│ │     │          │ radiating to    │ Presentation is CP │                        ││
│ │     │          │ left arm...     │ but dx is MI       │                        ││
│ ├─────┼──────────┼─────────────────┼────────────────────┼────────────────────────┤│
│ │ ☑️   │ NEURO002 │ Symptom: (empty)│ Symptom: HA        │ [Keep AI ✓] [Adjust ▼]││
│ │     │          │ System: (empty) │ System: Neurologic │ Status: ✅ Accepted    ││
│ │     │          │                 │                    │                        ││
│ │     │          │ 35F Severe      │ AI Reasoning:      │                        ││
│ │     │          │ headache with   │ HA with neuro      │                        ││
│ │     │          │ vision changes  │ deficits           │                        ││
│ ├─────┼──────────┼─────────────────┼────────────────────┼────────────────────────┤│
│ │ ☑️   │ CARD5678 │ Symptom: CP     │ Symptom: SYNC      │ [Keep Current] [Use AI]││
│ │     │          │ System: Cardio  │ System: Cardiovasc │ Status: ⚠️  Conflict   ││
│ │     │          │                 │                    │                        ││
│ │     │          │ 72M Syncope     │ AI Reasoning:      │                        ││
│ │     │          │ episode with    │ Primary is syncope │                        ││
│ │     │          │ chest pain      │ not chest pain     │                        ││
│ └─────┴──────────┴─────────────────┴────────────────────┴────────────────────────┘│
│                                                                                     │
│ Summary:                                                                            │
│   ✅ 182 AI suggestions accepted                                                    │
│   🟡 12 manually adjusted                                                           │
│   ⚠️  13 conflicts (AI differs from current)                                        │
│                                                                                     │
│ Bulk Actions:                                                                       │
│ [Accept All AI Suggestions] [Accept Selected (195)] [Reset to Original]            │
│                                                                                     │
│                                     [Cancel] [Apply Categories to Master] │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 WORKFLOW SEQUENCE

### **Phase 1: AI Analysis**

**User Action**: Clicks "Run AI Categorization"

**System Process**:
```javascript
function runAICategorization() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName('Master Scenario Convert');

  // Get all cases (rows 3+, skipping 2 header rows)
  const data = masterSheet.getRange(3, 1, masterSheet.getLastRow() - 2, 646).getValues();

  const cases = [];
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    cases.push({
      rowIndex: i + 3,
      caseID: row[0],                    // Column A: Case_ID
      legacyCaseID: row[8],              // Column I: Legacy_Case_ID
      currentSymptom: row[23],           // Column X: Category_Symptom
      currentSystem: row[24],            // Column Y: Category_System
      chiefComplaint: row[100],          // Approximate - chief complaint field
      history: row[200],                 // Approximate - H&P field
      diagnosis: row[300]                // Approximate - diagnosis field
    });
  }

  Logger.log('📊 Loaded ' + cases.length + ' cases for categorization');

  // Process in batches of 25
  const batchSize = 25;
  const results = [];

  for (let i = 0; i < cases.length; i += batchSize) {
    const batch = cases.slice(i, Math.min(i + batchSize, cases.length));

    Logger.log('Processing batch ' + (Math.floor(i / batchSize) + 1) + '...');

    // Call OpenAI to categorize batch
    const batchResults = categorizeBatchWithAI(batch);
    results.push(...batchResults);

    // Update progress (toast notification)
    showProgress((i + batch.length), cases.length);
  }

  Logger.log('✅ AI categorization complete: ' + results.length + ' cases');

  // Save results to temporary sheet for review
  saveCategorizationResults(results);

  // Show review interface
  showCategorizationReviewUI(results);
}
```

---

### **Phase 2: AI Categorization Logic**

**OpenAI Prompt Template**:
```javascript
function categorizeBatchWithAI(cases) {
  const apiKey = getOpenAIKey();

  const prompt = `You are an ER triage nurse categorizing medical simulation cases.

For each case, suggest:
1. **Symptom Category** (chief complaint accronym): CP, SOB, ABD, HA, AMS, SYNC, etc.
2. **System Category** (post-diagnosis): Cardiovascular, Pulmonary, Neurologic, etc.

**RULES**:
- Symptom = What patient presents with (preserves mystery)
- System = Underlying diagnosis system (revealed after)
- If patient has chest pain → Symptom = CP (even if not cardiac)
- If diagnosis is MI → System = Cardiovascular

**Available Symptom Categories**:
CP (Chest Pain), SOB (Respiratory Distress), ABD (Abdominal Pain), HA (Headache),
AMS (Altered Mental Status), SYNC (Syncope), SZ (Seizure), DIZZ (Dizziness),
WEAK (Weakness), NT (Numbness/Tingling), GLF (Fall), TR (Trauma), etc.

**Available System Categories**:
Cardiovascular, Pulmonary, Gastrointestinal, Neurologic, Endocrine/Metabolic,
Renal/Genitourinary, Hematologic/Oncologic, Infectious Disease, Toxicology,
Trauma, Obstetrics/Gynecology, Pediatrics, HEENT, Musculoskeletal, Critical Care

**Cases to categorize**:
${JSON.stringify(cases, null, 2)}

Return JSON array:
[
  {
    "caseID": "GI01234",
    "suggestedSymptom": "CP",
    "suggestedSymptomName": "Chest Pain Cases",
    "suggestedSystem": "Cardiovascular",
    "reasoning": "Patient presents with chest pain (CP) but diagnosis is MI (Cardiovascular)"
  },
  ...
]`;

  const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2000
    })
  });

  const result = JSON.parse(response.getContentText());
  const suggestions = JSON.parse(result.choices[0].message.content);

  return suggestions;
}
```

---

### **Phase 3: Review Interface Interaction**

**Scenario A: Accept AI Suggestion** (Green checkmark)
```javascript
// User clicks "Keep AI ✓" for GI01234
// Updates in-memory state (not yet applied to sheet)
categorization[caseID] = {
  symptom: aiSuggestion.symptom,
  system: aiSuggestion.system,
  status: 'accepted'
};
```

**Scenario B: Manual Adjustment** (Yellow icon)
```javascript
// User clicks "Adjust ▼" dropdown for GI01234
// Shows dropdown with all 39 symptom options
// User selects "SOB" instead of "CP"
categorization[caseID] = {
  symptom: 'SOB',                // User override
  system: aiSuggestion.system,   // Keep AI system
  status: 'modified'
};
```

**Scenario C: Conflict Resolution** (Orange warning)
```javascript
// Case already has Symptom: CP, System: Cardiovascular
// AI suggests Symptom: SYNC, System: Cardiovascular
// User chooses: [Keep Current] or [Use AI]

if (userChoice === 'useAI') {
  categorization[caseID] = {
    symptom: 'SYNC',
    system: 'Cardiovascular',
    status: 'ai-overwrote-existing'
  };
}
```

---

### **Phase 4: Bulk Application**

**User Action**: Clicks "Apply Categories to Master"

**5-Layer Validation** (Same as Pathways):
```javascript
function applyCategorization(categorizationData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName('Master Scenario Convert');

  Logger.log('🔒 Running 5-layer validation...');

  // Layer 1: Check all cases exist
  for (const caseID in categorizationData) {
    const row = findRowByLegacyCaseID(masterSheet, caseID);
    if (!row) {
      throw new Error('Case not found: ' + caseID);
    }
  }

  // Layer 2: Validate all symptom accronyms exist
  const validSymptoms = getAccronymMapping(); // From your mapping sheet
  for (const caseID in categorizationData) {
    if (!validSymptoms[categorizationData[caseID].symptom]) {
      throw new Error('Invalid symptom: ' + categorizationData[caseID].symptom);
    }
  }

  // Layer 3: Validate all system categories exist
  const validSystems = getValidSystemCategories();
  for (const caseID in categorizationData) {
    if (!validSystems.includes(categorizationData[caseID].system)) {
      throw new Error('Invalid system: ' + categorizationData[caseID].system);
    }
  }

  // Layer 4: Create backup
  const backupName = 'Master Scenario Convert (Backup ' + new Date().toISOString() + ')';
  masterSheet.copyTo(ss).setName(backupName);
  Logger.log('✅ Backup created: ' + backupName);

  // Layer 5: User confirmation
  const confirmed = ui.alert(
    'Apply Categorization?',
    'Update ' + Object.keys(categorizationData).length + ' cases?',
    ui.ButtonSet.YES_NO
  );

  if (confirmed !== ui.Button.YES) {
    throw new Error('User cancelled');
  }

  Logger.log('✅ All validations passed');

  // Apply updates
  let updateCount = 0;
  for (const caseID in categorizationData) {
    const row = findRowByLegacyCaseID(masterSheet, caseID);
    const cat = categorizationData[caseID];

    // Column X: Category_Symptom (accronym)
    masterSheet.getRange(row, 24).setValue(cat.symptom);

    // Column Y: Category_System (system name)
    masterSheet.getRange(row, 25).setValue(cat.system);

    // Column 16: Category_Symptom_Name (full name)
    const mapping = validSymptoms[cat.symptom];
    masterSheet.getRange(row, 16).setValue(mapping.preCategory);

    // Column 17: Category_System_Name (full name)
    masterSheet.getRange(row, 17).setValue(cat.system);

    updateCount++;
    Logger.log('✅ Updated ' + caseID + ': ' + cat.symptom + ' / ' + cat.system);
  }

  Logger.log('🎉 Applied ' + updateCount + ' categorizations');

  return {
    success: true,
    updated: updateCount,
    backup: backupName
  };
}
```

---

## 📋 COLUMNS UPDATED BY THIS TOOL

When categories are applied, these columns are updated:

| Column | Field | Example Value |
|--------|-------|---------------|
| **X** | Category_Symptom | "CP" (accronym) |
| **Y** | Category_System | "Cardiovascular" (system name) |
| **16** | Category_Symptom_Name | "Chest Pain Cases" (full symptom name) |
| **17** | Category_System_Name | "Cardiovascular" (full system name) |

**Note**: Columns 14-15 (Pathway_ID, Pathway_Name) are NOT touched by this tool.
Those are only updated when pathways are applied (separate workflow).

---

## 🎯 USE CASES

### **Use Case 1: Initial Bulk Categorization**
- Start: 207 uncategorized cases
- Run AI categorization
- Review 207 suggestions
- Adjust 10-15 cases manually
- Apply → All 207 cases categorized

### **Use Case 2: Re-Categorization**
- Existing categories exist
- Run AI to get fresh suggestions
- Shows conflicts (Current vs AI)
- Keep some, use AI for others
- Apply → Updated categories

### **Use Case 3: Spot Fixes**
- Use filter: "Show conflicts only"
- Review 13 cases where AI disagrees
- Manually decide case-by-case
- Apply → Fix inconsistencies

---

## 🔧 SETTINGS & OPTIONS

```
┌─────────────────────────────────────────────┐
│ ⚙️ Categorization Settings                 │
├─────────────────────────────────────────────┤
│                                             │
│ AI Model: [GPT-4 ▼]                        │
│                                             │
│ Batch Size: [25 ▼] (cases per API call)    │
│                                             │
│ Auto-Accept Threshold:                      │
│ [90%] confidence or higher                  │
│ (Low confidence cases flagged for review)  │
│                                             │
│ Conflict Handling:                          │
│ ⚪ Keep existing (default)                  │
│ ⚪ Prefer AI suggestions                    │
│ ⚪ Flag all conflicts for review            │
│                                             │
│ Include in Analysis:                        │
│ ☑️  Chief Complaint                         │
│ ☑️  History & Physical                      │
│ ☑️  Diagnosis                               │
│ ☑️  Vital Signs Pattern                     │
│                                             │
│           [Save Settings]                   │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🚀 IMPLEMENTATION PHASES

### **Phase 1: Backend Functions** (1-2 days)
- `runAICategorization()` - Main orchestrator
- `categorizeBatchWithAI()` - OpenAI integration
- `saveCategorizationResults()` - Temp storage
- `applyCategorization()` - Bulk update with validation

### **Phase 2: Review UI** (2-3 days)
- HTML modal with table interface
- Dropdown selectors for manual adjustment
- Filter/search functionality
- Status indicators (✅🟡⚠️)

### **Phase 3: Integration** (1 day)
- Add "Categories" tab to existing modal
- Wire up 1-click button
- Progress indicators
- Success/error toasts

---

## ✅ BENEFITS

1. **Speed**: Categorize 207 cases in ~2 minutes (vs hours manually)
2. **Consistency**: AI applies same logic to all cases
3. **Oversight**: Human review before applying
4. **Flexibility**: Easy to adjust individual cases
5. **Safety**: 5-layer validation + backup
6. **Auditability**: Track which were AI vs manual

---

## 📊 SEPARATION OF CONCERNS

### **Categories Tab (This Tool)**
- **Purpose**: Assign Symptom + System categories to ALL cases
- **Scope**: All 207 scenarios in Master Scenario Convert
- **Updates**: Columns X, Y, 16, 17 (categories only)
- **Independent**: Works without pathways

### **Pathways Tab (Existing)**
- **Purpose**: Group cases into educational sequences
- **Scope**: Subset of cases (4-6 per pathway)
- **Updates**: Columns 14, 15 (Pathway_ID, Pathway_Name) + Category columns
- **Dependent**: Requires categories to exist first

**Workflow Order**:
1. ✅ **First**: Use Categories tab to categorize all 207 cases
2. ✅ **Then**: Use Pathways tab to create educational sequences

---

**Status**: Ready to Implement
**Next Step**: Build Phase 1 (Backend Functions)
**Timeline**: 4-6 days for complete implementation

---

_Generated by Atlas (Claude Code) - 2025-11-10_
