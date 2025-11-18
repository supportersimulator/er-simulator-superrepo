# Legacy Tools Documentation - ER_Simulator_Builder.gs v3.7

**Source**: ChatGPT-era development (pre-Claude)
**Version**: 3.7
**Date Analyzed**: 2025-11-04
**Total Tools Discovered**: 20 major features

---

## 📋 Overview

This document catalogs all tools and features discovered in the legacy ER_Simulator_Builder.gs v3.7 codebase. These tools were developed during the ChatGPT collaboration phase and represent the foundation of the current simulation scenario generation system.

**Key Characteristics**:
- OpenAI API integration (gpt-4o-mini, gpt-4o, o4-mini, o3-mini)
- Google Sheets two-tier header system
- Batch processing with queue management
- Quality scoring and duplicate detection
- Real-time sidebar UI with live logging

---

## 🛠️ Core Tools Catalog

### 1. Batch Engine

**Purpose**: Process multiple simulation scenarios in bulk with queue management

**Features**:
- **Run All**: Process entire input sheet
- **Run 25 Rows**: Process first 25 rows only
- **Run Specific Rows**: User-defined row range
- Live log sidebar integration
- Queue state management
- Progress tracking with timestamps
- Batch Reports sheet integration

**Key Functions**:
- `runBatchProcessing()` - Main batch orchestration
- `processBatchQueue()` - Queue state machine
- `getBatchProgress()` - Real-time progress reporting

**Integration Points**:
- Input sheet (4-column format)
- Output sheet (dynamic from Settings!A1)
- Batch_Reports sheet (summary statistics)
- Document Properties (queue state persistence)

**Performance**:
- Token estimation (4 chars = 1 token)
- Cost calculation per batch run
- Elapsed time tracking

---

### 2. Single Case Generator

**Purpose**: Generate individual simulation scenario rows with two-tier header awareness

**Features**:
- Individual row processing
- Two-tier header system support
- Sidebar integration for live feedback
- JSON vitals validation
- Compact JSON output format

**Key Functions**:
- `processOneInputRow()` - Main single case processor
- `buildPromptFromInputRow()` - Prompt construction
- `parseOpenAIResponse()` - Response extraction

**Input Format** (4-column):
- Column A: `Formal_Info` (structured case info)
- Column B: HTML content
- Column C: `DOC` (document text)
- Column D: Extra notes

**Output Format**:
- All Convert_Master columns populated
- Monitor/Vitals JSON: `{"HR":120,"BP":"95/60","RR":28,"Temp":39.2,"SpO2":94}`
- Case metadata (Case_ID, Spark_Title, Reveal_Title)

---

### 3. ATSR Title Generator

**Purpose**: Generate Attention-grabbing (Spark) and Reveal titles with intelligent regeneration

**Features**:
- **Keep & Regenerate**: Preserve good titles, regenerate weak ones
- **Deselect Mode**: Skip unchecked rows
- **Memory Tracker**: Remembers last 10 character motifs to avoid repetition
- **Spark Title**: Short, cryptic teaser (e.g., "The Silent Witness")
- **Reveal Title**: Full clinical descriptor (e.g., "Acute Myocardial Infarction with Cardiogenic Shock")
- **Case_ID Auto-Generation**: Unique identifiers (e.g., `GI01234`, `CV02456`)

**Key Functions**:
- `generateATSRTitles()` - Main title generation
- `regenerateSelectedTitles()` - Selective regeneration
- `trackMotifs()` - Memory system for avoiding repetition

**Memory System**:
- Stores last 10 character descriptions
- Prevents repeated motifs across batch runs
- Script Properties persistence

**Title Quality Rules**:
- Spark: 2-5 words, evocative, no diagnosis spoilers
- Reveal: Full diagnosis, clinical accuracy, educational value
- Case_ID: Category prefix + 5-digit number (e.g., `RESP12345`, `NEURO67890`)

---

### 4. Case Summary Enhancer

**Purpose**: Auto-format case summaries with medical formatting

**Features**:
- **Auto-bold Diagnosis**: Highlights primary Dx
- **Auto-bold Intervention**: Emphasizes critical actions
- **Auto-bold Takeaway**: Key learning points
- Markdown formatting preservation
- Summary structure enforcement

