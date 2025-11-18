# Sim Builder (Production) - Apps Script Documentation

**Project Name:** Sim Builder (Production)
**Script ID:** `12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2`
**Created:** 2025-11-07
**Last Updated:** 2025-11-14
**Export Location:** `google-drive-code/sim-builder-production/`

---

## 📁 Project Files

| File | Type | Lines | Purpose |
|------|------|-------|---------|
| `Code.gs` | SERVER_JS | ~2000+ | Main Apps Script code (menu, utilities) |
| `Ultimate_Categorization_Tool_Complete.gs` | SERVER_JS | ~1500+ | Ultimate AI categorization tool |
| `appsscript.json` | JSON | ~20 | Project manifest (OAuth scopes, timeZone) |

---

## 🔧 Top-Level Functions

### Menu & UI

**`onOpen()`**
- Purpose: Creates custom menu in Google Sheets
- Triggers: On spreadsheet open
- Menu items: "Sim Builder Tools" dropdown

**`showBatchProcessingSidebar()`**
- Purpose: Opens batch processing UI
- UI: HTML sidebar with mode selector
- Modes: Next 25 / All Remaining / Specific Rows

---

### Batch Processing

**`processBatch(options)`**
- Purpose: Main batch processing orchestrator
- Input: `{ mode, rowSpec }`
- Process:
  1. Validates input rows
  2. Calls OpenAI API for enrichment
  3. Applies ATSR title generation
  4. Maps categories and pathways
  5. Writes to Master Scenario Convert tab

**`processNextUnprocessedRows(count)`**
- Purpose: Processes next N unprocessed rows
- Default: 25 rows
- Uses: Row detection formula (Output rows + 3)

**`processAllRemaining()`**
- Purpose: Processes ALL unprocessed rows
- Warning: Can take >30 minutes for large datasets

**`processSpecificRows(rowSpec)`**
- Purpose: Processes specific rows or ranges
- Format: `"15,20,25"` or `"15-20"` or `"15-20,25,30-35"`
- Skips: Already-processed rows

---

### AI Integration

**`callOpenAI(prompt, systemPrompt)`**
- Purpose: Calls OpenAI GPT-4 API
- Model: `gpt-4` or `gpt-4-turbo`
- Returns: Structured JSON response

**`enrichScenarioWithAI(rawInput)`**
- Purpose: Parses unstructured text → structured JSON
- Extracts: Vitals, symptoms, history, physical exam
- Validation: Ensures required fields present

---

### Category & Pathway Features

**`generateCategories(symptom)`**
- Purpose: Maps symptom → body system category
- Uses: `accronym_symptom_system_mapping` tab
- Returns: Primary + secondary categories

**`discoverPathways(scenario)`**
- Purpose: Identifies clinical logic pathways
- AI-powered: Uses GPT-4 for pathway analysis
- Stores: Results in `Pathway_Analysis_Cache` tab

---

### ATSR (Title Generation)

**`generateATSRTitle(scenario)`**
- Purpose: Auto-generates concise scenario title
- Format: "Age/Sex - Chief Complaint - Key Feature"
- Example: "45M - Chest Pain - STEMI"

**`refineTitleWithAI(rawTitle)`**
- Purpose: Improves title clarity and conciseness
- Model: GPT-4
- Rules: <60 characters, clear, clinically accurate

---

### Caching & Performance

**`getCachedField(caseID, fieldName)`**
- Purpose: Retrieves cached field value
- Cache: `Field_Cache_Incremental` tab
- Benefit: Reduces redundant AI calls

**`setCachedField(caseID, fieldName, value)`**
- Purpose: Stores field value in cache
- Updates: `Field_Cache_Incremental` tab

---

### Data Validation

**`validateScenarioInput(row)`**
- Purpose: Validates input data before processing
- Checks:
  - Required fields present
  - Data format correct
  - No duplicate Case_IDs

**`scoreScenarioQuality(scenario)`**
- Purpose: Assigns quality score (0-100)
- Factors:
  - Completeness (all fields filled)
  - Clinical realism
  - Data consistency

---

### Utility Functions

**`getNextUnprocessedRow()`**
- Purpose: Detects next row to process
- Logic: `3 + (Output rows - 2 headers)`
- Resilient: Works even if batch was interrupted

**`writeResultToOutput(row, data)`**
- Purpose: Writes structured JSON to Output tab
- Columns: 100+ fields (Case_ID, Title, Vitals, etc.)

