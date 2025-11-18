#!/usr/bin/env node

/**
 * Build Ultimate ATSR
 *
 * Features:
 * - Wide screen (1000px+)
 * - All fields editable (text inputs with radio selection)
 * - Memory Anchors system (10 unique, memorable patient identifiers)
 * - Uniqueness tracking (no reuse of anchors/motifs)
 * - Save & Close / Save & Continue buttons
 * - Rich Sim Mastery prompt
 * - Light grey theme
 * - No Case_ID
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const SCRIPT_ID = '1NXjFvH2Wo117saCyqmNDfCqZ1iQ9vykxa0-kHUhFAYDuhthgql5Ru_P6';
const BASE_PATH = path.join(__dirname, 'Code_RESTORED_FINAL.gs');
const OUTPUT_PATH = path.join(__dirname, 'Code_ULTIMATE_ATSR.gs');

console.log('');
console.log('════════════════════════════════════════════════════');
console.log('   🎯 BUILDING ULTIMATE ATSR');
console.log('════════════════════════════════════════════════════');
console.log('');

console.log('📖 Reading base code...');
let code = fs.readFileSync(BASE_PATH, 'utf8');

// Step 1: Enhance the prompt to include Memory Anchors
console.log('📝 Step 1: Adding Memory Anchor generation to prompt...');

const memoryAnchorPrompt = `

### 3. **Memory Anchors** (10 unique, unforgettable patient identifiers)

**Purpose**: Help clinicians remember patients the way ED doctors naturally do - by distinctive, memorable details.

**Philosophy**: ED doctors don't remember patients by medical details. They remember:
- "The tall skinny guy in overalls"
- "Lady who doesn't like to shave her legs"
- "SVT patient who's actually the sleep medicine doctor at our hospital"
- "Methadone patient with facial tattoos"
- "Kind lady holding a book"
- "Pleasant spouse who stood when I came in"

**Memory Anchor Categories & Examples**:

**A) Visual Appearance**:
- Very sweaty face (suggests MI/cardiac)
- Faded grey shirt (eye problem - grey = vision)
- Unkempt appearance with bag of clothes
- Unusual hair color/style
- Distinctive facial features
- Visible tattoos (location/theme)
- Piercings or jewelry

**B) Apparel & Accessories**:
- AC/DC shirt (heart attack - "Thunderstruck")
- BYU hat or shirt (specific college)
- Sports team jersey (Lakers, Yankees, etc.)
- Medical scrubs (works in healthcare)
- Business suit (professional)
- Vintage band t-shirt
- Designer purse/bag
- Small dog in carrier

**C) Olfactory (Smell)**:
- Pungent body odor
- Heavy perfume/cologne
- Cigarette smoke smell
- Alcohol on breath
- Fresh coffee smell

**D) Behavioral/Personality**:
- Annoyingly loud kid (AOM - ear related)
- Quiet and withdrawn
- Extremely talkative
- Constantly on phone
- Reading a specific book
- Doing crossword puzzle
- Nervous hand-wringing

**E) Family/Social Context**:
- Twin kids with patient
- Huge family of 8 in the room
- Daughter is an ER nurse (specify specialty)
- Son translating (language barrier)
- Service dog present
- Worried spouse holding hand
- Teenager rolling eyes

**F) Occupation Clues**:
- Carpenter (sawdust on clothes)
- Teacher (grading papers)
- Chef (kitchen burns on hands)
- Nurse (works at same hospital)
- Construction worker (hard hat)

**G) Contextual/Situational**:
- Came directly from gym
- Still in pajamas at 3pm
- Wearing hiking gear
- Wedding ring tan line (divorced)
- Military uniform/veteran

**Rules for Memory Anchors**:
1. **Highly specific**: "BYU baseball cap" not "wearing a hat"
2. **Memorable**: Strong visual/sensory detail
3. **Diverse**: Mix categories (visual, smell, behavior, context)
4. **Stereotype-aware**: Use stereotypes clinicians naturally use (tall, unkempt, loud, etc.)
5. **Case-linked when possible**: Sweaty for MI, loud kid for AOM, eye-related for vision problems
6. **Personality-rich**: Kind, pleasant, annoying, withdrawn, talkative
7. **Unique per patient**: NO reuse of anchors across cases
8. **Culturally varied**: Different ethnicities, backgrounds, professions
9. **Medically neutral**: NOT about the diagnosis itself
10. **Unforgettable**: Would make you say "Oh yeah, I remember that patient!"

**Examples of STRONG Memory Anchors**:
✅ "Very sweaty face, pale, clutching chest (looks terrified)"
✅ "Wearing AC/DC 'Thunderstruck' t-shirt (ironic for heart attack)"
✅ "Annoyingly loud 3-year-old screaming in corner (mom exhausted)"
✅ "Pleasant elderly man who stood up to shake my hand despite pain"
✅ "Strong smell of cigarette smoke, stained fingers, chronic cough"
✅ "Daughter is an ICU nurse at University Hospital (knows too much)"
✅ "Huge family of 8 people crowding the room (need to kick some out)"
✅ "Small yappy dog in designer purse (patient refuses to leave it)"
✅ "Wearing faded grey shirt (ironic for vision complaint)"
✅ "BYU baseball cap, clearly a die-hard fan (talking about game)"

**Examples of WEAK Memory Anchors** (avoid these):
❌ "Middle-aged male"
❌ "Overweight"
❌ "Has diabetes"
❌ "Chest pain patient"
❌ "Anxious"

**Output Format**:
Provide 10 Memory Anchors that:
- Are ALL different categories/types
- Are ALL unforgettable
- Are ALL specific and vivid
- Avoid reusing any motifs from: \${usedMemory}
- Avoid duplicating anything in existing data: \${allText}

**Quality Check**:
- Would an ED doctor remember this patient by this detail? ✅
- Is it vivid enough to picture in your mind? ✅
- Is it different from the other 9 anchors? ✅
- Does it add personality to the encounter? ✅

---
`;

// Find where to insert Memory Anchors in the prompt
const insertAfterReveal = code.indexOf('### 3. **Case Summary**');
if (insertAfterReveal !== -1) {
  const before = code.substring(0, insertAfterReveal);
  const after = code.substring(insertAfterReveal).replace('### 3. **Case Summary**', '### 4. **Case Summary**');
  code = before + memoryAnchorPrompt + after;
  console.log('   ✅ Added Memory Anchor prompt');
}

// Step 2: Update JSON output format to include Memory Anchors
console.log('📝 Step 2: Adding Memory Anchors to output format...');

code = code.replace(
  /Output JSON:\s*\{[\s\S]*?"Case_Summary":/,
  `Output JSON:
{
  "Spark_Titles": ["...x5"],
  "Reveal_Titles": ["...x5"],
  "Memory_Anchors": ["...x10"],
  "Case_Summary":`
);

// Step 3: Build the ultimate UI with editable fields and wider screen
console.log('📝 Step 3: Creating ultimate UI...');

const ultimateUI = `
function buildATSRUltimateUI_(row, parsed, keepSelections) {
  // Helper: Create editable radio options with text input
  const makeEditable = (vals, name, label) => \`
    <div class="section">
      <h3>\${label}</h3>
      <div class="options">
        \${vals.map((v,i)=>\`
          <div class="option-row">
            <input type="radio" name="\${name}" value="\${i}" id="\${name}_\${i}" \${(keepSelections && i===0)?'checked':''}>
            <input type="text" id="\${name}_text_\${i}" value="\${String(v).replace(/"/g,'&quot;')}" class="edit-field">
          </div>
        \`).join('')}
        <div class="option-row no-change">
          <input type="radio" name="\${name}" value="nochange" id="\${name}_nochange">
          <label for="\${name}_nochange">🟦 No Change (keep current)</label>
        </div>
      </div>
    </div>
  \`;

  const ps = parsed.Case_Summary?.Patient_Summary || 'A patient was evaluated and managed for an acute condition requiring urgent care.';
  const ki = parsed.Case_Summary?.Key_Intervention || 'N/A';
  const ct = parsed.Case_Summary?.Core_Takeaway || 'N/A';

  return \`
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      * { box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
        margin: 0;
        background: #f5f7fa;
        color: #2c3e50;
        font-size: 14px;
      }
      .header {
        background: #e8edf2;
        border-bottom: 2px solid #cbd5e0;
        padding: 16px 20px;
        position: sticky;
        top: 0;
        z-index: 100;
      }
      .header h1 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: #1a202c;
      }
      .container {
        padding: 20px;
        max-width: 1400px;
        margin: 0 auto;
      }
      .summary-card {
        background: #ffffff;
        border: 1px solid #cbd5e0;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 20px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      .summary-card h2 {
        margin: 0 0 12px 0;
        font-size: 18px;
        color: #1a202c;
        font-weight: 600;
      }
      .summary-text {
        font-size: 15px;
        line-height: 1.6;
        color: #2d3748;
        margin-bottom: 16px;
      }
      .summary-details {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        padding: 16px;
        background: #f7fafc;
        border-radius: 6px;
        border-left: 4px solid #3b82f6;
      }
      .detail-item {
        font-size: 14px;
      }
      .detail-item strong {
        color: #1a202c;
        display: block;
        margin-bottom: 4px;
      }
      .grid-3 {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        margin-bottom: 20px;
      }
      .section {
        background: #ffffff;
        border: 1px solid #cbd5e0;
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      .section h3 {
        margin: 0 0 14px 0;
        font-size: 15px;
        font-weight: 600;
        color: #1a202c;
        padding-bottom: 10px;
        border-bottom: 2px solid #e2e8f0;
      }
      .options {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .option-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px;
        border-radius: 6px;
        transition: background 0.2s;
      }
      .option-row:hover {
        background: #f7fafc;
      }
      .option-row.no-change {
        margin-top: 8px;
        padding-top: 12px;
        border-top: 1px solid #e2e8f0;
      }
      .option-row input[type="radio"] {
        flex-shrink: 0;
        width: 18px;
        height: 18px;
        cursor: pointer;
      }
      .edit-field {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #cbd5e0;
        border-radius: 6px;
        font-size: 13px;
        background: #ffffff;
        color: #2c3e50;
        transition: border-color 0.2s, box-shadow 0.2s;
      }
      .edit-field:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      .actions {
        background: #ffffff;
        border: 1px solid #cbd5e0;
        border-radius: 8px;
        padding: 20px;
        display: flex;
        gap: 12px;
        justify-content: center;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      button {
        padding: 12px 24px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }
      .btn-primary {
        background: #3b82f6;
        color: white;
      }
      .btn-primary:hover {
        background: #2563eb;
        transform: translateY(-1px);
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      }
      .btn-secondary {
        background: #10b981;
        color: white;
      }
      .btn-secondary:hover {
        background: #059669;
        transform: translateY(-1px);
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      }
      .btn-tertiary {
        background: #6366f1;
        color: white;
      }
      .btn-tertiary:hover {
        background: #4f46e5;
        transform: translateY(-1px);
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      }
      .btn-close {
        background: #e2e8f0;
        color: #475569;
      }
      .btn-close:hover {
        background: #cbd5e0;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>✨ ATSR — Titles, Summary & Memory Anchors (Row \${row})</h1>
    </div>

    <div class="container">
      <div class="summary-card">
        <h2>🩺 Case Summary</h2>
        <div class="summary-text">\${ps}</div>
        <div class="summary-details">
          <div class="detail-item">
            <strong>🎯 Key Intervention</strong>
            \${ki}
          </div>
          <div class="detail-item">
            <strong>💡 Core Takeaway</strong>
            \${ct}
          </div>
        </div>
      </div>

      <div class="grid-3">
        \${makeEditable(parsed.Spark_Titles||[], 'spark', '🔥 Spark Titles (Pre-Sim Mystery)')}
        \${makeEditable(parsed.Reveal_Titles||[], 'reveal', '💎 Reveal Titles (Post-Sim Learning)')}
        \${makeEditable(parsed.Memory_Anchors||[], 'anchor', '🎭 Memory Anchors (Unforgettable Patient Details)')}
      </div>

      <div class="actions">
        <button class="btn-primary" onclick="apply(false)">✅ Save & Close</button>
        <button class="btn-secondary" onclick="apply(true)">⏭️ Save & Continue</button>
        <button class="btn-tertiary" onclick="keepRegen()">🔁 Keep & Regenerate</button>
        <button class="btn-close" onclick="google.script.host.close()">❌ Close</button>
      </div>
    </div>

    <script>
      function getTxt(name) {
        const selected = document.querySelector('input[name="'+name+'"]:checked');
        if (!selected || selected.value === 'nochange') return 'nochange';
        const idx = selected.value;
        const textField = document.getElementById(name+'_text_'+idx);
        return textField ? textField.value : 'nochange';
      }

      function apply(continueNext) {
        const data = {
          spark: getTxt('spark'),
          reveal: getTxt('reveal'),
          anchor: getTxt('anchor'),
          continueNext: continueNext
        };
        google.script.run
          .withSuccessHandler(()=>{
            if(continueNext) {
              google.script.run.runATSRTitleGenerator(\${row+1}, true);
            } else {
              google.script.host.close();
            }
          })
          .saveATSRData(\${row}, data);
      }

      function keepRegen() {
        google.script.host.close();
        google.script.run.runATSRTitleGenerator(\${row}, true);
      }
    </script>
  </body>
  </html>
  \`;
}
`;

// Replace the existing UI builder
const uiBuilderStart = code.indexOf('function buildATSRPanelDark_');
if (uiBuilderStart !== -1) {
  const nextFunctionStart = code.indexOf('\nfunction ', uiBuilderStart + 10);
  const before = code.substring(0, uiBuilderStart);
  const after = code.substring(nextFunctionStart);
  code = before + ultimateUI + after;
  console.log('   ✅ Created ultimate UI');
}

// Update the call to the UI builder
code = code.replace(/buildATSRPanelDark_/g, 'buildATSRUltimateUI_');

// Update modal size
code = code.replace(/\.setWidth\(860\)\.setHeight\(820\)/, '.setWidth(1400).setHeight(900)');

// Step 4: Add saveATSRData function
console.log('📝 Step 4: Adding save function with uniqueness tracking...');

const saveFunction = `

function saveATSRData(row, data) {
  const ss = SpreadsheetApp.getActive();
  const sheet = pickMasterSheet_();
  if (!sheet) return;

  const headers = sheet.getRange(2,1,1,sheet.getLastColumn()).getValues()[0];

  const setCell = (colName, value) => {
    const colIdx = headers.indexOf(colName);
    if (colIdx === -1) return;
    if (value !== 'nochange') {
      sheet.getRange(row, colIdx + 1).setValue(value);
    }
  };

  // Save selected values
  setCell('Case_Organization:Spark_Title', data.spark);
  setCell('Case_Organization:Reveal_Title', data.reveal);
  setCell('Case_Organization:Memory_Anchor', data.anchor);

  // Track used memory anchors for uniqueness
  if (data.anchor !== 'nochange') {
    const usedMemory = getProp(SP_KEYS.USED_MEMORY_ANCHORS, '');
    const newUsed = usedMemory + ' | ' + data.anchor;
    setProp(SP_KEYS.USED_MEMORY_ANCHORS, newUsed.substring(0, 5000)); // Keep last 5000 chars
  }
}
`;

const onOpenIdx = code.indexOf('function onOpen()');
if (onOpenIdx !== -1) {
  const before = code.substring(0, onOpenIdx);
  const after = code.substring(onOpenIdx);
  code = before + saveFunction + '\n' + after;
  console.log('   ✅ Added save function');
}

// Step 5: Add memory anchor property key
code = code.replace(
  /const SP_KEYS = \{/,
  `const SP_KEYS = {
  USED_MEMORY_ANCHORS: 'used_memory_anchors',`
);

// Save
fs.writeFileSync(OUTPUT_PATH, code);
console.log('');
console.log(`💾 Saved to: ${OUTPUT_PATH}`);
console.log(`📊 Size: ${code.length} characters`);
console.log('');

// Deploy
console.log('🚀 Step 5: Deploying to Google Sheets...');

async function deploy() {
  console.log('🔐 Authenticating...');
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const {client_id, client_secret, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const tokenPath = path.join(__dirname, '../config/token.json');
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  oAuth2Client.setCredentials(token);
  console.log('   ✅ Authenticated');

  const script = google.script({version: 'v1', auth: oAuth2Client});

  console.log('📥 Fetching current project...');
  const project = await script.projects.getContent({scriptId: SCRIPT_ID});
  console.log(`   ✅ Found ${project.data.files.length} files`);

  const updatedFiles = project.data.files.map(file => {
    if (file.name === 'Code') {
      return { name: file.name, type: file.type, source: code };
    }
    return file;
  });

  console.log('⬆️  Pushing changes...');
  await script.projects.updateContent({
    scriptId: SCRIPT_ID,
    requestBody: { files: updatedFiles }
  });

  console.log('   ✅ Deployment complete!');
  console.log('');

  console.log('════════════════════════════════════════════════════');
  console.log('✅ ULTIMATE ATSR DEPLOYED');
  console.log('════════════════════════════════════════════════════');
  console.log('');

  console.log('📋 Features:');
  console.log('   ✅ Wide screen (1400px) for better visibility');
  console.log('   ✅ All fields editable (can modify before saving)');
  console.log('   ✅ Memory Anchors system (10 unique, memorable details)');
  console.log('   ✅ Uniqueness tracking (no reuse of anchors)');
  console.log('   ✅ Save & Close button');
  console.log('   ✅ Save & Continue button (loads next row)');
  console.log('   ✅ Keep & Regenerate button');
  console.log('   ✅ Rich Sim Mastery prompt');
  console.log('   ✅ Light grey theme');
  console.log('   ❌ NO Case_ID');
  console.log('');

  console.log('🧪 Test it now:');
  console.log('   1. Open Google Sheet');
  console.log('   2. Refresh page (Cmd+R)');
  console.log('   3. Click: 🧠 Sim Builder → ATSR');
  console.log('   4. See wide screen with 3 editable panels!');
  console.log('   5. Memory Anchors should be unique and vivid!');
  console.log('');
}

deploy().catch(err => {
  console.error('❌ Deploy error:', err.message);
  process.exit(1);
});
