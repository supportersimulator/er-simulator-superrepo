/**
 * AI Case Overview Generator
 *
 * Uses OpenAI API + AI Priority Research + Marketing Genius to create:
 * 1. Pre-Sim Overview: Sells the case value WITHOUT spoiling the mystery
 * 2. Post-Sim Overview: Reinforces learning with key takeaways
 *
 * Philosophy: "Sell the journey before, celebrate the victory after"
 */

const OpenAI = require('openai');
require('dotenv').config();

let openaiClient = null;

/**
 * Initialize OpenAI client (call this from main script after reading settings)
 */
function initializeOpenAI(client) {
  openaiClient = client;
}

function getOpenAIClient() {
  if (!openaiClient) {
    throw new Error('OpenAI client not initialized. Call initializeOpenAI() first.');
  }
  return openaiClient;
}

/**
 * Generate pre-sim case overview (sells value WITHOUT spoiling mystery)
 */
async function generatePreSimOverview(caseData) {
  const {
    sparkTitle, // Patient presentation (safe to reveal)
    system, // Medical system (safe to reveal)
    aiResearch = {}, // AI research data (CRITICAL PEARLS - must hide!)
    complexity,
    priority,
    pathwayName
  } = caseData;

  // Extract marketing insights WITHOUT revealing diagnosis
  const valuePromise = aiResearch.criticalPearl
    ? "You'll master a critical clinical decision that separates excellent clinicians from average ones"
    : "You'll build essential diagnostic and management skills";

  const organizationalValue = aiResearch.organizationalPriority
    ? `This case addresses ${aiResearch.organizationalPriority.litigationRisk === 'High' ? 'high-stakes' : ''} clinical scenarios`
    : "This case builds foundational emergency medicine competency";

  const prompt = `You are writing a PRE-SIMULATION case overview for EMERGENCY MEDICINE CLINICIANS that SELLS the learning experience WITHOUT spoiling the mystery.

**ABOUT THE SIMULATION APP:**
This is an immersive emergency medicine simulation platform where:
- Users see a live patient monitor with vital signs (HR, SpO2, BP, RR, EtCO2)
- Waveforms display in real-time (ECG, pleth, BP, capnography)
- Users make clinical decisions under time pressure
- Monitor displays evolve based on their interventions
- Audio feedback (beeps, alarms) create realistic ED atmosphere
- Cases are 5-10 minutes of intense, realistic clinical experience
- Users discover diagnoses through history, exam, and monitor changes
- The app teaches critical decision-making, not just knowledge recall
- Focus is on "what would you do RIGHT NOW in a real ED?"

**THE SIMULATION EXPERIENCE:**
- Starts with chief complaint and initial vitals (MYSTERY MODE - diagnosis hidden)
- User gathers history, performs exam, interprets monitor
- Critical decision points emerge (medication? intervention? workup?)
- Monitor responds to user choices (vitals improve/worsen)
- Case reveals teaching points through discovery, not lecture
- Post-sim debrief reinforces the critical clinical pearls

**TARGET AUDIENCE:**
Emergency Medicine physicians, residents, and advanced practice providers who:
- Work in fast-paced, high-stakes ED environments
- Value clinical confidence in high-pressure situations
- Prioritize patient safety (avoiding missed diagnoses and medication errors)
- Seek career protection (reducing litigation risk)
- Want respect from colleagues (being the clinician others turn to)
- Prepare for board exams (ABEM, LLSA)
- Value efficient learning (max value, min time)

**🎯 ESCAPE ROOM MYSTERY STYLE - CRITICAL RULES:**

This is NOT a traditional case description - it's a MYSTERY TEASER like an escape room preview.

**FORBIDDEN - NEVER reveal:**
- ❌ The diagnosis (no "MI", "stroke", "sepsis", "anaphylaxis", specific disease names)
- ❌ Specific treatments or contraindications (no "nitro is dangerous", "give epi")
- ❌ Specific test findings (no "check leads II, III, aVF", "look for ST elevation")
- ❌ Clinical pearls or teaching points (save these for POST-sim!)
- ❌ Any medical jargon that hints at the answer

**ALLOWED - Only reveal:**
- ✅ Observable symptoms (chest pain, shortness of breath, altered mental status, visible distress)
- ✅ Patient demographics (age, brief appearance description)
- ✅ Emotional urgency ("You have 2 minutes", "One wrong move...")
- ✅ Mystery hooks ("The 'obvious' approach has a hidden trap")
- ✅ Vague skill descriptions ("Spot the critical detail", "Avoid the common mistake")

**CASE CONTEXT:**
- **Patient Presentation**: ${sparkTitle}
- **Medical System**: ${system}
- **Complexity**: ${complexity}/15
- **Priority**: ${priority}/10

**YOUR TASK:**
Write a SHORT, PUNCHY mystery teaser (3-4 sentences total) that creates intrigue WITHOUT spoiling anything.

**TONE:**
- Direct and clinical (EM clinicians hate fluff)
- Emotionally urgent (create time pressure)
- Mysterious and intriguing (escape room vibe)
- SHORT - maximum 4 sentences total

**SBAR HANDOFF INTEGRATION:**
Blend SBAR (Situation, Background, Assessment, Recommendation) into the mystery format:
- **Situation**: What's happening RIGHT NOW (observable symptoms, immediate concern)
- **Background**: Brief context (age, setting, what nurse/family says) - CONCISE, NO DIAGNOSIS
- **Assessment**: What you're walking into (vital signs concerning, patient declining)
- **Recommendation**: The urgency (need immediate evaluation, time-sensitive decision)

Make SBAR feel natural - like a real ED handoff - while keeping the mystery alive.

**OUTPUT FORMAT (JSON):**
{
  "sbarHandoff": "2-3 sentence SBAR-style clinical handoff. SITUATION: What's happening now. BACKGROUND: Brief context (family/nurse observations). ASSESSMENT: Current status. Example: 'Nurse calls: 55M clutching chest, pale, diaphoretic. Wife says pain started 20 minutes ago while shoveling snow, he looks terrified. Vitals unstable, patient declining. You need to see him now.'",

  "theStakes": "1 sentence creating urgency. Example: 'One decision in the next 90 seconds determines if this patient walks out or doesn't make it.'",

  "mysteryHook": "1 sentence hinting at complexity WITHOUT revealing answer. Example: 'The standard treatment protocol has a hidden trap—and you have less than 2 minutes to spot it.'",

  "whatYouWillLearn": [
    "Vague skill 1 (NO specifics! Example: 'How to spot the critical detail in first 90 seconds')",
    "Vague skill 2 (Example: 'Why the standard approach isn't always safe')",
    "Vague skill 3 (Example: 'The one assessment that changes your entire treatment plan')"
  ],

  "estimatedTime": "5-10 minutes"
}

**EXAMPLES OF SBAR + ESCAPE ROOM MYSTERY STYLE:**

✅ PERFECT Example (Anaphylaxis - diagnosis NOT mentioned):
{
  "sbarHandoff": "Triage calls: 8M at birthday party, suddenly can't breathe, lips swelling fast. Mom says he ate cake 5 minutes ago, now he's terrified and gasping. He's declining rapidly—you need to see him now.",
  "theStakes": "You have 3 minutes before this turns irreversible.",
  "mysteryHook": "The first medication you reach for will save his life—but there's a critical technique detail that most clinicians get wrong.",
  "whatYouWillLearn": [
    "The life-saving intervention sequence",
    "The technique detail that makes the difference",
    "What NOT to do in the first 60 seconds"
  ],
  "estimatedTime": "6 minutes"
}

✅ PERFECT Example (Pediatric Asthma - diagnosis NOT mentioned):
{
  "sbarHandoff": "Nurse brings in a 5F, wheezing and retracting hard. Mom says the inhaler stopped working an hour ago, she's getting quieter. Vitals show she's tiring out—needs immediate evaluation.",
  "theStakes": "When pediatric patients stop fighting to breathe, you're out of time.",
  "mysteryHook": "There's a narrow window where aggressive treatment saves lives—and a point where you've waited too long. Where's that line?",
  "whatYouWillLearn": [
    "Recognizing the 'quiet before the crash'",
    "When to escalate (and how fast)",
    "The intervention that buys you time"
  ],
  "estimatedTime": "7 minutes"
}

✅ PERFECT Example (Chest Pain - NO diagnosis or treatment mentioned):
{
  "sbarHandoff": "EMS brings in 55M, crushing chest pain, pale and sweaty. Wife says it started while shoveling snow 30 minutes ago, he looks terrified. Monitor shows concerning vitals—he needs you now.",
  "theStakes": "One decision in the next 90 seconds determines if this patient walks out alive.",
  "mysteryHook": "The 'textbook' treatment has a hidden trap that kills patients—and you have 2 minutes to spot it.",
  "whatYouWillLearn": [
    "The critical detail hidden in plain sight",
    "Why the standard approach isn't always safe",
    "The one assessment that changes everything"
  ],
  "estimatedTime": "8 minutes"
}

❌ BAD Example (gives away too much):
"A patient with inferior MI arrives. Learn why nitro is contraindicated..." → TOO REVEALING!

❌ BAD Example (mentions specific treatment):
"Learn when to give tPA for stroke..." → NO TREATMENT NAMES!

**IMPORTANT:**
- Keep it SHORT (3-4 total sentences across all fields)
- Use ONLY observable symptoms from ${sparkTitle}
- Create mystery WITHOUT revealing the answer
- Think: "escape room preview" not "case summary"

Provide your response as valid JSON only (no markdown, no code blocks).`;

  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a marketing genius specializing in educational content. You know how to sell learning experiences by creating curiosity gaps and outcome-focused messaging. You NEVER spoil the learning journey by revealing answers. Always provide responses in valid JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8, // Higher for creative, compelling copy
      max_tokens: 1200
    });

    const content = response.choices[0].message.content.trim();
    const result = JSON.parse(content);

    return {
      ...result,
      caseId: caseData.currentCaseId || caseData.newId,
      sparkTitle: sparkTitle,
      type: 'pre-sim',
      aiGenerated: true,
      model: 'gpt-4o',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error generating pre-sim overview:', error.message);

    // Fallback to generic overview
    return {
      headline: `Master: ${sparkTitle}`,
      hookOpening: `${sparkTitle} - A critical case in your ${pathwayName} training pathway.`,
      whyThisMatters: "This case builds essential diagnostic and management skills for emergency medicine practice.",
      whatYoullDiscover: [
        "Critical assessment techniques",
        "Evidence-based management strategies",
        "Clinical decision-making under pressure"
      ],
      pathwayContext: `Part of your ${pathwayName} curriculum.`,
      callToAction: "Start this case to build your clinical confidence.",
      estimatedTime: "5-10 minutes",
      error: error.message,
      aiGenerated: false,
      fallbackUsed: true
    };
  }
}

