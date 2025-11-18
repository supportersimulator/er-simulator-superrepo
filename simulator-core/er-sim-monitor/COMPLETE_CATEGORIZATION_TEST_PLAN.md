# 🧪 Complete Categorization Test Plan - Fresh Run

**Goal:** Clear existing AI_Categorization_Results and re-run Ultimate Categorization Tool v2.0.1 to fully populate Master sheet

---

## 📋 PRE-TEST CHECKLIST

### ✅ Step 1: Verify Current State

**Master Scenario Convert Sheet:**
- URL: https://docs.google.com/spreadsheets/d/1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM/edit?gid=1564998840
- Verify GID in URL = `1564998840` ✅
- Total rows: 207 cases (rows 3-209)
- Columns R & S status:
  - Rows 3-54: **FILLED** (~52 cases)
  - Rows 55-209: **EMPTY** (~155 cases)

### ✅ Step 2: Backup Current AI_Categorization_Results (Optional)

If you want to preserve existing AI results before clearing:

1. Right-click `AI_Categorization_Results` sheet tab
2. Select "Copy to" → "Existing spreadsheet" or "New spreadsheet"
3. Name it: `AI_Categorization_Results_Backup_Nov13`

**OR** just delete it - we're creating fresh!

---

## 🧹 STEP 1: CLEAR EXISTING RESULTS

### Option A: Delete Sheet (RECOMMENDED)

1. Open spreadsheet
2. Right-click `AI_Categorization_Results` sheet tab
3. Select **"Delete"**
4. Confirm deletion

**Why:** Fresh sheet ensures no column structure issues

### Option B: Keep Sheet, Clear Data

1. Open `AI_Categorization_Results` sheet
2. Select all data (Ctrl+A / Cmd+A)
3. Delete (keep headers if you want, but tool will recreate anyway)

---

## 🚀 STEP 2: RUN AI CATEGORIZATION

### Phase 2A: Extract Cases

1. Open your spreadsheet
2. Click menu: **🧠 Sim Builder** → **🤖 Ultimate Categorization Tool**
3. Modal opens with 4 tabs
4. Click **"Run AI Categorization"** button (Tab 1)
5. Tool will:
   - Extract all 207 cases from Master sheet
   - Read columns R & S (current categorization)
   - Send to AI for analysis
   - Create/recreate `AI_Categorization_Results` sheet
   - Write 15 columns (A-O) with all data

**Expected Output:**
```
✅ AI Categorization Complete
   Processed: 207 cases
   New categorizations: ~155
   Matches: ~52
   Conflicts: 0
   Results written to: AI_Categorization_Results
```

**⏱ Estimated Time:**
- ~207 cases × 2 seconds per case = ~7 minutes
- May take up to 10 minutes depending on AI response time

**What to Watch For:**
- Progress messages in modal
- No errors about missing sheet or wrong GID
- Success message when complete

---

## 🔍 STEP 3: VERIFY AI_CATEGORIZATION_RESULTS SHEET

### Check Sheet Structure

1. Navigate to `AI_Categorization_Results` sheet
2. Verify **15 columns** exist:

```
A: Case_ID
B: Legacy_Case_ID
C: Row_Index
D: Current_Symptom
E: Current_System
F: Suggested_Symptom
G: Suggested_Symptom_Name
H: Suggested_System
I: AI_Reasoning
J: Confidence
K: Status
L: User_Decision
M: Final_Symptom ← CRITICAL
N: Final_System ← CRITICAL
O: Final_Symptom_Name
```

### Check Data Quality

**Verify Row 2 (First Data Row):**
- Column A (Case_ID): Should have a case ID (e.g., "CARD0001")
- Column C (Row_Index): Should be `3` (first data row in Master)
- Column D (Current_Symptom): May be filled or empty (depending on Master)
- Column F (Suggested_Symptom): **MUST HAVE VALUE** (e.g., "CP", "SOB", "ABD")
- Column H (Suggested_System): **MUST HAVE VALUE** (e.g., "Cardiovascular")
- Column I (AI_Reasoning): **MUST HAVE TEXT** (explanation)
- Column M (Final_Symptom): **MUST HAVE VALUE** (defaults to column F)
- Column N (Final_System): **MUST HAVE VALUE** (defaults to column H)

