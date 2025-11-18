#!/usr/bin/env node

/**
 * Generate comprehensive audit report of ALL tools in the system
 * Cross-references with existing documentation to identify gaps
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 COMPREHENSIVE TOOLS AUDIT REPORT\n');
console.log('Scanning all scripts and comparing with documentation...\n');

// Get all script files
const scriptsDir = path.join(__dirname);
const allScripts = fs.readdirSync(scriptsDir)
  .filter(f => f.endsWith('.cjs') || f.endsWith('.js'))
  .sort();

// Load existing documentation
const docsDir = path.join(__dirname, '../docs');
const toolsInventoryPath = path.join(docsDir, 'COMPREHENSIVE_TOOLS_INVENTORY.md');
const legacyToolsPath = path.join(docsDir, 'LEGACY_TOOLS_V3.7_DOCUMENTATION.md');

const toolsInventory = fs.existsSync(toolsInventoryPath)
  ? fs.readFileSync(toolsInventoryPath, 'utf8')
  : '';
const legacyDocs = fs.existsSync(legacyToolsPath)
  ? fs.readFileSync(legacyToolsPath, 'utf8')
  : '';

// Categorize scripts
const categories = {
  'Google Sheets Integration': [],
  'Batch Processing': [],
  'Quality Control': [],
  'Data Analysis': [],
  'Waveform Management': [],
  'Authentication': [],
  'Deployment': [],
  'Backup & Restore': [],
  'Documentation Generation': [],
  'Testing & Validation': [],
  'UI/UX Tools': [],
  'Utility Scripts': [],
  'Uncategorized': []
};

const testedStatus = {
  tested: [],
  untested: [],
  unknown: []
};

// Analyze each script
console.log('📊 SCRIPT INVENTORY:\n');
console.log(`Total Scripts: ${allScripts.length}\n`);

allScripts.forEach(script => {
  const scriptPath = path.join(scriptsDir, script);
  let content = '';

  try {
    content = fs.readFileSync(scriptPath, 'utf8');
  } catch (e) {
    // Skip unreadable files
    return;
  }

  // Extract description from comments
  const descMatch = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\n/);
  const description = descMatch ? descMatch[1].trim() : 'No description';

  // Check if documented
  const isInInventory = toolsInventory.includes(script);
  const isInLegacy = legacyDocs.includes(script);
  const documented = isInInventory || isInLegacy;

  // Check if tested (look for test comments or execution logs)
  const hasTestComments = content.includes('// TEST:') || content.includes('// TESTED:');
  const tested = hasTestComments ? 'tested' : 'unknown';

  // Categorize by keywords
  let category = 'Uncategorized';
  if (script.includes('auth') || script.includes('Auth')) category = 'Authentication';
  else if (script.includes('batch') || script.includes('Batch')) category = 'Batch Processing';
  else if (script.includes('quality') || script.includes('Quality') || script.includes('validate')) category = 'Quality Control';
  else if (script.includes('analyze') || script.includes('compare') || script.includes('check')) category = 'Data Analysis';
  else if (script.includes('waveform') || script.includes('Waveform') || script.includes('ecg')) category = 'Waveform Management';
  else if (script.includes('deploy') || script.includes('Deploy')) category = 'Deployment';
  else if (script.includes('backup') || script.includes('Backup') || script.includes('restore')) category = 'Backup & Restore';
  else if (script.includes('generate') && script.includes('Doc')) category = 'Documentation Generation';
  else if (script.includes('test') || script.includes('Test')) category = 'Testing & Validation';
  else if (script.includes('ui') || script.includes('UI') || script.includes('sidebar')) category = 'UI/UX Tools';
  else if (script.includes('fetch') || script.includes('sync') || script.includes('Sheets')) category = 'Google Sheets Integration';

  categories[category].push({
    name: script,
    description,
    documented,
    tested
  });

  testedStatus[tested].push(script);
});

// Generate report
const report = [];

report.push('# COMPREHENSIVE TOOLS AUDIT REPORT');
report.push('');
report.push(`**Generated:** ${new Date().toISOString()}`);
report.push(`**Total Scripts:** ${allScripts.length}`);
report.push('');
report.push('---');
report.push('');

// Summary statistics
const totalDocumented = allScripts.filter(s =>
  toolsInventory.includes(s) || legacyDocs.includes(s)
).length;
const totalUndocumented = allScripts.length - totalDocumented;

report.push('## 📊 Summary Statistics');
report.push('');
report.push(`- **Total Scripts:** ${allScripts.length}`);
report.push(`- **Documented:** ${totalDocumented} (${Math.round(totalDocumented/allScripts.length*100)}%)`);
report.push(`- **Undocumented:** ${totalUndocumented} (${Math.round(totalUndocumented/allScripts.length*100)}%)`);
report.push(`- **Testing Status:**`);
report.push(`  - Tested: ${testedStatus.tested.length}`);
report.push(`  - Unknown: ${testedStatus.unknown.length}`);
report.push('');
report.push('---');
report.push('');

// Category breakdown
report.push('## 🗂️ Tools by Category');
report.push('');

Object.entries(categories).forEach(([category, tools]) => {
  if (tools.length === 0) return;

  report.push(`### ${category} (${tools.length} tools)`);
  report.push('');

  tools.forEach(tool => {
    const docStatus = tool.documented ? '📄' : '⚠️';
    const testStatus = tool.tested === 'tested' ? '✅' : '❓';
    report.push(`${docStatus} ${testStatus} **${tool.name}**`);
    report.push(`   - ${tool.description}`);
    if (!tool.documented) report.push(`   - ⚠️ **NOT DOCUMENTED** - Needs documentation`);
    report.push('');
  });
});

report.push('---');
report.push('');

// Undocumented tools section
const undocumented = [];
Object.values(categories).forEach(tools => {
  tools.forEach(tool => {
    if (!tool.documented) undocumented.push(tool);
  });
});

if (undocumented.length > 0) {
  report.push('## ⚠️ UNDOCUMENTED TOOLS REQUIRING ATTENTION');
  report.push('');
  report.push(`**Count:** ${undocumented.length} tools need documentation`);
  report.push('');
  report.push('| Script | Description | Category |');
  report.push('|--------|-------------|----------|');

  undocumented.forEach(tool => {
    const category = Object.entries(categories).find(([_, tools]) =>
      tools.some(t => t.name === tool.name)
    )?.[0] || 'Unknown';
    report.push(`| ${tool.name} | ${tool.description} | ${category} |`);
  });

  report.push('');
}

report.push('---');
report.push('');

// Testing status
report.push('## 🧪 Testing Status');
report.push('');
report.push(`**Scripts with Unknown Testing Status:** ${testedStatus.unknown.length}`);
report.push('');
report.push('These scripts need to be tested and approved:');
report.push('');
testedStatus.unknown.slice(0, 20).forEach(script => {
  report.push(`- [ ] ${script}`);
});
if (testedStatus.unknown.length > 20) {
  report.push(`- ... and ${testedStatus.unknown.length - 20} more`);
}
report.push('');

report.push('---');
report.push('');

// Approval checklist
report.push('## ✅ APPROVAL CHECKLIST FOR USER');
report.push('');
report.push('Please review and approve the following:');
report.push('');
report.push('### 1. Documentation Status');
report.push(`- [ ] Review ${totalDocumented} documented tools`);
report.push(`- [ ] Approve documentation for undocumented tools (${totalUndocumented} remaining)`);
report.push('');
report.push('### 2. Tool Functionality');
report.push('For each category, approve that tools function as intended:');
report.push('');
Object.entries(categories).forEach(([category, tools]) => {
  if (tools.length > 0) {
    report.push(`- [ ] **${category}** (${tools.length} tools)`);
  }
});
report.push('');
report.push('### 3. Testing Requirements');
report.push(`- [ ] Identify which of the ${testedStatus.unknown.length} untested tools need testing`);
report.push('- [ ] Define testing criteria for critical tools');
report.push('');
report.push('### 4. Priority Tools for Immediate Documentation');
report.push('');
report.push('**Recommended high-priority undocumented tools:**');
report.push('');

// Prioritize by likely importance
const highPriority = undocumented.filter(t =>
  t.name.includes('batch') ||
  t.name.includes('quality') ||
  t.name.includes('deploy') ||
  t.name.includes('sync')
).slice(0, 10);

if (highPriority.length > 0) {
  highPriority.forEach((tool, i) => {
    report.push(`${i + 1}. **${tool.name}** - ${tool.description}`);
  });
} else {
  report.push('(All high-priority tools are documented)');
}

report.push('');
report.push('---');
report.push('');
report.push('## 📋 Next Steps');
report.push('');
report.push('1. **User reviews this report** and provides approval/feedback');
report.push('2. **Claude documents high-priority undocumented tools**');
report.push('3. **User tests critical tools** and confirms functionality');
report.push('4. **Claude updates comprehensive documentation** with approved tools');
report.push('5. **Upload updated documentation to Google Drive**');
report.push('');
report.push('---');
report.push('');
report.push('**Report End**');

// Write report
const reportPath = path.join(docsDir, 'TOOLS_AUDIT_REPORT.md');
fs.writeFileSync(reportPath, report.join('\n'));

console.log(`✅ Audit report generated: ${reportPath}`);
console.log('');
console.log('📊 Summary:');
console.log(`   Total Scripts: ${allScripts.length}`);
console.log(`   Documented: ${totalDocumented} (${Math.round(totalDocumented/allScripts.length*100)}%)`);
console.log(`   Undocumented: ${totalUndocumented} (${Math.round(totalUndocumented/allScripts.length*100)}%)`);
console.log('');
console.log('⚠️  USER ACTION REQUIRED:');
console.log('   Please review docs/TOOLS_AUDIT_REPORT.md and provide approval.');
console.log('');
