#!/usr/bin/env node

/**
 * Standalone Overview Generator
 *
 * Generates AI-powered case overviews (pre-sim + post-sim) from existing
 * AI_ENHANCED_CASE_ID_MAPPING.json file.
 *
 * This can be run independently if the main AI-Enhanced tool didn't complete
 * the overview generation phase.
 */

const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
require('dotenv').config();

const { initializeOpenAI, batchGenerateOverviews, previewOverviews } = require('./lib/caseOverviewGenerator.cjs');

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  📝 STANDALONE CASE OVERVIEW GENERATOR');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  try {
    // Step 1: Load existing AI-enhanced mapping
    const mappingPath = path.join(__dirname, '..', 'AI_ENHANCED_CASE_ID_MAPPING.json');

    if (!fs.existsSync(mappingPath)) {
      console.error('❌ ERROR: AI_ENHANCED_CASE_ID_MAPPING.json not found!');
      console.error('');
      console.error('You must run the main AI-Enhanced tool first:');
      console.error('  node scripts/aiEnhancedRenaming.cjs');
      console.error('');
      process.exit(1);
    }

    console.log('📖 Loading AI research data...');
    const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
    console.log('   ✅ Loaded ' + mapping.length + ' cases with AI research');
    console.log('');

    // Step 2: Initialize OpenAI
    console.log('🔑 Initializing OpenAI API...');
    const openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    initializeOpenAI(openaiClient);
    console.log('   ✅ OpenAI client initialized');
    console.log('');

    // Step 3: Generate overviews
    console.log('═══════════════════════════════════════════════════');
    console.log('📝 GENERATING CASE OVERVIEWS');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('Creating AI-powered case overviews:');
    console.log('  1. PRE-SIM: Sells the case value WITHOUT spoiling mystery');
    console.log('  2. POST-SIM: Reinforces learning with key takeaways');
    console.log('');
    console.log('Processing ' + mapping.length + ' cases...');
    console.log('  ⏱️  Estimated time: ~' + Math.ceil(mapping.length * 2 / 25) + ' minutes (378 API calls at 25 req/min)');
    console.log('  💰 Estimated cost: ~$' + (mapping.length * 0.052).toFixed(2));
    console.log('');

    const startTime = Date.now();

    const caseOverviews = await batchGenerateOverviews(mapping, {
      rateLimit: 25, // Lower rate (2 requests per case = pre + post)
      onProgress: (progress) => {
        const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
        const eta = ((progress.total - progress.current) * 2 / 25).toFixed(1);
        console.log('   📊 Progress: ' + progress.current + '/' + progress.total +
                    ' (' + Math.round(progress.current / progress.total * 100) + '%) | ' +
                    'Elapsed: ' + elapsed + 'min | ETA: ' + eta + 'min');
      }
    });

    // Step 4: Save case overviews
    const overviewsPath = path.join(__dirname, '..', 'AI_CASE_OVERVIEWS.json');
    fs.writeFileSync(overviewsPath, JSON.stringify(caseOverviews, null, 2));

    const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

    console.log('');
    console.log('✅ Case overviews saved: AI_CASE_OVERVIEWS.json');
    console.log('   ' + caseOverviews.length + ' cases with pre-sim + post-sim overviews');
    console.log('   ⏱️  Total time: ' + totalTime + ' minutes');
    console.log('');

    // Step 5: Preview one case overview
    if (caseOverviews.length > 0) {
      console.log('📖 PREVIEW: First case overview');
      console.log('');
      previewOverviews(caseOverviews[0]);
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ OVERVIEW GENERATION COMPLETE!');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Review the generated overviews in AI_CASE_OVERVIEWS.json');
    console.log('  2. Run sync script to populate Google Sheet columns:');
    console.log('     node scripts/syncOverviewsToSheet.cjs');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ ERROR generating overviews:');
    console.error(error.message);
    if (error.stack) {
      console.error('');
      console.error('Stack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