**Key Functions**:
- `enhanceCaseSummary()` - Main formatting engine
- `boldKeyTerms()` - Pattern-based bolding

**Formatting Rules**:
```
**Diagnosis**: [Primary diagnosis]
**Intervention**: [Critical action taken]
**Takeaway**: [Key learning point]
```

---

### 5. Image Sync Defaults Manager

**Purpose**: Manage default image URLs for vital states across all scenarios

**Features**:
- **Refresh Functionality**: Reload defaults from master list
- **Editable Defaults**: Direct sheet editing
- Default image URLs per vital state (normal, tachycardia, bradycardia, hypotensive, etc.)
- Bulk application to scenarios

**Key Functions**:
- `refreshImageDefaults()` - Reload master defaults
- `applyImageDefaultsToScenarios()` - Bulk update

**Default Image States**:
- Normal vitals (HR 60-100, BP >90 systolic, SpO2 >95%)
- Tachycardia (HR >120)
- Bradycardia (HR <50)
- Hypotensive (BP <90 systolic)
- Hypoxic (SpO2 <90)
- Critical (multiple derangements)

---

### 6. Settings Panel

**Purpose**: Centralized configuration for API keys, models, and pricing

**Features**:
- **API Key Management**: Script Properties or Settings sheet storage
- **Model Selection**: gpt-4o-mini, gpt-4o, o4-mini, o3-mini
- **Price Configuration**: Input/output per 1K tokens
- **Header Cache Management**: Refresh/clear two-tier headers

**Key Functions**:
- `openSettingsPanel()` - Launch UI
- `saveAPIKey()` - Persist credentials
- `updatePricing()` - Cost configuration
- `clearHeaderCache()` - Reset cached headers

**Storage Locations**:
- Script Properties: `OPENAI_API_KEY`
- Settings sheet: Key-value pairs
- Document Properties: Header cache

**Pricing Defaults**:
```javascript
{
  "gpt-4o-mini": { input: 0.15, output: 0.60 },
  "gpt-4o": { input: 5.00, output: 15.00 },
  "o4-mini": { input: 0.15, output: 0.60 },
  "o3-mini": { input: 0.15, output: 0.60 }
}
```

---

### 7. Quality Scoring System

**Purpose**: Automated 0-100% quality evaluation with weighted rubric

**Scoring Components**:
1. **Core Identity (10 points)**: Case_ID, Spark_Title, Reveal_Title
2. **Patient Basics (10 points)**: Age, Sex, Setting, HPI
3. **Vitals (20 points)**: Initial + state vitals
4. **Branching (18 points)**: Progression states, decision rules
5. **Education (15 points)**: Objectives + MCQ
6. **Orders Data (12 points)**: Labs/Imaging/ECG presence
7. **Environment AV (8 points)**: Scene/time/ambience/media
8. **Meta Completeness (7 points)**: Reflection + developer metadata

**Key Functions**:
- `scoreScenarioQuality()` - Calculate weighted score
- `generateImprovementSuggestions()` - Targeted recommendations
- `auditAllScenarios()` - Batch quality analysis
- `cleanupLowQualityScenarios()` - Automated cleanup

**Auto-Created Columns**:
- `Developer_and_QA_Metadata:Simulation_Quality_Score` (0-100%)
- `Developer_and_QA_Metadata:Simulation_Enhancement_Suggestions` (text)

**Quality Thresholds**:
- **90-100%**: Production-ready
- **75-89%**: Good, minor improvements
- **60-74%**: Acceptable, needs refinement
- **<60%**: Needs significant work or deletion

---

### 8. Duplicate Detection System

**Purpose**: Prevent duplicate scenario creation with content hash signatures

**Features**:
- **Content Hash Signature**: SHA-256-like hash of input content
- **Hash-Based Duplicate Checking**: Before processing any row
- **Prevents Reprocessing**: Skips identical inputs
- **Duplicate Count Tracking**: Reports in Batch Reports

**Key Functions**:
- `generateContentHash()` - Create unique signature
- `checkForDuplicate()` - Pre-processing validation
- `logDuplicateSkip()` - Track skipped rows

**Hash Algorithm**:
```javascript
hash = SHA256(Formal_Info + HTML + DOC + Extra)
```

**Duplicate Detection Flow**:
1. Generate hash from 4-column input
2. Check Document Properties for existing hash
3. If match found → Skip row and log
4. If no match → Process row and store hash

