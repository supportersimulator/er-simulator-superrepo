# Simulation Conversion System Documentation

**Version**: 1.0
**Last Updated**: 2025-11-01
**System**: ER Simulator - Simulation Conversion Pipeline

---

## Overview

The Simulation Conversion System transforms raw medical case data from various sources into structured, AI-enhanced simulation scenarios compatible with the Sim Mastery platform.

---

## System Architecture

### 1. Data Flow

```
Source Data (emsim_final, etc.)
    ↓
Input Sheet (staging area)
    ↓
AI Processing (OpenAI GPT-4o-mini)
    ↓
Master Scenario Convert (output sheet)
    ↓
Sim Mastery Platform
```

---

## Input Sheet Structure

### **Sheet Name**: `Input`

### **Column Mapping** (CRITICAL - DO NOT CHANGE)

| Column | Name | Purpose | Source Mapping | Required | Format |
|--------|------|---------|----------------|----------|--------|
| **A** | Formal_Info | Extra metadata, notes, formal case info | emsim_final Column A (optional) | No | Plain text |
| **B** | HTML | HTML-formatted case content | emsim_final Column A (site_text) | Yes* | HTML markup |
| **C** | DOC | Word document text content | emsim_final Column B (document_text) | Yes* | Plain text |
| **D** | Extra | Additional notes, supplementary info | (unused currently) | No | Plain text |

\* At least one of columns B or C must have data

### **Important Rules**

1. **Column A** is intentionally LEFT EMPTY during import (reserved for manual notes)
2. **Column B** receives HTML content from source data
3. **Column C** receives Word document text from source data
4. **Column D** is intentionally LEFT EMPTY (reserved for future use)
5. Any field can be blank - the AI will work with whatever is provided
6. Row 1 contains headers
7. Data starts at Row 2

---

## Master Scenario Convert Structure

### **Sheet Name**: `Master Scenario Convert`

### **Header System**: 2-Tier Headers

- **Row 1**: Tier 1 categories (e.g., "Case_Organization", "Monitor_Vital_Signs")
- **Row 2**: Tier 2 field names (e.g., "Case_ID", "Initial_Vitals")
- **Row 3+**: Data rows (each row = one complete simulation scenario)

### **Merged Key Format**

Fields are referenced using the format: `Tier1:Tier2`

Examples:
- `Case_Organization:Case_ID`
- `Monitor_Vital_Signs:Initial_Vitals`
- `Patient_Demographics_and_Clinical_Data:Age`

---

## Import Process

### **Source Sheet**: emsim_final

**Google Sheet ID**: `1Sx_6R3Dr1fbaV3u8y9tgtkc0ir7GV2X-zI9ZJiDwRXA`
**Total Rows**: 172 medical scenarios

### **Import Mapping**

```javascript
emsim_final Column A (site_text)     → Input Column B (HTML)
emsim_final Column B (document_text) → Input Column C (DOC)
Input Column A                       → (empty - reserved)
Input Column D                       → (empty - reserved)
```

### **Import Script**

**Location**: `/scripts/importEmsimFinal.cjs`

**Usage**:
```bash
npm run import-emsim
```

**What it does**:
1. Reads data from emsim_final sheet
2. Checks for duplicate content signatures
3. Maps columns correctly (A→B, B→C)
4. Leaves columns A and D empty
5. Appends to Input sheet starting at next available row

---

## AI Processing

### **Model**: OpenAI GPT-4o-mini

### **Processing Methods**

#### **Method 1: Sidebar (Google Sheets UI)**

**Access**: ER Simulator menu → Launch Batch / Single (Sidebar)

**Modes**:
- **Single Case**: Process one specific Input row
- **Next 25 Unprocessed**: Intelligently finds next 25 unprocessed Input rows (RECOMMENDED)
- **Specific Rows**: Process custom range (e.g., "10-35", "5,7,9-12")
- **All Rows**: Process entire Input sheet

**How "Next 25 Unprocessed" Works**:
1. Reads all `Conversion_Status` signatures from Master Scenario Convert (output sheet)
2. Iterates through Input sheet rows starting from row 2
3. For each Input row, generates a hash signature from the first 1000 characters
4. Compares Input row signature against all Master Scenario Convert signatures
5. Selects first 25 Input rows whose signatures are NOT in Master Scenario Convert
6. Queues those 25 rows for processing

