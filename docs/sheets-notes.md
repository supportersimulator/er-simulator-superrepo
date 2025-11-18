# Google Sheets Integration Notes

**Sheet Name:** "Convert_Master_Sim_CSV_Template_with_Input"
**Sheet ID:** `1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM`
**Last Updated:** 2025-11-14

---

## 📊 Sheet Overview

This Google Sheet is the **central data hub** for the ER Simulator batch processing system.

**Purpose:**
- Raw scenario input (Input tab)
- Structured scenario output (Master Scenario Convert tab)
- Batch processing state management
- AI categorization results storage
- Field caching for performance

---

## 📑 Tab Structure (13 Tabs)

### Core Tabs

| Tab Name | Rows | Purpose |
|----------|------|---------|
| **Master Scenario Convert** | 209 | Structured output scenarios (JSON format) |
| **Input** | 211 | Raw input scenarios (unstructured text) |
| **Settings** | 2 | API keys, configuration |

### Processing & Cache Tabs

| Tab Name | Rows | Purpose |
|----------|------|---------|
| **Field_Cache_Incremental** | 207 | Cached field values for batch processing |
| **Pathway_Analysis_Cache** | 2 | Pathway analysis results cache |
| **AI_Categorization_Results** | 208 | AI-generated category assignments |

### Reporting Tabs

| Tab Name | Rows | Purpose |
|----------|------|---------|
| **Batch_Reports** | 45 | Historical batch processing reports |
| **Batch_Progress** | 29 | Current batch job progress tracking |
| **Tools_Workflow_Tracker** | 49 | Tool usage and workflow metrics |

### Reference Tabs

| Tab Name | Rows | Purpose |
|----------|------|---------|
| **Pathways_Master** | 13 | Pathways definitions and logic |
| **Logic_Type_Library** | 8 | Logic type reference library |
| **accronym_symptom_system_mapping** | 43 | Symptom → Body System mappings |
| **BACKUP_2Tier_Headers** | 191 | Backup of 2-tier header structure |

---

## 🔄 Data Flow

```
┌─────────────────┐
│  Input Tab      │  ← Raw scenarios entered by user
│  (Row 3+)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Apps Script     │  ← Batch processing triggered
│ Engine          │     (Next 25 / All / Specific rows)
└────────┬────────┘
         │
         ├──▶ OpenAI API (parse & enrich)
         ├──▶ ATSR (title generation)
         ├──▶ Categories (symptom mapping)
         └──▶ Pathways (logic discovery)
         │
         ▼
┌─────────────────┐
│ Master Scenario │  ← Structured JSON written
│ Convert Tab     │     (Output row N = Input row N)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ fetchVitalsFrom │  ← Monitor pulls latest data
│ SheetsOAuth.js  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ data/vitals.    │  ← Local JSON for React Native app
│ json            │
└─────────────────┘
```

---

## 🔑 Key Column Mappings

### Input Tab Columns

| Column | Field | Description |
|--------|-------|-------------|
| A | Raw_Input | Unstructured scenario text |
| B | Case_Type | Type of medical case |
| C | Chief_Complaint | Primary symptom/complaint |

*(Note: Full column mapping available in exported CSV)*

### Master Scenario Convert Tab Columns

| Column | Field | Description |
|--------|-------|-------------|
| A | Case_ID | Unique identifier (e.g., GI01234) |
| B | Title | Scenario title |
| C | Presenting_Complaint | Chief complaint |
| ... | ... | *(100+ columns total)* |
| K | Vitals_JSON | Structured vital signs JSON |
| P | Waveform | ECG waveform type |
| Q | Category | Primary category |
| R | Pathway | Clinical logic pathway |

---

## 🔧 Settings Tab Configuration

| Setting | Value | Purpose |
|---------|-------|---------|
| **OpenAI API Key** | `sk-proj-...` | API key for GPT-4 processing |
| **Batch Mode** | Next 25 / All / Specific | Processing mode selector |

**Security Note:** API keys are stored in Settings tab (B2). **Never commit this sheet to public repos.**

---

## 📥 Export Instructions

