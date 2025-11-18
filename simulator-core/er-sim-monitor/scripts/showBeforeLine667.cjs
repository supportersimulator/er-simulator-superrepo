const fs = require('fs');

const code = fs.readFileSync('temp-code-current.gs', 'utf8');
const lines = code.split('\n');

console.log('LINES 640-680 (showing context around line 667):');
console.log('═══════════════════════════════════════════════════════════════\n');

for (let i = 639; i < 680; i++) {
  console.log((i + 1) + ': ' + lines[i]);
}

console.log('\n═══════════════════════════════════════════════════════════════');