**`logBatchReport(stats)`**
- Purpose: Logs batch completion stats
- Writes: To `Batch_Reports` tab
- Metrics: Total rows, success rate, errors

---

## 🔌 External Integrations

### Google Sheets API
- **Purpose:** Read/write scenario data
- **Scopes:** `https://www.googleapis.com/auth/spreadsheets`

### OpenAI API
- **Purpose:** Scenario enrichment, title generation
- **Endpoint:** `https://api.openai.com/v1/chat/completions`
- **Auth:** Bearer token (API key from Settings tab)

---

## 📊 Data Flow Diagram

```
User clicks "Launch Batch Engine"
  ↓
showBatchProcessingSidebar()
  ↓
User selects mode + clicks "Start"
  ↓
processBatch({ mode: "next25" })
  ↓
getNextUnprocessedRow()  → Detects Row 15
  ↓
Read Input tab rows 15-39 (25 rows)
  ↓
For each row:
  ├─ validateScenarioInput()
  ├─ enrichScenarioWithAI()  → OpenAI API call
  ├─ generateATSRTitle()     → OpenAI API call
  ├─ generateCategories()
  ├─ discoverPathways()
  ├─ scoreScenarioQuality()
  └─ writeResultToOutput()   → Master Scenario Convert tab
  ↓
logBatchReport()  → Batch_Reports tab
  ↓
Show success toast notification
```

---

## ⚙️ Configuration

### appsscript.json

```json
{
  "timeZone": "America/Denver",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/script.external_request"
  ]
}
```

**Key Settings:**
- **Runtime:** V8 (modern JavaScript engine)
- **OAuth Scopes:** Sheets + External HTTP requests
- **Exception Logging:** Stackdriver (Google Cloud Logging)

---

## 🔒 Security Considerations

### API Key Storage
- ⚠️ OpenAI API key stored in Settings!B2
- ❌ NOT encrypted (plaintext)
- ✅ Sheet permissions restrict access

**Recommendation:** Move to Google Secret Manager (Phase III)

### OAuth Scopes
- ✅ Minimal scopes (only Sheets + HTTP)
- ✅ No Drive, Gmail, or Calendar access

---

## 🐛 Known Issues

1. **Long Execution Times**
   - Apps Script max: 6 minutes
   - Workaround: Batch in chunks (Next 25)

2. **API Rate Limits**
   - OpenAI: 3500 requests/min (Tier 3)
   - Sheets: 100 reads/min, 60 writes/min
   - Mitigation: Caching system

3. **Error Handling**
   - Partial batch failures → some rows processed, others skip
   - Fix: Retry logic for failed rows

4. **Duplicate Code**
   - Multiple versions in Drive (70+ Apps Script files)
   - See: [migration_next_steps.md](migration_next_steps.md) for deduplication plan

---

## 🔮 Future Migration Plan

### Phase III: Apps Script → Node.js

**Why:**
- Better testing (Jest)
- Type safety (TypeScript)
- Local development
- Version control (git)

**Migration Strategy:**
1. Extract business logic to Node.js packages
2. Keep Apps Script as thin UI layer
3. Apps Script calls Node.js backend API
4. Gradually migrate all logic

**Timeline:** 3-4 weeks (see [migration_next_steps.md](migration_next_steps.md))

---

## 📚 Related Files

### In Super-Repo

- `google-drive-code/sim-builder-production/` - Exported code
- `google-drive-code/sim-builder/` - Other Sim Builder variants
- `google-drive-code/atsr-tools/` - ATSR standalone tools

### In Google Drive (Backups)

- "Apps Script Backup - Working - 2025-11-14T16-34-45"
- "Ultimate_Tool_Backup_2025-11-12T06-16-18"
- "Apps Script Backup 2025-11-12"

---

## 📝 Maintenance

### Updating Production Code

**Current (Manual):**
1. Edit code in Apps Script editor
2. Save
3. Manually backup to Drive
4. Export to super-repo

**Future (Automated via Clasp):**
1. Edit locally in VS Code
2. `clasp push`
3. `clasp deploy`
4. Auto-commit to git

---

## 📞 Support

**Owner:** Aaron Tjomsland
**Collaborators:** Atlas (Claude Code), GPT-5 (OpenAI)
**GitHub:** https://github.com/supportersimulator/er-sim-monitor

---

## 📝 Changelog

- **2025-11-14:** Initial documentation created
- Exported full project from Apps Script API
- Documented all top-level functions
- Mapped data flow and integrations
