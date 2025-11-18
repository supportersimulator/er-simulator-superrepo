/**
 * ATSR Title Generator Feature - Complete
 *
 * Everything for ATSR (Automated Titles, Summary & Review Generator):
 * - Complete ATSR UI with selection interface
 * - ALL GOLDEN PROMPTS PRESERVED CHARACTER-FOR-CHARACTER
 * - OpenAI API integration
 * - Response parsing and validation
 * - User selection and memory tracking
 *
 * Common Utility Goal: Adjust all ATSR features
 *
 * External Dependencies:
 * - Core_Processing_Engine.gs (for tryParseJSON)
 *
 * Generated: 2025-11-04T18:48:41.621Z
 * Source: Code_ULTIMATE_ATSR.gs (complete feature extraction)
 */

// ==================== ATSR FEATURE ====================

// Custom menu - unified Sim Builder
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  const menu = ui.createMenu('🧠 Sim Builder');

  // Core Tools
  menu.addItem('🎨 ATSR Titles Optimizer', 'runATSRTitleGenerator');
  menu.addItem('🧩 Categories & Pathways', 'runCategoriesPathwaysPanel');

  // Future tools
  menu.addSeparator();
  // menu.addItem('🚀 Batch Processing', 'openSimSidebar');

  menu.addToUi();
}

// ========== ATSR HELPER FUNCTIONS & CONSTANTS ==========

const SP_KEYS = {
  USED_MEMORY_ANCHORS: 'used_memory_anchors',
  API_KEY: 'OPENAI_API_KEY',
  MODEL: 'OPENAI_MODEL',
  PRICE_INPUT: 'PRICE_INPUT_PER_1K',
  PRICE_OUTPUT: 'PRICE_OUTPUT_PER_1K',
  USED_MOTIFS: 'USED_CHARACTER_MOTIFS',
  HEADER_CACHE: 'HEADER_CACHE_JSON',
  IMG_SYNC_DEFAULTS: 'IMG_SYNC_DEFAULTS_JSON',
  LAST_INPUT_SHEET: 'LAST_INPUT_SHEET',
  LAST_OUTPUT_SHEET: 'LAST_OUTPUT_SHEET'
};

function getSafeUi_() {
  try {
    return SpreadsheetApp.getUi();
  } catch (e) {
    return null;
  }
}

function pickMasterSheet_() {
  const ss = SpreadsheetApp.getActive();
  // Prefer last used output
  const last = getProp(SP_KEYS.LAST_OUTPUT_SHEET, '');
  if (last) {
    const s = ss.getSheetByName(last);
    if (s) return s;
  }
  // Else prefer sheet named like Master Scenario CSV
  const m = ss.getSheets().find(sh=>/master scenario csv/i.test(sh.getName()));
  return m || ss.getActiveSheet();
}

function getProp(key, fallback) {
  const v = PropertiesService.getDocumentProperties().getProperty(key);
  return (v === null || v === undefined) ? fallback : v;
}

function setProp(key, val) {
  PropertiesService.getDocumentProperties().setProperty(key, val);
}

// Constants for OpenAI API
const DEFAULT_MODEL = 'gpt-4o';
const DEFAULT_TEMP_SINGLE = 0.7;
const MAX_TOKENS = 16000;

// API Key Management
function syncApiKeyFromSettingsSheet_() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName('Settings');
  if (!sheet) return null;

  try {
    const range = sheet.getDataRange().getValues();
    // Try KV pairs
    for (let r=0; r<range.length; r++) {
      const k = String(range[r][0]||'').trim().toUpperCase();
      const v = String(range[r][1]||'').trim();
      if (k === 'OPENAI_API_KEY' && v) {
        Logger.log('✅ Found OPENAI_API_KEY in Settings sheet');
        return v;
      }
    }
    // Fallback: B2 if row2 has "API Key" label
    const labelB2 = String(sheet.getRange(2,1).getValue()||'').toLowerCase();
    if (labelB2.includes('api')) {
      const apiKey = String(sheet.getRange(2,2).getValue()||'').trim();
      if (apiKey) {
        Logger.log('✅ Found API key in Settings!B2');
        return apiKey;
      }
    }
  } catch(e) {
    Logger.log('⚠️ Error reading Settings sheet: ' + e.message);
  }
  return null;
}

function readApiKey_() {
  // DELETE the cached key to force fresh read
  try {
    PropertiesService.getDocumentProperties().deleteProperty('OPENAI_API_KEY');
    Logger.log('🗑️ Deleted cached API key');
  } catch (e) {
    Logger.log('⚠️ Could not delete cache: ' + e.message);
  }

  // Read fresh from Settings sheet
  const fromSheet = syncApiKeyFromSettingsSheet_();
  if (fromSheet) {
    Logger.log('✅ Read fresh API key from Settings sheet');
    // DON'T cache it - keep reading fresh
    return fromSheet;
  }

  Logger.log('❌ No API key found in Settings sheet');
  return null;
}

