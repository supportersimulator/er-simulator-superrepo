#!/usr/bin/env node

/**
 * Create Tools Workflow Tracker Sheet in Google Sheets
 *
 * Creates a new tab: "Tools_Workflow_Tracker" with columns:
 * - Sequential Order (1, 2, 3...)
 * - Workflow Phase
 * - Tool Name
 * - Tool Description
 * - Purpose in Workflow
 * - Claude Testing Status (Pass/Fail/Untested)
 * - User Testing Status (Approved/Needs Testing/Failed)
 * - Fully Documented? (Yes/No)
 * - Backed Up on Google Drive? (Yes/No)
 * - Architecture (Standalone File/Monolithic/Hybrid)
 * - Should Be Standalone? (Yes/No)
 * - Reasoning (Why standalone or monolithic)
 * - Planned Improvements
 * - Priority (Critical/High/Medium/Low)
 * - Last Updated
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Define the chronological workflow phases and tools
const workflowPhases = [
  {
    phase: "PHASE 1: Source Material Preparation",
    description: "Convert raw source materials into structured input format",
    tools: [
      {
        name: "ecg-to-svg-converter.html",
        description: "Convert ECG strip images to medically accurate waveforms",
        purpose: "Creates precise SVG/PNG waveforms from ECG images with 1:1 pixel preservation",
        architecture: "Standalone File",
        shouldBeStandalone: "Yes",
        reasoning: "Browser-based tool, completely independent functionality, used before any other processing"
      },
      {
        name: "migrateWaveformNaming.cjs",
        description: "Universal waveform naming migration system",
        purpose: "Ensures consistent waveform naming across entire ecosystem (vfib_ecg format)",
        architecture: "Standalone File",
        shouldBeStandalone: "Yes",
        reasoning: "One-time migration utility, may need to run independently for future waveform additions"
      },
      {
        name: "fetchVitalsFromSheetsOAuth.js",
        description: "Fetch vitals data from Google Sheets using OAuth2",
        purpose: "Pull latest scenario data from Master Scenario Convert sheet for processing",
        architecture: "Standalone File",
        shouldBeStandalone: "Yes",
        reasoning: "Reusable authentication layer, used by multiple downstream tools"
      },
      {
        name: "syncVitalsToSheets.js",
        description: "Two-way sync between vitals.json and Google Sheets",
        purpose: "Auto-fill missing waveform fields and sync back to sheet",
        architecture: "Standalone File",
        shouldBeStandalone: "Yes",
        reasoning: "Independent sync utility, may run on schedule or manually"
      }
    ]
  },
  {
    phase: "PHASE 2: Input Validation & Preparation",
    description: "Validate and prepare input data before scenario generation",
    tools: [
      {
        name: "validateVitalsJSON.cjs",
        description: "Validate vitals JSON format and structure",
        purpose: "Pre-flight check to ensure vitals data is valid before batch processing",
        architecture: "Standalone File",
        shouldBeStandalone: "Yes",
        reasoning: "Quality gate, should run independently to catch errors early"
      },
      {
        name: "Input Validation (Apps Script)",
        description: "4-column input validation (Formal_Info, HTML, DOC, Extra)",
        purpose: "Validates input rows have required content before OpenAI processing",
        architecture: "Monolithic (Code_ULTIMATE_ATSR.gs)",
        shouldBeStandalone: "No",
        reasoning: "Tightly coupled to batch processing, called inline during row processing"
      },
      {
        name: "Duplicate Detection (Apps Script)",
        description: "Content hash signature system for duplicate detection",
        purpose: "Prevents reprocessing identical input content, saves API costs",
        architecture: "Monolithic (Code_ULTIMATE_ATSR.gs)",
        shouldBeStandalone: "No",
        reasoning: "Needs access to Document Properties for hash registry, batch-engine dependent"
      }
    ]
  },
  {
    phase: "PHASE 3: Scenario Generation (OpenAI Processing)",
    description: "Generate complete simulation scenarios from input data",
    tools: [
      {
        name: "Batch Engine (Apps Script)",
        description: "Queue-based batch processing (Run All/25/Specific)",
        purpose: "Main orchestration engine for processing multiple scenarios in sequence",
        architecture: "Monolithic (Code_ULTIMATE_ATSR.gs)",
        shouldBeStandalone: "No",
        reasoning: "Core Apps Script functionality, requires UI, Properties, and Sheet access"
      },
      {
        name: "Single Case Generator (Apps Script)",
        description: "Process individual input row into complete scenario",
        purpose: "Core processing function: builds prompt, calls OpenAI, parses response",
        architecture: "Monolithic (Code_ULTIMATE_ATSR.gs)",
        shouldBeStandalone: "No",
        reasoning: "Called by Batch Engine, tightly integrated with header system and output writing"
      },
      {
        name: "addClinicalDefaults.cjs",
        description: "Apply clinical defaults to scenarios (Node.js version)",
        purpose: "Fill missing clinical fields with medically accurate defaults",
        architecture: "Standalone File",
        shouldBeStandalone: "Yes",
        reasoning: "Can run independently post-generation, useful for bulk updates"
      },
      {
        name: "Clinical Defaults (Apps Script)",
        description: "Apply clinical defaults during generation",
        purpose: "Real-time application of defaults during OpenAI response processing",
        architecture: "Monolithic (Code_ULTIMATE_ATSR.gs)",
        shouldBeStandalone: "No",
        reasoning: "Inline processing optimization, avoids second-pass corrections"
      }
    ]
  },
  {
    phase: "PHASE 4: Quality Scoring & Analysis",
    description: "Evaluate scenario quality and identify improvements",
    tools: [
      {
        name: "Quality Scoring System (Apps Script)",
        description: "0-100% weighted rubric evaluation (8 components)",
        purpose: "Automated quality assessment immediately after generation",
        architecture: "Monolithic (Code_ULTIMATE_ATSR.gs)",
        shouldBeStandalone: "Maybe",
        reasoning: "Could be standalone for post-processing audits, but efficient inline"
      },
      {
        name: "validateBatchQuality.cjs",
        description: "Batch quality validation and reporting",
        purpose: "Post-generation quality audit across all scenarios",
        architecture: "Standalone File",
        shouldBeStandalone: "Yes",
        reasoning: "Independent audit tool, run periodically or after batch completions"
      },
      {
        name: "analyzeDuplicateScenarios.cjs",
        description: "Analyze duplicate Case_IDs for actual duplicates",
        purpose: "Identify near-duplicate scenarios using media URLs and text similarity",
        architecture: "Standalone File",
        shouldBeStandalone: "Yes",
        reasoning: "Analysis tool, may run independently for cleanup operations"
      },
      {
        name: "compareDataQuality.cjs",
        description: "Compare data quality across batches",
        purpose: "Track quality trends over time, identify degradation patterns",
        architecture: "Standalone File",
        shouldBeStandalone: "Yes",
        reasoning: "Analytics tool, periodic execution for quality monitoring"
      }
    ]
  },
  {
    phase: "PHASE 5: Title & Metadata Enhancement",
    description: "Generate engaging titles and enrich metadata",
    tools: [
      {
        name: "ATSR Title Generator (Apps Script)",
        description: "Generate Spark and Reveal titles with memory tracker",
        purpose: "Create attention-grabbing titles with 10-motif memory to avoid repetition",
        architecture: "Monolithic (Code_ULTIMATE_ATSR.gs)",
        shouldBeStandalone: "No",
        reasoning: "Uses Script Properties for memory, integrated with Sheet UI for Keep/Regenerate"
      },
      {
        name: "Case Summary Enhancer (Apps Script)",
        description: "Auto-bold Dx/Intervention/Takeaway in summaries",
        purpose: "Format case summaries for readability and emphasis",
        architecture: "Monolithic (Code_ULTIMATE_ATSR.gs)",
        shouldBeStandalone: "No",
        reasoning: "Post-processing formatter, could be standalone but efficient inline"
      },
      {
        name: "addCategoryColumn.cjs",
        description: "Add category classification column",
        purpose: "Classify scenarios by medical specialty category",
        architecture: "Standalone File",
        shouldBeStandalone: "Yes",
        reasoning: "Metadata enrichment, can run independently for bulk categorization"
      },
      {
        name: "categoriesAndPathwaysTool.cjs",
        description: "Categories and learning pathways management",
        purpose: "Organize scenarios into curriculum pathways",
        architecture: "Standalone File",
        shouldBeStandalone: "Yes",
        reasoning: "Educational organization tool, used for curriculum design phase"
      }
    ]
  },
  {
    phase: "PHASE 6: Media Management & Image Sync",
    description: "Manage media URLs and image defaults",
    tools: [
      {
        name: "Image Sync Defaults Manager (Apps Script)",
        description: "Refresh and manage default image URLs per vital state",
        purpose: "Maintain consistent default images for normal/tachy/brady/hypotensive states",
        architecture: "Monolithic (Code_ULTIMATE_ATSR.gs)",
        shouldBeStandalone: "Maybe",
        reasoning: "Could be standalone for bulk image URL updates, but convenient in UI"
      },
      {
        name: "analyzeMediaURLsDetailed.cjs",
        description: "Detailed analysis of media URL usage",
        purpose: "Identify missing, broken, or duplicate media URLs across scenarios",
        architecture: "Standalone File",
        shouldBeStandalone: "Yes",
        reasoning: "Media audit tool, independent validation of media assets"
      },
      {
        name: "checkMediaURLs.cjs",
        description: "Quick media URL validation check",
        purpose: "Fast check for missing or invalid media URLs",
        architecture: "Standalone File",
        shouldBeStandalone: "Yes",
        reasoning: "Quality gate, can run before deployment"
      }
    ]
  },
  {
    phase: "PHASE 7: Batch Reports & Monitoring",
    description: "Track batch processing statistics and costs",
    tools: [
      {
        name: "Batch Reports (Apps Script)",
        description: "Generate batch processing summaries",
        purpose: "Track Created/Skipped/Duplicates/Errors/Cost/Elapsed time per batch",
        architecture: "Monolithic (Code_ULTIMATE_ATSR.gs)",
        shouldBeStandalone: "No",
        reasoning: "Integrated reporting, writes to Batch_Reports sheet during execution"
      },
      {
        name: "Live Logs Panel (Apps Script)",
        description: "Real-time log viewing with auto-refresh",
        purpose: "Monitor batch processing progress in real-time via sidebar",
        architecture: "Monolithic (Code_ULTIMATE_ATSR.gs)",
        shouldBeStandalone: "No",
        reasoning: "UI component, requires Apps Script sidebar and Document Properties"
      },
      {
        name: "batchStatusSummary.cjs",
        description: "Batch status summary reporting",
        purpose: "External summary of batch processing status across multiple runs",
        architecture: "Standalone File",
        shouldBeStandalone: "Yes",
        reasoning: "Analytics tool, can run independently for historical analysis"
      },
      {
        name: "checkBatchStatus.cjs",
        description: "Check current batch processing status",
        purpose: "Query batch queue state and progress from external script",
        architecture: "Standalone File",
        shouldBeStandalone: "Yes",
        reasoning: "External monitoring tool, useful for automation/CI/CD pipelines"
      }
    ]
  },
  {
    phase: "PHASE 8: Backup & Version Control",
    description: "Backup critical data and code versions",
    tools: [
      {
        name: "backupMetadata.cjs",
        description: "Backup scenario metadata to JSON",
        purpose: "Create point-in-time snapshot of all scenario metadata",
        architecture: "Standalone File",
        shouldBeStandalone: "Yes",
        reasoning: "Data protection, should run independently on schedule"
      },
      {
        name: "backupToGoogleDrive.cjs",
        description: "Automated backup to Google Drive",
        purpose: "Upload backups to organized Google Drive folder structure",
        architecture: "Standalone File",
        shouldBeStandalone: "Yes",
        reasoning: "Cloud backup integration, independent scheduled job"
      },
      {
        name: "compareBackups.cjs",
        description: "Compare two backup snapshots for differences",
        purpose: "Identify what changed between backup versions",
        architecture: "Standalone File",
        shouldBeStandalone: "Yes",
        reasoning: "Diff utility, used for auditing and rollback decisions"
      },
      {
        name: "restoreMetadata.cjs",
        description: "Restore scenario metadata from backup",
        purpose: "Rollback to previous backup if corruption or errors occur",
        architecture: "Standalone File",
        shouldBeStandalone: "Yes",
        reasoning: "Recovery tool, critical for disaster recovery"
      }
    ]
  },
  {
    phase: "PHASE 9: Deployment & Distribution",
    description: "Deploy code to Apps Script and distribute scenarios",
    tools: [
      {
        name: "deployAppsScript.cjs",
        description: "Deploy Code_ULTIMATE_ATSR.gs to Google Apps Script",
        purpose: "Push local code changes to live Apps Script project",
        architecture: "Standalone File",
        shouldBeStandalone: "Yes",
        reasoning: "Deployment automation, should be independent CI/CD tool"
      },
      {
        name: "deployATSR.cjs",
        description: "Deploy ATSR configuration",
        purpose: "Specific ATSR title generator deployment",
        architecture: "Standalone File",
        shouldBeStandalone: "Yes",
        reasoning: "Modular deployment, may deploy ATSR independently of full system"
      },
      {
        name: "deployCategoriesPanel.cjs",
        description: "Deploy Categories & Pathways Panel",
        purpose: "Deploy UI panel for category/pathway management",
        architecture: "Standalone File",
        shouldBeStandalone: "Yes",
        reasoning: "UI component deployment, separate from core processing"
      },
      {
        name: "deployWebApp.cjs",
        description: "Deploy as Google Apps Script Web App",
        purpose: "Enable HTTP endpoint for external API access",
        architecture: "Standalone File",
        shouldBeStandalone: "Yes",
        reasoning: "Web service deployment, independent infrastructure setup"
      }
    ]
  },
  {
    phase: "PHASE 10: Testing & Validation",
    description: "Validate system functionality and data integrity",
    tools: [
      {
        name: "API Status Checker (Apps Script)",
        description: "Quick OpenAI API connectivity test",
        purpose: "Verify API key and endpoint accessibility before batch runs",
        architecture: "Monolithic (Code_ULTIMATE_ATSR.gs)",
        shouldBeStandalone: "No",
        reasoning: "Pre-flight check, integrated into UI for convenience"
      },
      {
        name: "validateSystemIntegrity.cjs",
        description: "System-wide integrity validation",
        purpose: "Comprehensive check of all system components and data consistency",
        architecture: "Standalone File",
        shouldBeStandalone: "Yes",
        reasoning: "Holistic health check, independent diagnostic tool"
      },
      {
        name: "testBatchProcessing.cjs",
        description: "Test batch processing functionality",
        purpose: "Integration test for batch engine and processing pipeline",
        architecture: "Standalone File",
        shouldBeStandalone: "Yes",
        reasoning: "Automated testing, part of CI/CD suite"
      },
      {
        name: "verifyBatchTool.cjs",
        description: "Verify batch processing tool functionality",
        purpose: "Validate batch queue management and state persistence",
        architecture: "Standalone File",
        shouldBeStandalone: "Yes",
        reasoning: "Test utility, runs independently for validation"
      }
    ]
  },
  {
    phase: "PHASE 11: Analytics & Dashboards",
    description: "Generate insights and visualization dashboards",
    tools: [
      {
        name: "generateDashboard.cjs",
        description: "Generate HTML dashboard of scenario statistics",
        purpose: "Visual overview of scenario library metrics and trends",
        architecture: "Standalone File",
        shouldBeStandalone: "Yes",
        reasoning: "Reporting tool, generates static HTML for viewing"
      },
      {
        name: "interactiveDashboard.cjs",
        description: "Interactive dashboard with filtering",
        purpose: "Dynamic dashboard with real-time filtering and drill-down",
        architecture: "Standalone File",
        shouldBeStandalone: "Yes",
        reasoning: "Advanced analytics UI, independent web application"
      },
      {
        name: "exportDashboardData.cjs",
        description: "Export dashboard data to CSV/JSON",
        purpose: "Extract analytics data for external analysis or archival",
        architecture: "Standalone File",
        shouldBeStandalone: "Yes",
        reasoning: "Data export utility, used for external reporting"
      },
      {
        name: "analyzePathwayNames.cjs",
        description: "Analyze learning pathway naming patterns",
        purpose: "Identify pathway naming inconsistencies and suggest consolidation",
        architecture: "Standalone File",
        shouldBeStandalone: "Yes",
        reasoning: "Content analysis, used for curriculum cleanup"
      }
    ]
  },
  {
    phase: "PHASE 12: Optimization & Maintenance",
    description: "Ongoing optimization and system maintenance",
    tools: [
      {
        name: "Header Cache System (Apps Script)",
        description: "Two-tier header caching for performance",
        purpose: "40x speedup for column lookups during batch processing",
        architecture: "Monolithic (Code_ULTIMATE_ATSR.gs)",
        shouldBeStandalone: "No",
        reasoning: "Performance optimization, tightly integrated with Sheet access"
      },
      {
        name: "Property Management (Apps Script)",
        description: "Script/Document Properties management",
        purpose: "Persistent storage across sessions for API keys, cache, state",
        architecture: "Monolithic (Code_ULTIMATE_ATSR.gs)",
        shouldBeStandalone: "No",
        reasoning: "Core infrastructure, used by all Apps Script components"
      },
      {
        name: "consolidatePathways.cjs",
        description: "Consolidate duplicate pathway names",
        purpose: "Merge duplicate pathways with different naming variations",
        architecture: "Standalone File",
        shouldBeStandalone: "Yes",
        reasoning: "Maintenance utility, periodic cleanup operations"
      },
      {
        name: "autoFlagFoundationalCases.cjs",
        description: "Auto-flag foundational cases based on criteria",
        purpose: "Identify high-priority educational scenarios for curriculum",
        architecture: "Standalone File",
        shouldBeStandalone: "Yes",
        reasoning: "Content curation, can run independently for bulk flagging"
      }
    ]
  }
];

async function createToolsWorkflowSheet() {
  console.log('\n📊 CREATING TOOLS WORKFLOW TRACKER SHEET\n');

  // Load credentials
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const tokenPath = path.join(__dirname, '../config/token.json');

  if (!fs.existsSync(credentialsPath) || !fs.existsSync(tokenPath)) {
    console.error('❌ Missing credentials or token');
    process.exit(1);
  }

  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

  const { client_id, client_secret } = credentials.installed || credentials.web;
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, 'http://localhost');
  oauth2Client.setCredentials(token);

  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

  // Get spreadsheet ID from .env or config
  const SHEET_ID = process.env.GOOGLE_SHEET_ID || '1xZ7YKmF-z9Ygf9r3mmmZZjRjVJy7-hI3k8s_c6OVgL8';

  console.log('📋 Generating workflow tracker data...\n');

  // Build rows
  const rows = [];

  // Header row
  rows.push([
    'Sequential Order',
    'Workflow Phase',
    'Tool Name',
    'Tool Description',
    'Purpose in Workflow',
    'Claude Testing Status',
    'User Testing Status',
    'Fully Documented?',
    'Backed Up on Google Drive?',
    'Current Architecture',
    'Should Be Standalone?',
    'Reasoning',
    'Planned Improvements',
    'Priority',
    'Last Updated'
  ]);

  let sequentialOrder = 1;

  workflowPhases.forEach(phase => {
    phase.tools.forEach(tool => {
      rows.push([
        sequentialOrder++,
        phase.phase,
        tool.name,
        tool.description,
        tool.purpose,
        'Untested', // Claude Testing Status
        'Needs Testing', // User Testing Status
        'No', // Fully Documented (will be updated)
        'No', // Backed Up on Google Drive (will be updated)
        tool.architecture,
        tool.shouldBeStandalone,
        tool.reasoning,
        '', // Planned Improvements (user fills in)
        '', // Priority (user fills in)
        new Date().toISOString().split('T')[0] // Last Updated
      ]);
    });
  });

  console.log(`✅ Generated ${rows.length - 1} tool entries across ${workflowPhases.length} phases\n`);

  try {
    // Check if sheet exists
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
    const existingSheet = spreadsheet.data.sheets?.find(s => s.properties?.title === 'Tools_Workflow_Tracker');

    if (existingSheet) {
      console.log('⚠️  Tools_Workflow_Tracker sheet already exists - updating...');

      // Clear existing content
      await sheets.spreadsheets.values.clear({
        spreadsheetId: SHEET_ID,
        range: 'Tools_Workflow_Tracker!A:O'
      });

      // Update with new data
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: 'Tools_Workflow_Tracker!A1',
        valueInputOption: 'RAW',
        resource: { values: rows }
      });

      console.log('✅ Updated existing Tools_Workflow_Tracker sheet');
    } else {
      console.log('📝 Creating new Tools_Workflow_Tracker sheet...');

      // Create new sheet
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        resource: {
          requests: [{
            addSheet: {
              properties: {
                title: 'Tools_Workflow_Tracker',
                gridProperties: {
                  rowCount: rows.length + 10,
                  columnCount: 15,
                  frozenRowCount: 1
                }
              }
            }
          }]
        }
      });

      // Write data
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: 'Tools_Workflow_Tracker!A1',
        valueInputOption: 'RAW',
        resource: { values: rows }
      });

      console.log('✅ Created Tools_Workflow_Tracker sheet with data');
    }

    // Format header row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      resource: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: (await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID }))
                  .data.sheets?.find(s => s.properties?.title === 'Tools_Workflow_Tracker')
                  ?.properties?.sheetId,
                startRowIndex: 0,
                endRowIndex: 1
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.2, green: 0.3, blue: 0.5 },
                  textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                  horizontalAlignment: 'CENTER'
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
            }
          }
        ]
      }
    });

    console.log('\n✅ Sheet formatting applied');
    console.log('\n📊 SUMMARY:');
    console.log(`   Total Tools: ${rows.length - 1}`);
    console.log(`   Workflow Phases: ${workflowPhases.length}`);
    console.log(`   Sheet: Tools_Workflow_Tracker`);
    console.log('\n🔗 View at:');
    console.log(`   https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=0`);
    console.log('');

  } catch (error) {
    console.error('❌ Error creating sheet:', error.message);
    throw error;
  }
}

createToolsWorkflowSheet().catch(console.error);
