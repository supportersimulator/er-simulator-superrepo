#!/usr/bin/env node

/**
 * ANALYZE GPT FORMATTER STRUCTURE AND ORGANIZATION
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const GPT_FORMATTER_ID = '1orJ__UUViG-gdSOHXt2VSGzo--ASib9XdVLVCApccKujWnqTuxq7wHIw';

console.log('\n📊 ANALYZING GPT FORMATTER STRUCTURE\n');
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

async function analyze() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading GPT Formatter...\n');

    const content = await script.projects.getContent({
      scriptId: GPT_FORMATTER_ID
    });

    const code = content.data.files.find(f => f.name === 'Code').source;

    console.log(`📦 Total Size: ${(code.length / 1024).toFixed(1)} KB\n`);
    console.log(`📝 Total Lines: ${code.split('\n').length.toLocaleString()}\n`);

    console.log('═══════════════════════════════════════════════════════════════\n');

    // Check for section headers
    console.log('📋 CODE SECTIONS (Section Headers Found):\n');

    const sectionHeaders = [...code.matchAll(/\/\/ ={10,}.*?={10,}/g)];
    if (sectionHeaders.length > 0) {
      sectionHeaders.forEach((match, index) => {
        const header = match[0].replace(/\/\/ ={10,}/g, '').trim();
        console.log(`   ${index + 1}. ${header}`);
      });
      console.log(`\n   ✅ Found ${sectionHeaders.length} organized sections\n`);
    } else {
      console.log('   ⚠️  No clear section headers found\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

    // Count functions by feature
    console.log('📊 FUNCTION DISTRIBUTION:\n');

    const allFunctions = [...code.matchAll(/^function\s+(\w+)/gm)].map(m => m[1]);
    console.log(`   Total Functions: ${allFunctions.length}\n`);

    // Group by prefix/pattern
    const groups = {
      'ATSR': allFunctions.filter(f => f.includes('ATSR') || f.includes('Atsr')),
      'Cache': allFunctions.filter(f => f.includes('cache') || f.includes('Cache')),
      'Batch': allFunctions.filter(f => f.includes('Batch') || f.includes('batch')),
      'Categories/Pathways': allFunctions.filter(f => 
        f.includes('Categories') || f.includes('Pathways') || f.includes('Category') || 
        f.includes('Pathway') || f.includes('Chain') || f.includes('Holistic')
      ),
      'Field Selector': allFunctions.filter(f => f.includes('Field') || f.includes('field')),
      'Image Sync': allFunctions.filter(f => f.includes('Image') || f.includes('image') || f.includes('Img')),
      'Memory/Motif': allFunctions.filter(f => f.includes('Memory') || f.includes('Motif') || f.includes('motif')),
      'Waveform': allFunctions.filter(f => f.includes('Waveform') || f.includes('waveform')),
      'Quality': allFunctions.filter(f => f.includes('Quality') || f.includes('quality')),
      'Helper/Utility': allFunctions.filter(f => f.endsWith('_') || f.includes('get') || f.includes('parse'))
    };

    Object.entries(groups).forEach(([name, funcs]) => {
      if (funcs.length > 0) {
        console.log(`   ${name}: ${funcs.length} functions`);
      }
    });

    console.log('\n═══════════════════════════════════════════════════════════════\n');

    // Check for duplicate functions
    console.log('🔍 CHECKING FOR DUPLICATES:\n');

    const functionCounts = {};
    allFunctions.forEach(f => {
      functionCounts[f] = (functionCounts[f] || 0) + 1;
    });

    const duplicates = Object.entries(functionCounts).filter(([name, count]) => count > 1);

    if (duplicates.length > 0) {
      console.log('   ⚠️  DUPLICATE FUNCTIONS FOUND:\n');
      duplicates.forEach(([name, count]) => {
        console.log(`   - ${name}() appears ${count} times`);
      });
      console.log('\n   ⚠️  This will cause issues - only last declaration executes!\n');
    } else {
      console.log('   ✅ No duplicate functions found\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

    // Check menu structure
    console.log('📋 MENU STRUCTURE:\n');

    const onOpenMatch = code.match(/function onOpen\(\)[^{]*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/);
    if (onOpenMatch) {
      const menuCode = onOpenMatch[0];
      const menus = [...menuCode.matchAll(/createMenu\(['"]([^'"]+)['"]\)/g)];
      const items = [...menuCode.matchAll(/addItem\(['"]([^'"]+)['"],\s*['"](\w+)['"]\)/g)];

      console.log('   Menus:\n');
      menus.forEach(m => console.log(`   - ${m[1]}`));

      console.log('\n   Menu Items:\n');
      items.forEach(m => console.log(`   - ${m[1]} → ${m[2]}()`));
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

    // Recommendations
    console.log('💡 ORGANIZATION ASSESSMENT:\n');

    if (sectionHeaders.length < 5) {
      console.log('   ⚠️  Code could benefit from better section organization\n');
      console.log('   Recommendation: Add clear section headers for:\n');
      console.log('   - ATSR Feature\n');
      console.log('   - Categories & Pathways\n');
      console.log('   - Cache System\n');
      console.log('   - Batch Processing\n');
      console.log('   - Utility Functions\n');
    } else {
      console.log('   ✅ Code has good section organization\n');
    }

    if (duplicates.length > 0) {
      console.log('   🔴 CRITICAL: Remove duplicate functions immediately!\n');
    }

    if (code.length > 400000) {
      console.log('   ⚠️  Code is very large (>400KB)\n');
      console.log('   Consider splitting into multiple files if possible\n');
    } else if (code.length > 250000) {
      console.log('   ℹ️  Code is large but manageable\n');
    } else {
      console.log('   ✅ Code size is reasonable\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

    // Save analysis
    const analysisPath = path.join(__dirname, '../backups/gpt-formatter-analysis-2025-11-06.txt');
    const analysis = `
GPT Formatter Structure Analysis
Generated: ${new Date().toLocaleString()}

Size: ${(code.length / 1024).toFixed(1)} KB
Lines: ${code.split('\n').length.toLocaleString()}
Functions: ${allFunctions.length}
Sections: ${sectionHeaders.length}
Duplicates: ${duplicates.length}

${duplicates.length > 0 ? 'WARNING: Duplicate functions found!\n' + duplicates.map(([n, c]) => `- ${n}() x${c}`).join('\n') : 'No duplicates found'}
`;

    fs.writeFileSync(analysisPath, analysis, 'utf8');
    console.log(`💾 Analysis saved to: ${analysisPath}\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

analyze();
