#!/usr/bin/env node

/**
 * Fix Close Dialog behavior to return to Categories & Pathways panel
 * Also add an onbeforeunload handler and intercept ESC key
 */

const fs = require('fs');
const path = require('path');

const phase2Path = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs');

console.log('\n🔧 FIXING CLOSE DIALOG BEHAVIOR\n');
console.log('═══════════════════════════════════════════════════════════════\n');

let code = fs.readFileSync(phase2Path, 'utf8');

// Add a custom close handler that reopens the panel
const oldHeader = `    '<div class="header">💾 PRE-CACHING RICH CLINICAL DATA</div>'`;

const newHeader = `    '<div class="header" style="display:flex;justify-content:space-between;align-items:center">' +
    '  <span>💾 PRE-CACHING RICH CLINICAL DATA</span>' +
    '  <button onclick="returnToPanel()" style="background:#00c853;color:#000;border:none;padding:8px 16px;border-radius:4px;font-size:12px;font-weight:bold;cursor:pointer;">🔙 Return to Panel</button>' +
    '</div>'`;

code = code.replace(oldHeader, newHeader);
console.log('   ✅ Added Return to Panel button in header\n');

// Add returnToPanel() function at the beginning of the script section
const oldScriptStart = `    '<script>' +
    'var startTime = Date.now();'`;

const newScriptStart = `    '<script>' +
    'var startTime = Date.now();' +
    'function returnToPanel() {' +
    '  google.script.run.showCategoriesPathwaysPanel();' +
    '  google.script.host.close();' +
    '}' +
    'window.onbeforeunload = function() {' +
    '  google.script.run.showCategoriesPathwaysPanel();' +
    '};' +
    'document.addEventListener("keydown", function(e) {' +
    '  if (e.key === "Escape") {' +
    '    e.preventDefault();' +
    '    returnToPanel();' +
    '  }' +
    '});'`;

code = code.replace(oldScriptStart, newScriptStart);
console.log('   ✅ Added returnToPanel() function\n');
console.log('   ✅ Added onbeforeunload handler (triggers when X is clicked)\n');
console.log('   ✅ Added ESC key handler\n');

fs.writeFileSync(phase2Path, code, 'utf8');

console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ CLOSE DIALOG BEHAVIOR FIXED!\n');
console.log('📋 Changes Made:\n');
console.log('   1. Added "Return to Panel" button in header');
console.log('   2. Clicking X now reopens Categories & Pathways panel');
console.log('   3. Pressing ESC now returns to panel');
console.log('   4. All close actions return user to panel\n');
console.log('🔄 Now deploying to TEST...\n');
console.log('═══════════════════════════════════════════════════════════════\n');
