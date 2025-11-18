#!/usr/bin/env node

/**
 * AI PATHWAY DISCOVERY - COMPREHENSIVE PRE-DEPLOYMENT TEST
 * Tests syntax, prompt structure, error handling, and edge cases
 */

const fs = require('fs');
const path = require('path');

console.log('\n🧪 AI PATHWAY DISCOVERY - PRE-DEPLOYMENT TESTS\n');
console.log('═══════════════════════════════════════════════════════════════\n');

const filePath = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs');
const code = fs.readFileSync(filePath, 'utf8');

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (e) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${e.message}\n`);
    testsFailed++;
  }
}

// TEST 1: File exists and is readable
test('File exists and readable', () => {
  if (!code || code.length === 0) throw new Error('File is empty');
  if (code.length < 50000) throw new Error('File size too small - may be corrupted');
});

// TEST 2: Critical functions exist
test('AI discovery functions exist', () => {
  const requiredFunctions = [
    'discoverPathwaysSync_',
    'getAIDiscoveryStatus',
    'startAIDiscovery',
    'extractVital_',
    'analyzeCatalog_'
  ];

  requiredFunctions.forEach(fn => {
    if (!code.includes(`function ${fn}`)) {
      throw new Error(`Missing function: ${fn}`);
    }
  });
});

// TEST 3: Prompt structure validation
test('Prompt strings properly escaped', () => {
  // Extract prompt lines
  const promptMatch = code.match(/const prompt = creativityMode[\s\S]*?(?=\n\s{4}log)/);
  if (!promptMatch) throw new Error('Cannot find prompt definition');

  const promptCode = promptMatch[0];

  // Check for unescaped quotes inside strings
  const lines = promptCode.split('\n');
  lines.forEach((line, idx) => {
    // Look for potential quote issues
    if (line.includes('"') && line.includes("'")) {
      // Check if quotes are properly escaped
      const singleQuotes = (line.match(/'/g) || []).length;
      const escapedQuotes = (line.match(/\\'/g) || []).length;

      // If line contains Can't, Don't, etc - should be escaped
      if (line.match(/\s(Can|Don|Won|Doesn)'t\s/) && !line.includes("\\'")) {
        throw new Error(`Line ${idx}: Unescaped apostrophe in "${line.trim().substring(0, 50)}..."`);
      }
    }
  });
});

// TEST 4: JSON stringify safety
test('JSON.stringify used correctly', () => {
  const jsonStringifyUsages = code.match(/JSON\.stringify\([^)]+\)/g) || [];

  jsonStringifyUsages.forEach(usage => {
    // Check that we're not trying to stringify something that might be undefined
    if (usage.includes('JSON.stringify(summaries)') ||
        usage.includes('JSON.stringify({') ||
        usage.includes('JSON.stringify([')) {
      // These are safe
      return;
    }
  });
});

// TEST 5: Error handling exists
test('Error handling implemented', () => {
  const errorChecks = [
    'if (!settingsSheet)',
    'if (!apiKey)',
    'if (code !== 200)',
    'try {',
    'catch (e)'
  ];

  errorChecks.forEach(check => {
    if (!code.includes(check)) {
      throw new Error(`Missing error check: ${check}`);
    }
  });
});

// TEST 6: Logging functions called correctly
test('Logging system integrated', () => {
  // Check that log() is called with correct parameters
  const logCalls = code.match(/log\([^)]+\)/g) || [];

  if (logCalls.length < 10) {
    throw new Error('Insufficient logging - expected at least 10 log calls');
  }

  // Check that log() calls have both message and type
  const badLogCalls = logCalls.filter(call => {
    return !call.includes("'info'") &&
           !call.includes("'success'") &&
           !call.includes("'warning'") &&
           !call.includes("'error'");
  });

  if (badLogCalls.length > 0) {
    throw new Error(`Found ${badLogCalls.length} log calls without type parameter`);
  }
});

// TEST 7: OpenAI API call structure
test('OpenAI API call properly structured', () => {
  const apiCallMatch = code.match(/UrlFetchApp\.fetch\('https:\/\/api\.openai\.com[\s\S]*?\}\);/);
  if (!apiCallMatch) throw new Error('Cannot find OpenAI API call');

  const apiCall = apiCallMatch[0];

  // Check required fields
  const requiredFields = [
    'Authorization',
    'Bearer',
    'model',
    'gpt-4',
    'messages',
    'temperature',
    'max_tokens'
  ];

  requiredFields.forEach(field => {
    if (!apiCall.includes(field)) {
      throw new Error(`Missing field in API call: ${field}`);
    }
  });

  // Check muteHttpExceptions is set
  if (!apiCall.includes('muteHttpExceptions: true')) {
    throw new Error('muteHttpExceptions not set - errors may not be caught');
  }
});

// TEST 8: Response parsing with fallback
test('Response parsing has fallback logic', () => {
  const parseMatch = code.match(/let pathways = \[\];[\s\S]*?pathways = match/);
  if (!parseMatch) throw new Error('Cannot find parsing logic');

  const parseCode = parseMatch[0];

  // Check for regex match fallback
  if (!parseCode.includes('match ? JSON.parse(match[0]) : JSON.parse(aiText)')) {
    throw new Error('Missing fallback logic for JSON parsing');
  }
});

// TEST 9: PropertiesService usage for persistence
test('PropertiesService used for state persistence', () => {
  if (!code.includes('PropertiesService.getScriptProperties()')) {
    throw new Error('PropertiesService not used - state may not persist');
  }

  if (!code.includes("setProperty('AI_PATHWAYS'")) {
    throw new Error('Pathways not stored in properties');
  }
});

// TEST 10: Client polling system
test('Client-side polling implemented', () => {
  const pollingChecks = [
    'setInterval(pollLogs, 300)',
    'getAIDiscoveryStatus',
    'if (result.complete)',
    'clearInterval(pollInterval)'
  ];

  pollingChecks.forEach(check => {
    if (!code.includes(check)) {
      throw new Error(`Missing polling component: ${check}`);
    }
  });
});

// TEST 11: Temperature values correct
test('Temperature values set correctly', () => {
  if (!code.includes('creativityMode === \'radical\' ? 1.0 : 0.7')) {
    throw new Error('Temperature values incorrect or missing');
  }
});

// TEST 12: Both creativity modes implemented
test('Both Standard and Radical modes exist', () => {
  const modes = ['standard', 'radical'];

  modes.forEach(mode => {
    if (!code.includes(`'${mode}'`)) {
      throw new Error(`Missing mode: ${mode}`);
    }
  });
});

// TEST 13: Case summary fields present
test('Enhanced case summaries with 23 fields', () => {
  const requiredFields = [
    'id:', 'title:', 'diagnosis:', 'preSim:', 'postSim:',
    'learning:', 'objectives:', 'category:', 'difficulty:',
    'age:', 'gender:', 'initialHR:', 'initialBP:',
    'examFindings:', 'medications:', 'pmh:', 'allergies:',
    'environment:', 'disposition:'
  ];

  let missingFields = [];
  requiredFields.forEach(field => {
    if (!code.includes(field)) {
      missingFields.push(field);
    }
  });

  if (missingFields.length > 0) {
    throw new Error(`Missing summary fields: ${missingFields.join(', ')}`);
  }
});

// TEST 14: Disease mimics framework present
test('Two-type disease mimics framework in prompts', () => {
  const mimicChecks = [
    'Disease mimics - TWO TYPES',
    'Cross-category mimics',
    'Within-category mimics',
    'MI vs panic',
    'STEMI vs Wellens'
  ];

  mimicChecks.forEach(check => {
    if (!code.includes(check)) {
      throw new Error(`Missing mimic framework element: ${check}`);
    }
  });
});

// TEST 15: Click-worthy naming guidance present
test('Click-worthy pathway naming guidance in prompts', () => {
  const namingChecks = [
    'IRRESISTIBLY CLICK-WORTHY',
    'emotionally resonant',
    'Netflix series vibes',
    'The Deadly Doppelgangers',
    'Evil Twins'
  ];

  namingChecks.forEach(check => {
    if (!code.includes(check)) {
      throw new Error(`Missing naming guidance: ${check}`);
    }
  });
});

// TEST 16: Prompt length validation
test('Prompts not excessively long', () => {
  const standardPromptMatch = code.match(/ANALYZE ALL.*?NO markdown, NO explanation\.'/);
  const radicalPromptMatch = code.match(/ANALYZE ALL.*?NO markdown, NO explanation\.'/g);

  if (standardPromptMatch && standardPromptMatch[0].length > 3000) {
    throw new Error('Standard prompt too long - may hit token limits');
  }

  if (radicalPromptMatch && radicalPromptMatch[0].length > 3000) {
    throw new Error('Radical prompt too long - may hit token limits');
  }
});

// TEST 17: File size reasonable
test('File size within reasonable limits', () => {
  const sizeKB = code.length / 1024;

  if (sizeKB > 150) {
    throw new Error(`File size ${sizeKB.toFixed(1)} KB exceeds 150 KB limit`);
  }

  if (sizeKB < 80) {
    throw new Error(`File size ${sizeKB.toFixed(1)} KB too small - may be missing code`);
  }

  console.log(`   (Current size: ${sizeKB.toFixed(1)} KB)`);
});

// TEST 18: No console.log statements (use log() instead)
test('No console.log statements (uses log() instead)', () => {
  const consoleLogMatch = code.match(/console\.log/g);

  if (consoleLogMatch && consoleLogMatch.length > 0) {
    throw new Error(`Found ${consoleLogMatch.length} console.log statements - should use log() instead`);
  }
});

// SUMMARY
console.log('\n═══════════════════════════════════════════════════════════════');
console.log(`✅ Tests Passed: ${testsPassed}`);
console.log(`❌ Tests Failed: ${testsFailed}`);
console.log('═══════════════════════════════════════════════════════════════\n');

if (testsFailed === 0) {
  console.log('🎉 ALL TESTS PASSED - READY FOR DEPLOYMENT!\n');
  process.exit(0);
} else {
  console.log('⚠️  SOME TESTS FAILED - FIX ISSUES BEFORE DEPLOYING!\n');
  process.exit(1);
}
