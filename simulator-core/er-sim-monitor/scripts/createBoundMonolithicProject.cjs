#!/usr/bin/env node

/**
 * CREATE NEW CONTAINER-BOUND MONOLITHIC PROJECT
 * Creates a fresh Apps Script project bound to the test spreadsheet
 * with all the monolithic code
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TEST_SPREADSHEET_ID = '1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI';
const BACKUP_DIR = path.join(__dirname, '../backups/all-projects-2025-11-06');

console.log('\n🔨 CREATING NEW CONTAINER-BOUND MONOLITHIC PROJECT\n');
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

async function createBoundProject() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log(`📊 Test Spreadsheet: ${TEST_SPREADSHEET_ID}\n`);
    console.log('📥 Reading source files for monolithic code...\n');

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

    // De-duplication function
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

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🔨 Creating new container-bound project...\n');

    // Create a new Apps Script project bound to the spreadsheet
    const newProject = await script.projects.create({
      requestBody: {
        title: 'TEST Tools - Monolithic Environment',
        parentId: TEST_SPREADSHEET_ID
      }
    });

    const newProjectId = newProject.data.scriptId;
    console.log(`✅ Created new project: ${newProjectId}\n`);

    console.log('💾 Uploading monolithic code...\n');

    // Upload the monolithic code
    const files = [
      {
        name: 'Code',
        type: 'SERVER_JS',
        source: monolithicCode
      },
      {
        name: 'appsscript',
        type: 'JSON',
        source: JSON.stringify({
          timeZone: 'America/Los_Angeles',
          dependencies: {},
          exceptionLogging: 'STACKDRIVER',
          runtimeVersion: 'V8'
        }, null, 2)
      }
    ];

    await script.projects.updateContent({
      scriptId: newProjectId,
      requestBody: { files }
    });

    console.log('✅ Successfully uploaded monolithic code!\n');

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ NEW CONTAINER-BOUND PROJECT CREATED!\n');
    console.log(`📋 Project ID: ${newProjectId}\n`);
    console.log('📝 NEXT STEPS:\n');
    console.log('   1. Open your test spreadsheet:');
    console.log(`      https://docs.google.com/spreadsheets/d/${TEST_SPREADSHEET_ID}\n`);
    console.log('   2. Press Cmd+R (or F5) to fully refresh the page\n');
    console.log('   3. Wait 5-10 seconds for the script to load\n');
    console.log('   4. Look for "🧪 TEST Tools" menu at the top\n');
    console.log('   5. The menu should appear with three options:');
    console.log('      • 🎨 ATSR Titles Optimizer');
    console.log('      • 🧩 Categories & Pathways (Phase 2)');
    console.log('      • 🔗 Pathway Chain Builder\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Save local backup
    const localBackupPath = path.join(__dirname, '../backups/monolithic-container-bound-2025-11-06.gs');
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

createBoundProject();
