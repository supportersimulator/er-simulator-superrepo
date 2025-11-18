const fs = require('fs');
const { execSync } = require('child_process');

const code = fs.readFileSync('backups/extracted_code_nov10.gs', 'utf8');

console.log('Checking backup file: extracted_code_nov10.gs\n');

// Write to temp file
fs.writeFileSync('temp-backup-check.js', code);

try {
  execSync('node --check temp-backup-check.js', { encoding: 'utf8', stdio: 'pipe' });
  console.log('✅ No syntax errors in backup!');
  console.log('\nFile stats:');
  console.log('  Size: ' + code.length + ' characters');
  console.log('  Lines: ' + code.split('\n').length);
  
  // Count functions
  const functionMatches = code.match(/^function\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(/gm);
  console.log('  Functions: ' + (functionMatches ? functionMatches.length : 0));
  
  // Check for onOpen
  if (code.includes('function onOpen()')) {
    console.log('  ✅ Has onOpen() function');
  } else {
    console.log('  ❌ Missing onOpen() function');
  }
} catch (error) {
  console.log('❌ SYNTAX ERROR IN BACKUP:\n');
  console.log(error.stderr || error.stdout || error.message);
}

fs.unlinkSync('temp-backup-check.js');
