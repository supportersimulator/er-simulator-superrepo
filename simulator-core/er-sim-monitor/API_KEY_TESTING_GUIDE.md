# 🔑 API Key Testing Guide

This guide shows you **3 easy ways** to test if your OpenAI API key is working correctly.

---

## 📋 Prerequisites

Before testing, make sure your API key is configured:

1. Open your Google Sheet
2. Go to the **Settings** sheet
3. Verify your API key is in one of these locations:
   - **Option A**: Cell **B2** (if row 2 has "API Key" label in column A)
   - **Option B**: As a key-value pair where column A = `OPENAI_API_KEY` and column B = your key
4. Your API key should start with `sk-proj-` or `sk-`

---

## 🚀 Method 1: Using the UI Button (Easiest)

This is the **quickest way** to test your API key:

1. Open your Google Sheet
2. Open the **Batch Processing Sidebar**:
   - Menu: **Sim Builder** → **🚀 Batch Processing**
   - Or use the keyboard shortcut if configured
3. Click the **🛡️ Check API** button
4. Wait a few seconds
5. You'll see one of these results:
   - ✅ **"🛡️ API is reachable."** → Your API key is working!
   - ⚠️ **"API replied unexpectedly"** → API responded but with wrong format
   - ❌ **"API error: [message]"** → API key is invalid or there's a connection issue

**That's it!** This method uses the built-in `checkApiStatus()` function.

---

## 🛠️ Method 2: Run Function in Apps Script Editor

For more detailed testing with logs:

1. Open **Apps Script Editor**:
   - Menu: **Extensions** → **Apps Script**
   - Or go to: `https://script.google.com/home/projects/YOUR_PROJECT_ID/edit`
2. In the function dropdown (top toolbar), select: **`checkApiStatus`**
3. Click the **▶️ Run** button (or press `Ctrl+R` / `Cmd+R`)
4. **Authorize** if prompted (first time only)
5. Check the results:
   - **View → Logs** (or press `Ctrl+Enter` / `Cmd+Enter`) to see detailed logs
   - Look for messages like:
     - ✅ `Found OPENAI_API_KEY in Settings sheet`
     - ✅ `API is reachable`
     - ❌ Error messages if something is wrong

**What it does**: Makes a simple OpenAI API call asking it to reply "OK", then verifies the response.

---

## 🧪 Method 3: Run Detailed Test Function

For the most comprehensive test with full error details:

1. Open **Apps Script Editor** (Extensions → Apps Script)
2. Copy and paste this test function:

```javascript
function testApiKeyDetailed() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settingsSheet = ss.getSheetByName('Settings');

  if (!settingsSheet) {
    SpreadsheetApp.getUi().alert('Error', 'Settings sheet not found', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  // Try to read API key
  let apiKey = null;
  
  // Method 1: Check for OPENAI_API_KEY key-value pair
  const range = settingsSheet.getDataRange().getValues();
  for (let r = 0; r < range.length; r++) {
    const k = String(range[r][0] || '').trim().toUpperCase();
    const v = String(range[r][1] || '').trim();
    if (k === 'OPENAI_API_KEY' && v) {
      apiKey = v;
      Logger.log('✅ Found OPENAI_API_KEY in Settings sheet');
      break;
    }
  }
  
  // Method 2: Fallback to B2
  if (!apiKey) {
    const labelB2 = String(settingsSheet.getRange(2, 1).getValue() || '').toLowerCase();
    if (labelB2.includes('api')) {
      apiKey = String(settingsSheet.getRange(2, 2).getValue() || '').trim();
      if (apiKey) {
        Logger.log('✅ Found API key in Settings!B2');
      }
    }
  }

  if (!apiKey) {
    SpreadsheetApp.getUi().alert('Error', 'No API key found in Settings sheet.\n\nPlease add it to:\n- Cell B2 (if row 2 has "API Key" label)\n- Or as OPENAI_API_KEY in column A with key in column B', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  Logger.log('🔑 API Key found: ' + apiKey.substring(0, 10) + '...');

  // Test API call
  try {
    Logger.log('🔄 Calling OpenAI API...');

    const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: 'Reply with exactly: "API test successful"'
          }
        ],
        max_tokens: 20,
        temperature: 0
      }),
      muteHttpExceptions: true
    });

    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    Logger.log('📡 Response code: ' + responseCode);

    if (responseCode === 200) {
      const data = JSON.parse(responseText);
      const message = data.choices[0].message.content.trim();
      Logger.log('✅ OpenAI response: ' + message);
      SpreadsheetApp.getUi().alert(
        '✅ Success!', 
        'OpenAI API is working correctly!\n\nResponse: ' + message + '\n\nModel: ' + data.model,
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    } else {
      const errorData = JSON.parse(responseText);
      Logger.log('❌ API Error: ' + responseText);
      SpreadsheetApp.getUi().alert(
        '❌ API Error', 
        'Status Code: ' + responseCode + '\n\nError: ' + (errorData.error?.message || responseText),
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    }

  } catch (e) {
    Logger.log('❌ Exception: ' + e.message);
    Logger.log('Stack: ' + e.stack);
    SpreadsheetApp.getUi().alert(
      '❌ Error', 
      'Exception occurred:\n\n' + e.message + '\n\nCheck logs for details.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}
```

