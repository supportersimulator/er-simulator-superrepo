#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('\n🤖 FULLY AUTOMATED ATSR TRIMMING\n');
console.log('━'.repeat(60));
console.log('This will:');
console.log('1. Analyze dependencies');
console.log('2. Auto-trim unused functions');
console.log('3. Deploy to standalone ATSR project');
console.log('4. Test ATSR functionality');
console.log('5. Report results');
console.log('━'.repeat(60) + '\n');

function run(cmd, description) {
  console.log(`▶️  ${description}...`);
  try {
    const output = execSync(cmd, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
      stdio: 'inherit'
    });
    console.log('');
    return output;
  } catch (err) {
    console.error(`❌ Failed: ${description}`);
    console.error(err.message);
    process.exit(1);
  }
}

// Step 1: Auto-trim
run('node scripts/autoTrimATSR.cjs', 'Auto-trimming ATSR code');

// Step 2: Deploy
run('node scripts/deployATSR.cjs', 'Deploying trimmed ATSR');

// Step 3: Test
run('node scripts/testATSRStandalone.cjs', 'Testing ATSR functionality');

console.log('\n🎉 FULLY AUTOMATED TRIMMING COMPLETE!\n');
console.log('✅ ATSR is now standalone and fully trimmed');
console.log('✅ All tests passed');
console.log('✅ Ready for independent use\n');