/**
 * Generate post-sim case overview (reinforces learning with key takeaways)
 */
async function generatePostSimOverview(caseData) {
  const {
    sparkTitle,
    revealTitle, // NOW safe to reveal (they just completed it!)
    system,
    aiResearch = {},
    complexity,
    priority,
    pathwayName
  } = caseData;

  // Extract all the gold from AI research
  const criticalPearl = aiResearch.criticalPearl || 'Key clinical insights for this presentation';
  const commonMistakes = aiResearch.commonMistakes || [];
  const residencyPriority = aiResearch.residencyPriority || {};
  const organizationalPriority = aiResearch.organizationalPriority || {};

  const prompt = `You are writing a POST-SIMULATION case overview for EMERGENCY MEDICINE CLINICIANS that CELEBRATES the learning victory and REINFORCES key takeaways.

**ABOUT THE SIMULATION APP:**
This is an immersive emergency medicine simulation platform where:
- Users just experienced a realistic ED case with live patient monitor
- They made real-time clinical decisions under pressure
- They discovered the diagnosis through clinical reasoning
- They saw how their interventions affected the patient's monitor/vitals
- The simulation lasted 5-10 minutes of intense clinical experience
- Now they need reinforcement of the critical teaching points

**CONTEXT:**
The EM clinician just completed this simulation case. Now it's time to:
1. Celebrate their accomplishment (they just mastered something valuable!)
2. Reinforce the critical clinical pearls (what to remember forever)
3. Remind them why this matters (patient safety, career protection, confidence)
4. Give them memorable takeaways for real ED shifts
5. Connect this to their broader EM training pathway

**CASE DETAILS:**
- **Patient Presentation**: ${sparkTitle}
- **Diagnosis Revealed**: ${revealTitle}
- **Medical System**: ${system}
- **Learning Pathway**: ${pathwayName}
- **Priority Level**: ${priority}/10 - ${priority >= 9 ? 'CRITICAL learning milestone' : 'Important training case'}
- **Complexity**: ${complexity}/15

**CRITICAL CLINICAL PEARL:**
${criticalPearl}

**COMMON MISTAKES TO AVOID:**
${commonMistakes.length > 0 ? commonMistakes.map((m, i) => `${i + 1}. ${m}`).join('\n') : 'N/A'}

**WHY RESIDENCIES PRIORITIZE THIS:**
${residencyPriority.reasoning || 'Builds essential EM competency'}

**ORGANIZATIONAL VALUE:**
- Litigation Risk: ${organizationalPriority.litigationRisk || 'Medium'}
- HCAHPS Impact: ${organizationalPriority.hcahpsImpact || 'Medium'}
- Cost Impact: ${organizationalPriority.costImpact || 'Medium'}

**YOUR TASK:**
Write a POST-SIMULATION overview that reinforces the learning and makes them feel like they just gained something incredibly valuable for their real ED practice.

**TONE & STYLE FOR EM CLINICIANS:**
- Celebrate the win (they just mastered a critical skill!)
- Direct, clinical language (they respect efficiency)
- Create VIVID patient story anchor (memorable character details to trigger recall)
- Make the critical pearl UNFORGETTABLE (use vivid examples, mnemonics, clinical stories)
- Connect to real ED practice (how this saves lives on their next shift)
- Emphasize transformation (what they can now do that they couldn't before)
- Quantify impact (litigation protection, patient outcomes, board relevance)
- Create emotional resonance (confidence, pride, professional competence)
- Action-oriented (what to remember when this patient presents at 3 AM)

**IMPORTANT - PATIENT STORY ANCHOR:**
The "patientStoryAnchor" is CRITICAL for memory retention. Make it:
- Vivid and specific (age, occupation, key symptom, memorable detail)
- Use sensory details when possible (pale, diaphoretic, clutching chest)
- Create a mental image the clinician can visualize
- Connect to the diagnosis (without being too obvious)
- Example: "The 68-year-old retired teacher with sudden-onset back pain who kept asking 'Is this my heart?'" (aortic dissection case)
- Example: "The 45-year-old construction worker who walked in looking pale and clutching his chest, then slumped in the triage chair" (inferior MI case)

**OUTPUT FORMAT (JSON):**
{
  "victoryHeadline": "🎉 Case Mastered: [Compelling 5-7 word headline celebrating their win]",
  "patientStoryAnchor": "One vivid sentence describing the patient character to anchor memory. Use descriptive details from presentation (${sparkTitle}) - age, gender, key symptoms, memorable aspect. Example: 'The 45-year-old construction worker with crushing chest pain and diaphoresis who turned pale when you asked about his pain location.'",
  "celebrationOpening": "2-3 sentences celebrating what they just accomplished and why it matters. Make them feel proud!",
  "theCriticalPearl": {
    "title": "The Golden Takeaway",
    "content": "The #1 clinical pearl they MUST remember forever (the inferior MI nitro contraindication equivalent). Make it memorable and actionable.",
    "memoryAid": "A simple mnemonic, acronym, or vivid mental image to remember this forever"
  },
  "whatYouMastered": [
    "Specific skill they now have (before: couldn't do this → after: can do this)",
    "Specific skill they now have",
    "Specific skill they now have"
  ],
  "avoidTheseTraps": [
    "Common mistake #1 and why it's dangerous",
    "Common mistake #2 and why it's dangerous"
  ],
  "realWorldImpact": {
    "patientSafety": "How this knowledge will save lives in their career",
    "careerProtection": "How this knowledge protects them from litigation/errors",
    "clinicalConfidence": "How this knowledge builds their expertise"
  },
  "nextSteps": {
    "inThisPathway": "What case to do next in the ${pathwayName} pathway",
    "toReinforce": "How to practice/reinforce this skill (mental rehearsal, etc.)"
  },
  "rememberForever": "The ONE sentence they should tattoo on their brain about this case",
  "confidence": 0.95
}

**TONE:**
- Celebratory (they just won!)
- Educational (reinforce the learning)
- Empowering (they're now better than before)
- Memorable (make the pearl stick)

**IMPORTANT:**
- NOW you can reveal the diagnosis (they completed it!)
- Make the critical pearl UNFORGETTABLE
- Use vivid language, stories, analogies
- Quantify the value when possible
- Make common mistakes visceral (help them avoid future errors)

Provide your response as valid JSON only (no markdown, no code blocks).`;

  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a master educator who knows how to reinforce learning through celebration and memorable takeaways. You create content that students remember for years. Always provide responses in valid JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8, // Higher for memorable, vivid language
      max_tokens: 2000
    });

    const content = response.choices[0].message.content.trim();
    const result = JSON.parse(content);

    return {
      ...result,
      caseId: caseData.currentCaseId || caseData.newId,
      revealTitle: revealTitle,
      sparkTitle: sparkTitle,
      type: 'post-sim',
      aiGenerated: true,
      model: 'gpt-4o',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error generating post-sim overview:', error.message);

    // Fallback to basic overview
    return {
      victoryHeadline: `✅ Mastered: ${revealTitle}`,
      celebrationOpening: `Congratulations! You've successfully completed the ${revealTitle} case.`,
      theCriticalPearl: {
        title: "The Golden Takeaway",
        content: criticalPearl,
        memoryAid: "Review this case regularly to reinforce the learning."
      },
      whatYouMastered: [
        "Assessment and diagnosis of this presentation",
        "Evidence-based management strategies",
        "Critical clinical decision-making"
      ],
      avoidTheseTraps: commonMistakes.slice(0, 2),
      realWorldImpact: {
        patientSafety: "This knowledge will help you provide excellent patient care.",
        careerProtection: "Mastering this case builds your clinical competency.",
        clinicalConfidence: "You're now better prepared for real-world practice."
      },
      nextSteps: {
        inThisPathway: `Continue your ${pathwayName} pathway with the next case.`,
        toReinforce: "Review this case periodically to maintain mastery."
      },
      rememberForever: criticalPearl,
      error: error.message,
      aiGenerated: false,
      fallbackUsed: true
    };
  }
}

