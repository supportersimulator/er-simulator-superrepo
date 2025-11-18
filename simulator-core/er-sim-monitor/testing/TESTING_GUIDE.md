# Apps Script Function Testing Guide

**Mission:** Test all 12 Apps Script functions to highest quality standards
**Duration:** 24-hour comprehensive testing
**Autonomous:** No bash commands, file-based operations only

---

## 🚀 Quick Start

### Option 1: Run Full Test Suite (Recommended)
```javascript
// This runs everything: verify deployment → deploy if needed → test all 12 functions → generate reports
const { runFullTestSuite } = require('./tools/runFullTestSuite.cjs');
await runFullTestSuite();
```

**Output:**
- `testing/results/comprehensive-test-report-{timestamp}.json` (full data)
- `testing/results/test-summary-{timestamp}.md` (human-readable)

---

## 🔧 Individual Tools

### 1. Verify Deployment
Check if Apps Script is deployed correctly:
```javascript
const { verifyDeployment } = require('./tools/verifyDeployment.cjs');
await verifyDeployment();
```

**What it checks:**
- Deployed code vs local source comparison
- All 12 critical functions present
- Size differences
- Function names match

**Output:** `testing/results/deployment-verification-{timestamp}.json`

---

### 2. Deploy Apps Script
Update deployed Apps Script with local code:
```javascript
const { deployScript } = require('./tools/deployAppsScript.cjs');
await deployScript();
```

**What it does:**
- Uploads `scripts/Code_ULTIMATE_ATSR.gs` to Google Apps Script
- Verifies upload success
- Checks all critical functions deployed

**Output:** `testing/results/deployment-{timestamp}.json`

---

### 3. Test All Functions
Test all 12 menu functions programmatically:
```javascript
const { runTests } = require('./tools/testAppsScriptFunctions.cjs');
await runTests();
```

**What it tests:**
- All 12 Apps Script menu functions
- Execution success/failure
- Response times
- Output quality

**Quality Scoring (0-100 points):**
- Functionality: 40pts (executes + completes task)
- Quality: 40pts (output format + content + golden standard match)
- Performance: 10pts (execution time + no timeouts)
- User Experience: 10pts (logs + intuitive operation)

**Output:** `testing/results/function-test-results-{timestamp}.json`

---

## 📊 Quality Standards

### Production Ready Criteria
- **Overall Average:** ≥ 90%
- **Critical Functions:** ≥ 95% (onOpen, openSimSidebar, runATSRTitleGenerator, checkApiStatus)
- **High Priority:** ≥ 85% (Categories, Quality Audit, Refresh Headers, Settings)
- **Medium Priority:** ≥ 75% (Image Sync, Memory Tracker, Clean Up, Retrain)

### Minimum Acceptable Standards
- **Critical:** ≥ 85%
- **High Priority:** ≥ 75%
- **Medium Priority:** ≥ 65%

---

## 📋 Functions Tested

### 🔴 Critical (4 functions)
1. **onOpen** - Menu Load
2. **openSimSidebar** - Launch Batch/Single Sidebar
3. **runATSRTitleGenerator** - ATSR Titles & Summary
4. **checkApiStatus** - Check API Status

### 🟡 High Priority (4 functions)
5. **openCategoriesPathwaysPanel** - Categories & Pathways
6. **runQualityAudit_AllOrRows** - Quality Audit
7. **refreshHeaders** - Refresh Headers
8. **openSettingsPanel** - Settings

### 🟢 Medium Priority (4 functions)
9. **openImageSyncDefaults** - Image Sync Defaults
10. **openMemoryTracker** - Memory Tracker
11. **cleanUpLowValueRows** - Clean Up Low-Value Rows
12. **retrainPromptStructure** - Retrain Prompt Structure

---

## 📁 Output Files

### JSON Reports (Machine-Readable)
- `deployment-verification-{date}.json` - Deployment status
- `deployment-{date}.json` - Deployment record
- `function-test-results-{date}.json` - Individual function scores
- `comprehensive-test-report-{date}.json` - Full test suite results

### Markdown Reports (Human-Readable)
- `test-summary-{date}.md` - Summary with tables and recommendations

