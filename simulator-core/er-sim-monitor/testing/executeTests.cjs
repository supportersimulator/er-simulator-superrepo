#!/usr/bin/env node

/**
 * Test Execution Wrapper
 * Executes the full test suite and captures results
 */

const { runFullTestSuite } = require('./tools/runFullTestSuite.cjs');

async function execute() {
  try {
    console.log('🚀 Starting Full Test Suite Execution\n');
    console.log('This will:');
    console.log('  1. Verify Apps Script deployment');
    console.log('  2. Deploy if needed');
    console.log('  3. Test all 12 functions');
    console.log('  4. Generate comprehensive reports\n');
    console.log('━'.repeat(70) + '\n');

    const result = await runFullTestSuite();

    console.log('\n' + '━'.repeat(70));
    console.log('✅ Test Suite Execution Complete');
    console.log('━'.repeat(70) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test Suite Failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Execute
execute();
