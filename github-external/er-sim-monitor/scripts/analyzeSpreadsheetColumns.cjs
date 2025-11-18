#!/usr/bin/env node

/**
 * Analyze spreadsheet columns to map 26 required fields for AI discovery
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SPREADSHEET_ID = '1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI';

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

async function analyzeColumns() {
  console.log('\n🔍 ANALYZING SPREADSHEET COLUMNS FOR FIELD MAPPING\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    // Find the master scenario sheet
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      fields: 'sheets.properties'
    });

    const masterSheet = spreadsheet.data.sheets.find(
      sheet => /master.*scenario.*convert/i.test(sheet.properties.title)
    );

    if (!masterSheet) {
      console.log('❌ Could not find Master Scenario Convert sheet\n');
      console.log('Available sheets:');
      spreadsheet.data.sheets.forEach(sh => {
        console.log('   • ' + sh.properties.title);
      });
      return;
    }

    const sheetName = masterSheet.properties.title;
    console.log('✅ Found sheet:', sheetName, '\n');

    // Read tier 1 and tier 2 headers
    const headerData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!1:2`
    });

    const tier1 = headerData.data.values[0];
    const tier2 = headerData.data.values[1];

    console.log('📊 Total columns:', tier2.length, '\n');

    // Define the 26 required fields for AI discovery
    const requiredFields = {
      // Core identification (3 fields) - TIER 1: BASIC
      basic: [
        { field: 'caseId', tier2Names: ['Case_Organization_Case_ID', 'Case ID', 'ID'] },
        { field: 'sparkTitle', tier2Names: ['Case_Organization_Spark_Title', 'Spark Title', 'Title'] },
        { field: 'diagnosis', tier2Names: ['Case_Orientation_Chief_Diagnosis', 'Chief Diagnosis', 'Diagnosis'] }
      ],

      // Learning context (4 fields) - TIER 2: LEARNING
      learning: [
        { field: 'preSimOverview', tier2Names: ['Case_Orientation_PreSim_Overview', 'PreSim Overview', 'Pre-Sim'] },
        { field: 'postSimOverview', tier2Names: ['Case_Orientation_PostSim_Overview', 'PostSim Overview', 'Post-Sim'] },
        { field: 'learningOutcomes', tier2Names: ['Case_Orientation_Actual_Learning_Outcomes', 'Learning Outcomes', 'Outcomes'] },
        { field: 'learningObjectives', tier2Names: ['Case_Orientation_Learning_Objectives', 'Learning Objectives', 'Objectives'] }
      ],

      // Case metadata (5 fields) - TIER 3: METADATA
      metadata: [
        { field: 'category', tier2Names: ['Case_Organization_Category', 'Category'] },
        { field: 'pathway', tier2Names: ['Case_Organization_Pathway_or_Course_Name', 'Pathway', 'Course Name'] },
        { field: 'difficulty', tier2Names: ['Case_Organization_Difficulty', 'Difficulty', 'Level'] },
        { field: 'estimatedDuration', tier2Names: ['Case_Organization_Estimated_Duration', 'Duration', 'Time'] },
        { field: 'setting', tier2Names: ['Case_Orientation_Setting', 'Setting', 'Location'] }
      ],

      // Patient demographics (3 fields) - TIER 4: DEMOGRAPHICS
      demographics: [
        { field: 'age', tier2Names: ['Case_Orientation_Patient_Age', 'Patient Age', 'Age'] },
        { field: 'gender', tier2Names: ['Case_Orientation_Patient_Gender', 'Patient Gender', 'Gender'] },
        { field: 'chiefComplaint', tier2Names: ['Case_Orientation_Chief_Complaint', 'Chief Complaint', 'Complaint'] }
      ],

      // Initial vitals (4 fields) - TIER 5: VITALS
      vitals: [
        { field: 'initialVitals', tier2Names: ['Case_Orientation_Initial_Vitals', 'Initial Vitals', 'Vitals', 'Initial_Vitals'] }
      ],

      // Clinical findings (4 fields) - TIER 6: CLINICAL
      clinical: [
        { field: 'examFindings', tier2Names: ['Case_Orientation_Exam_Findings', 'Exam Findings', 'Physical Exam'] },
        { field: 'medications', tier2Names: ['Case_Orientation_Medications', 'Medications', 'Meds', 'Past Medications'] },
        { field: 'pastMedicalHistory', tier2Names: ['Case_Orientation_Past_Medical_History', 'PMH', 'Medical History'] },
        { field: 'allergies', tier2Names: ['Case_Orientation_Allergies', 'Allergies'] }
      ],

      // Environment (3 fields) - TIER 7: ENVIRONMENT
      environment: [
        { field: 'environmentType', tier2Names: ['Case_Orientation_Environment_Type', 'Environment Type', 'Environment'] },
        { field: 'dispositionPlan', tier2Names: ['Case_Orientation_Disposition_Plan', 'Disposition Plan', 'Disposition'] },
        { field: 'context', tier2Names: ['Case_Orientation_Context', 'Context', 'Background'] }
      ]
    };

    // Map each field to actual column index
    const fieldMapping = {};
    const unmappedFields = [];

    Object.keys(requiredFields).forEach(tier => {
      console.log(`\n📋 ${tier.toUpperCase()} TIER:\n`);

      requiredFields[tier].forEach(fieldDef => {
        let foundIndex = -1;

        for (const possibleName of fieldDef.tier2Names) {
          foundIndex = tier2.indexOf(possibleName);
          if (foundIndex !== -1) {
            fieldMapping[fieldDef.field] = {
              index: foundIndex,
              columnName: tier2[foundIndex],
              tier: tier
            };
            console.log(`   ✅ ${fieldDef.field} → Column ${foundIndex} (${tier2[foundIndex]})`);
            break;
          }
        }

        if (foundIndex === -1) {
          unmappedFields.push({ field: fieldDef.field, tier: tier, attemptedNames: fieldDef.tier2Names });
          console.log(`   ❌ ${fieldDef.field} → NOT FOUND (tried: ${fieldDef.tier2Names.join(', ')})`);
        }
      });
    });

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log(`\n📊 MAPPING SUMMARY:\n`);
    console.log(`   Total required fields: ${Object.values(requiredFields).flat().length}`);
    console.log(`   Successfully mapped: ${Object.keys(fieldMapping).length}`);
    console.log(`   Unmapped fields: ${unmappedFields.length}\n`);

    if (unmappedFields.length > 0) {
      console.log('⚠️  UNMAPPED FIELDS:\n');
      unmappedFields.forEach(uf => {
        console.log(`   • ${uf.field} (${uf.tier} tier)`);
        console.log(`     Tried: ${uf.attemptedNames.join(', ')}\n`);
      });
    }

    // Save mapping to file for use by cache enrichment functions
    const mappingPath = path.join(__dirname, '../data/field-mapping.json');
    fs.writeFileSync(mappingPath, JSON.stringify({
      mappedFields: fieldMapping,
      unmappedFields: unmappedFields,
      sheetName: sheetName,
      analyzedAt: new Date().toISOString()
    }, null, 2));

    console.log(`✅ Field mapping saved to: ${mappingPath}\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('❌ Error:', e.message, '\n');
    if (e.stack) {
      console.log('Stack:', e.stack);
    }
  }
}

analyzeColumns().catch(console.error);
