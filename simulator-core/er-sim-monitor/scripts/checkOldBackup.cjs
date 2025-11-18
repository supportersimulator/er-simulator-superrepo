const fs = require('fs');
const { execSync } = require('child_process');

const code = fs.readFileSync('backups/apps-script-backup-2025-11-11/Code.gs', 'utf8');

console.log('Checking backup: apps-script-backup-2025-11-11/Code.gs\n');

// Write to temp file
fs.writeFileSync('temp-old-backup.js', code);

try {
  execSync('node --check temp-old-backup.js', { encoding: 'utf8', stdio: 'pipe' });
  console.log('✅ No syntax errors in this backup!');
  console.log('\nFile stats:');
  console.log('  Size: ' + code.length + ' characters');
  console.log('  Lines: ' + code.split('\n').length);
  
  // Check for onOpen
  const onOpenIndex = code.indexOf('function onOpen()');
  if (onOpenIndex !== -1) {
    console.log('  ✅ Has onOpen() function');
    
    const onOpenEnd = code.indexOf('\n}\n', onOpenIndex) + 3;
    const onOpenFunc = code.substring(onOpenIndex, onOpenEnd);
    console.log('\nonOpen() function:');
    console.log('─────────────────────────────────────────────────────────');
    console.log(onOpenFunc);
    console.log('─────────────────────────────────────────────────────────');
  } else {
    console.log('  ❌ Missing onOpen() function');
  }
} catch (error) {
  console.log('❌ SYNTAX ERROR:\n');
  console.log(error.stderr || error.stdout || error.message);
}

fs.unlinkSync('temp-old-backup.js');