**Future Enhancement** (from user feedback):
- Media URL uniqueness check (primary validation)
- Text similarity analysis (secondary validation)
- Demographic pattern matching

---

### 9. Batch Reports System

**Purpose**: Track batch processing statistics and cost analysis

**Features**:
- **Popup Summaries**: End-of-batch modal
- **Batch_Reports Sheet**: Persistent log
- **Metrics Tracked**: Created, Skipped, Duplicates, Errors, Cost, Elapsed time

**Key Functions**:
- `generateBatchReport()` - Create summary
- `writeToBatchReportsSheet()` - Persist log
- `displayBatchSummary()` - Show popup

**Batch_Reports Sheet Columns**:
```
| Timestamp | Mode | Created | Skipped | Duplicates | Errors | Estimated Cost | Elapsed |
|-----------|------|---------|---------|------------|--------|----------------|---------|
| 2025-11-04 10:30 | Run All | 25 | 3 | 2 | 0 | $0.45 | 3m 42s |
```

**Cost Calculation**:
- Input tokens: `(4 chars = 1 token)` estimation
- Output tokens: Response length / 4
- Total cost: `(input_tokens * input_price + output_tokens * output_price) / 1000`

---

### 10. API Status Checker

**Purpose**: Quick OpenAI API connectivity test

**Features**:
- One-click connectivity verification
- Returns "OK" confirmation or error message
- Tests API key validity
- Verifies endpoint accessibility

**Key Functions**:
- `testAPIConnection()` - Quick ping test

**Test Method**:
```javascript
// Sends minimal request to OpenAI API
{
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: "test" }],
  max_tokens: 5
}
```

**Expected Responses**:
- ✅ "OK - API connected successfully"
- ❌ "Error: Invalid API key"
- ❌ "Error: Network timeout"

---

### 11. Header Cache System

**Purpose**: Performance optimization for two-tier header access

**Features**:
- **Two-Tier Header Caching**: Row 1 + Row 2 merged keys
- **Document Properties Storage**: Persistent across sessions
- **Refresh Functionality**: Manual cache invalidation
- **Clear Functionality**: Reset cache

**Key Functions**:
- `cacheHeaders()` - Store headers in Document Properties
- `getCachedHeaders()` - Retrieve cached headers
- `refreshHeaderCache()` - Manual reload
- `clearHeaderCache()` - Reset cache

**Cache Format**:
```javascript
{
  "Patient_Info:Age": "B2",
  "Patient_Info:Sex": "C2",
  "Vitals:Monitor": "D2",
  // ... all columns cached
}
```

**Performance Benefit**:
- First access: ~200ms (read sheet)
- Cached access: ~5ms (read properties)
- 40x speed improvement for batch processing

---

### 12. Sidebar UI (Dark Theme)

**Purpose**: Interactive user interface for all tools

**Features**:
- **Dark Theme**: Medical monitor aesthetic
- **Input/Output Sheet Selection**: Dropdown selectors
- **Model Selection**: Radio buttons for OpenAI models
- **API Key Input**: Masked text field
- **Run Mode Selector**: Buttons for All/25/Specific
- **Live Log Viewer**: Real-time processing feedback
- **Status Indicators**: Visual progress indicators
- **Image Sync Button**: Quick access to media defaults
- **Settings Button**: Open configuration panel

**Key Functions**:
- `showSidebar()` - Launch sidebar
- `updateSidebarStatus()` - Real-time updates
- `logToSidebar()` - Live log streaming

**UI Components**:
```html
<!-- Input/Output Selectors -->
<select id="input-sheet">...</select>
<select id="output-sheet">...</select>

<!-- Model Selection -->
<input type="radio" name="model" value="gpt-4o-mini">
<input type="radio" name="model" value="gpt-4o">

<!-- API Key -->
<input type="password" id="api-key" placeholder="sk-...">

<!-- Run Modes -->
<button onclick="runAll()">Run All</button>
<button onclick="run25()">Run 25 Rows</button>
<button onclick="runSpecific()">Run Specific</button>

<!-- Live Log -->
<div id="live-log"></div>
```

**Dark Theme Styling**:
```css
body { background: #1a1a1a; color: #00ff00; }
button { background: #2a2a2a; border: 1px solid #00ff00; }
```

