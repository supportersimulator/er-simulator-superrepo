#!/usr/bin/env node

/**
 * COMPREHENSIVE PROJECT ANALYSIS FOR MICROSERVICES REFACTORING
 * Check all 3 key projects and map menu/function locations
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PROJECTS = {
  test_integration: {
    id: '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf',
    name: 'TEST Integration (Project #2)',
    purpose: 'Integration test + active working environment'
  },
  pathways_panel: {
    id: '1kkPZU3GsCCuu5IhTEOufmDT1Cb2rSQVB3Y3u1DPf87yoSV4WVtoNvd6i',
    name: 'Pathways Panel (Project #4)',
    purpose: 'Categories/Pathways + cache isolation'
  },
  atsr_panel: {
    id: '1KBkujOTXGDmmhWOFm-ifxoMjXM5pRwwM5FpFBtPWK8eoE99fr4lla1OE',
    name: 'ATSR Panel (Project #5)',
    purpose: 'ATSR title generation isolation'
  }
};

console.log('\n🔍 COMPREHENSIVE MICROSERVICES ARCHITECTURE ANALYSIS\n');
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

function extractFunction(source, functionName) {
  const regex = new RegExp(`function ${functionName}\\s*\\([^)]*\\)\\s*\\{`, 'g');
  const match = regex.exec(source);
  if (!match) return null;

  const startIndex = match.index;
  let braceCount = 0;
  let endIndex = startIndex;
  let foundStart = false;

  for (let i = startIndex; i < source.length; i++) {
    if (source[i] === '{') {
      braceCount++;
      foundStart = true;
    } else if (source[i] === '}') {
      braceCount--;
      if (foundStart && braceCount === 0) {
        endIndex = i + 1;
        break;
      }
    }
  }

  return source.substring(startIndex, endIndex);
}

function findAllFunctions(source) {
  const functionRegex = /function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
  const functions = [];
  let match;

  while ((match = functionRegex.exec(source)) !== null) {
    functions.push(match[1]);
  }

  return functions;
}

async function analyze() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    const projectData = {};

    // Read all 3 projects
    for (const [key, proj] of Object.entries(PROJECTS)) {
      console.log(`📥 Reading ${proj.name}...\n`);

      try {
        const project = await script.projects.getContent({ scriptId: proj.id });

        const files = project.data.files.filter(f => f.type === 'SERVER_JS');

        console.log(`   Files: ${files.length}\n`);
        files.forEach((f, i) => {
          const sizeKB = Math.round(f.source.length / 1024);
          console.log(`   ${i + 1}. ${f.name}.gs (${sizeKB} KB)`);
        });

        // Check for onOpen
        const fileWithMenu = files.find(f => f.source.includes('function onOpen'));

        if (fileWithMenu) {
          console.log(`\n   ✅ HAS onOpen() in ${fileWithMenu.name}.gs`);

          const onOpenFn = extractFunction(fileWithMenu.source, 'onOpen');
          if (onOpenFn) {
            // Extract menu items
            const itemRegex = /\.addItem\('([^']+)',\s*'([^']+)'\)/g;
            const menuItems = [];
            let match;

            while ((match = itemRegex.exec(onOpenFn)) !== null) {
              menuItems.push({
                label: match[1],
                functionName: match[2]
              });
            }

            console.log(`   Menu items: ${menuItems.length}`);
            menuItems.forEach(item => {
              console.log(`      • "${item.label}" → ${item.functionName}()`);
            });
          }
        } else {
          console.log('\n   ❌ No onOpen() function');
        }

        // Get all combined source
        const combinedSource = files.map(f => f.source).join('\n');
        const allFunctions = findAllFunctions(combinedSource);

        console.log(`   Total functions: ${allFunctions.length}`);

        projectData[key] = {
          ...proj,
          files: files.map(f => ({
            name: f.name,
            size: f.source.length,
            source: f.source
          })),
          hasMenu: !!fileWithMenu,
          menuFile: fileWithMenu ? fileWithMenu.name : null,
          allFunctions: allFunctions
        };

      } catch (error) {
        console.log(`   ❌ Error reading project: ${error.message}`);
      }

      console.log('\n═══════════════════════════════════════════════════════════════\n');
    }

    // Cross-project analysis
    console.log('🔍 CROSS-PROJECT FUNCTION ANALYSIS:\n');

    const keyFunctions = [
      'preCacheRichData',
      'showFieldSelector',
      'runPathwayChainBuilder',
      'generateATSRTitle',
      'getRecommendedFields_',
      'readApiKey_',
      'getAvailableFields',
      'processBatchRows_',
      'processOneInputRow_'
    ];

    console.log('Tracking key functions across projects:\n');

    keyFunctions.forEach(fn => {
      const locations = [];

      Object.entries(projectData).forEach(([key, data]) => {
        if (data.allFunctions && data.allFunctions.includes(fn)) {
          locations.push(data.name);
        }
      });

      if (locations.length > 0) {
        console.log(`• ${fn}()`);
        console.log(`  Found in: ${locations.join(', ')}`);

        // Categorize
        let shouldBe = '';
        if (fn.includes('Cache') || fn.includes('Pathway') || fn.includes('Field') || fn === 'showFieldSelector') {
          shouldBe = 'Pathways Panel (Project #4)';
        } else if (fn.includes('ATSR') || fn === 'generateATSRTitle' || fn === 'buildPathwayChain') {
          shouldBe = 'ATSR Panel (Project #5)';
        } else if (fn.includes('Batch') || fn.includes('Process') || fn === 'processOneInputRow_') {
          shouldBe = 'Batch Panel (Project #6) - NOT YET CREATED';
        } else if (fn === 'readApiKey_' || fn === 'getAvailableFields') {
          shouldBe = 'Central Orchestration (shared utility)';
        }

        if (shouldBe) {
          console.log(`  Should be in: ${shouldBe}`);
        }

        // Check for duplication
        if (locations.length > 1) {
          console.log(`  ⚠️  DUPLICATED across ${locations.length} projects!`);
        }

        console.log('');
      }
    });

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📊 CURRENT ARCHITECTURE STATE:\n');

    // TEST Integration analysis
    if (projectData.test_integration) {
      const test = projectData.test_integration;
      console.log('✅ TEST Integration (Project #2) - ACTIVE');
      console.log(`   Purpose: Integration test + working environment`);
      console.log(`   Has menu: ${test.hasMenu ? 'YES' : 'NO'}`);
      if (test.hasMenu) {
        console.log(`   Menu location: ${test.menuFile}.gs`);
      }
      console.log(`   Files: ${test.files.length}`);
      console.log(`   Functions: ${test.allFunctions.length}`);
      console.log(`   Status: This is the ACTIVE working environment\n`);
    }

    // Pathways Panel analysis
    if (projectData.pathways_panel) {
      const pathways = projectData.pathways_panel;
      console.log('✅ Pathways Panel (Project #4)');
      console.log(`   Purpose: Categories/Pathways + cache isolation`);
      console.log(`   Has menu: ${pathways.hasMenu ? 'YES - Should be removed' : 'NO - Correct!'}`);
      console.log(`   Files: ${pathways.files.length}`);
      console.log(`   Functions: ${pathways.allFunctions.length}`);
      console.log(`   Status: ${pathways.hasMenu ? 'Needs menu extraction' : 'Already isolated'}\n`);
    }

    // ATSR Panel analysis
    if (projectData.atsr_panel) {
      const atsr = projectData.atsr_panel;
      console.log('✅ ATSR Panel (Project #5)');
      console.log(`   Purpose: ATSR title generation isolation`);
      console.log(`   Has menu: ${atsr.hasMenu ? 'YES - Should be removed' : 'NO - Correct!'}`);
      console.log(`   Files: ${atsr.files.length}`);
      console.log(`   Functions: ${atsr.allFunctions.length}`);
      console.log(`   Status: ${atsr.hasMenu ? 'Needs menu extraction' : 'Needs function isolation'}\n`);
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎯 REFACTORING RECOMMENDATIONS:\n');

    // Determine where menu currently is
    const menuLocation = Object.entries(projectData).find(([key, data]) => data.hasMenu);

    if (menuLocation) {
      const [key, data] = menuLocation;
      console.log(`1. ✅ Menu is currently in ${data.name}`);

      if (key === 'test_integration') {
        console.log(`   ✅ GOOD - This is the correct central location!`);
        console.log(`   Next step: Verify menu items call functions from correct panels\n`);
      } else {
        console.log(`   ⚠️  NEEDS RELOCATION - Move to TEST Integration (Project #2)`);
        console.log(`   Menu should be in central integration test, not isolated panel\n`);
      }
    } else {
      console.log(`1. ❌ No menu found in any project!`);
      console.log(`   This explains why menu doesn't appear.`);
      console.log(`   Need to create onOpen() in TEST Integration (Project #2)\n`);
    }

    console.log('2. Create CentralOrchestration.gs or add menu to Code.gs');
    console.log('   Options:');
    console.log('   A) Add menu to existing Code.gs in TEST Integration');
    console.log('   B) Create new CentralOrchestration.gs file');
    console.log('   Recommendation: Option A (simpler)\n');

    console.log('3. Isolate ATSR Panel (Project #5)');
    console.log('   - Remove Batch_Processing_Sidebar_Feature.gs');
    console.log('   - Remove Core_Processing_Engine.gs (move to Batch Panel)');
    console.log('   - Keep only ATSR_Title_Generator_Feature.gs\n');

    console.log('4. Create dedicated Batch Processing Panel (Project #6)');
    console.log('   - Use existing project structure');
    console.log('   - Add Core_Processing_Engine.gs');
    console.log('   - Add Batch_Processing_Sidebar_Feature.gs');
    console.log('   - Remove ATSR functions\n');

    console.log('═══════════════════════════════════════════════════════════════\n');

    // Save comprehensive report
    const reportPath = path.join(__dirname, '../docs/COMPREHENSIVE_PROJECT_ANALYSIS.md');
    const report = `# COMPREHENSIVE MICROSERVICES ARCHITECTURE ANALYSIS

Generated: ${new Date().toLocaleString()}

## Project Inventory

${Object.entries(projectData).map(([key, data]) => `
### ${data.name}
- **ID**: ${data.id}
- **Purpose**: ${data.purpose}
- **Has Menu**: ${data.hasMenu ? `YES (in ${data.menuFile}.gs)` : 'NO'}
- **Files**: ${data.files.length}
  ${data.files.map(f => `- ${f.name}.gs (${Math.round(f.size / 1024)} KB)`).join('\n  ')}
- **Total Functions**: ${data.allFunctions.length}
`).join('\n')}

## Key Function Locations

${keyFunctions.map(fn => {
  const locations = [];
  Object.entries(projectData).forEach(([key, data]) => {
    if (data.allFunctions && data.allFunctions.includes(fn)) {
      locations.push(data.name);
    }
  });

  if (locations.length > 0) {
    return `### ${fn}()
- Found in: ${locations.join(', ')}
${locations.length > 1 ? '- ⚠️ **DUPLICATED** across multiple projects' : ''}
`;
  }
  return '';
}).filter(Boolean).join('\n')}

## Current Architecture Issues

1. **Menu Location**: ${menuLocation ? `Currently in ${menuLocation[1].name}` : 'No menu found'}
2. **Function Duplication**: Multiple projects contain the same functions
3. **Incomplete Isolation**: ATSR Panel contains batch processing code
4. **No Batch Panel**: Batch processing not yet isolated into Project #6

## Recommended Next Steps

1. Verify menu location and functionality
2. Create/update CentralOrchestration structure
3. Extract and isolate ATSR-only functions
4. Create dedicated Batch Processing Panel
5. Remove duplicated code across projects
6. Test each isolated panel independently
`;

    fs.writeFileSync(reportPath, report, 'utf8');
    console.log(`📄 Comprehensive analysis saved: ${reportPath}\n`);

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

analyze();
