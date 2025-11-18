#!/usr/bin/env node

/**
 * Comprehensive Analysis of Code.gs Structure
 * Maps all sections, functions, and dependencies
 */

const fs = require('fs');

const codeGsPath = '/tmp/Code_gs_current.gs';
const content = fs.readFileSync(codeGsPath, 'utf-8');
const lines = content.split('\n');

console.log('📊 CODE.GS COMPREHENSIVE ANALYSIS\n');
console.log('══════════════════════════════════════════════════════════════\n');
console.log(`Total lines: ${lines.length}`);
console.log(`Total size: ${Math.round(content.length / 1024)} KB\n`);
console.log('══════════════════════════════════════════════════════════════\n');

// Find all major sections
console.log('📂 MAJOR SECTIONS:\n');
const sections = [];
lines.forEach((line, idx) => {
  if (line.match(/^\/\/ ={20,}/) || line.match(/^\/\/ [A-Z\s]{10,}/)) {
    const nextLine = lines[idx + 1] || '';
    if (nextLine.match(/^\/\/ [A-Z]/)) {
      sections.push({
        line: idx + 1,
        title: nextLine.replace(/^\/\/ /, '').trim()
      });
    }
  }
});

sections.forEach(s => {
  console.log(`  Line ${s.line}: ${s.title}`);
});

// Find AI AUTO-CATEGORIZATION sections
console.log('\n══════════════════════════════════════════════════════════════\n');
console.log('🤖 AI AUTO-CATEGORIZATION SECTIONS:\n');

const aiSections = [];
lines.forEach((line, idx) => {
  if (line.includes('AI AUTO-CATEGORIZATION')) {
    aiSections.push({
      line: idx + 1,
      text: line.trim()
    });
  }
});

aiSections.forEach(s => {
  console.log(`  Line ${s.line}: ${s.text}`);
});

// Find all functions in AI sections
if (aiSections.length > 0) {
  console.log('\n══════════════════════════════════════════════════════════════\n');
  console.log('🔍 FUNCTIONS IN AI AUTO-CATEGORIZATION SECTIONS:\n');

  aiSections.forEach((aiSection, sectionIdx) => {
    const startLine = aiSection.line;
    let endLine = sectionIdx < aiSections.length - 1 ? aiSections[sectionIdx + 1].line : lines.length;

    // Find next major section marker
    for (let i = startLine; i < lines.length; i++) {
      if (i > startLine + 50 && lines[i].match(/^\/\/ ={20,}/) && !lines[i].includes('AI AUTO-CATEGORIZATION')) {
        endLine = i;
        break;
      }
    }

    console.log(`\nSection ${sectionIdx + 1}: Lines ${startLine}-${endLine}\n`);

    const functionsInSection = [];
    for (let i = startLine - 1; i < endLine && i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^function (\w+)\s*\(/);
      if (match) {
        const funcName = match[1];
        // Get function signature
        const signature = line.trim();
        functionsInSection.push({
          name: funcName,
          line: i + 1,
          signature: signature
        });
      }
    }

    console.log(`  Total functions: ${functionsInSection.length}\n`);
    functionsInSection.forEach(f => {
      console.log(`    ${f.line}: ${f.signature}`);
    });
  });
}

// Check for function calls to AI functions
console.log('\n══════════════════════════════════════════════════════════════\n');
console.log('🔗 AI FUNCTION USAGE ANALYSIS:\n');

const aiKeyFunctions = [
  'runAICategorization',
  'retryFailedCategorization',
  'applyCategorization',
  'openCategoriesPathwaysPanel',
  'openAICategorization',
  'clearAICategorizationResults'
];

aiKeyFunctions.forEach(funcName => {
  console.log(`\n${funcName}:\n`);

  // Find definitions
  const definitions = [];
  lines.forEach((line, idx) => {
    if (line.match(new RegExp(`^function ${funcName}\\s*\\(`))) {
      definitions.push(idx + 1);
    }
  });

  if (definitions.length > 0) {
    console.log(`  ✅ DEFINED at lines: ${definitions.join(', ')}`);
  } else {
    console.log(`  ❌ NOT DEFINED in Code.gs`);
  }

  // Find calls (excluding definition line)
  const calls = [];
  lines.forEach((line, idx) => {
    if (line.includes(funcName) && !line.match(new RegExp(`^function ${funcName}`))) {
      const lineNum = idx + 1;
      if (!definitions.includes(lineNum)) {
        calls.push({
          line: lineNum,
          code: line.trim().substring(0, 80)
        });
      }
    }
  });

  if (calls.length > 0) {
    console.log(`  📞 CALLED ${calls.length} times:`);
    calls.slice(0, 5).forEach(c => {
      console.log(`      Line ${c.line}: ${c.code}`);
    });
    if (calls.length > 5) {
      console.log(`      ... and ${calls.length - 5} more`);
    }
  } else {
    console.log(`  ⚠️  NEVER CALLED within Code.gs`);
  }
});

// Check menu registration
console.log('\n══════════════════════════════════════════════════════════════\n');
console.log('📋 MENU REGISTRATION:\n');

const menuSection = [];
for (let i = 0; i < Math.min(1000, lines.length); i++) {
  if (lines[i].includes('function onOpen')) {
    for (let j = i; j < Math.min(i + 100, lines.length); j++) {
      if (lines[j].includes('addItem') || lines[j].includes('addSubMenu')) {
        menuSection.push({
          line: j + 1,
          code: lines[j].trim()
        });
      }
      if (lines[j].includes('menu.addToUi()')) break;
    }
    break;
  }
}

menuSection.forEach(m => {
  console.log(`  Line ${m.line}: ${m.code}`);
});

console.log('\n══════════════════════════════════════════════════════════════\n');
console.log('💡 SAFETY ANALYSIS:\n');

// Check if any non-AI sections reference AI functions
const nonAISections = {
  start: 0,
  end: aiSections.length > 0 ? aiSections[0].line - 100 : lines.length
};

console.log(`Checking lines 1-${nonAISections.end} for AI function dependencies:\n`);

const dangerousRefs = [];
aiKeyFunctions.forEach(funcName => {
  for (let i = 0; i < nonAISections.end; i++) {
    const line = lines[i];
    if (line.includes(funcName) && !line.includes('//')) {
      dangerousRefs.push({
        func: funcName,
        line: i + 1,
        code: line.trim()
      });
    }
  }
});

if (dangerousRefs.length > 0) {
  console.log('⚠️  WARNING: Found references to AI functions OUTSIDE AI sections!\n');
  dangerousRefs.forEach(ref => {
    console.log(`  Line ${ref.line} (${ref.func}): ${ref.code.substring(0, 80)}`);
  });
  console.log('\n❌ NOT SAFE to remove AI section without investigating these!\n');
} else {
  console.log('✅ No references to AI functions found outside AI sections\n');
  console.log('✅ SAFE to move AI section to Phase2 file\n');
}

console.log('══════════════════════════════════════════════════════════════\n');
