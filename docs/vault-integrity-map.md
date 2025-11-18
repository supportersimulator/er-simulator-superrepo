# Vault Integrity Map

**Generated:** 2025-11-15  
**Guardian:** Hermes (Apps Script Gold-Mining)  
**Mode:** Vault Guardian Protocol **ACTIVE**

---

## 1. Vault Location & Protection Status

**Sacred Directory:**

```
google-drive-code/sim-builder-production/
```

**Protection Level:** 🔒 **UNTOUCHABLE** without explicit Aaron approval

**Last Vault Export:** 2025-11-14 20:49:43 (from Google Drive)

---

## 2. Vault Contents (Complete Inventory)

| File | Size | Lines | Hash (MD5) | Purpose |
|------|------|-------|------------|---------|
| `Code.gs` | 484,927 bytes | 13,201 | `09ded40ff09cb8e9bddba41853de4ee3` | Main Apps Script entrypoint |
| `Ultimate_Categorization_Tool_Complete.gs` | 85,618 bytes | 1,820 | `d025205b1724ee9a54c4cbb76ebe55ab` | Ultimate categorization tool |
| `appsscript.json` | 125 bytes | N/A | `c210bbd6b1d290009a05c9bd76587edf` | Apps Script manifest |
| `_project_metadata.json` | 500 bytes | N/A | `1c2281000485ed2a07be01948a702692` | Project metadata |

**Total:** 4 files (no subdirectories)

---

## 3. Code.gs — Function Inventory

**Total Functions:** 228

### Critical Entry Points

| Function | Line | Purpose |
|----------|------|---------|
| `onOpen()` | 598 | Menu initialization (runs on spreadsheet open) |
| `openSimSidebar()` | 1353 | Opens batch processing sidebar |
| `startBatchFromSidebar()` | 1990 | Main batch orchestrator |
| `processOneInputRow_()` | 2266 | Core single-row processor |
| `runATSRTitleGenerator()` | 2657 | ATSR title generation tool |
| `runPathwayChainBuilder()` | 6506 | Pathway chain builder |

### Menu System Functions

| Function | Purpose |
|----------|---------|
| `onOpen()` | Main menu builder |
| `getSafeUi_()` | Safe UI context helper |
| `runATSRTitleGenerator()` | ATSR menu item |
| `runPathwayChainBuilder()` | Categories & Pathways menu item |
| `openImageSyncDefaults()` | Image sync menu |
| `openSettingsPanel()` | Settings menu |
| `checkApiStatus()` | API status check |
| `suggestWaveformMapping()` | Waveform suggestion |
| `autoMapAllWaveforms()` | Auto-map waveforms |
| `analyzeCurrentMappings()` | Analyze mappings |
| `clearAllWaveforms()` | Clear waveforms |

### Batch Processing Core

| Function | Purpose |
|----------|---------|
| `startBatchFromSidebar()` | Batch orchestrator |
| `processOneInputRow_()` | Single row processor |
| `getNext25InputRows_()` | Get next 25 unprocessed |
| `getAllInputRows_()` | Get all remaining |
| `getSpecificInputRows_()` | Get specific rows by spec |
| `runSingleStepBatch()` | Single step batch |
| `finishBatchAndReport()` | Batch completion |
| `stopBatch()` | Emergency stop |

### Field Caching System

| Function | Purpose |
|----------|---------|
| `cacheNext25RowsWithFields()` | Cache next 25 rows with selected fields |
| `showFieldSelector()` | Field selector UI |
| `saveFieldSelection()` | Save field selection |
| `loadFieldSelection()` | Load saved fields |
| `getAvailableFields()` | Get all available fields |
| `getStaticRecommendedFields_()` | Get recommended fields |
| `getDefaultFieldNames_()` | Get default field names |
| `clearCacheSheet()` | Clear cache |
| `resetCacheProgress()` | Reset cache progress |
| `getCacheStatus()` | View cache status |
| `restore35Defaults()` | Restore 35 default fields |
| `showSavedFieldSelection()` | Show saved fields |

### Header & Schema Management

| Function | Purpose |
|----------|---------|
| `readTwoTierHeaders_()` | Read 2-tier headers |
| `mergedKeysFromTwoTiers_()` | Merge tier1 + tier2 |
| `cacheHeaders()` | Cache header structure |
| `getCachedHeadersOrRead()` | Get cached or read headers |
| `clearHeaderCache()` | Clear header cache |
| `refreshHeaders()` | Refresh header cache |
| `ensureHeadersCached()` | Ensure headers are cached |

### AI Integration