// OpenAI API Calls
function callOpenAI(promptText, temperature) {
  const apiKey = readApiKey_();
  if (!apiKey) throw new Error('❌ Missing API key. Open Settings and save your key (or add it to the Settings sheet).');
  const model = getProp(SP_KEYS.MODEL, DEFAULT_MODEL);

  const url = 'https://api.openai.com/v1/chat/completions';
  const payload = {
    model,
    temperature: temperature ?? DEFAULT_TEMP_SINGLE,
    max_tokens: MAX_TOKENS,
    messages: [
      { role: 'system', content: 'You are a world-class simulation scenario writer and exacting data formatter.' },
      { role: 'user', content: promptText }
    ]
  };
  const options = {
    method: 'post',
    headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type':'application/json' },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const body = response.getContentText();
  const json = JSON.parse(body);
  if (!json.choices || !json.choices.length) {
    throw new Error('⚠️ OpenAI returned no choices:\n' + body);
  }
  return json.choices[0].message.content.trim();
}

// ========== 6) ATSR — Titles & Summary (Keep & Regenerate, Deselect, Memory) ==========

function runATSRTitleGenerator(continueRow, keepSelections) {
  const ss = SpreadsheetApp.getActive();
  const sheet = pickMasterSheet_();
  if (!sheet) { getSafeUi_().alert('❌ Master Scenario CSV not found.'); return; }

  let row = continueRow;
  const ui = getSafeUi_();
  if (!row) {
    const resp = ui.prompt('Enter the row number for ATSR:', ui.ButtonSet.OK_CANCEL);
    if (resp.getSelectedButton() !== ui.Button.OK) return;
    row = parseInt(resp.getResponseText(),10);
  }
  if (isNaN(row) || row < 3) { ui.alert('Row must be ≥ 3.'); return; }

  const headers = sheet.getRange(2,1,1,sheet.getLastColumn()).getValues()[0];
  const values  = sheet.getRange(row,1,1,sheet.getLastColumn()).getValues()[0];
  const data = Object.fromEntries(headers.map((h,i)=>[h, values[i]]));

  // Limit context to avoid token overflow
  const usedMemory = getProp(SP_KEYS.USED_MOTIFS,'').substring(0, 300);

  // Extract only essential fields for ATSR generation
  const age = data['Patient_Demographics_and_Clinical_Data_Age'] || '';
  const gender = data['Patient_Demographics_and_Clinical_Data_Gender'] || '';
  const presenting = data['Patient_Demographics_and_Clinical_Data_Presenting_Complaint'] || '';
  const vignette = data['Set_the_Stage_Context_Clinical_Vignette'] || '';
  const why = data['Set_the_Stage_Context_Why_It_Matters'] || '';
  const goal = data['Set_the_Stage_Context_Educational_Goal'] || '';

  const caseDataFormatted = `
Age: ${age}
Gender: ${gender}
Chief Complaint: ${presenting}
Clinical Vignette: ${vignette}
Educational Goal: ${goal}
Why It Matters: ${why}`.trim();

  // ========== ENHANCED RICH PROMPT WITH SIM MASTERY PHILOSOPHY ==========
  const prompt = `
📘 **Sim Mastery ATSR — Automated Titles, Summary & Review Generator**

You are an expert simulation designer and marketing genius helping build **Sim Mastery** — an emotionally resonant, AI-facilitated, high-fidelity emergency-medicine simulation platform.

Your task is to create compelling, clinically accurate, and emotionally engaging titles and summaries for a medical simulation case that will be used by emergency medicine clinicians to sharpen their real-time decision-making skills.

---

## 🧠 **Core Philosophy: Sim Mastery Values**

• **Emotionally Resonant**: Help learners *feel* what it's like to manage chaos and experience triumph
• **Clinically Sound**: Every detail must be medically accurate and educationally valuable
• **Narratively Immersive**: Create intrigue, tension, and curiosity
• **Human-Centered**: Focus on the person behind the patient, not just the diagnosis
• **Growth-Oriented**: Support learner development through challenge and success
• **Professionally Warm**: Fun yet respectful of medicine's seriousness

---

## 🎯 **Your Task: Create 4 Components**

### 1. **Spark Titles** (5 variations)
**Purpose**: Pre-sim mystery teaser that sells the learning experience WITHOUT spoiling the diagnosis

**Format**:
\`"<Chief Complaint> (<Age Sex>): <Emotionally Urgent Spark Phrase>"\`

**Examples**:
✅ "Chest Pain (47 M): Dizzy, Sweaty, and Terrified"
✅ "Shortness of Breath (5 F): Gasping After Birthday Cake"
✅ "Abdominal Pain (28 F): Pregnant and Worsening Fast"

**Rules**:
- NO diagnosis mentioned (no "MI", "anaphylaxis", "appendicitis")
- Observable symptoms only (what you see/hear)
- Emotionally urgent language ("terrified", "gasping", "worsening")
- Human details (age, gender, context clues)
- Create intrigue without spoiling the mystery

**Quality Criteria**:
- Would an EM clinician FEEL the urgency?
- Does it create curiosity without revealing the answer?
- Is it specific enough to paint a vivid picture?
- Does it respect the patient's humanity?

---

### 2. **Reveal Titles** (5 variations)
**Purpose**: Post-sim reinforcement that celebrates the diagnosis and learning objective

**Format**:
\`"<Diagnosis> (<Age Sex>): <Key Learning Objective or Clinical Pearl>"\`

**Examples**:
✅ "Acute MI (55 M): Recognizing Atypical Presentations"
✅ "Anaphylaxis (8 M): Epinephrine Technique Saves Lives"
✅ "Ectopic Pregnancy (28 F): The One Test You Can't Skip"

**Rules**:
- Diagnosis IS revealed (this is post-sim)
- Focus on the KEY teaching point or clinical pearl
- Emphasize what the learner will MASTER
- Clinical accuracy is critical
- Actionable takeaway (not just knowledge, but skill)

**Quality Criteria**:
- Does it reinforce the critical learning objective?
- Would the learner feel PROUD to have mastered this?
- Is the clinical pearl specific and actionable?
- Does it emphasize competence and growth?

---



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
- Very sweaty face, pale complexion
- Faded grey shirt with coffee stain
- Unkempt appearance with bag of clothes
- Unusual hair color/style
- Distinctive facial features
- Visible tattoos (location/theme)
- Piercings or jewelry

**B) Apparel & Accessories**:
- AC/DC "Thunderstruck" concert t-shirt
- BYU baseball cap (clearly a die-hard fan)
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
- Annoyingly loud 3-year-old screaming in corner
- Quiet and withdrawn, avoiding eye contact
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
5. **Personality-focused**: Adds human dimension to medical encounter
6. **Personality-rich**: Kind, pleasant, annoying, withdrawn, talkative
7. **Unique per patient**: NO reuse of anchors across cases
8. **Culturally varied**: Different ethnicities, backgrounds, professions
9. **Medically neutral**: NOT about the diagnosis itself
10. **Unforgettable**: Would make you say "Oh yeah, I remember that patient!"

**Examples of STRONG Memory Anchors**:
✅ "Very sweaty face, pale complexion, looks terrified"
✅ "Wearing AC/DC 'Thunderstruck' concert t-shirt, vintage 1990"
✅ "Annoyingly loud 3-year-old screaming in corner (mom looks exhausted)"
✅ "Pleasant elderly man who stood up to shake my hand with firm grip"
✅ "Strong smell of cigarette smoke, yellow-stained fingers, smoker's voice"
✅ "Daughter is an ICU nurse at University Hospital (asking detailed questions)"
✅ "Huge family of 8 people crowding tiny room (all talking at once)"
✅ "Small yappy Chihuahua in designer Louis Vuitton purse (won't stop barking)"
✅ "Wearing faded grey 'World's Best Grandpa' shirt with coffee stain"
✅ "BYU baseball cap (clearly die-hard fan, keeps talking about last game)"

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
- Avoid reusing any motifs from: ${usedMemory}
- Create unique, case-appropriate memory anchors based on the case data above

**Quality Check**:
- Would an ED doctor remember this patient by this detail? ✅
- Is it vivid enough to picture in your mind? ✅
- Is it different from the other 9 anchors? ✅
- Does it add personality to the encounter? ✅

---
### 4. **Case Summary** (Structured narrative)
**Purpose**: Concise, compelling summary that sells the value and humanizes the patient

**Components**:

**A) Patient_Summary** (3 sentences - CLINICAL HANDOFF STYLE):
- Write like an ED doctor admitting to a hospitalist
- GET TO THE POINT - diagnosis, presentation, key findings, disposition
- NO mystery, NO drama - just the clinical facts
- Include: chief complaint, vitals/exam findings, workup/diagnosis, management/disposition

**Examples**:
✅ "55M presents with acute substernal chest pain while shoveling snow. EKG shows STEMI, troponin elevated. Cath lab activated, given aspirin/heparin, admitted to CCU."
✅ "8M with anaphylaxis after peanut exposure at birthday party. Presented with facial swelling, stridor, hypotension. IM epi given x2, improved, admitted for observation."
✅ "72F fell at home, hip pain, unable to bear weight. X-ray confirms femoral neck fracture. Orthopedics consulted, scheduled for ORIF in AM."

**B) Key_Intervention** (Short phrase):
- The ONE action that changes the outcome
- Specific, actionable, memorable
- Focus on WHAT to do, not just WHY

**Examples**:
✅ "Immediate epinephrine (correct IM technique)"
✅ "Early aspirin + cath lab activation"
✅ "Surgical consult within 2 hours"

**C) Core_Takeaway** (Short phrase):
- The clinical pearl they'll remember forever
- Specific to THIS case
- Actionable and confidence-building

**Examples**:
✅ "Atypical presentations kill—always consider cardiac"
✅ "Epi first, questions later—timing saves lives"
✅ "Beta-hCG in all women of childbearing age"

**D) Defining_Characteristic_Options** (5 unique, humanizing details):
- Patient descriptors that add humanity and memorability
- Avoid clichés and overused motifs
- Make each case feel REAL and distinct
- Mix physical, emotional, and contextual details

**Examples**:
✅ "Retired firefighter who's 'never been sick a day in his life'"
✅ "Soccer mom rushing from practice still in her coaching gear"
✅ "College student studying for finals, chugging energy drinks"
✅ "Grandmother who walked 3 blocks to the ED because she 'didn't want to bother anyone'"
✅ "Construction worker who delayed coming in because he 'thought it was just heartburn'"

**Rules for Defining Characteristics**:
- Avoid motifs already used: ${usedMemory}
- Each one should paint a distinct picture
- Balance vulnerability with strength
- Include context clues (occupation, activity, mindset)
- Make the learner CARE about the patient

---

## 📋 **Context from This Case**

**Case Data** (Header: Value pairs from Google Sheet):
${caseDataFormatted}

**Motifs Already Used** (avoid these):
${usedMemory || 'None yet'}

---

## 🎨 **Tone & Style Guidelines**

**DO**:
✅ Use emotionally urgent language ("terrified", "gasping", "worsening fast")
✅ Focus on observable symptoms and human context
✅ Create intrigue and tension in Spark Titles
✅ Emphasize mastery and clinical pearls in Reveal Titles
✅ Make every detail clinically accurate and educationally sound
✅ Humanize the patient with specific, memorable details
✅ Paint vivid pictures that make the learner FEEL the scenario
✅ Use professional medical terminology appropriately

**DON'T**:
❌ Spoil the diagnosis in Spark Titles
❌ Use clichés or overused phrases
❌ Include medical jargon that obscures the human story
❌ Create generic, forgettable descriptions
❌ Duplicate existing motifs or patterns
❌ Sacrifice clinical accuracy for drama
❌ Make light of serious medical situations

---

## 🧪 **Quality Checklist**

Before finalizing your output, verify:

**Spark Titles**:
- [ ] NO diagnosis revealed
- [ ] Emotionally urgent and engaging
- [ ] Observable symptoms only
- [ ] Creates curiosity and tension
- [ ] Human context included

**Reveal Titles**:
- [ ] Diagnosis clearly stated
- [ ] Key learning objective emphasized
- [ ] Actionable clinical pearl
- [ ] Reinforces competence and mastery
- [ ] Clinically accurate

**Case IDs**:
- [ ] Correct format (7-8 chars)
- [ ] System prefix matches case
- [ ] Uppercase letters + digits
- [ ] Unique and memorable
- [ ] No duplication

**Case Summary**:
- [ ] Patient_Summary paints vivid picture
- [ ] Key_Intervention is specific and actionable
- [ ] Core_Takeaway is memorable and valuable
- [ ] Defining_Characteristics are unique and humanizing
- [ ] No clichés or overused motifs
- [ ] Emotionally resonant and clinically sound

---

## 📤 **Output Format (JSON)**

{
  "Spark_Titles": [
    "<Symptom> (<Age Sex>): <Spark Phrase>",
    "<Symptom> (<Age Sex>): <Spark Phrase>",
    "<Symptom> (<Age Sex>): <Spark Phrase>",
    "<Symptom> (<Age Sex>): <Spark Phrase>",
    "<Symptom> (<Age Sex>): <Spark Phrase>"
  ],
  "Reveal_Titles": [
    "<Diagnosis> (<Age Sex>): <Learning Objective>",
    "<Diagnosis> (<Age Sex>): <Learning Objective>",
    "<Diagnosis> (<Age Sex>): <Learning Objective>",
    "<Diagnosis> (<Age Sex>): <Learning Objective>",
    "<Diagnosis> (<Age Sex>): <Learning Objective>"
  ],
  "Memory_Anchors": [
    "Unforgettable patient detail #1",
    "Unforgettable patient detail #2",
    "Unforgettable patient detail #3",
    "Unforgettable patient detail #4",
    "Unforgettable patient detail #5",
    "Unforgettable patient detail #6",
    "Unforgettable patient detail #7",
    "Unforgettable patient detail #8",
    "Unforgettable patient detail #9",
    "Unforgettable patient detail #10"
  ],
  "Case_Summary": {
    "Patient_Summary": "A vivid 1-2 sentence description combining clinical urgency with human context, painting a clear picture of the scenario.",
    "Key_Intervention": "The ONE specific action that changes the outcome",
    "Core_Takeaway": "The clinical pearl they'll remember forever",
    "Defining_Characteristic_Options": [
      "Unique humanizing detail #1",
      "Unique humanizing detail #2",
      "Unique humanizing detail #3",
      "Unique humanizing detail #4",
      "Unique humanizing detail #5"
    ]
  }
}

---

## 🎯 **Final Reminder: The Sim Mastery Standard**

You're not just creating titles and summaries—you're crafting learning experiences that will stay with clinicians throughout their careers. Every word matters. Every detail should serve both the educational objective AND the emotional resonance.

Make this case:
• Unforgettable
• Clinically impeccable
• Emotionally powerful
• Educationally transformative

Now create your output. Make it AMAZING. 🚀
`;

  // ========== END OF ENHANCED PROMPT ==========

  Logger.log('📊 Prompt length: ' + prompt.length + ' characters');
  Logger.log('📊 Case data length: ' + caseDataFormatted.length + ' characters');

  const ai = callOpenAI(prompt, 0.7); // Temperature 0.7 for creative but consistent output
  Logger.log('📝 AI response length: ' + ai.length + ' characters');
  Logger.log('📝 AI response preview: ' + ai.substring(0, 500));

  const parsed = parseATSRResponse_(ai);
  if (!parsed) {
    Logger.log('❌ Failed to parse AI response');
    ui.alert('⚠️ ATSR parse error:\n'+ai.substring(0, 1000));
    return;
  }

  Logger.log('✅ Parsed keys: ' + Object.keys(parsed).join(', '));

  const html = buildATSRUltimateUI_(row, parsed, keepSelections, data);
  ui.showModalDialog(HtmlService.createHtmlOutput(html).setWidth(1920).setHeight(1000), '🎨 ATSR Titles Optimizer (v2 - TEST)');
}



// ATSR-specific JSON parser that handles markdown code fences
function parseATSRResponse_(text) {
  if (!text) return null;

  // Strip markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/,'');
  }

  try { return JSON.parse(cleaned); } catch(e) {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch(_) {} }
    return null;
  }
}