/**
 * Generate both pre-sim and post-sim overviews for a case
 */
async function generateBothOverviews(caseData) {
  console.log(`   Generating overviews for: ${caseData.revealTitle || caseData.sparkTitle}...`);

  const [preSimOverview, postSimOverview] = await Promise.all([
    generatePreSimOverview(caseData),
    generatePostSimOverview(caseData)
  ]);

  return {
    caseId: caseData.currentCaseId || caseData.newId,
    sparkTitle: caseData.sparkTitle,
    revealTitle: caseData.revealTitle,
    preSimOverview,
    postSimOverview,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Batch generate overviews for all cases
 */
async function batchGenerateOverviews(cases, options = {}) {
  const {
    rateLimit = 50, // Requests per minute
    onProgress = null
  } = options;

  const results = [];
  const delayMs = (60 * 1000) / rateLimit;

  console.log('📝 Generating AI case overviews (pre-sim + post-sim)...');
  console.log('   Channeling Frank Kern & Alex Hormozi for compelling copy...');
  console.log('');

  for (let i = 0; i < cases.length; i++) {
    const caseData = cases[i];

    console.log(`   [${i + 1}/${cases.length}] ${caseData.revealTitle || caseData.sparkTitle}...`);

    // Delay to respect rate limit (both pre + post = 2 requests per case)
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs * 2));
    }

    const result = await generateBothOverviews(caseData);

    if (onProgress) {
      onProgress({
        current: i + 1,
        total: cases.length,
        caseData,
        result
      });
    }

    results.push(result);
  }

  console.log('');
  console.log('✅ Generated overviews for ' + results.length + ' cases!');
  console.log('   Each case has: Pre-sim teaser + Post-sim reinforcement');
  console.log('');

  return results;
}