| Function | Purpose |
|----------|---------|
| `callOpenAI()` | Call OpenAI API |
| `callOpenAiJson()` | Call OpenAI with JSON parsing |
| `syncApiKeyFromSettingsSheet_()` | Sync API key from Settings tab |
| `readApiKey_()` | Read API key |
| `getOpenAIAPIKey()` | Get OpenAI key |
| `clearApiKeyCache()` | Clear API key cache |

### ATSR (Title Generation)

| Function | Purpose |
|----------|---------|
| `runATSRTitleGenerator()` | Main ATSR UI |
| `buildATSRUltimateUI_()` | Build ATSR modal |
| `parseATSRResponse_()` | Parse ATSR AI response |
| `generateMysteriousSparkTitles()` | Generate spark titles |
| `saveATSRData()` | Save ATSR results |
| `applyATSRSelectionsWithDefiningAndMemory()` | Apply ATSR selections |

### Quality & Validation

| Function | Purpose |
|----------|---------|
| `evaluateSimulationQuality()` | Score scenario quality |
| `ensureQualityColumns_()` | Ensure quality columns exist |
| `attachQualityToRow_()` | Attach quality score to row |
| `runQualityAudit_AllOrRows()` | Run quality audit |
| `cleanUpLowValueRows()` | Clean up low-quality rows |
| `validateVitalsFields_()` | Validate vitals JSON |
| `validateCategorization()` | Validate categorization |

### Categorization & Pathways

| Function | Purpose |
|----------|---------|
| `runPathwayChainBuilder()` | Pathway chain builder UI |
| `getOrCreateHolisticAnalysis_()` | Get/create holistic analysis |
| `performHolisticAnalysis_()` | Perform full analysis |
| `identifyPathwayOpportunities_()` | Identify pathways |
| `buildCategorizationPrompt()` | Build AI categorization prompt |
| `saveCategorizationResults()` | Save categorization |
| `applyCategorization()` | Apply categorization |
| `getCategorizationResults()` | Get results |
| `getCategorizationStats()` | Get stats |
| `getCategoryView()` | View by category |
| `getPathwayView()` | View by pathway |
| `getAllCategoriesView()` | All categories |
| `getAllPathwaysView()` | All pathways |

### Utility Functions

| Function | Purpose |
|----------|---------|
| `getProp()` / `setProp()` | Script properties |
| `hashText()` | Text hashing |
| `tryParseJSON()` | Safe JSON parsing |
| `cleanDuplicateLines()` | Clean duplicates |
| `estimateTokens()` / `estimateCostUSD()` | Cost estimation |
| `showToast()` | Toast notifications |
| `logLong()` / `logLong_()` | Long text logging |
| `getSidebarLogs()` / `clearSidebarLogs()` | Sidebar logging |
| `appendLogSafe()` | Safe log appending |

### Waveform System

| Function | Purpose |
|----------|---------|
| `suggestWaveformMapping()` | Suggest waveform |
| `autoMapAllWaveforms()` | Auto-map all |
| `analyzeCurrentMappings()` | Analyze mappings |
| `clearAllWaveforms()` | Clear all |
| `detectWaveformForState_()` | Detect waveform logic |

### Clinical Defaults

| Function | Purpose |
|----------|---------|
| `applyClinicalDefaults_()` | Apply defaults to parsed scenario |

### Testing & Diagnostics

| Function | Purpose |
|----------|---------|
| `testBatchProcessRow3()` | Test batch processing |
| `testLiveLogging()` | Test logging |
| `testBatchModeFlag()` | Test batch mode |
| `testSimpleFieldSelector()` | Test field selector |
| `testHello()` | Test hello world |
| `testCacheSimple()` | Test simple cache |
| `testCacheDiagnostic()` | Cache diagnostics |
| `testAICategorization()` | Test AI categorization |
| `analyzeOutputSheetStructure()` | Analyze output structure |

---

## 4. Ultimate_Categorization_Tool_Complete.gs — Function Inventory

**Total Functions:** 29

### Key Functions

| Function | Purpose |
|----------|---------|
| `openUltimateCategorization()` | Main entry point |
| `buildUltimateCategorizationUI()` | Build modal UI |
| `getMasterScenarioConvertSheet_()` | Get master sheet by GID |
| `getSheetByGid_()` | Get sheet by GID helper |
| `runAICategorization()` | Run AI categorization |
| `exportCategorizationResults()` | Export results |
| `clearAllCategories()` | Clear categories |
| `getCategoryBreakdown()` | Get category stats |
| `getSystemBreakdown()` | Get system stats |
| `browseByCategoryOrSystem()` | Browse UI |
| `getCategorizationSettings()` | Get settings |
| `saveCategorizationSettings()` | Save settings |

