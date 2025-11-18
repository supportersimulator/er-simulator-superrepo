const fs = require('fs');

const code = fs.readFileSync('temp-code-current.gs', 'utf8');

console.log('SYNTAX CHECK ON DEPLOYED CODE.GS:');
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

// Count brackets
const openBrackets = (code.match(/\[/g) || []).length;
const closeBrackets = (code.match(/\]/g) || []).length;
console.log('Brackets: ' + openBrackets + ' open, ' + closeBrackets + ' close');
if (openBrackets !== closeBrackets) {
  console.log('❌ UNBALANCED BRACKETS - Difference: ' + (openBrackets - closeBrackets));
} else {
  console.log('✅ Brackets balanced');
}

console.log('\nFile size: ' + code.length + ' characters');
console.log('Lines: ' + code.split('\n').length);

// Check if onOpen exists
if (code.includes('function onOpen()')) {
  console.log('\n✅ onOpen() function found');
  
  // Find onOpen and show it
  const onOpenIndex = code.indexOf('function onOpen()');
  const onOpenEnd = code.indexOf('\n}\n', onOpenIndex) + 3;
  const onOpenFunc = code.substring(onOpenIndex, onOpenEnd);
  
  console.log('\nonOpen() function:');
  console.log('─────────────────────────────────────────────────────────');
  console.log(onOpenFunc);
  console.log('─────────────────────────────────────────────────────────');
} else {
  console.log('\n❌ onOpen() function NOT found');
}

console.log('\n═══════════════════════════════════════════════════════════════');
