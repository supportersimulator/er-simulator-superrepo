const fs = require('fs');

const code = fs.readFileSync('backups/Code-CURRENT-DIAGNOSIS.gs', 'utf8');
const lines = code.split('\n');

console.log('Finding lines with potential parentheses errors...\n');

let parenCount = 0;
const suspicious = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const openCount = (line.match(/\(/g) || []).length;
  const closeCount = (line.match(/\)/g) || []).length;

  parenCount += openCount - closeCount;

  // If this line makes the count go negative or has large imbalance
  if (parenCount < 0 || Math.abs(openCount - closeCount) > 5) {
    suspicious.push({
      lineNum: i + 1,
      line: line.trim(),
      open: openCount,
      close: closeCount,
      runningTotal: parenCount
    });
  }
}

console.log('SUSPICIOUS LINES:');
console.log('═══════════════════════════════════════════════════════════════\n');

suspicious.slice(0, 20).forEach(item => {
  console.log('Line ' + item.lineNum + ': (' + item.open + ' open, ' + item.close + ' close, total: ' + item.runningTotal + ')');
  console.log('  ' + item.line.substring(0, 100));
  console.log('');
});

console.log('═══════════════════════════════════════════════════════════════');
console.log('\nFinal parentheses count: ' + parenCount + ' (should be 0)');
