# 🧪 AI CATEGORIZATION TESTING GUIDE

**Date**: 2025-11-10
**Status**: Backend functions deployed - Ready to test

---

## ✅ DEPLOYED FUNCTIONS

### **Backend (11 functions)**
- `runAICategorization()` - Main orchestrator for all 207 cases
- `categorizeBatchWithAI(cases)` - OpenAI API integration
- `buildCategorizationPrompt()` - Prompt construction
- `determineStatus()` - Status logic (new/matches/conflict)
- `saveCategorizationResults()` - Save to temp sheet
- `applyStatusFormatting()` - Color-code results
- `getOpenAIAPIKey()` - Read API key from Settings!B2
- `testAICategorization()` - **TEST FUNCTION** (run this first!)

### **Application (6 functions)**
- `applyCategorization(mode)` - Apply reviewed categories to Master
- `validateCategorization()` - 5-layer safety validation
- `createBackup()` - Auto-backup before updates
- `applyCategorizationUpdates()` - Bulk update logic
- `getCategorizationStats()` - Stats for UI
- `getCategorizationResults()` - Filtered/paginated results
- `rollbackCategorization()` - Restore from backup

---

## 🧪 TESTING SEQUENCE

### **Step 1: Verify API Key**

1. Open your Google Sheet
2. Go to **Settings** sheet
3. Check cell **B2** contains valid OpenAI API key
   - Should start with `sk-proj-...`
   - If empty or invalid, update it

---

### **Step 2: Run Test Function** (5 Sample Cases)

1. Open Apps Script Editor:
   ```
   https://script.google.com/d/12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2/edit
   ```

2. In function dropdown, select: **`testAICategorization`**

3. Click **Run** (▶️ button)

4. Check **Execution log** (View → Logs or Cmd+Enter)

**Expected Output**:
```
🧪 Testing AI Categorization with 5 sample cases...

📊 Test cases:
   GI01234: 58M Chest Pain
   NEURO002: 35F Severe headache
   CARD5678: 72M Syncope episode
   ...

✅ AI Categorization successful!

📋 Results:
   GI01234
      Suggested: CP / Cardiovascular
      Reasoning: Patient presents with chest pain (CP) but diagnosis is MI (Cardiovascular)
      Status: conflict

   NEURO002
      Suggested: HA / Neurologic
      Reasoning: Severe headache with neurologic symptoms
      Status: new
   ...
```

**If successful**: ✅ Proceed to Step 3

**If error**: Check error message:
- `OpenAI API key not found` → Update Settings!B2
- `401 Incorrect API key` → API key is invalid
- `429 Rate limit` → Wait 1 minute, try again
- Other errors → Check execution log for details

---

### **Step 3: Run Full Categorization** (All 207 Cases)

1. In function dropdown, select: **`runAICategorization`**

2. Click **Run** (▶️)

3. Monitor execution log

**Expected Output**:
```
🤖 Starting AI Categorization...

📊 Loaded 207 cases
✅ Extracted case data

📦 Processing batch 1/9 (25 cases)...
✅ Batch 1 complete
📦 Processing batch 2/9 (25 cases)...
✅ Batch 2 complete
...
📦 Processing batch 9/9 (7 cases)...
✅ Batch 9 complete

🎉 AI Categorization complete!
   Total cases processed: 207

✅ Results saved to AI_Categorization_Results sheet
```

**Duration**: ~2-3 minutes (depending on API response time)

**Cost**: ~$0.15-0.25 (OpenAI API usage)

---

### **Step 4: Review Results Sheet**

1. Switch to **AI_Categorization_Results** sheet (newly created)

2. Check columns:
   - **A**: Case_ID
   - **B**: Legacy_Case_ID
   - **C**: Row_Index
   - **D**: Current_Symptom (existing)
   - **E**: Current_System (existing)
   - **F**: Suggested_Symptom (AI)
   - **G**: Suggested_Symptom_Name (AI)
   - **H**: Suggested_System (AI)
   - **I**: AI_Reasoning
   - **J**: Confidence
   - **K**: Status (new/matches/conflict)
   - **L**: User_Decision (empty - for manual review)
   - **M**: Final_Symptom (default = AI suggestion)
   - **N**: Final_System (default = AI suggestion)

3. **Color Coding**:
   - 🟢 Light green rows = **new** (uncategorized)
   - 🔵 Light blue rows = **matches** (AI agrees with current)
   - 🟠 Light orange rows = **conflict** (AI disagrees with current)
   - 🔴 Light red rows = **error** (processing failed)

4. **Sample Rows**:
   Look for cases with different statuses to verify variety

---

### **Step 5: Manual Adjustments** (Optional)

**To override AI suggestion**:

1. Find a row you want to adjust
2. Edit **Column M** (Final_Symptom):
   - Change from AI suggestion to your preferred accronym
   - Use dropdown (if you add data validation) or type manually
   - Valid values: CP, SOB, ABD, HA, AMS, SYNC, etc.

3. Edit **Column N** (Final_System):
   - Change from AI suggestion to your preferred system
   - Valid values: Cardiovascular, Pulmonary, Neurologic, etc.

4. Edit **Column L** (User_Decision):
   - Add note like "Manual override - actually syncope not chest pain"

**Example**:
```
Row 42:
  Current: (empty) / (empty)
  AI Suggested: CP / Cardiovascular
  Your Change: SYNC / Cardiovascular  (because primary presentation was syncope)
  User Decision: "Primary symptom is syncope, chest pain secondary"
```

