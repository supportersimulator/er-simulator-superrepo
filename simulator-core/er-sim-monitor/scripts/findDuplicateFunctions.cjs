const fs = require('fs');

const code = fs.readFileSync('temp-code-current.gs', 'utf8');
const lines = code.split('\n');

console.log('Finding all function declarations...\n');

const functionPattern = /^function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/;
const functionCounts = {};
const functionLines = {};

lines.forEach((line, index) => {
  const match = line.match(functionPattern);
  if (match) {
    const funcName = match[1];
    if (!functionCounts[funcName]) {
      functionCounts[funcName] = 0;
      functionLines[funcName] = [];
    }
    functionCounts[funcName]++;
    functionLines[funcName].push(index + 1);
  }
});

console.log('DUPLICATE FUNCTION DECLARATIONS:');
console.log('═══════════════════════════════════════════════════════════════\n');

const duplicates = Object.keys(functionCounts).filter(name => functionCounts[name] > 1);

if (duplicates.length === 0) {
  console.log('No duplicates found (this is unexpected!)');
} else {
  duplicates.forEach(funcName => {
    console.log('Function: ' + funcName);
    console.log('Declared ' + functionCounts[funcName] + ' times at lines: ' + functionLines[funcName].join(', '));
    console.log('');
    
    // Show the context for each declaration
    functionLines[funcName].forEach(lineNum => {
      console.log('  Line ' + lineNum + ':');
      for (let i = lineNum - 1; i < Math.min(lineNum + 5, lines.length); i++) {
        console.log('    ' + (i + 1) + ': ' + lines[i].substring(0, 80));
      }
      console.log('');
    });
  });
}

console.log('═══════════════════════════════════════════════════════════════');
