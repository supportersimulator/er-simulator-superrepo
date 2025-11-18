const fs = require('fs');

const current = fs.readFileSync('temp-code-current.gs', 'utf8');
const backup = fs.readFileSync('backups/apps-script-backup-2025-11-11/Code.gs', 'utf8');

console.log('COMPARING FILES:');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('Current file:');
console.log('  Size: ' + current.length + ' characters');
console.log('  Lines: ' + current.split('\n').length);

console.log('\nBackup file (Nov 11):');
console.log('  Size: ' + backup.length + ' characters');
console.log('  Lines: ' + backup.split('\n').length);

console.log('\nDifference: ' + (current.length - backup.length) + ' characters');

// Check if files are identical
if (current === backup) {
  console.log('\n✅ FILES ARE IDENTICAL');
} else {
  console.log('\n❌ FILES ARE DIFFERENT');
  
  // Find first difference
  let firstDiff = -1;
  for (let i = 0; i < Math.min(current.length, backup.length); i++) {
    if (current[i] !== backup[i]) {
      firstDiff = i;
      break;
    }
  }
  
  if (firstDiff !== -1) {
    const currentLines = current.split('\n');
    const backupLines = backup.split('\n');
    
    let currentLine = 0;
    let currentPos = 0;
    for (let i = 0; i < currentLines.length; i++) {
      currentPos += currentLines[i].length + 1; // +1 for newline
      if (currentPos > firstDiff) {
        currentLine = i + 1;
        break;
      }
    }
    
    console.log('\nFirst difference at character ' + firstDiff + ' (approx line ' + currentLine + ')');
    console.log('Current context: "' + current.substring(Math.max(0, firstDiff - 50), firstDiff + 50) + '"');
    console.log('Backup context: "' + backup.substring(Math.max(0, firstDiff - 50), firstDiff + 50) + '"');
  }
}

console.log('\n═══════════════════════════════════════════════════════════════');
