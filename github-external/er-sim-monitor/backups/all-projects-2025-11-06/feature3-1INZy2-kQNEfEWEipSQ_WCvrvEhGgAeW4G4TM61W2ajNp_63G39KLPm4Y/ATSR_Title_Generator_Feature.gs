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
  ui.showModalDialog(HtmlService.createHtmlOutput(html).setWidth(1400).setHeight(900), ' ');
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
  // Helper: Create editable radio options with text input
  const makeEditable = (vals, name, label) => `
    <div class="section">
      <h3>${label}</h3>
      <div class="options">
        ${vals.map((v,i)=>`
          <div class="option-row">
            <input type="radio" name="${name}" value="${i}" id="${name}_${i}" ${(keepSelections && i===0)?'checked':''}>
            <input type="text" id="${name}_text_${i}" value="${String(v).replace(/"/g,'&quot;')}" class="edit-field">
          </div>
        `).join('')}
        <div class="option-row no-change">
          <input type="radio" name="${name}" value="nochange" id="${name}_nochange">
          <label for="${name}_nochange">🟦 No Change (keep current)</label>
        </div>
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
        padding: 8px 20px 16px 20px;
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
        max-width: 700px;
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
        gap: 8px;
        padding: 4px 6px;
        border-radius: 4px;
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
        padding: 6px 10px;
        border: 1px solid #cbd5e0;
        border-radius: 6px;
        font-size: 13px;
        background: #ffffff;
        color: #2c3e50;
        transition: border-color 0.2s, box-shadow 0.2s;
        word-wrap: break-word;
        white-space: normal;
        overflow-wrap: break-word;
        min-height: 32px;
        line-height: 1.4;
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
        ${makeEditable(parsed.Spark_Titles||[], 'spark', '🔥 Spark Titles (Pre-Sim Mystery)')}
        ${makeEditable(parsed.Reveal_Titles||[], 'reveal', '💎 Reveal Titles (Post-Sim Learning)')}
        ${makeEditable(parsed.Memory_Anchors||[], 'anchor', '🎭 Memory Anchors (Unforgettable Patient Details)')}
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
    </script>
  </body>
  </html>
  `;
}



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