**Verify Last Row (Row 208):**
- Should have data for last case
- All critical columns (F, H, M, N) should be filled

**Sample Check (Random Row):**
Pick a random row (e.g., row 100) and verify:
- Case_ID exists
- Suggested_Symptom is valid symptom code
- Suggested_System is valid system name
- AI_Reasoning makes sense for the case
- Final columns (M & N) have values

---

## 📊 STEP 4: REVIEW RESULTS (OPTIONAL)

You can skip this step if you trust the AI, but if you want to review:

### Use Browse Features (Tabs 2 & 3)

**Tab 2: Browse by Symptom**
1. Click dropdown to select symptom (e.g., "CP - Chest Pain")
2. Review all cases categorized as that symptom
3. Check if AI reasoning makes sense

**Tab 3: Browse by System**
1. Click dropdown to select system (e.g., "Cardiovascular")
2. Review all cases in that system
3. Verify categorization accuracy

**Edit if Needed:**
- You can manually edit columns M (Final_Symptom) and N (Final_System)
- These are the values that will be applied to Master
- Only edit if AI got it wrong

---

## ✅ STEP 5: APPLY TO MASTER

### Run Apply Function

1. Go back to Tab 1 or Tab 4 in the modal
2. Click **"Apply to Master"** button
3. Tool will:
   - Read all rows from AI_Categorization_Results
   - For each case, get Final_Symptom (column M) and Final_System (column N)
   - Look up Case_ID in Master sheet
   - Write to Master columns R & S using **GID 1564998840**
   - Update all 207 rows

**Expected Output:**
```
✅ Applied to Master Sheet
   Cases updated: 207
   Sheet: Master Scenario Convert (GID: 1564998840)
   Columns: R (Symptom), S (System)
```

**⏱ Estimated Time:**
- ~207 cases × 0.5 seconds = ~2 minutes

**What to Watch For:**
- No errors about "sheet not found"
- Success message with count = 207
- Confirmation it wrote to GID 1564998840

---

## 🎯 STEP 6: VERIFY MASTER SHEET UPDATED

### Check Master Scenario Convert Sheet

1. Navigate to: https://docs.google.com/spreadsheets/d/1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM/edit?gid=1564998840
2. Verify URL still shows `gid=1564998840` (correct sheet)

### Check Column R (Symptom)

**Before (what you had):**
- Rows 3-54: Filled (~52 rows)
- Rows 55-209: **EMPTY** (~155 rows)

**After (expected):**
- Rows 3-209: **ALL FILLED** (207 rows)

**Sample Checks:**
- Row 3: Should have symptom code (e.g., "CP", "SOB", "ABD")
- Row 55: **Should now have symptom code** (was empty before)
- Row 100: Should have symptom code
- Row 209: Should have symptom code

### Check Column S (System)

**Before:**
- Rows 3-54: Filled
- Rows 55-209: **EMPTY**

**After (expected):**
- Rows 3-209: **ALL FILLED**

**Sample Checks:**
- Row 3: Should have system name (e.g., "Cardiovascular", "Respiratory")
- Row 55: **Should now have system name** (was empty before)
- Row 100: Should have system name
- Row 209: Should have system name

### Verify Data Accuracy

Pick a few cases and cross-reference:

**Example:**
1. Find Case_ID "CARD0001" in Master (e.g., row 3)
2. Note Column R (Symptom) and Column S (System) values
3. Open AI_Categorization_Results sheet
4. Find Case_ID "CARD0001" (row 2)
5. Verify Master R = AI Results M (Final_Symptom)
6. Verify Master S = AI Results N (Final_System)

**Should match exactly!**

---

## 📈 SUCCESS CRITERIA

### ✅ Phase 2A (Extraction) Success

- [x] AI_Categorization_Results sheet created/recreated
- [x] 15 columns (A-O) exist
- [x] 207 rows of data (rows 2-208)
- [x] All Suggested columns (F, H) filled
- [x] All Final columns (M, N, O) filled with defaults
- [x] AI_Reasoning column (I) has explanations

### ✅ Phase 2C (Apply) Success

- [x] "Apply to Master" completed without errors
- [x] Success message shows 207 cases updated
- [x] Confirmation message shows GID 1564998840

### ✅ Master Sheet Verification Success