---

### 13. Live Logs Panel

**Purpose**: Real-time log viewing during batch processing

**Features**:
- **Real-Time Log Viewing**: Streaming updates
- **Refresh Button**: Manual log reload
- **Clear Button**: Reset log display
- **Auto-Refresh Every 5 Seconds**: Automatic updates
- **Fade-In Animation**: New logs appear smoothly

**Key Functions**:
- `showLiveLogsPanel()` - Launch panel
- `appendToLiveLog()` - Add log entry
- `clearLiveLog()` - Reset log
- `autoRefreshLogs()` - Automatic update loop

**Log Entry Format**:
```
[10:30:42] Processing row 5...
[10:30:45] ✅ Created GI01234 - "The Silent Witness"
[10:30:46] Processing row 6...
[10:30:48] ⚠️ Skipped row 7 (duplicate content)
[10:30:49] Processing row 8...
```

**Document Properties Storage**:
```javascript
DocumentProperties.setProperty('LIVE_LOG', JSON.stringify(logEntries));
```

---

### 14. Vitals Validation & Normalization

**Purpose**: Ensure Monitor/Vitals JSON fields are valid and compact

**Features**:
- **JSON Validation**: Syntax checking
- **Compact JSON Format Enforcement**: No extra whitespace
- **Format Standardization**: Consistent structure

**Key Functions**:
- `validateVitalsJSON()` - Syntax checking
- `normalizeVitalsJSON()` - Compact formatting
- `fixMalformedVitals()` - Auto-repair common errors

**Expected Format**:
```json
{"HR":120,"BP":"95/60","RR":28,"Temp":39.2,"SpO2":94}
```

**Common Fixes**:
- Remove extra whitespace: `{ "HR" : 120 }` → `{"HR":120}`
- Fix missing quotes: `{HR:120}` → `{"HR":120}`
- Standardize BP format: `"95-60"` → `"95/60"`
- Add missing fields: Auto-fill defaults if required fields missing

---

### 15. Input System (4-Column)

**Purpose**: Flexible input format for diverse source materials

**Column Structure**:
- **Column A**: `Formal_Info` (structured case information)
- **Column B**: HTML content (web scrapes, formatted text)
- **Column C**: `DOC` (document text, plain text sources)
- **Column D**: Extra notes (developer annotations, special instructions)

**Key Features**:
- **Any Column May Be Blank**: Flexible input sources
- **Multi-Source Support**: Text, HTML, documents, notes
- **Prompt Construction**: Intelligently combines all non-blank columns

**Key Functions**:
- `readInputRow()` - Extract 4-column data
- `buildPromptFromInput()` - Combine columns into OpenAI prompt

**Example Input**:
```
| A (Formal_Info) | B (HTML) | C (DOC) | D (Extra) |
|-----------------|----------|---------|-----------|
| 55M chest pain  | <html>...</html> | Case notes... | Focus on MI |
| 72F confusion   |          | ER note: altered MS | Check stroke |
|                 | <html>...</html> |           | Web scrape |
```

---

### 16. Pricing & Cost Estimation

**Purpose**: Track token usage and estimate batch processing costs

**Features**:
- **Token Estimation**: 4 characters = 1 token rule
- **Cost Calculation**: Per input/output token pricing
- **Configurable Pricing**: Per 1K tokens settings
- **Batch Cost Totals**: Aggregate cost reporting

**Key Functions**:
- `estimateTokens()` - Character-based estimation
- `calculateCost()` - Price calculation
- `trackBatchCost()` - Aggregate cost tracking

**Token Estimation Algorithm**:
```javascript
inputTokens = Math.ceil(inputText.length / 4);
outputTokens = Math.ceil(outputText.length / 4);
```

**Cost Calculation**:
```javascript
cost = (inputTokens * inputPricePer1K / 1000) +
       (outputTokens * outputPricePer1K / 1000);
```

**Pricing Table** (as of v3.7):
```
| Model        | Input (per 1K) | Output (per 1K) |
|--------------|----------------|-----------------|
| gpt-4o-mini  | $0.15          | $0.60           |
| gpt-4o       | $5.00          | $15.00          |
| o4-mini      | $0.15          | $0.60           |
| o3-mini      | $0.15          | $0.60           |
```