**This ensures**:
- No duplicate processing (same row won't be processed twice)
- Automatic continuation (always picks up where previous batch left off)
- Efficient batch processing (processes maximum 25 rows at a time)

**Input**:
- Reads Input sheet row (columns A, B, C, D)
- Combines all non-empty fields into context

**Output**:
- Creates NEW row in Master Scenario Convert
- Generates complete simulation with all required fields
- Fills 2-tier header structure automatically
- Stores content signature in `Conversion_Status` column for duplicate detection

**Cost**: ~$0.50-$3.00 per scenario (varies by complexity)

#### **Method 2: HTTP Batch API** (Currently Not Working)

**Status**: ⚠️ Broken - use sidebar instead

#### **Method 3: Node.js Standard API** (Alternative)

**Script**: `/scripts/processWithStandardAPI.cjs`
**Status**: Works, but operates on existing Master rows (not Input sheet)

---

## Conversion Rules

### **Data Combination**

The AI receives ALL non-empty Input fields:
```
Formal_Info (Column A) + HTML (Column B) + DOC (Column C) + Extra (Column D)
```

### **Field Requirements**

The AI MUST generate these critical fields:

1. **Case_Organization:Case_ID** - Unique identifier (e.g., EM12345)
2. **Case_Organization:Spark_Title** - Catchy title format: `"<Symptom> (<Age Sex>): <Hook>"`
3. **Case_Organization:Reveal_Title** - Educational title format: `"<Diagnosis> (<Age Sex>): <Learning Point>"`
4. **Monitor_Vital_Signs:Initial_Vitals** - Compact JSON: `{"HR":120,"BP":"95/60","RR":28,"Temp":39.2,"SpO2":94}`
5. **Patient_Demographics_and_Clinical_Data:Age** - Number
6. **Patient_Demographics_and_Clinical_Data:Gender** - Male/Female/Other

### **Vitals Format**

**CRITICAL**: All vitals MUST be compact JSON (single line, no formatting)

**Correct**:
```json
{"HR":120,"BP":"95/60","RR":28,"Temp":39.2,"SpO2":94}
```

**Incorrect**:
```json
{
  "HR": 120,
  "BP": "95/60"
}
```

### **N/A Values**

- Use `"N/A"` for unknown or not applicable fields
- Never invent URLs or data
- If unsure, use `"N/A"`

---

## Duplicate Detection

### **Method**: Content Hash Signature

The system uses a two-layer duplicate detection approach:

#### **Layer 1: Hash Generation (Input Side)**

When processing an Input row, the system:
```javascript
// Combine all input fields
const sniff = (formal + '\n' + html + '\n' + docRaw + '\n' + extra).slice(0, 1000);

// Generate hash signature
const sig = hashText(sniff);
```

#### **Layer 2: Signature Storage (Output Side)**

When creating a Master Scenario Convert row, the system:
1. Stores the hash signature in the `Conversion_Status` column
2. Format: `{value} | {signature}` or just `{signature}` if no other value
3. Example: `PROCESSED | a3f9c8d2b1e0`

#### **Detection Process**

Before processing an Input row:
1. Generate hash signature from Input row content (first 1000 chars)
2. Read all `Conversion_Status` values from Master Scenario Convert
3. Extract signatures from `Conversion_Status` column (handles `|` delimiter)
4. Check if Input row signature exists in Master Scenario Convert signatures
5. **If match found**: Skip row as duplicate
6. **If no match**: Process row and store signature in new Master Scenario Convert row

This ensures:
- ✅ Same Input content is never processed twice
- ✅ "Next 25 Unprocessed" mode can identify unprocessed rows
- ✅ Automatic resume capability after interruptions

---

## Quality Validation

### **Automatic Warnings**

The system checks for:
- ✅ Valid JSON in vitals fields
- ✅ Required fields present
- ✅ Vitals include minimum data (HR, BP)
- ⚠️ Missing State4_Vitals, State5_Vitals (warnings, not errors)

### **Common Warnings** (Non-Critical)

```
⚠️ Missing Monitor_Vital_Signs:State4_Vitals field.
⚠️ Missing Monitor_Vital_Signs:State5_Vitals field.
```

These are OK - not all scenarios need 5 states.

---

## Processing Status Tracking

### **Live Logs**

Available in sidebar UI - shows real-time progress:
```
9:50:05 PM ▶️ Starting conversion for Row 10 (batchMode=false)
5:13:40 PM 🤖 AI response parsed successfully for Row 10
5:13:40 PM ⚠️ Missing Monitor_Vital_Signs:State4_Vitals field.
5:13:40 PM 📤 Writing results for Row 10 to "Master Scenario Convert"
5:13:41 PM ✅ Row 10 successfully written to sheet.
```

### **Batch Reports**

**Sheet**: `Batch_Reports`

Tracks:
- Timestamp
- Mode (Batch/Single)
- Created count
- Skipped count
- Duplicates count
- Errors count
- Estimated cost
- Elapsed time

---

## Error Handling

### **Common Errors**

#### **"Row empty, skipped"**
- **Cause**: All four Input columns (A, B, C, D) are empty
- **Fix**: Ensure at least column B or C has data

#### **"duplicate (hash match)"**
- **Cause**: Content already processed
- **Fix**: This is normal - system prevents duplicates

#### **"AI JSON parse fail"**
- **Cause**: OpenAI returned invalid JSON
- **Fix**: System automatically retries; check logs for details

---

## File Locations

### **Scripts**

```
/scripts/importEmsimFinal.cjs          - Import from emsim_final to Input
/scripts/processWithStandardAPI.cjs    - Process via OpenAI Standard API
/scripts/checkInputSheet.cjs           - Check Input sheet status
/scripts/verifySetup.cjs               - Verify system configuration
/scripts/cleanupInputRow2.cjs          - Clean up test data
```

### **Documentation**

```
/docs/SIMULATION_CONVERSION_SYSTEM.md  - This file
/apps-script-backup/Code.gs            - Google Apps Script source
```

### **Configuration**

```
/.env                                  - Environment variables
/config/token.json                     - Google OAuth token
```

---

## Environment Variables

**Required in `.env`**:

```bash
GOOGLE_SHEET_ID=<Master sheet ID>
GOOGLE_CLIENT_ID=<OAuth client ID>
GOOGLE_CLIENT_SECRET=<OAuth secret>
OPENAI_API_KEY=<OpenAI API key>
APPS_SCRIPT_ID=<Apps Script project ID>
```

---

## Workflow Examples

### **Example 1: Import and Process New Batch (RECOMMENDED)**

```bash
# Step 1: Import 172 scenarios from emsim_final
npm run import-emsim

# Step 2: Verify import
npm run check-input

# Step 3: Process via sidebar (automatic mode)
# Open Google Sheets UI
# ER Simulator → Launch Batch / Single
# Mode: "Next 25 unprocessed"  ← RECOMMENDED
# Click: Launch Batch Engine
#
# System automatically:
# - Finds next 25 unprocessed Input rows
# - Skips any already-processed rows
# - Processes and creates Master Scenario Convert rows
#
# Step 4: Repeat Step 3 until all rows processed
# (Just keep clicking "Launch Batch Engine" with "Next 25 unprocessed")
```

### **Example 1B: Import and Process with Manual Row Selection**

```bash
# Step 1: Import 172 scenarios from emsim_final
npm run import-emsim

# Step 2: Verify import
npm run check-input

# Step 3: Process via sidebar (manual range selection)
# Open Google Sheets UI
# ER Simulator → Launch Batch / Single
# Mode: "Specific rows"
# Rows: "42-66" (25 rows at a time)
# Click: Launch Batch Engine
```

### **Example 2: Process Single Case**

```bash
# Via sidebar:
# Mode: Single Case
# Row: 10
# Click: Launch Batch Engine
```

### **Example 3: Check Status**

```bash
npm run check-input       # Check Input sheet status
npm run check-batch       # Check batch progress
```

---

## Best Practices

### ✅ **DO**

- Process in batches of 25 rows for stability
- Monitor live logs for errors
- Verify results after each batch
- Keep Input columns A and D empty (reserved)
- Use sidebar for reliable processing

### ❌ **DON'T**

- Don't modify column mapping (A, B, C, D structure is fixed)
- Don't run multiple batches simultaneously
- Don't delete Input rows until confirmed in Master
- Don't edit Master Scenario Convert headers manually
- Don't trust cost estimates (they're inconsistent)

---

## Troubleshooting

### **Sidebar won't open**

**Error**: `TypeError: Cannot read properties of null (reading 'showSidebar')`

**Fix**: The `getSafeUi_()` function has infinite recursion bug
- Open Apps Script Editor
- Find line: `return getSafeUi_();`
- Change to: `return SpreadsheetApp.getUi();`

### **No rows being created**

**Possible causes**:
1. Input rows are empty
2. Duplicate content (already processed)
3. OpenAI API key invalid

**Check**:
```bash
npm run verify-setup
```

### **AI returning invalid JSON**

**Usually auto-retries**. If persistent:
1. Check live logs for full error
2. Verify OpenAI API key is valid
3. Check Input data isn't corrupted

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-01 | Initial documentation created |

---

## Related Documentation

- [Apps Script Code Documentation](../apps-script-backup/Code.gs)
- [Import Scripts](../scripts/)
- [Google Sheets Integration](../README.md)

---

## Support

For issues or questions:
1. Check this documentation
2. Review live logs in sidebar
3. Run verification scripts
4. Check Apps Script execution logs

---

**End of Documentation**
