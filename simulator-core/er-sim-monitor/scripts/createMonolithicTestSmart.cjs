#!/usr/bin/env node

/**
 * CREATE SMART MONOLITHIC TEST PROJECT
 * Combines Production + Title Optimizer + Advanced Cache
 * Intelligently removes duplicate function/const declarations
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PROJECT_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf';
const BACKUP_DIR = path.join(__dirname, '../backups/all-projects-2025-11-06');

console.log('\n🔨 CREATING SMART MONOLITHIC TEST PROJECT\n');
console.log('═══════════════════════════════════════════════════════════════\n');

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

function removeDuplicates(code, seenFunctions, seenConsts) {
  const lines = code.split('\n');
  const result = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Check for function declarations
    const functionMatch = line.match(/^function\s+(\w+)\s*\(/);
    if (functionMatch) {
      const functionName = functionMatch[1];
      if (seenFunctions.has(functionName)) {
        // Skip this function
        console.log(`   ⏩ Skipping duplicate function: ${functionName}()`);
        let braceDepth = 0;
        let started = false;
        while (i < lines.length) {
          for (const char of lines[i]) {
            if (char === '{') { braceDepth++; started = true; }
            if (char === '}') braceDepth--;
          }
          i++;
          if (started && braceDepth === 0) break;
        }
        continue;
      } else {
        seenFunctions.add(functionName);
      }
    }

    // Check for const declarations
    const constMatch = line.match(/^const\s+(\w+)\s*=/);
    if (constMatch) {
      const constName = constMatch[1];
      if (seenConsts.has(constName)) {
        console.log(`   ⏩ Skipping duplicate const: ${constName}`);
        // Skip lines until we find the closing bracket or semicolon
        let skipLine = line;
        i++;
        while (i < lines.length && !skipLine.includes(';') && !skipLine.includes('};')) {
          skipLine = lines[i];
          i++;
        }
        continue;
      } else {
        seenConsts.add(constName);
      }
    }

    // Check for onOpen() - only keep the first one
    if (line.includes('function onOpen()')) {
      if (seenFunctions.has('onOpen')) {
        console.log(`   ⏩ Skipping duplicate onOpen()`);
        let braceDepth = 0;
        let started = false;
        while (i < lines.length) {
          for (const char of lines[i]) {
            if (char === '{') { braceDepth++; started = true; }
            if (char === '}') braceDepth--;
          }
          i++;
          if (started && braceDepth === 0) break;
        }
        continue;
      } else {
        seenFunctions.add('onOpen');
      }
    }

    result.push(line);
    i++;
  }

  return result.join('\n');
}

async function createMonolithicTest() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Reading source files...\n');

    // Read production baseline (all core batch processing)
    const productionPath = path.join(BACKUP_DIR, 'main-1orJ__UUViG-gdSOHXt2VSGzo--ASib9XdVLVCApccKujWnqTuxq7wHIw/Code.gs');
    const productionCode = fs.readFileSync(productionPath, 'utf8');
    console.log(`✅ Production baseline: ${(productionCode.length / 1024).toFixed(1)} KB`);

    // Read Title Optimizer (ATSR features)
    const atsrPath = path.join(BACKUP_DIR, 'test1-1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf/ATSR_Title_Generator_Feature.gs');
    const atsrCode = fs.readFileSync(atsrPath, 'utf8');
    console.log(`✅ ATSR Title Optimizer: ${(atsrCode.length / 1024).toFixed(1)} KB`);

    // Read Categories/Pathways Phase 2
    const pathways2Path = path.join(BACKUP_DIR, 'test1-1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf/Categories_Pathways_Feature_Phase2.gs');
    const pathways2Code = fs.readFileSync(pathways2Path, 'utf8');
    console.log(`✅ Categories/Pathways Phase 2: ${(pathways2Code.length / 1024).toFixed(1)} KB`);

    // Read Advanced Cache System files
    const cacheDir = path.join(BACKUP_DIR, 'feature1-1kkPZU3GsCCuu5IhTEOufmDT1Cb2rSQVB3Y3u1DPf87yoSV4WVtoNvd6i');
    const cacheFiles = fs.readdirSync(cacheDir).filter(f => f.endsWith('.gs'));

    const cacheCodeParts = cacheFiles.map(filename => {
      const filePath = path.join(cacheDir, filename);
      const content = fs.readFileSync(filePath, 'utf8');
      console.log(`✅ Advanced Cache - ${filename}: ${(content.length / 1024).toFixed(1)} KB`);
      return { filename, content };
    });

    console.log('\n═══════════════════════════════════════════════════════════════\n');
    console.log('🔧 Building de-duplicated monolithic Code.gs...\n');

    // Track seen functions and constants
    const seenFunctions = new Set();
    const seenConsts = new Set();

    // Process production code first (baseline)
    console.log('\n📦 Processing Production baseline...');
    const cleanProduction = removeDuplicates(productionCode, seenFunctions, seenConsts);

    // Process ATSR code
    console.log('\n📦 Processing ATSR Title Optimizer...');
    const cleanATSR = removeDuplicates(atsrCode, seenFunctions, seenConsts);

    // Process Pathways Phase 2
    console.log('\n📦 Processing Categories/Pathways Phase 2...');
    const cleanPathways2 = removeDuplicates(pathways2Code, seenFunctions, seenConsts);

    // Process Advanced Cache files
    const cleanCacheParts = cacheCodeParts.map(({filename, content}) => {
      console.log(`\n📦 Processing Advanced Cache - ${filename}...`);
      return removeDuplicates(content, seenFunctions, seenConsts);
    });

    // Build the final monolithic file
    const monolithicCode = `/**
 * MONOLITHIC TEST ENVIRONMENT
 *
 * Combined from:
 * - Production GPT Formatter (all core batch processing)
 * - Title Optimizer (ATSR features)
 * - Categories/Pathways Phase 2 (27 default headers, Field Selector)
 * - Advanced Cache System (Pathway Chain Builder, 7-layer cache)
 *
 * Generated: ${new Date().toISOString()}
 *
 * De-duplicated: Removed duplicate function and const declarations
 * This is a COMPLETE test environment with ALL features working together.
 */