### Full Sheet Export (All Tabs as CSV)

```bash
cd /Users/aarontjomsland/Documents/er-simulator-superrepo/simulator-core/er-sim-monitor
node scripts/exportGoogleSheets.cjs
```

**Output:** `scenario-csv-raw/sheets-exports/*.csv`

### Sync Vitals to Monitor

```bash
npm run fetch-vitals
```

**This will:**
1. Read "Master Scenario Convert" tab
2. Parse vitals JSON from each row
3. Write to `data/vitals.json`
4. Monitor automatically reloads with new data

---

## 🔄 Bi-Directional Sync

### Two-Way Sync (Sheets ↔ JSON)

```bash
npm run sync-vitals
```

**This will:**
1. Read from "Master Scenario Convert"
2. Auto-fill missing waveform/timestamps
3. Update both `data/vitals.json` AND Google Sheet
4. Log each update

---

## 🔴 Live Real-Time Sync (Advanced)

### Setup Webhook for Instant Updates

**Step 1:** Start live sync server

```bash
npm run live-sync  # Starts server on port 3333
```

**Step 2:** Expose to internet (for Google Sheets webhook)

```bash
npx ngrok http 3333  # Get public URL
```

**Step 3:** Update Apps Script with ngrok URL

```javascript
// In Apps Script onEdit() trigger
const LIVE_SYNC_URL = "https://xxxxx.ngrok.io/vitals-update";
```

**Now:** Any edit in Sheet → Instantly updates Monitor UI via WebSocket!

---

## 📊 Row Detection Logic

### Duplicate Prevention System

**How it determines next row to process:**

```javascript
// Counts ACTUAL processed rows in Output sheet
const processedRows = outputSheet.getLastRow() - 2;  // Subtract 2 header rows
const nextRow = 3 + processedRows;  // Row 3 is first data row

// Example: If 14 data rows exist (rows 3-16)
// nextRow = 3 + 12 = 15 (next unprocessed row)
```

**Key Feature:** Resilient to stop/resume operations. Always correct even if batch was interrupted.

---

## 🔍 Important Sheet Behaviors

### 2-Tier Header System

**Row 1:** Tier 1 headers (broad categories)
**Row 2:** Tier 2 headers (specific field names)
**Row 3+:** Data rows

**Why:** Organizes 100+ columns into logical groups.

### 1:1 Row Correspondence

**Rule:** Input Row N → Output Row N (always)

```
Input Row 3  → Output Row 3  (first scenario)
Input Row 4  → Output Row 4  (second scenario)
Input Row N  → Output Row N
```

**Why:** Simplifies tracking, prevents mismatches.

---

## ⚠️ Known Issues & Limitations

### Google Sheets API Rate Limits

- **Reads:** 100 requests per 100 seconds per user
- **Writes:** 60 requests per 100 seconds per user

**Mitigation:** Use caching (`Field_Cache_Incremental` tab)

### Apps Script Execution Time Limit

- **Max runtime:** 6 minutes per execution
- **Workaround:** Batch processing in chunks (Next 25 mode)

### Large JSON Fields

- Some vitals JSON exceeds 50KB
- Can cause slow rendering in Sheets UI
- **Solution:** Export to Supabase for large datasets (Phase III)

---

## 🔮 Future Enhancements

### Phase III Migration (Planned)

**Replace Google Sheets with Supabase PostgreSQL:**

- ✅ No API rate limits
- ✅ Real-time subscriptions (live updates)
- ✅ Full SQL query power
- ✅ Better performance
- ✅ Row-level security for multi-tenant

**Migration Path:** See [migration_next_steps.md](migration_next_steps.md)

---

## 📚 Related Documentation

- [architecture_overview.md](architecture_overview.md) - System architecture
- [env-setup.md](env-setup.md) - Google Sheets API setup
- [superrepo_inventory.md](superrepo_inventory.md) - Exported CSV inventory

---

## 📝 Changelog

- **2025-11-14:** Initial documentation created
- Exported all 13 tabs to CSV (static snapshot)
- Documented row detection logic and batch modes
- Added live sync setup instructions
