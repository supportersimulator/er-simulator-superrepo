#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TEST_SCRIPT_ID = '1kkPZU3GsCCuu5IhTEOufmDT1Cb2rSQVB3Y3u1DPf87yoSV4WVtoNvd6i';

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

async function update() {
  console.log('\n🔍 FINDING AND UPDATING FUNCTIONS\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });
    const phase2File = project.data.files.find(f => f.name === 'Categories_Pathways_Feature_Phase2');

    if (!phase2File) {
      console.log('❌ Phase2 file not found\n');
      return;
    }

    let code = phase2File.source;
    let changes = [];

    // -----------------------------------------------------------------------
    // Find and update performHolisticAnalysis_()
    // -----------------------------------------------------------------------
    
    console.log('🔍 Looking for performHolisticAnalysis_()...\n');
    
    // Look for the function and find where columns are defined
    const holisticFnMatch = code.match(/function performHolisticAnalysis_[\s\S]*?(?=\n\/\/|function \w+|$)/);
    
    if (holisticFnMatch) {
      const functionCode = holisticFnMatch[0];
      console.log('✅ Found performHolisticAnalysis_()');
      console.log(`   Length: ${functionCode.length} chars\n`);
      
      // Check if it already has dynamic resolution
      if (functionCode.includes('resolveColumnIndices_')) {
        console.log('   ✅ Already has dynamic resolution\n');
      } else {
        console.log('   ⚠️  Needs dynamic resolution\n');
        
        // Find the column definitions
        const colMatch = functionCode.match(/(const caseIdCol = \d+;[\s\S]*?const diagnosisCol = \d+;)/);
        
        if (colMatch) {
          console.log('   ✅ Found column definitions - will replace\n');
          
          const replacement = `// Dynamic column resolution for holistic analysis
  const columnIndices = resolveColumnIndices_({
    caseId: { name: 'Case_Organization_Case_ID', fallback: 0 },
    sparkTitle: { name: 'Case_Organization_Spark_Title', fallback: 1 },
    pathway: { name: 'Case_Organization_Pathway_or_Course_Name', fallback: 5 },
    category: { name: 'Case_Organization_Category', fallback: 4 },
    diagnosis: { name: 'Case_Organization_Final_Diagnosis', fallback: 44 }
  });
  
  const caseIdCol = columnIndices.caseId;
  const sparkTitleCol = columnIndices.sparkTitle;
  const pathwayCol = columnIndices.pathway;
  const categoryCol = columnIndices.category;
  const diagnosisCol = columnIndices.diagnosis;`;
          
          code = code.replace(colMatch[0], replacement);
          changes.push('✅ Updated performHolisticAnalysis_() with dynamic resolution');
        }
      }
    } else {
      console.log('⚠️  Could not find performHolisticAnalysis_()\n');
    }

    // -----------------------------------------------------------------------
    // Find and update analyzeCatalog_()
    // -----------------------------------------------------------------------
    
    console.log('🔍 Looking for analyzeCatalog_()...\n');
    
    const catalogFnMatch = code.match(/function analyzeCatalog_[\s\S]*?(?=\n\/\/|function \w+|$)/);
    
    if (catalogFnMatch) {
      const functionCode = catalogFnMatch[0];
      console.log('✅ Found analyzeCatalog_()');
      console.log(`   Length: ${functionCode.length} chars\n`);
      
      // Check if it already has dynamic resolution
      if (functionCode.includes('resolveColumnIndices_')) {
        console.log('   ✅ Already has dynamic resolution\n');
      } else {
        console.log('   ⚠️  Needs dynamic resolution\n');
        
        // Find the column definitions (might be different pattern)
        const colMatch = functionCode.match(/((?:const|var) \w+Col = \d+;[\s\S]{0,500})/);
        
        if (colMatch) {
          console.log('   ✅ Found column definitions - will replace\n');
          console.log('   Original snippet:', colMatch[0].substring(0, 200) + '...\n');
          
          const replacement = `// Dynamic column resolution for catalog analysis
  const columnIndices = resolveColumnIndices_({
    caseId: { name: 'Case_Organization_Case_ID', fallback: 0 },
    sparkTitle: { name: 'Case_Organization_Spark_Title', fallback: 1 },
    pathway: { name: 'Case_Organization_Pathway_or_Course_Name', fallback: 5 },
    category: { name: 'Case_Organization_Category', fallback: 4 },
    diagnosis: { name: 'Case_Organization_Final_Diagnosis', fallback: 44 },
    learningOutcomes: { name: 'CME_and_Educational_Content_CME_Learning_Objective', fallback: 191 }
  });
  
  const caseIdCol = columnIndices.caseId;
  const sparkTitleCol = columnIndices.sparkTitle;
  const pathwayCol = columnIndices.pathway;
  const categoryCol = columnIndices.category;
  const diagnosisCol = columnIndices.diagnosis;
  const learningOutcomesCol = columnIndices.learningOutcomes;
  `;
          
          code = code.replace(colMatch[0], replacement);
          changes.push('✅ Updated analyzeCatalog_() with dynamic resolution');
        }
      }
    } else {
      console.log('⚠️  Could not find analyzeCatalog_()\n');
    }

    // -----------------------------------------------------------------------
    // Deploy if changes made
    // -----------------------------------------------------------------------

    if (changes.length > 0) {
      phase2File.source = code;
      
      console.log('🚀 Deploying changes...\n');

      await script.projects.updateContent({
        scriptId: TEST_SCRIPT_ID,
        requestBody: {
          files: project.data.files
        }
      });

      console.log('═══════════════════════════════════════════════════════════════');
      console.log('✅ UPDATES COMPLETE!\n');
      changes.forEach(c => console.log('   ' + c));
      console.log('\n═══════════════════════════════════════════════════════════════\n');
    } else {
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('✅ NO CHANGES NEEDED - Functions already optimized\n');
      console.log('═══════════════════════════════════════════════════════════════\n');
    }

  } catch (e) {
    console.log('\n❌ Failed: ' + e.message + '\n');
    if (e.stack) {
      console.log(e.stack);
    }
  }
}

update().catch(console.error);
