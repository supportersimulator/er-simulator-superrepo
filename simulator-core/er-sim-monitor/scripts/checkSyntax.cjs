const fs = require('fs');

const code = fs.readFileSync('backups/Code-CURRENT-DIAGNOSIS.gs', 'utf8');

console.log('SYNTAX CHECK:');
console.log('═══════════════════════════════════════════════════════════════\n');

// Count braces
const openBraces = (code.match(/{/g) || []).length;
const closeBraces = (code.match(/}/g) || []).length;
console.log('Braces: ' + openBraces + ' open, ' + closeBraces + ' close');
if (openBraces !== closeBraces) {
  console.log('❌ UNBALANCED BRACES - Difference: ' + (openBraces - closeBraces));
} else {
  console.log('✅ Braces balanced');
}

// Count parens
const openParens = (code.match(/\(/g) || []).length;
const closeParens = (code.match(/\)/g) || []).length;
console.log('Parentheses: ' + openParens + ' open, ' + closeParens + ' close');
if (openParens !== closeParens) {
  console.log('❌ UNBALANCED PARENTHESES - Difference: ' + (openParens - closeParens));
} else {
  console.log('✅ Parentheses balanced');
}

console.log('\nFile size: ' + code.length + ' characters');
console.log('Lines: ' + code.split('\n').length);

console.log('\n═══════════════════════════════════════════════════════════════');
