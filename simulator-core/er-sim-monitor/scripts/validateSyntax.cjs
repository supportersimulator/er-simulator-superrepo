const fs = require('fs');
const { execSync } = require('child_process');

const code = fs.readFileSync('temp-code-current.gs', 'utf8');

console.log('Attempting to parse Code.gs with Node.js...\n');

// Write to a temp .js file
fs.writeFileSync('temp-syntax-check.js', code);

try {
  // Try to parse it - this will show the exact syntax error
  execSync('node --check temp-syntax-check.js', { encoding: 'utf8', stdio: 'pipe' });
  console.log('✅ No syntax errors found!');
} catch (error) {
  console.log('❌ SYNTAX ERROR FOUND:\n');
  console.log(error.stderr || error.stdout || error.message);
}

// Clean up
fs.unlinkSync('temp-syntax-check.js');