function buildATSRUltimateUI_(row, parsed, keepSelections, data) {
  // Helper: Create editable radio options with text input + show current value first
  const makeEditable = (vals, name, label, currentValue, showMysteryButton = false) => `
    <div class="section">
      <div class="section-header">
        <h3>${label}</h3>
        ${showMysteryButton ? `
        <button class="btn-mystery" onclick="regenerateMoreMysterious()" title="Generate even more mysterious titles that hide the diagnosis">
          🎭 Make More Mysterious
        </button>
        ` : ''}
      </div>
      <div class="options">
        ${currentValue ? `
        <div class="option-row">
          <input type="radio" name="${name}" value="current" id="${name}_current" checked>
          <input type="text" id="${name}_text_current" value="${String(currentValue).replace(/"/g,'&quot;')}" class="edit-field">
        </div>
        <div class="current-label">
          <em>No change, keep current version</em>
        </div>
        ` : ''}
        ${vals.map((v,i)=>`
          <div class="option-row">
            <input type="radio" name="${name}" value="${i}" id="${name}_${i}">
            <input type="text" id="${name}_text_${i}" value="${String(v).replace(/"/g,'&quot;')}" class="edit-field">
          </div>
        `).join('')}
      </div>
    </div>
  `;

  const ps = parsed.Case_Summary?.Patient_Summary || 'A patient was evaluated and managed for an acute condition requiring urgent care.';
  const ki = parsed.Case_Summary?.Key_Intervention || 'N/A';
  const ct = parsed.Case_Summary?.Core_Takeaway || 'N/A';

  // Extract diagnosis from Reveal_Title (before the colon)
  let diagnosis = 'Diagnosis Unknown';
  const revealTitle = data['Case_Organization_Reveal_Title'];
  if (revealTitle) {
    // Format: "Severe Asthma Exacerbation (8 M): Swift Action Required"
    // Extract: "Severe Asthma Exacerbation"
    const match = revealTitle.match(/^([^(]+)/);
    if (match) {
      diagnosis = match[1].trim();
    }
  }

  // Create specific learning outcome from diagnosis and key intervention
  const learningOutcome = ki !== 'N/A'
    ? `Master ${ki.toLowerCase()} as critical decision for ${diagnosis.toLowerCase()}`
    : `Master rapid recognition and treatment of ${diagnosis.toLowerCase()}`;

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <!-- Cache bust: v7_demographic_format_${Date.now()} -->
    <style>
      * { box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
        margin: 0;
        background: #f5f7fa;
        color: #2c3e50;
        font-size: 14px;
      }
      .container {
        padding: 6px 16px 10px 16px;
        max-width: 1900px;
        margin: 0 auto;
      }
      .summary-card {
        background: #ffffff;
        border: 1px solid #cbd5e0;
        border-radius: 6px;
        padding: 8px 12px;
        margin-bottom: 6px;
        box-shadow: none;
        max-width: 700px;
      }
      .summary-card h2 {
        margin: 0 0 4px 0;
        font-size: 15px;
        color: #1a202c;
        font-weight: 600;
      }
      .summary-text {
        font-size: 13px;
        line-height: 1.4;
        color: #2d3748;
        margin-bottom: 6px;
      }
      .summary-details {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        padding: 6px 8px;
        background: #f7fafc;
        border-radius: 4px;
        border-left: 3px solid #3b82f6;
      }
      .detail-item {
        font-size: 11px;
      }
      .detail-item strong {
        color: #1a202c;
        display: block;
        margin-bottom: 2px;
      }
      .grid-3 {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-bottom: 8px;
        align-items: start;
      }
      .section {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        padding: 6px;
        height: 100%;
      }
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
        padding-bottom: 3px;
        border-bottom: 1px solid #e2e8f0;
      }
      .section h3 {
        margin: 0;
        font-size: 13px;
        font-weight: 600;
        color: #1a202c;
      }
      .btn-mystery {
        padding: 4px 8px;
        font-size: 10px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.2s;
        box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
      }
      .btn-mystery:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(102, 126, 234, 0.4);
        background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
      }
      .btn-mystery:active {
        transform: translateY(0);
      }
      .options {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .option-row {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 1px 2px;
        border-radius: 2px;
        transition: background 0.2s;
      }
      .option-row:hover {
        background: #f7fafc;
      }
      .option-row.no-change {
        margin-top: 2px;
        padding-top: 3px;
        border-top: 1px solid #e2e8f0;
      }
      .option-row input[type="radio"] {
        flex-shrink: 0;
        width: 14px;
        height: 14px;
        cursor: pointer;
      }
      .edit-field {
        flex: 1;
        padding: 4px 6px;
        border: 1px solid #e2e8f0;
        border-radius: 3px;
        font-size: 13px;
        background: #ffffff;
        color: #2c3e50;
        transition: border-color 0.2s;
        word-wrap: break-word;
        white-space: normal;
        overflow-wrap: break-word;
        min-height: 24px;
        line-height: 1.3;
      }
      .edit-field:focus {
        outline: none;
        border-color: #3b82f6;
      }
      .current-label {
        padding: 2px 0 4px 18px;
        font-size: 11px;
        color: #64748b;
        font-style: italic;
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
    <div class="container">
      <div class="summary-card">
        <div style="margin-bottom: 4px; font-size: 13px; color: #64748b; font-weight: 500;">Case Summary:</div>
        <div style="font-size: 26px; font-weight: 700; color: #1a202c; margin-bottom: 16px; line-height: 1.2;">${diagnosis}</div>
        <ul style="list-style-type: disc; margin: 0; padding-left: 20px; line-height: 1.7;">
          <li style="margin-bottom: 10px; color: #2d3748; font-size: 14px;">${ps}</li>
          <li style="color: #2d3748; font-size: 14px; font-weight: 600;"><strong>Learning Objective:</strong> ${learningOutcome}</li>
        </ul>
      </div>

      <div class="grid-3">
        ${makeEditable(parsed.Spark_Titles||[], 'spark', '🔥 Spark Titles (Pre-Sim Mystery)', data['Case_Organization_Spark_Title'], true)}
        ${makeEditable(parsed.Reveal_Titles||[], 'reveal', '💎 Reveal Titles (Post-Sim Learning)', data['Case_Organization_Reveal_Title'])}
        ${makeEditable(parsed.Memory_Anchors||[], 'anchor', '🎭 Memory Anchors (Unforgettable Patient Details)', data['Case_Organization_Memory_Anchor'])}
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
              google.script.run.runATSRTitleGenerator(${row+1}, true);
            } else {
              google.script.host.close();
            }
          })
          .saveATSRData(${row}, data);
      }

      function keepRegen() {
        google.script.host.close();
        google.script.run.runATSRTitleGenerator(${row}, true);
      }

      let mysteryLevel = 1; // Track how mysterious we're getting

      function regenerateMoreMysterious() {
        // Show loading state
        const btn = event.target;
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '🔄 Level ' + mysteryLevel + '...';

        // Collect current titles from the text inputs
        const sparkContainer = document.querySelector('[name="spark"]').closest('.section').querySelector('.options');
        const textInputs = sparkContainer.querySelectorAll('.edit-field');
        const currentTitles = Array.from(textInputs).map(input => input.value);

        google.script.run
          .withSuccessHandler((newTitles) => {
            // Replace the Spark Titles options with new ultra-mysterious ones
            const sparkContainer = document.querySelector('[name="spark"]').closest('.section').querySelector('.options');

            // Keep the current value option if it exists
            const currentOption = sparkContainer.querySelector('.option-row:first-child');
            const hasCurrentValue = currentOption && currentOption.querySelector('[id$="_current"]');

            // Build new options HTML
            let newHTML = '';
            if (hasCurrentValue) {
              newHTML += currentOption.outerHTML;
              newHTML += sparkContainer.querySelector('.current-label').outerHTML;
            }

            // Add new mysterious titles
            newTitles.forEach((title, i) => {
              newHTML += '<div class="option-row">' +
                '<input type="radio" name="spark" value="' + i + '" id="spark_' + i + '">' +
                '<input type="text" id="spark_text_' + i + '" value="' + title.replace(/"/g,'&quot;') + '" class="edit-field">' +
                '</div>';
            });

            sparkContainer.innerHTML = newHTML;

            // Increment mystery level for next click
            mysteryLevel++;

            // Update button text to show we're going deeper
            const levelEmojis = ['🎭', '🕵️', '❓', '🌫️', '👻'];
            const emoji = levelEmojis[Math.min(mysteryLevel - 1, levelEmojis.length - 1)];
            btn.innerHTML = emoji + ' Even More Mysterious';
            btn.disabled = false;
          })
          .withFailureHandler((error) => {
            alert('Error generating mysterious titles: ' + error);
            btn.disabled = false;
            btn.innerHTML = originalText;
          })
          .generateMysteriousSparkTitles(${row}, mysteryLevel, currentTitles);
      }
    </script>
  </body>
  </html>
  `;
}



// Generate ultra-mysterious Spark Titles that completely hide the diagnosis
function generateMysteriousSparkTitles(row, mysteryLevel, currentTitles) {
  const s = pickMasterSheet_();
  const headers = s.getRange(2,1,1,s.getLastColumn()).getValues()[0];
  const rowData = s.getRange(row, 1, 1, headers.length).getValues()[0];

  // Build data object
  const data = {};
  headers.forEach((h,i) => { data[h] = rowData[i]; });

  // Extract the diagnosis from Reveal Title
  const revealTitle = data['Case_Organization_Reveal_Title'] || '';
  const diagnosisMatch = revealTitle.match(/^([^(]+)/);
  const diagnosis = diagnosisMatch ? diagnosisMatch[1].trim() : 'Unknown';

  // Extract age/gender from current Spark Title (e.g., "Title (58 M): Description")
  const currentSparkTitle = data['Case_Organization_Spark_Title'] || '';
  const demographicMatch = currentSparkTitle.match(/\((\d+\s+[MF])\)/);
  const demographic = demographicMatch ? demographicMatch[1] : null;

  // Get patient summary
  const patientSummary = data['Case_Summary_Patient_Summary'] || 'A patient presents with concerning symptoms.';

  // Adjust mystery level instructions
  const level = mysteryLevel || 1;
  let mysteryInstructions = '';

  if (level === 1) {
    mysteryInstructions = '**MYSTERY LEVEL 1 (Moderate Mystery):**\n' +
      '- Use vague family observations\n' +
      '- Avoid medical terms but can hint at general concern\n' +
      '- Example: "Grandpa\'s Not Acting Right"\n\n';
  } else if (level === 2) {
    mysteryInstructions = '**MYSTERY LEVEL 2 (High Mystery):**\n' +
      '- Even more vague and indirect\n' +
      '- Focus on pure behavioral changes\n' +
      '- Example: "Something\'s Different Today"\n\n';
  } else if (level === 3) {
    mysteryInstructions = '**MYSTERY LEVEL 3 (Maximum Mystery):**\n' +
      '- Extremely vague, almost cryptic\n' +
      '- Pure emotion and concern only\n' +
      '- Example: "I\'m Worried"\n\n';
  } else {
    mysteryInstructions = '**MYSTERY LEVEL ' + level + ' (ULTRA Maximum):**\n' +
      '- Absolutely NO specifics whatsoever\n' +
      '- Pure gut feeling and unease\n' +
      '- Example: "Something\'s Not Right"\n\n';
  }

  // Build the prompt based on whether we have current titles to iterate on
  let prompt = '';

  if (currentTitles && currentTitles.length > 0) {
    // ITERATIVE MODE: Make existing titles MORE mysterious
    const formatInstruction = demographic
      ? '**FORMAT REQUIREMENT:**\nEach title MUST follow this exact format:\n"Title (' + demographic + '): Brief description"\n\nExample: "Grandpa\'s Not Acting Right (' + demographic + '): Family Concerned"\n\n'
      : '';

    prompt = 'You are making existing pre-simulation titles EVEN MORE MYSTERIOUS to completely hide the diagnosis.\n\n' +
      mysteryInstructions +
      '**YOUR TASK:**\n' +
      'Take each of these titles and make them MORE vague, MORE mysterious, and LESS revealing.\n' +
      'Remove any remaining hints about the condition. Make them more cryptic and indirect.\n' +
      'Keep the human context and emotional tone, but be even more subtle.\n\n' +
      '**Current Titles to Make More Mysterious:**\n' +
      JSON.stringify(currentTitles, null, 2) + '\n\n' +
      formatInstruction +
      '**Patient Context (to maintain relevance):**\n' +
      patientSummary + '\n\n' +
      '**Actual Diagnosis (HIDE THIS COMPLETELY):**\n' +
      diagnosis + '\n\n' +
      '**CRITICAL RULES:**\n' +
      '- NEVER mention the diagnosis (' + diagnosis + ')\n' +
      '- NEVER use medical terminology\n' +
      '- Remove any remaining clinical hints\n' +
      '- Make each title LESS specific than before\n' +
      '- Use even vaguer language\n' +
      '- Focus on pure emotion and concern\n' +
      '- Keep titles grounded in the patient context (age, setting, etc.)\n' +
      '- Maintain human perspective (family member, concerned observer)\n' +
      (demographic ? '- ALWAYS include (' + demographic + ') in each title\n' : '') +
      '\n' +
      'Return ONLY a JSON array of the same number of titles, now more mysterious:\n' +
      '["More mysterious version of title 1", "More mysterious version of title 2", ...]';
  } else {
    // INITIAL MODE: Generate from scratch
    const formatInstruction = demographic
      ? '**FORMAT REQUIREMENT:**\nEach title MUST follow this exact format:\n"Title (' + demographic + '): Brief description"\n\nExample: "Grandpa\'s Not Acting Right (' + demographic + '): Family Concerned"\n\n'
      : '';

    const exampleSuffix = demographic ? ' (' + demographic + ')' : '';

    prompt = 'You are creating ULTRA-MYSTERIOUS pre-simulation titles that COMPLETELY HIDE the diagnosis from learners.\n\n' +
      mysteryInstructions +
      formatInstruction +
      '**CRITICAL RULES:**\n' +
      '- NEVER mention the diagnosis (' + diagnosis + ')\n' +
      '- NEVER use medical terminology that reveals the condition\n' +
      '- NEVER hint at the organ system or pathophysiology\n' +
      '- Focus on vague, concerning observations\n' +
      '- Use layperson language and indirect descriptions\n' +
      '- Create curiosity and mystery without clinical clues\n' +
      (demographic ? '- ALWAYS include (' + demographic + ') in each title\n' : '') +
      '\n' +
      '**Patient Context:**\n' +
      patientSummary + '\n\n' +
      '**Actual Diagnosis (HIDE THIS COMPLETELY):**\n' +
      diagnosis + '\n\n' +
      '**Examples of Ultra-Mysterious Titles:**\n' +
      '- "Grandpa\'s Not Acting Right' + exampleSuffix + ': Family Concerned"\n' +
      '- "She Just Doesn\'t Look Right' + exampleSuffix + ': Something\'s Wrong"\n' +
      '- "Something\'s Off with Dad Today' + exampleSuffix + ': Can\'t Put My Finger on It"\n' +
      '- "The Kid Who Won\'t Stop Crying' + exampleSuffix + ': Parents Worried"\n' +
      '- "Mom Says He\'s Not Himself' + exampleSuffix + ': Acting Strange"\n\n' +
      '**Generate 5 ultra-mysterious Spark Titles that:**\n' +
      '1. Use concerned family member observations\n' +
      '2. Describe behavioral/emotional changes only\n' +
      '3. Avoid ANY medical symptoms or terms\n' +
      '4. Create urgency through human context\n' +
      '5. Make learners think "I need to assess this"\n' +
      (demographic ? '6. Include (' + demographic + ') in EVERY title\n' : '') +
      '\n' +
      'Return ONLY a JSON array of 5 title strings, no explanation:\n' +
      '["Title 1", "Title 2", "Title 3", "Title 4", "Title 5"]';
  }

  Logger.log('🎭 Generating ultra-mysterious Spark Titles (Level ' + level + ')');
  Logger.log('   For diagnosis: ' + diagnosis);
  if (currentTitles && currentTitles.length > 0) {
    Logger.log('   Iterating on ' + currentTitles.length + ' existing titles');
  } else {
    Logger.log('   Generating fresh titles from scratch');
  }

  const response = callOpenAI(prompt, 0.9); // High temperature for creativity
  Logger.log('📝 OpenAI response: ' + response);

  // Parse the JSON array
  const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const titles = JSON.parse(cleanResponse);

  Logger.log('✅ Generated ' + titles.length + ' mysterious titles');
  return titles;
}

// New save function that handles data from the UI
function saveATSRData(row, data) {
  const s = pickMasterSheet_();
  const headers = s.getRange(2,1,1,s.getLastColumn()).getValues()[0];

  const setVal = (key, val) => {
    if (!val || val==='nochange') return;
    const idx = headers.indexOf(key);
    if (idx<0) {
      Logger.log('⚠️ Column not found: ' + key);
      return;
    }
    const r = s.getRange(row, idx+1);
    r.setValue(val);
  };

  Logger.log('💾 Saving ATSR data for row ' + row);
  Logger.log('   Spark: ' + data.spark);
  Logger.log('   Reveal: ' + data.reveal);
  Logger.log('   Anchor: ' + data.anchor);

  setVal('Case_Organization_Spark_Title', data.spark);
  setVal('Case_Organization_Reveal_Title', data.reveal);
  setVal('Case_Organization_Memory_Anchor', data.anchor);

  SpreadsheetApp.getActive().toast('✅ ATSR saved successfully!');
}

// Legacy function kept for compatibility
function applyATSRSelectionsWithDefiningAndMemory(row, spark, reveal, caseID, define) {
  const s = pickMasterSheet_();
  const headers = s.getRange(2,1,1,s.getLastColumn()).getValues()[0];

  const setVal = (key, val, append=false) => {
    if (!val || val==='nochange') return;
    const idx = headers.indexOf(key);
    if (idx<0) return;
    const r = s.getRange(row, idx+1);
    if (append) {
      const ex = r.getValue();
      r.setValue(ex ? (ex + ' ' + val) : val);
    } else r.setValue(val);
  };

  setVal('Spark_Title',   spark);
  setVal('Reveal_Title',  reveal);
  setVal('Patient_Descriptor', define, true);

  if (define && define!=='nochange') {
    const memKey = SP_KEYS.USED_MOTIFS;
    const prev = getProp(memKey,'');
    const motif = define.toLowerCase().split(' ').slice(0,3).join(' ');
    if (!prev.includes(motif)) setProp(memKey, prev ? (prev+', '+motif) : motif);
  }

  SpreadsheetApp.getActive().toast('✅ ATSR saved.');
}