---

### **Step 6: Apply Categorizations** (Test with Sample)

**Test with conflicts only first**:

1. In function dropdown, select: **`applyCategorization`**

2. Edit function call to:
   ```javascript
   applyCategorization('conflicts-only')
   ```

3. Click **Run**

**Expected Output**:
```
🚀 Starting categorization application...
   Mode: conflicts-only

📊 Loaded 207 categorization results
📝 Filtered to 13 cases to update

🔒 Running 5-layer validation...

Layer 1: Verifying all cases exist...
✅ Layer 1 passed: All cases exist

Layer 2: Validating symptom accronyms...
✅ Layer 2 passed: All symptom accronyms valid

Layer 3: Validating system categories...
✅ Layer 3 passed: All system categories valid

Layer 4: Checking data integrity...
✅ Layer 4 passed: Data integrity verified

Layer 5: Verifying target columns exist...
✅ Layer 5 passed: All target columns exist

✅ Validation passed

✅ Backup created: Master Scenario Convert (Backup 2025-11-10 15:45:23)

✅ User confirmed

🔧 Applying categorization updates...

✅ Updated GI01234: CP / Cardiovascular
✅ Updated NEURO002: HA / Neurologic
...

🎉 Categorization application complete!
   Cases updated: 13
   Errors: 0
```

4. **Confirmation Dialog** will appear:
   - Shows number of cases to update
   - Shows backup name
   - Click **YES** to proceed or **NO** to cancel

5. **Verify Updates**:
   - Go to **Master Scenario Convert** sheet
   - Find a case that was updated (e.g., GI01234)
   - Check:
     - Column X: Category_Symptom = "CP"
     - Column Y: Category_System = "Cardiovascular"
     - Column 16: Category_Symptom_Name = "Chest Pain Cases"
     - Column 17: Category_System_Name = "Cardiovascular"

---

### **Step 7: Full Application** (All Cases)

**After verifying sample works**:

1. Edit function call to:
   ```javascript
   applyCategorization('all')
   ```

2. Click **Run**

3. Confirm when prompted

4. Wait for completion (~1-2 minutes for 207 cases)

**Expected Result**:
- All 207 cases categorized
- Columns X, Y, 16, 17 populated for all rows
- Backup created automatically
- Execution log shows all updates

---

## 🔄 ROLLBACK (If Needed)

**If something went wrong**:

1. In function dropdown, select: **`rollbackCategorization`**

2. Click **Run**

3. Confirm restoration

**What happens**:
- Current Master Scenario Convert deleted
- Most recent backup restored
- All changes reverted

---

## 📊 STATISTICS CHECK

**Get categorization stats**:

1. In function dropdown, select: **`getCategorizationStats`**

2. Click **Run**

3. Check execution log

**Expected Output**:
```javascript
{
  total: 207,
  new: 156,      // Uncategorized
  matches: 38,   // AI agrees with current
  conflicts: 13, // AI disagrees with current
  errors: 0      // Processing errors
}
```

---

## ❌ TROUBLESHOOTING

### **Error: "OpenAI API key not found"**
**Solution**: Update Settings!B2 with valid API key

### **Error: "401 Incorrect API key"**
**Solution**: API key is invalid. Get new key from OpenAI dashboard

### **Error: "429 Rate limit exceeded"**
**Solution**: Wait 60 seconds, then retry. OpenAI has rate limits.

### **Error: "Invalid symptom accronym"**
**Solution**: AI suggested invalid accronym. Check AI_Categorization_Results sheet, manually fix Column M.

### **Error: "Case not found"**
**Solution**: Legacy_Case_ID doesn't exist in Master. Check Row_Index in results sheet.

### **Error: "Execution timeout"**
**Solution**: For large batches, split into smaller chunks. Run conflicts-only first, then new cases.

---

## ✅ SUCCESS CRITERIA

**Backend Functions Working**:
- ✅ `testAICategorization()` runs without errors
- ✅ Returns 5 results with suggestions
- ✅ AI reasoning makes sense

**Full Categorization Working**:
- ✅ `runAICategorization()` processes all 207 cases
- ✅ Creates AI_Categorization_Results sheet
- ✅ All rows have suggested categories
- ✅ Status column correctly identifies new/matches/conflicts

**Application Working**:
- ✅ `applyCategorization()` updates Master Scenario Convert
- ✅ 5-layer validation passes
- ✅ Backup created automatically
- ✅ Columns X, Y, 16, 17 populated correctly
- ✅ No errors in execution log

---

## 🚀 NEXT STEPS (AFTER TESTING)

### **1. Build Review UI** (2-3 days)
- HTML modal with table interface
- Dropdown selectors for manual adjustment
- Filter by status (new/matches/conflicts)
- Search by Case ID
- Bulk actions (Accept All, Accept Selected)

### **2. Integrate into Modal** (1 day)
- Add "Categories" tab to existing modal
- Wire up "Run AI Categorization" button
- Show progress during processing
- Display results in review table

### **3. Production Use**
- Run full categorization
- Review all 207 suggestions
- Make adjustments as needed
- Apply to Master Scenario Convert
- All cases categorized! ✅

---

**Status**: ✅ Backend Complete - Ready for Testing
**Next Session**: Test functions, then build Review UI

---

_Testing Guide by Atlas (Claude Code) - 2025-11-10_
