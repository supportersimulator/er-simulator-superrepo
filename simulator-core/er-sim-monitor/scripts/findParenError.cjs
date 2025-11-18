const fs = require('fs');

const code = fs.readFileSync('temp-code-current.gs', 'utf8');
const lines = code.split('\n');

console.log('Finding lines with parentheses imbalance...\n');

let runningTotal = 0;
const problems = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const openCount = (line.match(/\(/g) || []).length;
  const closeCount = (line.match(/\)/g) || []).length;
  
  runningTotal += openCount - closeCount;
  
  // If running total goes negative, we have too many closes
  if (runningTotal < 0) {
    problems.push({
      lineNum: i + 1,
      line: line.trim(),
      open: openCount,
      close: closeCount,
      runningTotal: runningTotal
    });
  }
}

console.log('LINES WHERE RUNNING TOTAL GOES NEGATIVE:');
console.log('═══════════════════════════════════════════════════════════════\n');

if (problems.length === 0) {
  console.log('No lines where running total goes negative.');
  console.log('The extra closing parens are distributed throughout the file.');
  console.log('\nSearching for lines with large imbalances...\n');
  
  // Find lines with large imbalances
  const largeImbalances = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const openCount = (line.match(/\(/g) || []).length;
    const closeCount = (line.match(/\)/g) || []).length;
    const diff = Math.abs(openCount - closeCount);
    
    if (diff > 5) {
      largeImbalances.push({
        lineNum: i + 1,
        line: line.trim().substring(0, 100),
        open: openCount,
        close: closeCount,
        diff: openCount - closeCount
      });
    }
  }
  
  console.log('Top 30 lines with largest parentheses imbalances:');
  largeImbalances
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
    .slice(0, 30)
    .forEach(item => {
      console.log('Line ' + item.lineNum + ': (' + item.open + ' open, ' + item.close + ' close, diff: ' + (item.diff > 0 ? '+' : '') + item.diff + ')');
      console.log('  ' + item.line);
      console.log('');
    });
} else {
  problems.slice(0, 20).forEach(item => {
    console.log('Line ' + item.lineNum + ': (' + item.open + ' open, ' + item.close + ' close, total: ' + item.runningTotal + ')');
    console.log('  ' + item.line.substring(0, 100));
    console.log('');
  });
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('\nFinal parentheses count: ' + runningTotal + ' (should be 0)');
