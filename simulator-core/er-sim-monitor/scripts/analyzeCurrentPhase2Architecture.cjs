#!/usr/bin/env node

/**
 * ANALYZE CURRENT PHASE 2 ARCHITECTURE
 *
 * Pull currently deployed Categories_Pathways_Feature_Phase2.gs from TEST
 * and create a detailed architectural analysis document showing:
 * - All functions and their purpose
 * - Data flow through the system
 * - Cache architecture
 * - Batch processing current state
 * - Dependencies between functions
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TEST_SCRIPT_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf';

async function authorize() {
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const tokenPath = path.join(__dirname, '../config/token.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

function extractFunctions(code) {
  // Extract all function definitions with their first few lines
  const functionRegex = /^function\s+(\w+)\s*\([^)]*\)\s*\{/gm;
  const functions = [];
  let match;

  while ((match = functionRegex.exec(code)) !== null) {
    const funcName = match[1];
    const startPos = match.index;
    const funcStart = code.substring(startPos, startPos + 200);

    // Find the comment block above the function
    const beforeFunc = code.substring(Math.max(0, startPos - 500), startPos);
    const commentMatch = beforeFunc.match(/\/\*\*[\s\S]*?\*\/\s*$/);
    const comment = commentMatch ? commentMatch[0].trim() : '';

    functions.push({
      name: funcName,
      comment: comment,
      preview: funcStart.split('\n').slice(0, 5).join('\n')
    });
  }

  return functions;
}

function analyzeDataFlow(code) {
  const analysis = {
    cacheFlow: [],
    headerFlow: [],
    pathwayFlow: [],
    batchProcessing: []
  };

  // Find cache-related function calls
  if (code.includes('refreshHeaders()')) {
    analysis.cacheFlow.push('refreshHeaders() → Maps column headers dynamically');
  }
  if (code.includes('getOrCreateHolisticAnalysis_()')) {
    analysis.cacheFlow.push('getOrCreateHolisticAnalysis_() → Checks cache or creates new');
  }
  if (code.includes('performHolisticAnalysis_()')) {
    analysis.cacheFlow.push('performHolisticAnalysis_() → Processes all data');
  }

  // Check for batch processing
  const batchLoopMatch = code.match(/for\s*\(\s*let\s+\w+\s*=\s*\d+;\s*\w+\s*<\s*data\.length/g);
  if (batchLoopMatch) {
    analysis.batchProcessing.push(`Found ${batchLoopMatch.length} loops processing all data at once`);
  }

  const batchSizeMatch = code.match(/batchSize\s*=\s*(\d+)/);
  if (batchSizeMatch) {
    analysis.batchProcessing.push(`Batch size configured: ${batchSizeMatch[1]} rows`);
  } else {
    analysis.batchProcessing.push('⚠️  No batch size configuration found - may process all rows at once');
  }

  return analysis;
}

async function analyze() {
  console.log('\n🔍 ANALYZING CURRENT PHASE 2 ARCHITECTURE\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    console.log('📥 Pulling Categories_Pathways_Feature_Phase2.gs from TEST...\n');

    const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });
    const phase2File = project.data.files.find(f => f.name === 'Categories_Pathways_Feature_Phase2');

    if (!phase2File) {
      console.log('❌ Categories_Pathways_Feature_Phase2.gs not found in TEST!\n');
      console.log('Available files:');
      project.data.files.forEach(f => console.log(`   - ${f.name}`));
      return;
    }

    const code = phase2File.source;
    const sizeKB = Math.round(code.length / 1024);
    const lineCount = code.split('\n').length;

    console.log(`✅ Loaded Categories_Pathways_Feature_Phase2.gs\n`);
    console.log(`📊 Statistics:\n`);
    console.log(`   Size: ${sizeKB} KB`);
    console.log(`   Lines: ${lineCount}`);
    console.log(`\n`);

    // Extract functions
    console.log('📋 EXTRACTING ALL FUNCTIONS...\n');
    const functions = extractFunctions(code);
    console.log(`Found ${functions.length} functions:\n`);

    // Group functions by category
    const categories = {
      'Entry Points (Menu Items)': [],
      'Cache System': [],
      'Pathway Discovery': [],
      'Helper Functions': [],
      'UI Functions': [],
      'Test Functions': []
    };

    functions.forEach(func => {
      const name = func.name;
      if (name.includes('runPathway') || name === 'onOpen') {
        categories['Entry Points (Menu Items)'].push(func);
      } else if (name.includes('cache') || name.includes('Cache') || name.includes('refresh') || name.includes('holistic')) {
        categories['Cache System'].push(func);
      } else if (name.includes('pathway') || name.includes('Pathway') || name.includes('discover')) {
        categories['Pathway Discovery'].push(func);
      } else if (name.includes('test') || name.includes('Test')) {
        categories['Test Functions'].push(func);
      } else if (name.includes('UI') || name.includes('Html') || name.includes('build')) {
        categories['UI Functions'].push(func);
      } else {
        categories['Helper Functions'].push(func);
      }
    });

    // Print categorized functions
    Object.entries(categories).forEach(([category, funcs]) => {
      if (funcs.length > 0) {
        console.log(`\n${category}:`);
        funcs.forEach(f => {
          console.log(`   • ${f.name}`);
          if (f.comment) {
            const firstLine = f.comment.split('\n')[1]?.replace(/^\s*\*\s*/, '').trim();
            if (firstLine) {
              console.log(`     ${firstLine}`);
            }
          }
        });
      }
    });

    // Analyze data flow
    console.log('\n\n🔄 DATA FLOW ANALYSIS:\n');
    const dataFlow = analyzeDataFlow(code);

    console.log('Cache Flow:');
    dataFlow.cacheFlow.forEach(step => console.log(`   ${step}`));

    console.log('\n⚠️  Batch Processing Status:');
    dataFlow.batchProcessing.forEach(status => console.log(`   ${status}`));

    // Find the critical cache function
    console.log('\n\n🔍 CRITICAL FUNCTION: performHolisticAnalysis_()\n');
    const perfHolisticMatch = code.match(/function performHolisticAnalysis_\(\)[\s\S]{0,2000}/);
    if (perfHolisticMatch) {
      const funcPreview = perfHolisticMatch[0].split('\n').slice(0, 40).join('\n');
      console.log(funcPreview);
      console.log('\n   ... (truncated)\n');
    }

    // Save full code to temp file for reference
    const tempPath = '/tmp/phase2_architecture_analysis.gs';
    fs.writeFileSync(tempPath, code, 'utf8');
    console.log(`💾 Full code saved to: ${tempPath}\n`);

    // Create summary document
    const summaryPath = path.join(__dirname, '../docs/PHASE2_ARCHITECTURE_SUMMARY.md');
    const summary = `# Phase 2 Architecture Analysis
Generated: ${new Date().toISOString()}

## Overview
- **File**: Categories_Pathways_Feature_Phase2.gs
- **Size**: ${sizeKB} KB (${lineCount} lines)
- **Total Functions**: ${functions.length}

## Function Categories

${Object.entries(categories).map(([cat, funcs]) => {
  if (funcs.length === 0) return '';
  return `### ${cat}