---

### 17. Duplicate Line Cleaner

**Purpose**: Remove excessive repeated lines in text content

**Features**:
- **Max 3 Occurrences**: Removes 4+ consecutive duplicate lines
- **Text Cleanup Utility**: Pre-processing for cleaner prompts
- **Preserves Intentional Repetition**: Keeps up to 3 occurrences

**Key Functions**:
- `removeDuplicateLines()` - Main cleanup function

**Algorithm**:
```javascript
// Example input:
Line A
Line B
Line B
Line B
Line B
Line B
Line C

// Output after cleanup:
Line A
Line B
Line B
Line B
Line C
```

**Use Cases**:
- Cleaning web scrapes (repeated nav elements)
- Removing boilerplate (repeated headers/footers)
- Fixing OCR errors (duplicated text blocks)

---

### 18. JSON Parser (Tolerant)

**Purpose**: Extract JSON from mixed text and markdown responses

**Features**:
- **Extracts JSON from Mixed Text**: Handles non-JSON prefix/suffix
- **Markdown Code Fence Support**: Parses \`\`\`json blocks
- **Regex-Based Extraction**: Pattern matching for JSON objects

**Key Functions**:
- `extractJSON()` - Main extraction function
- `parseTolerantly()` - Fallback parsing with error recovery

**Extraction Patterns**:
```javascript
// Pattern 1: Markdown code fence
```json
{...}
```

// Pattern 2: JSON embedded in text
Here is the output: {...} - that's the result.

// Pattern 3: Multiple JSON objects
{...} some text {...}
```

**Error Recovery**:
- Try standard `JSON.parse()` first
- If fails, extract with regex: `/\{[\s\S]*\}/`
- If multiple objects, parse first valid JSON
- If all fail, return empty object and log error

---

### 19. Output Sheet Management

**Purpose**: Dynamic output sheet selection with fallback logic

**Features**:
- **Dynamic Selection**: From `Settings!A1`
- **Auto-Refresh**: Validates sheet exists
- **Fallback Logic**: Defaults to first "Convert" sheet if missing

**Key Functions**:
- `getOutputSheet()` - Retrieve target sheet
- `validateOutputSheet()` - Check sheet exists
- `fallbackToDefaultSheet()` - Recovery logic

**Selection Logic**:
```javascript
1. Read Settings!A1 value
2. If value exists → Search for sheet by name
3. If sheet found → Use it
4. If sheet not found → Search for any sheet starting with "Convert"
5. If Convert sheet found → Use first match
6. If no Convert sheet → Create "Master Scenario Convert"
7. Return sheet object
```

**Settings!A1 Usage**:
```
| A                              | B     | C     |
|--------------------------------|-------|-------|
| Master Scenario Convert        |       |       |  ← Output sheet name
| OPENAI_API_KEY                 | sk-... |       |
| DEFAULT_MODEL                  | gpt-4o-mini |  |
```

---

### 20. Property Management

**Purpose**: Persistent storage across sessions

**Storage Types**:
1. **Script Properties**: API keys, global settings (user-level)
2. **Document Properties**: Logs, cache, state (document-level)

**Key Functions**:
- `setScriptProperty()` - Store user-level data
- `getScriptProperty()` - Retrieve user-level data
- `setDocumentProperty()` - Store document-level data
- `getDocumentProperty()` - Retrieve document-level data
- `clearAllProperties()` - Reset all stored data

**Script Properties Usage**:
```javascript
// API Keys
ScriptProperties.setProperty('OPENAI_API_KEY', 'sk-...');

// Model Defaults
ScriptProperties.setProperty('DEFAULT_MODEL', 'gpt-4o-mini');

// Pricing Config
ScriptProperties.setProperty('PRICING_CONFIG', JSON.stringify({...}));
```

**Document Properties Usage**:
```javascript
// Header Cache
DocumentProperties.setProperty('HEADER_CACHE', JSON.stringify(headers));

// Live Log
DocumentProperties.setProperty('LIVE_LOG', JSON.stringify(logs));

// Batch Queue State
DocumentProperties.setProperty('BATCH_QUEUE', JSON.stringify(queue));

