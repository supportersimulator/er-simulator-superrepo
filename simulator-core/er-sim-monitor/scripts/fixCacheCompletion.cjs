#!/usr/bin/env node

/**
 * Fix cache completion issues:
 * 1. Remove auto-close timeout
 * 2. Add "Return to Panel" button
 * 3. Fix "0 cases" bug (use totalCases instead of allCases.length)
 */

const fs = require('fs');
const path = require('path');

const phase2Path = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs');

console.log('\n🔧 FIXING CACHE COMPLETION ISSUES\n');
console.log('═══════════════════════════════════════════════════════════════\n');

let code = fs.readFileSync(phase2Path, 'utf8');

// ISSUE 1: Fix "0 cases" bug in performCacheWithProgress()
console.log('📝 Step 1: Fixing "0 cases" bug...\n');

const oldCasesProcessed = `    const casesProcessed = analysis.allCases ? analysis.allCases.length : 0;`;

const newCasesProcessed = `    const casesProcessed = analysis.totalCases || 0;`;

if (code.indexOf(oldCasesProcessed) !== -1) {
  code = code.replace(oldCasesProcessed, newCasesProcessed);
  console.log('   ✅ Fixed: Now uses analysis.totalCases instead of analysis.allCases.length\n');
} else {
  console.log('   ℹ️  casesProcessed line not found or already fixed\n');
}

// ISSUE 2 & 3: Replace the entire success handler
console.log('📝 Step 2: Replacing success handler with Return to Panel button...\n');

const oldSuccessHandler = `'google.script.run' +
    '  .withSuccessHandler(function(result) {' +
    '    if (result.success) {' +
    '      updateProgress(100, result.casesProcessed);' +
    '      addLog("✅ SUCCESS! Processed " + result.casesProcessed + " cases", "success");' +
    '      addLog("💾 Cache stored in Pathway_Analysis_Cache sheet", "success");' +
    '      addLog("📊 All 23 fields per case cached (demographics + vitals + clinical context)", "success");' +
    '      addLog("⚡ Valid for 24 hours", "success");' +
    '      addLog("🎯 AI discovery will now be INSTANT!", "success");' +
    '      updateStatus("✅ COMPLETE! Cache ready for instant AI discovery");' +
    '      setTimeout(function() { google.script.host.close(); }, 3000);' +
    '    } else {' +
    '      addLog("❌ ERROR: " + result.error, "warning");' +
    '      updateStatus("❌ Cache failed - check logs");' +
    '    }' +
    '  })' +
    '  .withFailureHandler(function(error) {' +
    '    addLog("❌ FAILED: " + error.message, "warning");' +
    '    updateStatus("❌ Cache process failed");' +
    '  })' +
    '  .performCacheWithProgress();'`;