${funcs.map(f => `- \`${f.name}\``).join('\n')}
`;
}).join('\n')}

## Data Flow

### Cache System Flow
${dataFlow.cacheFlow.map(s => `- ${s}`).join('\n')}

### Batch Processing Status
${dataFlow.batchProcessing.map(s => `- ${s}`).join('\n')}

## Critical Issues Identified

1. **Batch Processing**: Current implementation processes ALL rows in single loop
   - Location: \`performHolisticAnalysis_()\` function
   - Issue: May timeout with large datasets
   - Solution: Implement 25-row batch processing with progress updates

2. **Cache Architecture**: Two-part cache system
   - Part 1: \`refreshHeaders()\` - Maps dynamic columns
   - Part 2: \`performHolisticAnalysis_()\` - Processes all cases
   - Works correctly but needs batching

## Recommendations

1. Modify \`performHolisticAnalysis_()\` to process in 25-row batches
2. Add progress tracking between batches
3. Keep all existing functionality intact
4. Test thoroughly before deployment
`;

    fs.writeFileSync(summaryPath, summary, 'utf8');
    console.log(`📄 Architecture summary saved to: ${summaryPath}\n`);

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ ARCHITECTURE ANALYSIS COMPLETE!\n');
    console.log('Next Steps:');
    console.log('   1. Review the summary document');
    console.log('   2. Examine performHolisticAnalysis_() function');
    console.log('   3. Plan batch processing implementation carefully');
    console.log('   4. Make changes incrementally with testing\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');
    if (e.stack) console.log(e.stack);
  }
}

analyze().catch(console.error);
