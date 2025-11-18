# Batch Processing Fix Summary

## Problem Discovered

When batch processing ran, it created rows with only N/A values. The execution log showed:
- "Detected keys: error" (only 1 key instead of ~200)
- "Missing keys: Case_Organization:Case_ID, ..." (all fields missing)
- Cost: ~$0.99 per row (OpenAI was called successfully)

## Root Cause Analysis

### Critical Bug: Incorrect OpenAI Response Extraction

**Location:** `callOpenAiJson()` function in Code.gs

**The Problem:**
The code was parsing the **entire OpenAI Chat API response** as the simulation data, instead of extracting the content first.

**OpenAI Chat API Response Structure:**
```json
{
  "choices": [{
    "message": {
      "content": "{...actual simulation JSON with 200+ fields...}"
    }
  }]
}
```

**What the code was doing (WRONG):**
```javascript
const response = UrlFetchApp.fetch(url, options);
const raw = response.getContentText();
return JSON.parse(raw);  // ❌ Returns full API response with "choices" array
```

**Result:**
- `parsed` object had structure: `{choices: [{message: {content: "..."}}]}`
- Code tried to extract fields like `Case_Organization:Case_ID` from this structure
- No fields found → all N/A values
- If OpenAI returned an API error, the response would be `{error: {...}}` which explains "Detected keys: error"

## The Fix

**File:** `scripts/fixOpenAIResponseExtraction.cjs`

**What it does:**
1. Parses the full API response
2. Checks for API-level errors (`apiResponse.error`)
3. Extracts `apiResponse.choices[0].message.content`
4. **Then** parses that content string as the simulation JSON
5. Adds comprehensive logging for debugging

**New code:**
```javascript
const response = UrlFetchApp.fetch(url, options);
const raw = response.getContentText();

try {
  // Parse the full API response
  const apiResponse = JSON.parse(raw);

  // Check for API-level errors
  if (apiResponse.error) {
    Logger.log('❌ OpenAI API Error: ' + JSON.stringify(apiResponse.error));
    throw new Error('OpenAI API Error: ' + (apiResponse.error.message || JSON.stringify(apiResponse.error)));
  }

  // Extract the actual content from choices array
  if (!apiResponse.choices || !apiResponse.choices.length) {
    Logger.log('❌ No choices in API response');
    throw new Error('OpenAI returned no choices');
  }

  const content = apiResponse.choices[0].message.content;
  Logger.log('📝 Extracted content length: ' + content.length + ' characters');

  // NOW parse the content as JSON (this is the simulation data)
  const parsed = JSON.parse(content);
  Logger.log('✅ Successfully parsed simulation JSON with ' + Object.keys(parsed).length + ' keys');

  return parsed;
```

## Impact

### Before Fix:
- Row created with N/A values in all ~200 fields
- Only hash signature stored (in Conversion_Status column)
- "Detected keys: error" (1 key)
- Cost: ~$0.99 per failed row

### After Fix:
- Should extract all ~200 simulation fields correctly
- Proper vitals JSON stringification
- Full scenario data populated
- Cost: ~$0.99 per successful row

## Vitals JSON Handling (NOT the bug, but important to understand)

The prompt instructs OpenAI to output vitals as nested objects:
```json
{
  "Vitals_Initial": {"HR":120, "BP":"95/60", "RR":28, "Temp":39.2, "SpO2":94}
}
```

The code then stringifies them for Google Sheets storage:
```javascript
if (parsed[k] && typeof parsed[k] === 'object') {
  parsed[k] = JSON.stringify(parsed[k]);
}
```

Final result in sheet:
```
Vitals_Initial: "{\"HR\":120,\"BP\":\"95/60\",\"RR\":28,\"Temp\":39.2,\"SpO2\":94}"
```

**This is working as designed** - vitals are stored as JSON strings that the monitor engine can parse dynamically.

## Testing Plan

1. Refresh Google Sheets tab
2. Open sidebar
3. Select "Next 25 unprocessed rows" mode
4. Click "Launch Batch Engine"
5. Check execution logs for:
   - "🔍 DEBUG: Raw OpenAI API response: ..." (should show `{"choices":[...]}`)
   - "📝 Extracted content length: X characters"
   - "✅ Successfully parsed simulation JSON with ~200 keys"
6. Verify Master Scenario Convert has new row with populated fields (not all N/A)

## Related Scripts Created

1. `debugBatchQueue.cjs` - Added debug logging for queue tracking
2. `fixBatchErrorHandling.cjs` - Added withFailureHandler to prevent silent failures
3. `fixBatchFlowRecalculate.cjs` - Implemented recalculation strategy (process one row at a time)
4. `improveBatchErrorTracking.cjs` - Fixed error counting logic
5. `addTestBatchFunction.cjs` - Created testBatchProcessRow3() for manual testing
6. **`fixOpenAIResponseExtraction.cjs`** - **THE CRITICAL FIX** ✅

## Deployment Status

✅ Fix deployed to Apps Script project
✅ All logging in place
⏳ Pending: Test batch processing to verify fix works

## Next Steps

User should test the batch processing. If successful, they can process all 169 imported scenarios automatically using the "Next 25 unprocessed rows" mode.
