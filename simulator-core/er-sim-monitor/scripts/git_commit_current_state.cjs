#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('📦 GIT COMMIT: Current State Before Further Debugging\n');
console.log('═══════════════════════════════════════════════════════════════\n');

try {
  execSync('git add -A', { stdio: 'inherit' });
  
  const commitMessage = `WIP: Discovery tab button not working - JavaScript syntax error found

❌ CURRENT ISSUE:

Browser console shows NO debug messages from Discovery tab code
- No "🧪 SCRIPT TAG LOADED" message
- No "🔍 Attaching Discovery tab event listeners" message
- Indicates <script> tag not executing at all

🔍 DIAGNOSIS:

Syntax validation found: "Unexpected token ')'" error
This prevents entire <script> section from running
Button cannot work if JavaScript doesn't execute

📊 CURRENT STATE:

✅ buildAIDiscoveryTabHTML_() exists in Code.gs (8,615 chars, complete with styles)
✅ handleLogicTypeChange() function exists
✅ discoverPathways() function exists  
✅ IIFE with addEventListener exists
✅ NO inline onchange/onclick attributes (clean HTML)
✅ Parentheses balanced in IIFE (19 open, 19 close)
❌ Script tag not executing (syntax error somewhere)

📋 NEXT STEPS:

Need to locate exact syntax error in <script> section
Extract and test each function individually
Fix syntax error to allow script to run

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>`;

  execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
  
  console.log('\n✅ Git commit successful!\n');

} catch (error) {
  if (error.message.includes('nothing to commit')) {
    console.log('ℹ️  No changes to commit\n');
  } else {
    console.error('❌ Git commit failed:', error.message);
  }
}
