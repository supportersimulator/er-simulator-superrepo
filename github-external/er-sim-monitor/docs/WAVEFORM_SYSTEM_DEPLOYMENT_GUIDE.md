# AI-Powered Waveform Management System - Deployment Guide

## Overview

This guide will help you deploy the enhanced Google Apps Script waveform management system with AI-powered analysis capabilities.

**New Features:**
- Nested "Waveforms" submenu for better organization
- AI-powered waveform analysis using ChatGPT (GPT-4)
- Interactive sidebar tool for bulk waveform editing
- ECG to SVG Converter launcher
- Real-time statistics dashboard
- Intelligent waveform suggestions based on clinical context

---

## Prerequisites

1. ✅ Google account with access to the "Convert_Master_Sim_CSV_Template_with_Input" spreadsheet
2. ✅ OpenAI API key (get from https://platform.openai.com/api-keys)
3. ✅ The two implementation files:
   - `/scripts/GoogleSheetsAppsScript_Enhanced.js`
   - `/scripts/WaveformAdjustmentTool.html`

---

## Step 1: Access Google Apps Script Editor

1. Open your Google Sheet: **Convert_Master_Sim_CSV_Template_with_Input**
2. Click **Extensions** → **Apps Script**
3. You should see the existing Apps Script project

---

## Step 2: Deploy the Enhanced Apps Script

### Option A: Replace Existing Code (Recommended)

1. In the Apps Script editor, locate the main code file (usually `Code.gs`)
2. **IMPORTANT**: Make a backup first
   - Click **File** → **Make a copy**
   - Rename the copy to "Backup - [Today's Date]"
3. Select ALL existing code in `Code.gs`
4. Delete it
5. Copy the entire contents of `/scripts/GoogleSheetsAppsScript_Enhanced.js`
6. Paste into the now-empty `Code.gs`
7. Click **Save** (💾 icon or Ctrl+S)

### Option B: Create New Script File (Alternative)

1. Click the **+** button next to **Files**
2. Select **Script**
3. Name it `WaveformManagement`
4. Paste the contents of `/scripts/GoogleSheetsAppsScript_Enhanced.js`
5. Save
6. Comment out or remove the old waveform functions from the original file to avoid conflicts

---

## Step 3: Deploy the Sidebar HTML

1. In the Apps Script editor, click the **+** button next to **Files**
2. Select **HTML**
3. Name it exactly: `WaveformAdjustmentTool`
4. Delete the default HTML boilerplate
5. Copy the entire contents of `/scripts/WaveformAdjustmentTool.html`
6. Paste into the HTML file
7. Click **Save**

**Your file structure should now look like:**
```
📁 Apps Script Project
  📄 Code.gs (or WaveformManagement.gs)
  📄 WaveformAdjustmentTool.html
  📄 [other existing files...]
```

---

## Step 4: Configure the ECG Converter URL

1. In the Apps Script editor, find this line near the top of the code:
   ```javascript
   const ECG_CONVERTER_URL = 'file:///Users/aarontjomsland/er-sim-monitor/ecg-to-svg-converter.html';
   ```

2. **Choose deployment option:**

   **Option A: Local File (Current Setup)**
   - Keep the line as-is if running locally
   - Users will need the file at that exact path

   **Option B: Web Hosting (Recommended for Team)**
   - Upload `ecg-to-svg-converter.html` to GitHub Pages, Netlify, or similar
   - Replace the URL with the hosted URL:
     ```javascript
     const ECG_CONVERTER_URL = 'https://your-domain.com/ecg-to-svg-converter.html';
     ```

3. Save the file

---

## Step 5: Deploy and Refresh

1. In the Apps Script editor, click **Deploy** → **Test deployments**
2. Click **Select type** → **Web app** (if not already deployed)
3. Set **Execute as**: Me
4. Set **Who has access**: Anyone with Google account
5. Click **Deploy**
6. Authorize the script if prompted:
   - Review permissions
   - Click **Advanced** → **Go to [Project Name] (unsafe)**
   - Click **Allow**

7. **Close the Apps Script editor**
8. **Refresh your Google Sheet** (F5 or Cmd+R)

---

## Step 6: Configure OpenAI API Key

1. In the Google Sheet, you should now see the updated **ER Simulator** menu
2. Click **ER Simulator** → **⚙️ Configure OpenAI API Key**
3. Enter your OpenAI API key from https://platform.openai.com/api-keys
4. Click **OK**

**Security Note**: The API key is stored securely using Google Apps Script Properties Service and is NOT visible to other users or stored in the spreadsheet.

---

## Step 7: Verify Installation

### Test 1: Menu Structure
✅ Check that the menu has this structure:
```
ER Simulator
├── 📂 View Cases by Category
├── 🔍 Jump to Case by ID
├── 🧩 View Pathway Organization
├── ───────────────────────────
├── 📊 Waveforms ▶
│   ├── 1️⃣ Adjust Waveforms Data
│   ├── 2️⃣ ECG to SVG Converter
│   ├── ───────────────────────
│   ├── 🩺 Suggest Mapping (Current Row)
│   ├── 🔄 Auto-Map All Waveforms
│   ├── 📊 Analyze Current Mappings
│   └── ❌ Clear All Waveforms
├── ───────────────────────────
├── ✅ Validate Current Row
└── ⚙️ Configure OpenAI API Key
```

### Test 2: Sidebar Tool
1. Click **ER Simulator** → **Waveforms** → **Adjust Waveforms Data**
2. A sidebar should appear on the right
3. Click **🔄 Load All Cases**
4. You should see:
   - Statistics dashboard at top (Total Cases, Total States, With Waveforms)
   - Searchable case list
   - State editor when you select a case

### Test 3: AI Analysis
1. In the sidebar, select any case
2. Click **🤖 Analyze with AI**
3. You should see:
   - "Analyzing with ChatGPT..." loading message
   - AI-generated analysis of the waveforms
   - Suggested improvements (if applicable)

**If you see an error about API key**:
- Go back to Step 6 and configure your OpenAI API key

### Test 4: ECG Converter Launcher
1. Click **ER Simulator** → **Waveforms** → **ECG to SVG Converter**
2. A dialog should appear with:
   - Explanation of the tool
   - Green "Launch ECG Converter" button
3. Click the button - external tool should open in new tab

---

## Usage Guide

### Adjusting Waveforms

1. **Open the Tool**:
   - **ER Simulator** → **Waveforms** → **Adjust Waveforms Data**

2. **Load Cases**:
   - Click **🔄 Load All Cases**
   - Wait for statistics to populate

3. **Select a Case**:
   - Use search box to filter by ID or title
   - Click on a case to view its states

4. **Edit Waveforms**:
   - Each state has a dropdown with all available waveforms
   - Change any waveform selection
   - Changes are tracked automatically

5. **Get AI Suggestions** (Optional):
   - Click **🤖 Analyze with AI**
   - Review ChatGPT's analysis and suggestions
   - Apply suggestions manually via dropdowns

6. **Apply Changes**:
   - Click **💾 Apply All Changes** to save to sheet
   - Confirm the action
   - Changes are written back to Google Sheet

7. **Statistics Update**:
   - Real-time stats show progress
   - "With Waveforms" counter updates as you work

### Quick Actions for Single Row

If you just want to work with the currently selected row:

1. Click on any row in the **Master Scenario Convert** tab
2. Use quick actions from menu:
   - **🩺 Suggest Mapping** - AI suggests waveforms for current row
   - **✅ Validate Current Row** - Check data integrity

---

## API Usage and Costs

### OpenAI API Pricing (as of Nov 2025)

**GPT-4 Model**:
- **Input**: $0.03 per 1K tokens (~750 words)
- **Output**: $0.06 per 1K tokens (~750 words)

**Typical Analysis**:
- Per-case analysis: ~500 input tokens + ~150 output tokens
- Cost per analysis: ~$0.024 ($0.02 per case)
- 100 cases analyzed: ~$2.40
- 189 cases (full dataset): ~$4.54

**Budget Management**:
- Set usage limits at https://platform.openai.com/account/billing/limits
- Monitor usage at https://platform.openai.com/usage
- AI analysis is optional - manual editing always available

---

## Troubleshooting

### Issue: "OpenAI API Key not configured" error

**Solution**:
1. Click **ER Simulator** → **Configure OpenAI API Key**
2. Enter valid API key from https://platform.openai.com/api-keys
3. Try AI analysis again

---

### Issue: Menu doesn't show new structure

**Solution**:
1. Close and reopen the Google Sheet
2. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
3. Clear browser cache if still not working
4. Check Apps Script editor - ensure both files saved correctly

---

### Issue: Sidebar doesn't load or shows blank

**Solution**:
1. Check browser console for errors (F12 → Console tab)
2. Verify `WaveformAdjustmentTool.html` file exists in Apps Script
3. Check that HTML filename matches exactly in the code:
   ```javascript
   HtmlService.createHtmlOutputFromFile('WaveformAdjustmentTool')
   ```

---

### Issue: AI analysis returns errors

**Possible Causes & Solutions**:

1. **Invalid API Key**:
   - Verify key at https://platform.openai.com/api-keys
   - Re-enter via **Configure OpenAI API Key** menu

2. **API Rate Limit**:
   - Wait a few seconds between requests
   - OpenAI free tier: 3 requests/min

3. **Insufficient Credits**:
   - Check billing at https://platform.openai.com/account/billing
   - Add payment method if needed

4. **Network Error**:
   - Check internet connection
   - Try again - temporary Google/OpenAI network issue

---

### Issue: ECG Converter doesn't launch

**Solution**:

1. **Local File Path Issue**:
   - Verify file exists at the path in `ECG_CONVERTER_URL` constant
   - Try opening the path directly in browser first

2. **Browser Blocked Popup**:
   - Allow popups from Google Sheets
   - Browser settings → Site Settings → Popups

3. **Use Web Hosting Instead**:
   - Upload `ecg-to-svg-converter.html` to web host
   - Update `ECG_CONVERTER_URL` to hosted URL
   - Redeploy Apps Script

---

### Issue: Changes not saving to sheet

**Solution**:
1. Check script execution log:
   - Apps Script editor → **Executions** tab
   - Look for errors
2. Verify permissions:
   - Script needs edit access to sheet
   - Re-authorize if needed
3. Check if sheet is protected:
   - Unprotect cells if necessary

---

### Issue: Statistics show 0 cases

**Solution**:
1. Verify sheet name is exactly: `Master Scenario Convert`
2. Check that row 3 onwards contains data (rows 1-2 are headers)
3. Look at browser console for errors
4. Try clicking **🔄 Load All Cases** again

---

## Advanced Configuration

### Customize Waveform Options

Edit the `WAVEFORMS` constant in the Apps Script:

```javascript
const WAVEFORMS = [
  { id: 'sinus_ecg', name: 'Normal Sinus Rhythm (NSR)' },
  { id: 'afib_ecg', name: 'Atrial Fibrillation' },
  // Add your custom waveforms here
  { id: 'custom_ecg', name: 'Custom Waveform' }
];
```

Save and refresh to see new options in dropdowns.

---

### Modify AI Analysis Prompt

Customize how ChatGPT analyzes waveforms by editing `buildAIAnalysisPrompt()`:

```javascript
function buildAIAnalysisPrompt(caseData) {
  return `
You are an emergency medicine expert analyzing ECG waveform assignments.

Case: ${caseData.title}
Category: ${caseData.category}

[Customize this section with your specific requirements...]
`;
}
```

---

### Change AI Model

Switch from GPT-4 to GPT-3.5-turbo for lower costs:

```javascript
// In analyzeCaseWithAI() function
payload: JSON.stringify({
  model: 'gpt-3.5-turbo', // Changed from 'gpt-4'
  messages: [...],
  temperature: 0.3,
  max_tokens: 500
})
```

**Cost Comparison**:
- GPT-4: ~$0.024 per analysis
- GPT-3.5-turbo: ~$0.002 per analysis (12x cheaper)
- Quality tradeoff: GPT-4 more clinically accurate

---

## System Architecture

### Data Flow

```
Google Sheet (Master Scenario Convert)
    ↓
Apps Script reads row data
    ↓
Sidebar displays cases + states
    ↓
User selects case
    ↓ (optional)
ChatGPT API analyzes clinical context
    ↓
User edits waveforms
    ↓
Apps Script writes back to sheet
    ↓
Changes persist in Google Sheet
```

### File Structure

```
Apps Script Project
├── Code.gs (or WaveformManagement.gs)
│   ├── onOpen() - Creates menu
│   ├── openWaveformAdjustmentTool() - Opens sidebar
│   ├── getAllCasesForAdjustmentTool() - Fetches data
│   ├── updateWaveformForCaseState() - Saves changes
│   ├── analyzeCaseWithAI() - ChatGPT integration
│   ├── launchECGConverter() - External tool launcher
│   └── [legacy functions preserved...]
│
└── WaveformAdjustmentTool.html
    ├── loadAllCases() - Client-side data loading
    ├── renderCaseList() - Display cases
    ├── renderStates() - Display state editors
    ├── analyzeWithAI() - Trigger AI analysis
    └── applyBulkChanges() - Save all changes
```

---

## Security Best Practices

1. **API Key Storage**:
   ✅ Stored via PropertiesService (encrypted by Google)
   ✅ Not visible in sheet or code
   ✅ Per-user storage (each user's own key)

2. **Script Permissions**:
   ✅ Execute as owner (you)
   ✅ Restrict access to your Google account only
   ✅ Review all authorization scopes

3. **Data Privacy**:
   ✅ No case data sent to external services (except OpenAI for analysis)
   ✅ ChatGPT only receives waveform assignments + vitals (no PHI)
   ✅ OpenAI does not train on API data (per their policy)

4. **Rate Limiting**:
   - Consider adding cooldown between AI requests
   - Prevent accidental bulk API usage

---

## Maintenance

### Backup Checklist

**Before major changes**:
1. ✅ Export Google Sheet as Excel (.xlsx)
2. ✅ Copy Apps Script code to local files
3. ✅ Document current menu structure
4. ✅ Note any custom configurations

### Update Process

**When updating the system**:
1. Create backup copy of Apps Script project
2. Test changes in a copy of the sheet first
3. Deploy to production sheet during low-usage time
4. Verify all features work after deployment
5. Monitor execution logs for errors

---

## Future Enhancements

**Planned Features**:
- 🔄 Batch AI analysis (analyze all cases at once)
- 📊 Waveform coverage reports (which waveforms most/least used)
- 🎯 Auto-apply AI suggestions (one-click accept all)
- 📈 Usage analytics (track which features used most)
- 🔔 Validation warnings (alert if waveform doesn't match vitals)
- 🌐 Multi-language support (Spanish, French medical terms)

**Suggest more?** Open an issue or PR in the GitHub repository.

---

## Support

**Issues?** Check:
1. This troubleshooting guide (above)
2. Apps Script execution logs (Apps Script editor → Executions)
3. Browser console (F12 → Console tab)
4. Google Apps Script documentation: https://developers.google.com/apps-script

**Still stuck?**
- File an issue in the GitHub repository
- Include error messages and screenshots
- Note: what you tried and what happened

---

## Appendix: Complete File Locations

```
/Users/aarontjomsland/er-sim-monitor/
├── scripts/
│   ├── GoogleSheetsAppsScript_Enhanced.js  ← Deploy to Apps Script
│   └── WaveformAdjustmentTool.html         ← Deploy to Apps Script
│
├── ecg-to-svg-converter.html               ← Referenced by launcher
│
└── docs/
    └── WAVEFORM_SYSTEM_DEPLOYMENT_GUIDE.md ← This file
```

---

**Last Updated**: November 2, 2025
**System Version**: 2.0 (AI-Enhanced)
**Tested With**: Google Apps Script (latest), OpenAI GPT-4
**Status**: ✅ Production Ready