// Duplicate Hash Registry
DocumentProperties.setProperty('CONTENT_HASHES', JSON.stringify(hashes));
```

**Data Limits**:
- Script Properties: 500KB per property, unlimited properties
- Document Properties: 500KB per property, unlimited properties

---

## 🔗 Key Integrations

### OpenAI API Integration

**Supported Models**:
- `gpt-4o-mini` (default, cost-effective)
- `gpt-4o` (premium, highest quality)
- `o4-mini` (experimental)
- `o3-mini` (experimental)

**API Call Structure**:
```javascript
{
  model: "gpt-4o-mini",
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ],
  temperature: 0.7,
  max_tokens: 4000
}
```

**Rate Limiting**:
- Batch processing: 50 requests/minute
- Single case: No limits
- Error handling: Exponential backoff

---

### Google Sheets Integration

**Two-Tier Header System**:
```
Row 1: Tier1_Category | Tier1_Category | Tier1_Category |
Row 2: Tier2_Field    | Tier2_Field    | Tier2_Field    |
```

**Merged Key Format**: `Tier1:Tier2`
- Example: `Patient_Info:Age`, `Vitals:Monitor`, `Education:Objectives`

**Sheet Types**:
1. **Input Sheet**: 4-column format (Formal_Info, HTML, DOC, Extra)
2. **Output Sheet**: Full Convert_Master template
3. **Settings Sheet**: Key-value config pairs
4. **Batch_Reports Sheet**: Processing statistics log

---

### Apps Script Properties Service

**Script Properties** (User-Level):
- API keys
- Model defaults
- Pricing configuration
- User preferences

**Document Properties** (Document-Level):
- Header cache
- Live logs
- Batch queue state
- Duplicate hash registry

---

### Real-Time Sidebar Communication

**Client-Server Pattern**:
```javascript
// Client (Sidebar HTML)
google.script.run
  .withSuccessHandler(updateUI)
  .withFailureHandler(showError)
  .serverFunction(params);