const newSuccessHandler = `'google.script.run' +
    '  .withSuccessHandler(function(result) {' +
    '    if (result.success) {' +
    '      updateProgress(100, result.casesProcessed);' +
    '      addLog("✅ SUCCESS! Processed " + result.casesProcessed + " cases", "success");' +
    '      addLog("💾 Cache stored in Pathway_Analysis_Cache sheet", "success");' +
    '      addLog("📊 All 23 fields per case cached (demographics + vitals + clinical context)", "success");' +
    '      addLog("⚡ Valid for 24 hours", "success");' +
    '      addLog("🎯 AI discovery will now be INSTANT!", "success");' +
    '      addLog("", "success");' +
    '      updateStatus("✅ COMPLETE! Cache ready for instant AI discovery");' +
    '' +
    '      // Add Return to Panel button' +
    '      var logs = document.getElementById("logs");' +
    '      var buttonDiv = document.createElement("div");' +
    '      buttonDiv.style.cssText = "margin-top: 20px; text-align: center;";' +
    '' +
    '      var returnBtn = document.createElement("button");' +
    '      returnBtn.innerHTML = "🔙 Return to Categories & Pathways Panel";' +
    '      returnBtn.style.cssText = "background: linear-gradient(135deg, #00c853, #00ff6a); color: #000; border: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 8px rgba(0,200,83,0.3);";' +
    '      returnBtn.onmouseover = function() { this.style.background = "linear-gradient(135deg, #00ff6a, #00c853)"; };' +
    '      returnBtn.onmouseout = function() { this.style.background = "linear-gradient(135deg, #00c853, #00ff6a)"; };' +
    '      returnBtn.onclick = function() {' +
    '        google.script.run.showCategoriesPathwaysPanel();' +
    '        google.script.host.close();' +
    '      };' +
    '' +
    '      var closeBtn = document.createElement("button");' +
    '      closeBtn.innerHTML = "✖️ Close";' +
    '      closeBtn.style.cssText = "background: #333; color: #fff; border: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: bold; cursor: pointer; margin-left: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);";' +
    '      closeBtn.onmouseover = function() { this.style.background = "#555"; };' +
    '      closeBtn.onmouseout = function() { this.style.background = "#333"; };' +
    '      closeBtn.onclick = function() {' +
    '        google.script.host.close();' +
    '      };' +
    '' +
    '      buttonDiv.appendChild(returnBtn);' +
    '      buttonDiv.appendChild(closeBtn);' +
    '      logs.parentNode.appendChild(buttonDiv);' +
    '' +
    '      addLog("👆 Click \\"Return to Panel\\" to continue working", "success");' +
    '    } else {' +
    '      addLog("❌ ERROR: " + result.error, "warning");' +
    '      updateStatus("❌ Cache failed - check logs");' +
    '' +
    '      // Add return button even on failure' +
    '      var logs = document.getElementById("logs");' +
    '      var buttonDiv = document.createElement("div");' +
    '      buttonDiv.style.cssText = "margin-top: 20px; text-align: center;";' +
    '' +
    '      var returnBtn = document.createElement("button");' +
    '      returnBtn.innerHTML = "🔙 Return to Panel";' +
    '      returnBtn.style.cssText = "background: linear-gradient(135deg, #00c853, #00ff6a); color: #000; border: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: bold; cursor: pointer;";' +
    '      returnBtn.onclick = function() {' +
    '        google.script.run.showCategoriesPathwaysPanel();' +
    '        google.script.host.close();' +
    '      };' +
    '' +
    '      buttonDiv.appendChild(returnBtn);' +
    '      logs.parentNode.appendChild(buttonDiv);' +
    '    }' +
    '  })' +
    '  .withFailureHandler(function(error) {' +
    '    addLog("❌ FAILED: " + error.message, "warning");' +
    '    updateStatus("❌ Cache process failed");' +
    '' +
    '    // Add return button on failure too' +
    '    var logs = document.getElementById("logs");' +
    '    var buttonDiv = document.createElement("div");' +
    '    buttonDiv.style.cssText = "margin-top: 20px; text-align: center;";' +
    '' +
    '    var returnBtn = document.createElement("button");' +
    '    returnBtn.innerHTML = "🔙 Return to Panel";' +
    '    returnBtn.style.cssText = "background: linear-gradient(135deg, #00c853, #00ff6a); color: #000; border: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: bold; cursor: pointer;";' +
    '    returnBtn.onclick = function() {' +
    '      google.script.run.showCategoriesPathwaysPanel();' +
    '      google.script.host.close();' +
    '    };' +
    '' +
    '    buttonDiv.appendChild(returnBtn);' +
    '    logs.parentNode.appendChild(buttonDiv);' +
    '  })' +
    '  .performCacheWithProgress();'`;

if (code.indexOf(oldSuccessHandler) !== -1) {
  code = code.replace(oldSuccessHandler, newSuccessHandler);
  console.log('   ✅ Replaced success handler with Return to Panel button\n');
  console.log('   ✅ Removed auto-close setTimeout()\n');
  console.log('   ✅ Added Return button on success, failure, and error\n');
} else {
  console.log('   ⚠️  Success handler not found or already modified\n');
}

// Write back
fs.writeFileSync(phase2Path, code, 'utf8');

console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ CACHE COMPLETION FIXES COMPLETE!\n');
console.log('📊 Changes Made:\n');
console.log('   1. Fixed "0 cases" bug → now uses analysis.totalCases');
console.log('   2. Removed auto-close setTimeout()');
console.log('   3. Added green "Return to Panel" button');
console.log('   4. Added gray "Close" button as alternative');
console.log('   5. Buttons appear on success, failure, AND error\n');
console.log('🎯 New User Experience:\n');
console.log('   ✅ Shows correct case count (not 0)');
console.log('   ✅ Window STAYS OPEN after completion');
console.log('   ✅ User sees two buttons:');
console.log('      • 🔙 Return to Categories & Pathways Panel (green)');
console.log('      • ✖️ Close (gray)\n');
console.log('   ✅ Clicking Return button:');
console.log('      1. Closes cache window');
console.log('      2. Immediately reopens main panel');
console.log('      3. User can continue working seamlessly\n');
console.log('═══════════════════════════════════════════════════════════════\n');