/**
 * Preview overviews for a single case (for testing)
 */
function previewOverviews(overviewData) {
  const { preSimOverview, postSimOverview } = overviewData;

  console.log('═══════════════════════════════════════════════════');
  console.log('📖 PRE-SIM OVERVIEW (SBAR + Escape Room Mystery)');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('📞 SBAR HANDOFF:');
  console.log('   ' + preSimOverview.sbarHandoff);
  console.log('');
  console.log('⚠️ THE STAKES:');
  console.log('   ' + preSimOverview.theStakes);
  console.log('');
  console.log('🔍 MYSTERY HOOK:');
  console.log('   ' + preSimOverview.mysteryHook);
  console.log('');
  console.log('📚 WHAT YOU\'LL LEARN (Vague Skills):');
  preSimOverview.whatYouWillLearn.forEach((item, i) => {
    console.log(`  ${i + 1}. ${item}`);
  });
  console.log('');
  console.log('⏱️ ESTIMATED TIME: ' + preSimOverview.estimatedTime);
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('🎉 POST-SIM OVERVIEW (Victory Lap + Reinforcement)');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('🏆 HEADLINE: ' + postSimOverview.victoryHeadline);
  console.log('');
  console.log('💭 PATIENT STORY ANCHOR:');
  console.log('   ' + postSimOverview.patientStoryAnchor);
  console.log('');
  console.log('🎊 CELEBRATION:');
  console.log('   ' + postSimOverview.celebrationOpening);
  console.log('');
  console.log('💎 THE CRITICAL PEARL:');
  console.log('   ' + postSimOverview.theCriticalPearl.content);
  console.log('   💡 Memory Aid: ' + postSimOverview.theCriticalPearl.memoryAid);
  console.log('');
  console.log('✅ WHAT YOU MASTERED:');
  postSimOverview.whatYouMastered.forEach((item, i) => {
    console.log(`  ${i + 1}. ${item}`);
  });
  console.log('');
  console.log('🧠 REMEMBER FOREVER:');
  console.log('   "' + postSimOverview.rememberForever + '"');
  console.log('');
  console.log('═══════════════════════════════════════════════════');
}

module.exports = {
  initializeOpenAI,
  generatePreSimOverview,
  generatePostSimOverview,
  generateBothOverviews,
  batchGenerateOverviews,
  previewOverviews
};