---

## 🎯 Interpreting Results

### Overall Grade
- **✅ EXCELLENT:** 95%+ average
- **✅ VERY GOOD:** 90-94% average
- **✅ GOOD:** 85-89% average
- **⚠️ ACCEPTABLE:** 75-84% average
- **⚠️ NEEDS IMPROVEMENT:** 60-74% average
- **❌ FAILING:** <60% average

### Production Readiness
- ✅ **Production Ready:** All targets met, ready to use
- ⚠️ **Partial Success:** Minimum standards met, improvements recommended
- ❌ **Not Ready:** Below minimum standards, review failed functions

---

## 🔍 Troubleshooting

### Error: "Token file not found"
**Solution:** Run OAuth authentication first
```bash
npm run auth-google
```

### Error: "insufficient authentication scopes"
**Solution:** Delete token and re-authenticate with full scopes
```bash
rm config/token.json
npm run auth-google
```

### Error: "Script not found"
**Solution:** Verify Apps Script ID in .env
```bash
APPS_SCRIPT_ID=1NXjFvH2Wo117saCyqmNDfCqZ1iQ9vykxa0-kHUhFAYDuhthgql5Ru_P6
```

### Function Test Fails
**Check:**
1. Is function deployed? (run verifyDeployment.cjs)
2. Does function require parameters? (check FUNCTIONS_TO_TEST in testAppsScriptFunctions.cjs)
3. Does function need spreadsheet access? (verify Sheet ID in .env)

---

## 🧪 Testing Workflow

### Standard Testing Workflow
1. **Verify Deployment** → Check if code is deployed correctly
2. **Deploy if Needed** → Upload latest code if out of date
3. **Test Functions** → Run all 12 function tests
4. **Analyze Results** → Generate comprehensive report
5. **Review Recommendations** → Act on findings

### Full Automated Workflow
```javascript
// Single command runs entire workflow
await runFullTestSuite();
```

This will:
1. ✅ Authenticate with Google
2. ✅ Verify deployment (redeploy if needed)
3. ✅ Test all 12 functions
4. ✅ Score quality (0-100 points each)
5. ✅ Calculate averages by priority
6. ✅ Generate JSON + Markdown reports
7. ✅ Determine production readiness

---

## 📝 Example Output

### Console Output
```
🎯 24-HOUR APPS SCRIPT FUNCTION TESTING SUITE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mission: Test ALL functions to highest quality standards
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 PHASE 1: DEPLOYMENT VERIFICATION

🔐 Authenticating...
✅ Authenticated

📥 Fetching deployed script...
✅ Found 2 deployed files
✅ DEPLOYMENT VERIFIED - All functions present and code identical

📋 PHASE 2: COMPREHENSIVE FUNCTION TESTING

🧪 Testing: Menu Load (onOpen)
   Priority: CRITICAL | Target: 95%
   ⚙️  Invoking onOpen...
   ✅ Completed in 1250ms
   📊 Score: 95% ✅ EXCELLENT
   ✅ PASSED (Target: 95%)

[... 11 more functions ...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 TEST SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Passed: 12/12
❌ Failed: 0/12

📈 Average Score: 92.5%
   🔴 Critical Functions: 96.0% (Target: 95%+)
   🟡 High Priority: 90.0% (Target: 85%+)
   🟢 Medium Priority: 88.5% (Target: 75%+)

⏱️  Total Test Duration: 45.32s

📁 Results saved: testing/results/comprehensive-test-report-2025-11-03.json

✅ ALL QUALITY STANDARDS MET - READY FOR PRODUCTION
```

---

## 🏆 Success Criteria Summary

| Priority | Target | Meaning |
|----------|--------|---------|
| **Critical** | 95%+ | Essential functions, zero tolerance for failure |
| **High** | 85%+ | Important features, high quality expected |
| **Medium** | 75%+ | Supporting functions, good quality acceptable |
| **Overall** | 90%+ | Average across all 12 functions |

**Production Ready = All targets met + Overall ≥ 90%**

---

*Last Updated: 2025-11-03T06:15:00*
*Testing Framework Version: 1.0*
*Autonomous 8-Hour Session*
