const fs = require('fs');

const code = fs.readFileSync('temp-code-current.gs', 'utf8');
const lines = code.split('\n');

console.log('Tracking parentheses balance line by line...\n');

let runningTotal = 0;
let lastPositiveTotal = 0;
let firstNegativeLine = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const openCount = (line.match(/\(/g) || []).length;
  const closeCount = (line.match(/\)/g) || []).length;
  
  const prevTotal = runningTotal;
  runningTotal += openCount - closeCount;
  
  // Track when it first goes negative
  if (runningTotal < 0 && firstNegativeLine === null) {
    firstNegativeLine = i + 1;
    console.log('FIRST TIME RUNNING TOTAL GOES NEGATIVE:');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('Line ' + (i + 1) + ': Previous total was ' + prevTotal + ', line has ' + openCount + ' open and ' + closeCount + ' close');
    console.log('New total: ' + runningTotal);
    console.log('Line content: ' + line.trim());
    console.log('\nShowing context (lines ' + Math.max(1, i - 10) + '-' + Math.min(lines.length, i + 5) + '):');
    console.log('─────────────────────────────────────────────────────────');
    
    for (let j = Math.max(0, i - 10); j < Math.min(lines.length, i + 5); j++) {
      const marker = j === i ? ' ← HERE' : '';
      console.log((j + 1) + ': ' + lines[j] + marker);
    }
    console.log('─────────────────────────────────────────────────────────');
    break;
  }
}

console.log('\n═══════════════════════════════════════════════════════════════');