// ==================== PRODUCTION BASELINE ====================
// All core batch processing, quality scoring, and utilities

${cleanProduction}

// ==================== TITLE OPTIMIZER (ATSR) ====================
// Complete ATSR system with Spark/Reveal titles and mystery regeneration

${cleanATSR}

// ==================== CATEGORIES & PATHWAYS PHASE 2 ====================
// Field Selector with 27 default headers and AI recommendations

${cleanPathways2}

// ==================== ADVANCED CACHE SYSTEM ====================
// Pathway Chain Builder and 7-layer cache enrichment

${cleanCacheParts.join('\n\n')}

// ==================== END OF MONOLITHIC CODE ====================
`;

    console.log(`\n📊 Total combined size: ${(monolithicCode.length / 1024).toFixed(1)} KB`);
    console.log(`📊 Functions preserved: ${seenFunctions.size}`);
    console.log(`📊 Constants preserved: ${seenConsts.size}\n`);

    // Get current manifest
    console.log('📥 Fetching current project manifest...\n');
    const currentProject = await script.projects.getContent({ scriptId: PROJECT_ID });
    const manifestFile = currentProject.data.files.find(f => f.name === 'appsscript');

    if (!manifestFile) {
      throw new Error('Could not find appsscript manifest');
    }

    console.log('✅ Found manifest\n');

    // Create the new project structure
    const files = [
      {
        name: 'Code',
        type: 'SERVER_JS',
        source: monolithicCode
      },
      manifestFile
    ];

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('💾 Uploading monolithic test project...\n');

    await script.projects.updateContent({
      scriptId: PROJECT_ID,
      requestBody: { files }
    });

    console.log('✅ Successfully created monolithic test project!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📋 PROJECT STRUCTURE:\n');
    console.log('   1. Code.gs - Complete de-duplicated monolithic file');
    console.log('   2. appsscript.json - Manifest\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎯 TEST MENU ITEMS:\n');
    console.log('   1. 🎨 ATSR Titles Optimizer');
    console.log('   2. 🧩 Categories & Pathways (Phase 2)');
    console.log('   3. 🔗 Pathway Chain Builder\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📝 NEXT STEPS:\n');
    console.log('   1. Open your test spreadsheet');
    console.log('   2. Refresh the page (Cmd+R)');
    console.log('   3. Look for "🧪 TEST Tools" menu');
    console.log('   4. All three tools should now work!\n');

    // Save local backup
    const localBackupPath = path.join(__dirname, '../backups/monolithic-test-2025-11-06.gs');
    fs.writeFileSync(localBackupPath, monolithicCode, 'utf8');
    console.log(`💾 Local backup saved: ${localBackupPath}\n`);

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

createMonolithicTest();