---

## 5. Configuration Files

### appsscript.json

```json
{
  "timeZone": "America/Denver",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8"
}
```

**OAuth Scopes:** (not visible in manifest, likely in Apps Script project)
- `https://www.googleapis.com/auth/spreadsheets`
- `https://www.googleapis.com/auth/script.external_request`

### _project_metadata.json

Contains:
- Project ID
- Export timestamp
- Version info

---

## 6. Critical Dependencies (External)

### Google Sheets Tab Dependencies

The Vault code depends on these sheet tabs existing:

- `Input` — raw scenarios
- `Master Scenario Convert` — structured output (GID: 1564998840)
- `Field_Cache_Incremental` — field caching
- `Batch_Reports` — batch history
- `Batch_Progress` — current batch state
- `Settings` — API keys, config
- `AI_Categorization_Results` — categorization output
- `Pathways_Master` — pathway definitions
- `Logic_Type_Library` — logic types
- `accronym_symptom_system_mapping` — symptom mappings
- `Tools_Workflow_Tracker` — tool usage
- `Pathway_Analysis_Cache` — pathway cache
- `BACKUP_2Tier_Headers` — header backup

### External API Dependencies

- **OpenAI API:** GPT-4 for scenario enrichment, ATSR, categorization
- **Google Sheets API:** Read/write scenario data
- **Google Script Properties:** Store API keys, cache state, settings

---

## 7. Critical Conventions & Patterns

### Naming Conventions

- **Case IDs:** `{ACCRONYM}{5-digit-number}` (e.g., `GAST0001`, `RESP0031`)
- **Script Properties Keys:** Defined in code (e.g., `SELECTED_CACHE_FIELDS`, `LAST_CACHED_ROW`)
- **Sheet GID Usage:** Ultimate Tool uses GID (1564998840) to avoid duplicate sheet issues

### Row Mapping Logic

- **1:1 Correspondence:** Input Row N → Output Row N (always)
- **Header Rows:** Row 1 = Tier 1, Row 2 = Tier 2, Row 3+ = Data
- **Next Unprocessed Detection:** Based on `getLastRow() - 2` logic

### Batch Processing Modes

1. **Next 25 Unprocessed** (default)
2. **All Remaining**
3. **Specific Rows** (e.g., "15-20,25,30-35")

---

## 8. Vault Health Status

**Integrity:** ✅ VERIFIED  
**Completeness:** ✅ ALL FILES PRESENT  
**Function Count:** ✅ 228 (Code.gs) + 29 (Ultimate Tool) = 257 total  
**Dependencies:** ✅ All sheet tabs exist in production Google Sheet  
**API Keys:** ⚠️ Stored in Settings tab (plaintext, acceptable for now)  
**Version Control:** ⚠️ Manual (Clasp integration pending Phase III)

**Last Modified (in Vault):** 2025-11-14 20:49

---

## 9. Untouchable Items (Hermes Guardian Protocol)

Hermes **may NOT** modify these without explicit Aaron approval:

- `google-drive-code/sim-builder-production/Code.gs`
- `google-drive-code/sim-builder-production/Ultimate_Categorization_Tool_Complete.gs`
- `google-drive-code/sim-builder-production/appsscript.json`
- `google-drive-code/sim-builder-production/_project_metadata.json`

Hermes **may read** these for:
- Diffing against Atlas submissions
- Extracting function inventories
- Building awareness reports

---

## 10. Vault Update Protocol

**Only method for updating the Vault:**

1. Atlas works in `google-drive-code/atlas-working-copy/`
2. Atlas completes changes
3. Atlas signals readiness
4. Hermes performs full diff
5. Hermes produces **"Aaron Awareness Report — Pre-Promotion Audit"**
6. Aaron reviews and decides
7. Aaron explicitly says: **"Hermes, promote Atlas's changes into production."**
8. Hermes:
   - Archives current Vault → `legacy-apps-script/promoted-history/vault-YYYY-MM-DD-HH-MM-SS/`
   - Copies Atlas files → Vault
   - Logs promotion in `docs/vault-promotion-log.md`
   - Confirms completion

**No silent promotions. No auto-merges. No exceptions.**

---

## 11. Vault Snapshot (Reference)

This is the **baseline** against which all future Atlas submissions will be compared.

- **Production lineage:** Sim Builder (Production)
- **Script ID:** `12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2`
- **Bound to:** Google Sheet `Convert_Master_Sim_CSV_Template_with_Input`
- **Export date:** 2025-11-14

Any change to this baseline requires Hermes review → Aaron approval → explicit promotion command.

---

**Vault Guardian Mode: ACTIVE ✅**
