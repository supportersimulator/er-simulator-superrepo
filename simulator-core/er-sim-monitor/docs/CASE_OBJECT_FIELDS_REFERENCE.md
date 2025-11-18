# Complete Case Object Fields Reference

## Overview
Case objects in the ER Simulator system are defined by Google Sheets columns that map to a two-tier header structure (Tier 1: Category, Tier 2: Field Name). When accessed via APIs and scripts, fields are referenced using the format: `Category:Field_Name` or `Category_Field_Name` depending on the system.

## Core Field Categories

### 1. Case_Organization (Organization & Identification)
- **Case_ID**: Unique identifier (format: CATEGORY#### e.g., CARD0001)
- **Spark_Title**: Patient presentation teaser (mystery mode - no diagnosis)
- **Reveal_Title**: Actual diagnosis (shown after simulation)
- **Case_Series_Name**: Grouping/pathway name
- **Case_Series_Order**: Sequence number in series
- **Pathway_or_Course_Name**: Learning pathway classification
- **Difficulty_Level**: Case complexity rating
- **Original_Title**: Archive title
- **Legacy_Case_ID**: Previous system ID
- **Pre_Sim_Overview**: Mystery teaser overview (SBAR + escape room style)
- **Post_Sim_Overview**: Reinforcement overview (celebration + critical pearls)
- **Medical_Category**: System classification (CARD, RESP, NEUR, GAST, TRAU, MULT, etc.)
- **Case_Organization**: General organizational notes

### 2. Image Sync & Generation
- **Auto_Create_Image_Rows**: Boolean for auto-generation
- **Image_Row_Exists**: Current image status
- **Image_Generation_Status**: Processing state
- **Seed_Generation_Minute_Only**: Random seed (minute precision)
- **Seed_Generation_Trigger**: What initiated generation
- **AI_Image_Generation_Mode**: Mode type
- **Last_Image_Sync_Timestamp**: Last sync datetime
- **Image_CSV_Path**: Path to image data

### 3. Patient States & Configuration
- **Default_Patient_States**: Comma-separated state names (e.g., "Baseline,Worsening,Arrest,Recovery")
- **Default_Device_Profiles**: Device configuration
- **State1_Name**, **State2_Name**, **State3_Name**, **State4_Name**, **State5_Name**: Custom state names
- **State1_Expected_Actions**, **State2_Expected_Actions**, etc.: User actions for each state

### 4. Attribution & Version Control
- **Full_Attribution_Details**: Creator/source information
- **Version_Number**: Version identifier
- **Date_Developed**: Creation date
- **Last_Revision**: Latest update date
- **Developers**: Developer names
- **Institution_or_Affiliation**: Organization
- **License_Type**: License classification
- **License_Link**: License URL
- **Post_URL**: Publication URL
- **Post_Author**: Author name
- **Post_Published_Date**: Publication date

### 5. Educational Content
- **Educational_Goal**: High-level learning objective
- **Why_It_Matters**: Clinical relevance
- **Clinical_Vignette**: Patient story
- **Case_Summary_Concise**: Brief summary
- **CME_Learning_Objective**: CME-specific learning goal
- **Quiz_Q1**: Assessment question
- **Quiz_A1_Correct**, **Quiz_A1_Alt1**, **Quiz_A1_Alt2**, **Quiz_A1_Alt3**: Quiz answers/alternatives
- **CME_Reference_Links**: Educational reference URLs

### 6. Environment Details (Situation_and_Environment_Details)
- **Environment_Type**: Setting type (ED, OR, ICU, etc.)
- **Environment_Description_for_AI_Image**: Detailed description
- **Time_of_Day**: Time setting
- **Lighting_Mood**: Ambient lighting description
- **Ambient_Sounds**: Sound environment
- **Initial_Image_Prompt**: AI image generation prompt
- **Available_Supplies_&_Equipment**: Resources available
- **Triage_or_SBAR_Note**: Initial handoff note
- **Initial_Monitoring_Status**: Starting monitor status
- **Consult_Services**: Available consultants
- **Disposition_Plan**: Expected clinical pathway
- **Deterioration_Timers**: Time pressure parameters
- **Contraindicated_or_Unavailable_Tests**: Unavailable interventions
- **Media_Availability_Notes**: Media constraints

### 7. Patient Demographics (Patient_Demographics_and_Clinical_Data)
- **Patient_Name**: Name
- **Age**: Numeric age
- **Gender**: Male/Female/Other
- **Weight_kg**: Weight in kilograms
- **Height_cm**: Height in centimeters
- **Presenting_Complaint**: Chief complaint
- **Past_Medical_History**: Medical history
- **Current_Medications**: Active medications
- **Allergies**: Known allergies
- **Social_History**: Social/living situation
- **Initial_GCS**: Glasgow Coma Scale
- **Initial_Rhythm**: Starting ECG rhythm
- **Exam_Positive_Findings**: Abnormal exam findings
- **Exam_Negative_Findings**: Normal exam findings
- **Initial_Patient_Voice_Tone**: Voice characteristics

### 8. Patient Communication
- **Essential_Info_Shown_Immediately**: Auto-displayed information
- **Hidden_Info_On_Request**: Information revealed on request
- **RN_Script**: Nurse dialogue
- **Patient_Script**: Patient dialogue
- **Voice_Tone_Descriptors**: Voice characteristics
- **AI_Trigger_Keywords**: Keywords for AI interaction
- **Decision_Nodes_JSON**: Branching logic structure
- **AI_Response_Tiers**: Response complexity levels
- **Branching_Notes**: Pathway notes

### 9. Monitor Vital Signs (Monitor_Vital_Signs)
Vital sign objects for each state:
- **Initial_Vitals**: Starting patient vitals
- **State1_Vitals**: First state vitals
- **State2_Vitals**: Second state vitals
- **State3_Vitals**: Third state vitals
- **State4_Vitals**: Fourth state vitals
- **State5_Vitals**: Fifth state vitals

Each vitals object contains:
```json
{
  "hr": 98,                    // Heart rate
  "bp": { "sys": 128, "dia": 82 }, // Blood pressure
  "rr": 19,                    // Respiratory rate
  "temp": 36.8,                // Temperature
  "spo2": 95,                  // Oxygen saturation
  "etco2": 34,                 // End-tidal CO2 (optional)
  "waveform": "sinus_ecg",     // ECG waveform type
  "lastupdated": "2025-11-03T05:01:35.888Z" // ISO timestamp
}
```

**Waveform Types** (Universal Naming Standard with _ecg suffix):
- `sinus_ecg` - Normal Sinus Rhythm
- `afib_ecg` - Atrial Fibrillation
- `aflutter_ecg` - Atrial Flutter
- `svt_ecg` - Supraventricular Tachycardia
- `vtach_ecg` - Ventricular Tachycardia
- `vfib_ecg` - Ventricular Fibrillation
- `asystole_ecg` - Asystole (Flatline)
- `paced_ecg` - Paced Rhythm
- `junctional_ecg` - Junctional Rhythm
- `bigeminy_ecg` - Ventricular Bigeminy
- `trigeminy_ecg` - Ventricular Trigeminy
- `idioventricular_ecg` - Idioventricular Rhythm
- `torsades_ecg` - Torsades de Pointes
- `peapulseless_ecg` - Pulseless Electrical Activity
- `artifact_ecg` - Artifact / Noise

### 10. Vitals Format & Integration
- **Vitals_Format**: Format specification (JSON)
- **Vitals_API_Target**: API endpoint
- **Vitals_Update_Frequency**: Update interval

### 11. Media & Learning Resources
**For each media slot (1-19):**
- **Media_Type N**: Category
- **Media_Title N**: Display name
- **Media_URL N**: Resource URL
- **Media_Interpretation N**: How to interpret
- **Availability_Status media title N**: Available/unavailable status

### 12. Quality & Validation
- **Conversion_Status**: Conversion state (Converted, In Progress, etc.)
- **Reviewer_Name**: QA reviewer
- **Last_AI_Test_Date**: Latest test date
- **Misc Data**: Miscellaneous notes
- **Developer_Notes**: Internal notes
- **AI_Reflection_and_Suggestions**: AI improvement suggestions
- **Simulation_Quality_Score**: Quality rating (1-10)
- **Simulation_Enhancement_Suggestions**: Improvement ideas
- **Input_Hash**: Data integrity hash

## Field Access Patterns

### In Google Sheets (Tier1:Tier2 Format)
```
Case_Organization:Case_ID
Patient_Demographics_and_Clinical_Data:Age
Monitor_Vital_Signs:Initial_Vitals
Situation_and_Environment_Details:Disposition_Plan
```

### In Apps Script (Merged Header Format)
```javascript
buildCaseObject(headers, row) returns:
{
  'Case_Organization:Case_ID': 'CARD0001',
  'Case_Organization:Spark_Title': 'Patient with chest pain',
  'Patient_Demographics_and_Clinical_Data:Age': 55,
  'Monitor_Vital_Signs:Initial_Vitals': '{"hr": 98, "bp": {"sys": 128, "dia": 82}, ...}',
  // ... all merged fields
}
```

### In Google Sheets Row 2 Headers
```
Case_Organization_Case_ID
Case_Organization_Spark_Title
Patient_Demographics_and_Clinical_Data_Age
Monitor_Vital_Signs_Initial_Vitals
```

## Critical Field Groupings

### For Display/Case Selection
- `caseId` (Case_Organization:Case_ID)
- `sparkTitle` (Case_Organization:Spark_Title)
- `revealTitle` (Case_Organization:Reveal_Title)
- `category` (Case_Organization:Medical_Category)
- `difficulty` (Case_Organization:Difficulty_Level)
- `pathwayName` (Case_Organization:Pathway_or_Course_Name)

### For Simulation Execution
- `Initial_Vitals` through `State5_Vitals` (Monitor_Vital_Signs)
- `Default_Patient_States` (State configuration)
- `State1_Name` through `State5_Name` (Custom state labels)

### For Learning Experience
- `preSimOverview` (Case_Organization:Pre_Sim_Overview)
- `postSimOverview` (Case_Organization:Post_Sim_Overview)
- `Educational_Goal`, `Why_It_Matters`, `Clinical_Vignette`
- `CME_Learning_Objective`, Quiz fields

### For AI Generation
- `sparkTitle`, `revealTitle`, `Medical_Category`, `Environment_Type`
- `Time_of_Day`, `Lighting_Mood`, `Ambient_Sounds`
- `Initial_Image_Prompt`

### For Patient Communication
- `Patient_Name`, `Age`, `Gender`, `Presenting_Complaint`
- `Essential_Info_Shown_Immediately`, `Hidden_Info_On_Request`
- `RN_Script`, `Patient_Script`, `Voice_Tone_Descriptors`

## Total Field Count
Approximately 400+ columns in the full sheet, organized into ~15 category groups

## Example Case Object (Complete)
```javascript
{
  "Case_Organization:Case_ID": "CARD0001",
  "Case_Organization:Spark_Title": "55M with crushing chest pain",
  "Case_Organization:Reveal_Title": "Acute Myocardial Infarction (Inferior MI)",
  "Case_Organization:Medical_Category": "CARD",
  "Case_Organization:Pathway_or_Course_Name": "Cardiac Mastery Foundations",
  "Case_Organization:Difficulty_Level": "8/15",
  "Case_Organization:Pre_Sim_Overview": "{...mystery teaser JSON...}",
  "Case_Organization:Post_Sim_Overview": "{...celebration + pearls JSON...}",
  
  "Patient_Demographics_and_Clinical_Data:Patient_Name": "John",
  "Patient_Demographics_and_Clinical_Data:Age": 55,
  "Patient_Demographics_and_Clinical_Data:Gender": "Male",
  "Patient_Demographics_and_Clinical_Data:Presenting_Complaint": "Acute chest pain",
  "Patient_Demographics_and_Clinical_Data:Initial_Rhythm": "Sinus rhythm with inferior ST elevation",
  
  "Situation_and_Environment_Details:Environment_Type": "Emergency Department",
  "Situation_and_Environment_Details:Disposition_Plan": "Catheterization lab for PCI",
  
  "Monitor_Vital_Signs:Initial_Vitals": "{\"hr\": 98, \"bp\": {\"sys\": 128, \"dia\": 82}, \"rr\": 19, \"temp\": 36.8, \"spo2\": 95, \"etco2\": 34, \"waveform\": \"sinus_ecg\", \"lastupdated\": \"2025-11-03T05:01:35Z\"}",
  "Monitor_Vital_Signs:State1_Vitals": "{\"hr\": 110, \"bp\": {\"sys\": 100, \"dia\": 70}, ...}",
  "Monitor_Vital_Signs:State2_Vitals": "{...worsening state...}",
  
  "image sync:Default_Patient_States": "Baseline,Worsening,Arrest,Recovery",
  
  // ... 350+ more fields
}
```

