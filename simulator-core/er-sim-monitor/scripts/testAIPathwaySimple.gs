/**
 * SIMPLE TEST VERSION - AI Pathway Discovery
 * Tests with minimal prompt to diagnose timeout issues
 */

function testAIPathwaySimple() {
  // Test 1: Check API key
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settingsSheet = ss.getSheetByName('Settings');

  if (!settingsSheet) {
    SpreadsheetApp.getUi().alert('Error', 'Settings sheet not found', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  const apiKey = settingsSheet.getRange('B2').getValue();

  if (!apiKey) {
    SpreadsheetApp.getUi().alert('Error', 'No API key in Settings!B2', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  Logger.log('✅ API Key found: ' + apiKey.substring(0, 10) + '...');

  // Test 2: Try simple OpenAI call
  try {
    Logger.log('🔄 Calling OpenAI API...');

    const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: 'Say "test successful" and nothing else.'
          }
        ],
        max_tokens: 10
      }),
      muteHttpExceptions: true
    });

    const responseCode = response.getResponseCode();
    Logger.log('Response code: ' + responseCode);

    if (responseCode === 200) {
      const data = JSON.parse(response.getContentText());
      const message = data.choices[0].message.content;
      Logger.log('✅ OpenAI response: ' + message);
      SpreadsheetApp.getUi().alert('Success!', 'OpenAI API is working!\n\nResponse: ' + message, SpreadsheetApp.getUi().ButtonSet.OK);
    } else {
      Logger.log('❌ API Error: ' + response.getContentText());
      SpreadsheetApp.getUi().alert('API Error', 'Status: ' + responseCode + '\n\n' + response.getContentText(), SpreadsheetApp.getUi().ButtonSet.OK);
    }

  } catch (e) {
    Logger.log('❌ Exception: ' + e.message);
    SpreadsheetApp.getUi().alert('Error', 'Exception: ' + e.message + '\n\nStack: ' + e.stack, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}
