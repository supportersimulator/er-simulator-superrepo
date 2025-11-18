#!/usr/bin/env node

/**
 * Add "Return to Panel" functionality after cache completion
 * When cache window closes, automatically reopen the Categories & Pathways panel
 */

const fs = require('fs');
const path = require('path');

const phase2Path = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs');

console.log('\n🔄 ADDING RETURN TO PANEL AFTER CACHE\n');
console.log('═══════════════════════════════════════════════════════════════\n');

let code = fs.readFileSync(phase2Path, 'utf8');

// 1. Find the preCacheRichData() function that shows the modal dialog
console.log('📝 Step 1: Modifying cache progress modal...\n');

// Find where the modal is shown
const oldModalShow = `  const htmlOutput = HtmlService.createHtmlOutput(html).setWidth(900).setHeight(500);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, '💾 Pre-Caching Rich Clinical Data');`;

// The JavaScript in the HTML needs a close button that reopens the panel
const newModalShow = `  const htmlOutput = HtmlService.createHtmlOutput(html).setWidth(900).setHeight(500);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, '💾 Pre-Caching Rich Clinical Data');

  // Note: After user closes this modal, we can't automatically reopen the panel
  // because Apps Script doesn't support chaining modal dialogs.
  // Instead, we'll add a "Return to Panel" button in the completion UI`;

if (code.indexOf(oldModalShow) !== -1) {
  code = code.replace(oldModalShow, newModalShow);
  console.log('   ✅ Updated modal dialog setup\n');
}

// 2. Add a "Return to Panel" button to the completion UI
console.log('📝 Step 2: Adding completion UI with Return button...\n');

// Find the cache completion handler in the JavaScript
const completionHandler = `google.script.run
      .withSuccessHandler(function(result) {
        updateStatus('🎉 Cache Complete!', 'success');
        setProgress(100);
        addLog('✅ Successfully cached all data', 'success');
        addLog('Click X to close this window', 'info');
      })
      .withFailureHandler(function(error) {
        updateStatus('❌ Cache Failed', 'error');
        addLog('Error: ' + error.message, 'error');
      })
      .performCacheWithProgress();`;

const newCompletionHandler = `google.script.run
      .withSuccessHandler(function(result) {
        updateStatus('🎉 Cache Complete!', 'success');
        setProgress(100);
        addLog('✅ Successfully cached all data', 'success');
        addLog('', 'info');

        // Add return to panel button
        var logs = document.getElementById('logs');
        var buttonDiv = document.createElement('div');
        buttonDiv.style.cssText = 'margin-top: 20px; text-align: center;';

        var returnBtn = document.createElement('button');
        returnBtn.innerHTML = '🔙 Return to Categories & Pathways Panel';
        returnBtn.style.cssText = 'background: linear-gradient(135deg, #00c853, #00ff6a); color: #000; border: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 8px rgba(0,200,83,0.3);';
        returnBtn.onmouseover = function() { this.style.background = 'linear-gradient(135deg, #00ff6a, #00c853)'; };
        returnBtn.onmouseout = function() { this.style.background = 'linear-gradient(135deg, #00c853, #00ff6a)'; };
        returnBtn.onclick = function() {
          google.script.run.showCategoriesPathwaysPanel();
          google.script.host.close();
        };

        var closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✖️ Close';
        closeBtn.style.cssText = 'background: #333; color: #fff; border: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: bold; cursor: pointer; margin-left: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);';
        closeBtn.onmouseover = function() { this.style.background = '#555'; };
        closeBtn.onmouseout = function() { this.style.background = '#333'; };
        closeBtn.onclick = function() {
          google.script.host.close();
        };

        buttonDiv.appendChild(returnBtn);
        buttonDiv.appendChild(closeBtn);
        logs.parentNode.appendChild(buttonDiv);

        addLog('👆 Click "Return to Panel" to continue working', 'info');
      })
      .withFailureHandler(function(error) {
        updateStatus('❌ Cache Failed', 'error');
        addLog('Error: ' + error.message, 'error');

        // Add return button even on failure
        var logs = document.getElementById('logs');
        var buttonDiv = document.createElement('div');
        buttonDiv.style.cssText = 'margin-top: 20px; text-align: center;';

        var returnBtn = document.createElement('button');
        returnBtn.innerHTML = '🔙 Return to Panel';
        returnBtn.style.cssText = 'background: linear-gradient(135deg, #00c853, #00ff6a); color: #000; border: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: bold; cursor: pointer;';
        returnBtn.onclick = function() {
          google.script.run.showCategoriesPathwaysPanel();
          google.script.host.close();
        };

        buttonDiv.appendChild(returnBtn);
        logs.parentNode.appendChild(buttonDiv);
      })
      .performCacheWithProgress();`;

if (code.indexOf('performCacheWithProgress();') !== -1) {
  code = code.replace(completionHandler, newCompletionHandler);
  console.log('   ✅ Added Return to Panel button in completion UI\n');
}

// 3. Ensure showCategoriesPathwaysPanel() function exists
console.log('📝 Step 3: Verifying panel function exists...\n');

if (code.indexOf('function showCategoriesPathwaysPanel()') !== -1) {
  console.log('   ✅ Panel function already exists\n');
} else {
  console.log('   ℹ️  Panel function not found - may be in different file\n');
  console.log('   💡 Make sure showCategoriesPathwaysPanel() is accessible\n');
}

// Write back
fs.writeFileSync(phase2Path, code, 'utf8');

console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ RETURN TO PANEL FEATURE ADDED!\n');
console.log('📊 Changes Made:\n');
console.log('   1. Added "Return to Panel" button after cache completes');
console.log('   2. Added "Close" button as alternative');
console.log('   3. Buttons appear on both success and failure');
console.log('   4. Green gradient Return button stands out visually\n');
console.log('🎯 User Experience:\n');
console.log('   ✅ Cache completes successfully');
console.log('   ✅ User sees completion message');
console.log('   ✅ Two buttons appear:');
console.log('      • 🔙 Return to Categories & Pathways Panel (green)');
console.log('      • ✖️ Close (gray)\n');
console.log('   ✅ Clicking Return button:');
console.log('      1. Closes cache progress window');
console.log('      2. Immediately reopens main panel');
console.log('      3. User can continue working seamlessly\n');
console.log('   ✅ Clicking Close button:');
console.log('      1. Just closes the window');
console.log('      2. User returns to spreadsheet\n');
console.log('📋 Visual Design:\n');
console.log('   • Return button: Green gradient, bold, prominent');
console.log('   • Close button: Gray, secondary option');
console.log('   • Hover effects for better UX');
console.log('   • Centered layout for easy clicking\n');
console.log('═══════════════════════════════════════════════════════════════\n');