- [x] Master Scenario Convert (GID 1564998840) opened
- [x] Column R (index 17) has 207 filled rows (rows 3-209)
- [x] Column S (index 18) has 207 filled rows (rows 3-209)
- [x] Rows 55-209 **now have data** (previously empty)
- [x] Random spot checks match AI_Categorization_Results

### ✅ Overall System Success

- [x] Complete data flow verified: Master → AI → User Review → Apply → Master
- [x] GID fix working (wrote to correct sheet)
- [x] Column indices correct (R = 17, S = 18)
- [x] All 207 cases categorized
- [x] Zero errors or failures

---

## 🚨 TROUBLESHOOTING

### Problem: "AI Categorization" button does nothing

**Cause:** Script not deployed or modal code error

**Fix:**
1. Check Apps Script editor for errors
2. Verify Ultimate_Categorization_Tool_Complete.gs deployed
3. Check browser console (F12) for JavaScript errors

---

### Problem: "Sheet not found (GID: 1564998840)"

**Cause:** Master sheet deleted or GID changed

**Fix:**
1. Verify sheet exists: https://docs.google.com/spreadsheets/d/1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM/edit?gid=1564998840
2. If URL works, GID is correct
3. Check Apps Script for typos in `MASTER_SCENARIO_CONVERT_GID` constant

---

### Problem: "Apply to Master" shows 0 cases updated

**Cause:** Case_ID mismatch or Final columns empty

**Fix:**
1. Check AI_Categorization_Results columns M & N have data
2. Verify Case_ID format matches between sheets (case-sensitive)
3. Check Master sheet Column A has same Case_IDs

---

### Problem: Master sheet still has empty rows after apply

**Cause:** Applied to wrong sheet or column indices wrong

**Fix:**
1. Verify you're looking at GID 1564998840 (check URL)
2. Verify columns R & S specifically (not P & Q or other columns)
3. Check if backup sheet exists with same name

---

## 📝 TEST RESULTS LOG

**Date:** November 13, 2025

### Pre-Test State
- Master rows 3-54: ✅ Filled
- Master rows 55-209: ❌ Empty (155 rows)
- AI_Categorization_Results: Exists (partial data)

### Test Execution

**Step 1: Clear Results**
- [ ] AI_Categorization_Results sheet deleted
- [ ] Time: _____

**Step 2: Run AI Categorization**
- [ ] Started at: _____
- [ ] Completed at: _____
- [ ] Duration: _____
- [ ] Cases processed: _____
- [ ] Success message: _____

**Step 3: Verify AI Results Sheet**
- [ ] 15 columns exist: _____
- [ ] 207 rows exist: _____
- [ ] Final columns filled: _____
- [ ] Sample row checked: Row _____ ✅

**Step 4: Apply to Master**
- [ ] Started at: _____
- [ ] Completed at: _____
- [ ] Cases updated: _____
- [ ] GID confirmed: 1564998840 _____

**Step 5: Verify Master Sheet**
- [ ] Column R fully filled (207 rows): _____
- [ ] Column S fully filled (207 rows): _____
- [ ] Rows 55-209 now filled: _____
- [ ] Spot check matches: _____

### Final Result
- [ ] ✅ PASS - All 207 cases categorized
- [ ] ⚠️ PARTIAL - Some cases categorized
- [ ] ❌ FAIL - Errors occurred

**Notes:**
_____________________________________________________________________
_____________________________________________________________________

---

## 🎉 NEXT STEPS AFTER SUCCESS

Once all 207 cases are categorized:

1. **Celebrate!** 🎉 The Ultimate Categorization Tool is working perfectly
2. **Document success** - Add notes about any tweaks needed
3. **Monitor** - Use the tool periodically to re-categorize if cases change
4. **Expand** - Consider using for other categorization tasks

---

## 📚 REFERENCE

- **Master Sheet GID:** 1564998840
- **Column Indices:** R = 17, S = 18
- **Total Cases:** 207 (rows 3-209)
- **AI Results Columns:** 15 (A-O)
- **Version:** Ultimate Categorization Tool v2.0.1
- **Key Files:**
  - `Ultimate_Categorization_Tool_Complete.gs`
  - `ULTIMATE_CATEGORIZATION_DATA_FLOW.md`
  - `ULTIMATE_CATEGORIZATION_TOOL_TESTING_GUIDE.md`

**Good luck! Let me know how it goes!** 🚀