3. In the function dropdown, select: **`testApiKeyDetailed`**
4. Click **▶️ Run**
5. Check the **Logs** (View → Logs) for detailed output
6. An alert will show the result

**What it does**: 
- Verifies API key is found in Settings sheet
- Makes a test API call
- Shows detailed error messages if something fails
- Displays the API response

---

## 🔍 Understanding Test Results

### ✅ Success Messages

- **"🛡️ API is reachable."** → Everything is working!
- **"OpenAI API is working correctly!"** → API key is valid and functional

### ⚠️ Warning Messages

- **"API replied unexpectedly"** → API responded but format was wrong (rare, usually means API is working)
- **"No API key found"** → API key not configured in Settings sheet

### ❌ Error Messages

- **"Missing API key"** → API key not found in Settings sheet
- **"401 Unauthorized"** → API key is invalid or expired
- **"429 Too Many Requests"** → Rate limit exceeded (wait a few minutes)
- **"500 Internal Server Error"** → OpenAI server issue (try again later)
- **"Network error"** → Connection problem (check internet)

---

## 🐛 Troubleshooting

### Problem: "No API key found"

**Solution**:
1. Open Settings sheet
2. Add your API key to cell **B2** (with "API Key" label in A2)
3. Or add a row with `OPENAI_API_KEY` in column A and your key in column B
4. Run the test again

### Problem: "401 Unauthorized"

**Solution**:
1. Verify your API key is correct (copy-paste it again)
2. Check if the key starts with `sk-proj-` or `sk-`
3. Make sure there are no extra spaces before/after the key
4. Verify the key hasn't expired (check OpenAI dashboard)

### Problem: "429 Too Many Requests"

**Solution**:
1. Wait 1-2 minutes
2. Check your OpenAI usage limits in the dashboard
3. Try again after waiting

### Problem: Test function not found

**Solution**:
1. Make sure you're in the correct Apps Script project
2. The function should be in your main `Code.gs` or `Code.js` file
3. If using Method 3, make sure you pasted the function correctly

---

## 📝 Quick Reference

| Method | Speed | Detail Level | Best For |
|--------|-------|--------------|----------|
| **Method 1: UI Button** | ⚡ Fastest | Basic | Quick checks |
| **Method 2: checkApiStatus()** | ⚡ Fast | Medium | Standard testing |
| **Method 3: Detailed Test** | 🐢 Slower | Detailed | Debugging issues |

---

## ✅ Recommended Workflow

1. **First time setup**: Use **Method 3** to verify everything works
2. **Regular checks**: Use **Method 1** (UI button) for quick verification
3. **When debugging**: Use **Method 2** or **Method 3** to see detailed logs

---

**Need help?** Check the logs in Apps Script (View → Logs) for detailed error messages.