// Server (Apps Script)
function serverFunction(params) {
  // Process request
  return result;
}
```

**Live Updates**:
- Sidebar polls server every 1 second during batch processing
- Server returns current status from Document Properties
- Client updates UI with progress bars, log entries, status messages

---

## 🔮 Hidden/Planned Features

**From Code Comments**:

1. **ResusVitals API Integration** (mentioned in prompt but not implemented)
   - Real-time vital sign generation
   - Waveform animation data
   - Medical accuracy validation

2. **AI Facilitator System** (referenced in prompt)
   - Voice-responsive simulation
   - Adaptive questioning
   - Real-time scenario branching

3. **Mobile/Desktop Interactive Scenarios** (planned)
   - Cross-platform support
   - Offline capabilities
   - Touch/gesture interactions

---

## 📊 Settings Sheet Integrations

**Settings Sheet Structure**:
```
| A                    | B                        | C     |
|----------------------|--------------------------|-------|
| Master Scenario Convert  |                     |       |  ← Output sheet name
| OPENAI_API_KEY       | sk-...                   |       |
| DEFAULT_MODEL        | gpt-4o-mini              |       |
| INPUT_PRICE_PER_1K   | 0.15                     |       |
| OUTPUT_PRICE_PER_1K  | 0.60                     |       |
```

**Dynamic Configuration**:
- `Settings!A1`: Output sheet name (changes which sheet receives processed rows)
- Settings sheet KV pairs: Searchable key-value configuration
- Settings panel UI: Direct editing of all config values

---

## 📋 Batch_Reports Sheet

**Auto-Created Columns**:
```
| Timestamp            | Mode          | Created | Skipped | Duplicates | Errors | Estimated Cost | Elapsed |
|----------------------|---------------|---------|---------|------------|--------|----------------|---------|
| 2025-11-04 10:30:15  | Run All       | 25      | 3       | 2          | 0      | $0.45          | 3m 42s  |
| 2025-11-04 11:15:22  | Run 25 Rows   | 23      | 2       | 0          | 0      | $0.38          | 2m 55s  |
| 2025-11-04 14:20:33  | Run Specific  | 5       | 0       | 0          | 0      | $0.08          | 45s     |
```

**Metrics Tracked**:
- **Timestamp**: Batch start time
- **Mode**: Run All / Run 25 / Run Specific
- **Created**: Successfully processed scenarios
- **Skipped**: Rows with missing/invalid input
- **Duplicates**: Content hash matches (not processed)
- **Errors**: API failures, malformed responses
- **Estimated Cost**: Total USD cost for batch
- **Elapsed**: Total processing time

---

## 🎯 Quality Columns Auto-Created

**Developer_and_QA_Metadata Section**:

1. **Simulation_Quality_Score**
   - Type: Number (0-100%)
   - Formula: Weighted rubric calculation
   - Auto-populated after scenario creation

2. **Simulation_Enhancement_Suggestions**
   - Type: Text
   - Content: Targeted improvement recommendations
   - Examples:
     - "Add ECG findings to Orders_and_Tests:ECG"
     - "Expand Decision_Rules with 2 more branching paths"
     - "Include specific lab values in Orders_and_Tests:Labs"

---

## 🚀 Usage Workflows

### Workflow 1: Batch Processing New Scenarios

1. Open sidebar (Extensions → ER Simulator → Show Sidebar)
2. Select input sheet (contains 4-column source data)
3. Select output sheet (Master Scenario Convert)
4. Choose model (gpt-4o-mini recommended)
5. Enter API key (or load from Settings)
6. Click "Run All" or "Run 25 Rows"
7. Monitor live log for progress
8. Review Batch Report summary when complete
9. Check Batch_Reports sheet for cost analysis

### Workflow 2: Regenerating Titles Only

1. Select rows with weak titles (checkboxes in column A)
2. Open sidebar → Click "ATSR Tool"
3. Choose "Regenerate Selected"
4. Review new Spark/Reveal titles
5. Keep good titles, re-run for weak ones

### Workflow 3: Quality Audit & Cleanup

1. Run quality audit: Tools → Quality Scorer → Audit All
2. Review Simulation_Quality_Score column
3. Sort by score (ascending)
4. Read Simulation_Enhancement_Suggestions
5. Manually improve low-scoring scenarios (60-74%)
6. Delete very low quality (<60%) with cleanup tool

### Workflow 4: Duplicate Detection

1. Before batch run → Duplicate detector runs automatically
2. Content hash checked against Document Properties registry
3. Duplicates skipped and logged
4. Review Batch Report "Duplicates" count
5. Manually verify media URLs for near-duplicates (user recommendation)

---

## 🔧 Developer Notes

### Performance Optimizations

1. **Header Caching**: 40x speedup for column lookups
2. **Document Properties**: Faster than Sheet reads for state
3. **Batch Queue**: State machine prevents incomplete runs
4. **Token Estimation**: Avoids API calls for cost prediction

### Error Handling Patterns

1. **API Failures**: Exponential backoff with max 3 retries
2. **Malformed JSON**: Tolerant parser with regex extraction
3. **Missing Headers**: Auto-creates quality columns if absent
4. **Sheet Not Found**: Fallback to first "Convert" sheet

### Security Considerations

1. **API Key Storage**: Script Properties (user-level, not document-level)
2. **Masked Input**: Password fields in sidebar UI
3. **Settings Sheet**: Optional alternative to Script Properties (less secure)

---

## 🔄 Migration to Current System

**Changes Made by Claude**:
1. Modularized Apps Script architecture (separate files for each tool)
2. Added input validation layer (pre-processing checks)
3. Enhanced duplicate detection (media URL uniqueness)
4. Improved quality scoring (more granular rubric)
5. Created Node.js wrapper scripts for batch processing
6. Added comprehensive documentation system

**Preserved Features**:
- Two-tier header system (unchanged)
- Batch engine core logic (enhanced)
- ATSR title generation (improved)
- Quality scoring rubric (refined)
- Sidebar UI (modernized)

---

## 📚 Related Documentation

**Primary References**:
- `/docs/COMPREHENSIVE_TOOLS_INVENTORY.md` - Current tools catalog
- `/docs/DEVELOPMENT_ROADMAP.md` - Project phases and milestones
- `/scripts/Code_ULTIMATE_ATSR.gs` - Current Apps Script codebase

**Google Drive Folders**:
- `💾 Backups/Code Backups/` - Legacy code archive
- `📚 Documentation/System Documentation/` - Current system docs
- `🏁 Phase I - Data Organization & Case Management/` - Scenario processing

---

**Document Status**: ✅ Complete
**Last Updated**: 2025-11-04
**Next Review**: Before Phase III implementation
