#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'backups', 'apps-script-backup-2025-11-11', 'Phase2_Enhanced_Categories_With_AI.gs');

console.log('🔍 Analyzing Phase2_Enhanced_Categories_With_AI.gs for syntax errors...\n');

const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('📊 File Statistics:');
console.log('  Total lines:', lines.length);
console.log('  File size:', (content.length / 1024).toFixed(2), 'KB\n');

console.log('🐛 Searching for problematic patterns...\n');

// Find the specific syntax error
lines.forEach((line, idx) => {
  const lineNum = idx + 1;

  // Check for the specific error pattern
  if (line.includes('if (false)') && line.includes('//')) {
    console.log('❌ SYNTAX ERROR FOUND:');
    console.log('  Line', lineNum + ':', line.trim());
    console.log('  Problem: Comment includes opening brace, making if statement invalid');
    console.log('  Fix: Move opening brace to next line or remove comment\n');
  }

  // Check for other potential issues
  if (line.match(/\bif\s*\([^)]*\)\s*\/\//)) {
    console.log('⚠️  Potential issue at line', lineNum + ':', line.trim());
  }
});

// Find script blocks
let inScriptBlock = false;
let scriptBlockStart = -1;
let scriptBlocks = [];

lines.forEach((line, idx) => {
  if (line.includes('<script>')) {
    inScriptBlock = true;
    scriptBlockStart = idx + 1;
  }
  if (line.includes('</script>')) {
    if (inScriptBlock) {
      scriptBlocks.push({
        start: scriptBlockStart,
        end: idx + 1,
        lines: idx + 1 - scriptBlockStart
      });
    }
    inScriptBlock = false;
  }
});

console.log('📜 Script Blocks Found:', scriptBlocks.length);
scriptBlocks.forEach((block, idx) => {
  console.log('  Block', idx + 1 + ':', 'Lines', block.start, '-', block.end, '(' + block.lines, 'lines)');
});

console.log('\n✅ Analysis complete!');
