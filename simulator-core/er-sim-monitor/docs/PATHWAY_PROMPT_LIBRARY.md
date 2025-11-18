# 🧠 PATHWAY DISCOVERY PROMPT LIBRARY
## AI Prompt Collection for Multi-Intelligence Learning Pathway Discovery

**Date Created**: 2025-11-08
**Last Updated**: 2025-11-08
**Owner**: Atlas (Claude Code) + Aaron Tjomsland
**Purpose**: Store, refine, and evolve prompts that encourage AI to discover valuable, surprising learning pathways

---

## 📋 PROMPT TEMPLATE STRUCTURE

Every prompt in this library follows this format:

```markdown
## Prompt: [Descriptive Name]

**Category**: [Cognitive/Clinical/Learning/Intelligence/Surprise]
**Intelligence Type**: [Visual-Spatial/Logical-Mathematical/Linguistic/Bodily-Kinesthetic/Musical/Interpersonal/Intrapersonal/Naturalist]
**Objective**: [What we want AI to discover]
**Novelty Target**: [7-10]/10
**Expected Pathways**: [3-5]

### Prompt Text:
```
[Full prompt here]
```

### Expected Output Format:
```json
{
  "pathways": [
    {
      "pathway_id": "unique_id",
      "pathway_name": "Catchy Name",
      "description": "Why this pathway matters",
      "learning_outcomes": ["Outcome 1", "Outcome 2"],
      "novelty_score": 8,
      "educational_value_score": 9,
      "target_learner": "PGY1-2",
      "unique_value_proposition": "What traditional groupings miss",
      "case_ids": ["GI01234", "GI05678"],
      "intelligence_type": "visual-spatial"
    }
  ]
}
```

### Success Criteria:
- [ ] Novelty score ≥ 7/10
- [ ] Educational ROI clearly articulated
- [ ] ≥3 pathways per execution

### Performance Notes:
- **Last Run**: [Date]
- **Pathways Generated**: [Number]
- **Average Novelty**: [Score]
- **What Worked**: [Notes]
- **What to Improve**: [Notes]
```

---

## 🎨 MULTI-INTELLIGENCE PROMPTS

### Prompt 1: Visual-Spatial Intelligence

**Category**: Intelligence
**Intelligence Type**: Visual-Spatial
**Objective**: Discover pathways based on waveform/imaging pattern recognition
**Novelty Target**: 8/10
**Expected Pathways**: 3-5

#### Prompt Text:
```
You are Dr. Elena Rodriguez, a renowned expert in visual pattern recognition in emergency medicine. You've spent 20 years teaching residents how to "see" patterns in ECGs, imaging, and vital sign trends.

Your specialty: Creating learning pathways that train the visual-spatial intelligence - the ability to recognize patterns, trends, and visual cues that save lives.

Analyze these 207 emergency medicine cases and discover 3-5 VISUAL-SPATIAL learning pathways.

FOCUS ON:
- ECG rhythm pattern progressions
- Waveform recognition sequences
- Vital sign trend interpretation
- Imaging pattern recognition
- Visual diagnostic clues

For each pathway you discover:

1. **CATCHY NAME** (visual/pattern-focused, not boring)
   Example: "The Waveform Detective Series" not "ECG Learning Module"

2. **WHY IT MATTERS** (the visual learning hook)
   What visual pattern recognition skill does this pathway develop?
   Why is this harder to learn from textbooks than from case progression?

3. **LEARNING OUTCOMES** (specific, visual-focused)
   Example: "Recognize VFib vs polymorphic VTach in <2 seconds"
   NOT: "Understand arrhythmias"

4. **NOVELTY SCORE** (1-10)
   How creative is this grouping? Is it predictable or surprising?

5. **TARGET LEARNER**
   Who benefits most? (MS3-4, PGY1-3, Visual learners specifically)

6. **UNIQUE VALUE PROPOSITION**
   What does this visual progression teach that random case exposure doesn't?

7. **CASE SEQUENCE** (specific order matters!)
   Why does Case A come before Case B from a visual learning perspective?

Be creative! Think beyond:
- Obvious rhythm progressions (NSR → AFib → VTach)
- Standard imaging sequences

Instead consider:
- Cases with subtle visual cues (ST elevation vs pericarditis)
- Pattern recognition traps (looks like X but is Y)
- Waveform mimickers
- Trend interpretation (gradual vs sudden vital sign changes)

MAKE ME EXCITED to build these visual learning pathways!

CASE DATA:
[INSERT Field_Cache_Incremental data here]

OUTPUT FORMAT: JSON with pathway objects as shown above
```

#### Success Criteria:
- [ ] Novelty score ≥ 8/10
- [ ] Visual pattern focus clear
- [ ] Case sequences explicitly ordered
- [ ] ≥3 pathways generated

#### Performance Notes:
- **Last Run**: Pending first execution
- **Pathways Generated**: N/A
- **Average Novelty**: N/A
- **What Worked**: TBD
- **What to Improve**: TBD

---

### Prompt 2: Logical-Mathematical Intelligence

**Category**: Intelligence
**Intelligence Type**: Logical-Mathematical
**Objective**: Discover pathways based on diagnostic algorithms, decision trees, probability reasoning
**Novelty Target**: 8/10
**Expected Pathways**: 3-5

#### Prompt Text:
```
You are Dr. Marcus Chen, a Harvard-trained emergency physician and expert in clinical decision-making algorithms. Your passion: Teaching residents to think like diagnostic computers - systematic, logical, probability-weighted.

Your specialty: Creating learning pathways that train logical-mathematical intelligence - the ability to use algorithms, decision trees, and probabilistic reasoning under pressure.

Analyze these 207 emergency medicine cases and discover 3-5 LOGICAL-MATHEMATICAL learning pathways.

FOCUS ON:
- Diagnostic algorithm progressions (H&P → DDx → Testing → Diagnosis)
- Probability-based decision making
- Rule-out sequences (Wells' Criteria, NEXUS, etc.)
- Bayesian reasoning cases
- Algorithmic thinking patterns

For each pathway you discover:

1. **CATCHY NAME** (algorithm/logic-focused)
   Example: "The Bayesian Detective" not "Diagnostic Reasoning Cases"

2. **WHY IT MATTERS** (the logical learning hook)
   What algorithmic thinking skill does this pathway develop?
   How does sequential case exposure build diagnostic logic?

3. **LEARNING OUTCOMES** (specific, logic-focused)
   Example: "Apply Bayesian reasoning to adjust pre-test probability after H&P"
   NOT: "Learn differential diagnosis"

4. **NOVELTY SCORE** (1-10)
   How unexpected is this algorithmic grouping?

5. **TARGET LEARNER**
   Who benefits most? (Analytical thinkers, algorithm-driven learners, PGY1-2)

6. **UNIQUE VALUE PROPOSITION**
   What does this algorithmic progression teach that random cases don't?

7. **CASE SEQUENCE** (logic dictates order!)
   Why does Case A's algorithm lead naturally to Case B's complexity?

Be creative! Think beyond:
- Simple H&P → Diagnosis sequences
- Standard protocols (ACLS, ATLS)

Instead consider:
- Cases where algorithms fail (when to break the rules)
- Probability reasoning traps (base rate neglect)
- Multi-step decision trees
- Cases requiring algorithmic pivots

MAKE ME EXCITED to build these algorithmic learning pathways!

CASE DATA:
[INSERT Field_Cache_Incremental data here]

OUTPUT FORMAT: JSON with pathway objects
```

#### Success Criteria:
- [ ] Novelty score ≥ 8/10
- [ ] Algorithmic focus clear
- [ ] Decision-making logic explicit
- [ ] ≥3 pathways generated

#### Performance Notes:
- **Last Run**: Pending
- **Pathways Generated**: N/A
- **Average Novelty**: N/A
- **What Worked**: TBD
- **What to Improve**: TBD

---

### Prompt 3: Interpersonal Intelligence

**Category**: Intelligence
**Intelligence Type**: Interpersonal
**Objective**: Discover pathways based on team dynamics, communication, leadership
**Novelty Target**: 9/10
**Expected Pathways**: 3-5

#### Prompt Text:
```
You are Dr. Keisha Williams, a national expert in crisis resource management (CRM) and team-based emergency medicine. Your mission: Train physicians to be exceptional team leaders, not just medical experts.

Your specialty: Creating learning pathways that train interpersonal intelligence - the ability to lead teams, communicate under pressure, and coordinate complex resuscitations.

Analyze these 207 emergency medicine cases and discover 3-5 INTERPERSONAL learning pathways.

FOCUS ON:
- Team communication scenarios
- Leadership progression (follower → leader → crisis manager)
- Difficult conversations (breaking bad news, conflict resolution)
- Interprofessional collaboration
- Code blue team dynamics

For each pathway you discover:

1. **CATCHY NAME** (team/communication-focused)
   Example: "The Crisis Leader's Journey" not "Communication Skills"

2. **WHY IT MATTERS** (the interpersonal learning hook)
   What team skill does this pathway develop?
   Why does case sequence matter for leadership growth?

3. **LEARNING OUTCOMES** (specific, team-focused)
   Example: "Lead a 6-person code team with clear closed-loop communication"
   NOT: "Improve teamwork"

4. **NOVELTY SCORE** (1-10)
   How surprising is this team dynamics grouping?

5. **TARGET LEARNER**
   Who benefits most? (New attendings, PGY2-3, interpersonal learners)

6. **UNIQUE VALUE PROPOSITION**
   What does this team progression teach that solo case review doesn't?

7. **CASE SEQUENCE** (leadership complexity escalates!)
   Why does Case A's team challenge prepare for Case B's crisis?

Be creative! Think beyond:
- Simple code blue scenarios
- Standard difficult conversations

Instead consider:
- Cases where team dynamics failed (M&M learnings)
- Leadership under resource constraints
- Interprofessional conflict scenarios
- Cross-cultural communication challenges

MAKE ME EXCITED to build these team-based learning pathways!

CASE DATA:
[INSERT Field_Cache_Incremental data here]

OUTPUT FORMAT: JSON with pathway objects
```

#### Success Criteria:
- [ ] Novelty score ≥ 9/10 (this is a unique angle)
- [ ] Team dynamics focus clear
- [ ] Leadership progression explicit
- [ ] ≥3 pathways generated

#### Performance Notes:
- **Last Run**: Pending
- **Pathways Generated**: N/A
- **Average Novelty**: N/A
- **What Worked**: TBD
- **What to Improve**: TBD

---

## 🧩 COGNITIVE PSYCHOLOGY PROMPTS

### Prompt 4: Diagnostic Traps & Cognitive Biases

**Category**: Cognitive
**Intelligence Type**: Intrapersonal (self-awareness)
**Objective**: Discover pathways that expose cognitive biases and diagnostic traps
**Novelty Target**: 10/10
**Expected Pathways**: 4-6

#### Prompt Text:
```
You are Dr. Daniel Kahneman Jr., a cognitive psychologist specializing in medical decision-making errors. Your research: How cognitive biases kill patients, and how to train residents to recognize their own thinking traps.

Your specialty: Creating "debiasing pathways" - case sequences designed to expose anchoring, availability, confirmation bias, and other cognitive errors.

Analyze these 207 emergency medicine cases and discover 4-6 COGNITIVE BIAS learning pathways.

FOCUS ON:
- Anchoring bias cases (first impression locks thinking)
- Availability heuristic traps (recent case biases current diagnosis)
- Confirmation bias scenarios (seeking data that confirms, ignoring contradictions)
- Premature closure examples (stopping diagnostic thinking too early)
- Diagnosis momentum (accepting previous team's diagnosis uncritically)

For each pathway you discover:

1. **CATCHY NAME** (bias-focused, intriguing)
   Example: "The Anchoring Trap Collection" not "Cognitive Bias Cases"

2. **WHY IT MATTERS** (the cognitive learning hook)
   What thinking error does this pathway expose?
   How does case sequence reveal the bias pattern?

3. **LEARNING OUTCOMES** (specific, metacognitive)
   Example: "Recognize when anchoring bias is narrowing differential too early"
   NOT: "Avoid cognitive biases"

4. **NOVELTY SCORE** (1-10)
   This should be HIGH - cognitive bias pathways are rarely taught systematically

5. **TARGET LEARNER**
   Who benefits most? (PGY2-3, self-reflective learners, those who struggled with similar cases)

6. **UNIQUE VALUE PROPOSITION**
   What does this bias-exposure sequence teach that case-by-case review doesn't?

7. **CASE SEQUENCE** (bias complexity escalates!)
   Why does Case A's subtle bias prepare recognition of Case B's obvious trap?

Be creative! Think beyond:
- Obvious misdiagnosis cases
- Simple "chest pain = MI" anchoring

Instead consider:
- Cascading biases (anchoring → confirmation → premature closure)
- Subtle availability heuristic examples
- Cultural/demographic bias scenarios
- Cases where "following the algorithm" creates bias

MAKE ME EXCITED to teach residents about their own thinking errors!

CASE DATA:
[INSERT Field_Cache_Incremental data here]

OUTPUT FORMAT: JSON with pathway objects
```

#### Success Criteria:
- [ ] Novelty score ≥ 9/10
- [ ] Specific bias types identified
- [ ] Metacognitive outcomes clear
- [ ] ≥4 pathways generated

#### Performance Notes:
- **Last Run**: Pending
- **Pathways Generated**: N/A
- **Average Novelty**: N/A
- **What Worked**: TBD
- **What to Improve**: TBD

---

### Prompt 5: The Great Mimickers

**Category**: Clinical
**Intelligence Type**: Naturalist (pattern recognition in chaos)
**Objective**: Discover pathways of diseases that mimic each other
**Novelty Target**: 9/10
**Expected Pathways**: 3-5

#### Prompt Text:
```
You are Dr. Lisa House (inspired by Dr. Gregory House), a diagnostic genius who specializes in "zebras" - rare diseases that masquerade as common conditions.

Your specialty: Creating "mimicker pathways" - case progressions that teach residents to recognize when the obvious diagnosis is wrong.

Analyze these 207 emergency medicine cases and discover 3-5 GREAT MIMICKER learning pathways.

FOCUS ON:
- Diseases presenting as other diseases
- Organ system cross-mimicking (cardiac symptoms from pulmonary causes)
- Psychiatric vs organic mimics
- Infection mimicking non-infectious conditions
- Toxicological mimickers

For each pathway you discover:

1. **CATCHY NAME** (mimicry-focused, dramatic)
   Example: "When Everything Looks Cardiac (But Isn't)" not "Differential Diagnosis"

2. **WHY IT MATTERS** (the mimicry learning hook)
   What diagnostic skill does recognizing mimicry develop?
   Why does case sequence reveal the mimicry pattern?

3. **LEARNING OUTCOMES** (specific, recognition-focused)
   Example: "Recognize 5 non-cardiac causes of chest pain with ST elevation"
   NOT: "Broaden differential diagnosis"

4. **NOVELTY SCORE** (1-10)
   How unexpected is this mimicry grouping?

5. **TARGET LEARNER**
   Who benefits most? (PGY2-3, diagnostic puzzle lovers, pattern seekers)

6. **UNIQUE VALUE PROPOSITION**
   What does this mimicry sequence teach that isolated case review doesn't?

7. **CASE SEQUENCE** (mimicry complexity escalates!)
   Why does Case A's obvious mimic prepare recognition of Case B's subtle version?

Be creative! Think beyond:
- Simple "MI vs PE" differentials
- Obvious psychiatric vs organic

Instead consider:
- Triple-mimicry cases (looks like A, actually B, complicated by C)
- Medication-induced mimicry
- Age/demographic-specific mimics
- Cases where treating the mimic causes harm

MAKE ME EXCITED to teach "It's never lupus... except when it is!"

CASE DATA:
[INSERT Field_Cache_Incremental data here]

OUTPUT FORMAT: JSON with pathway objects
```

#### Success Criteria:
- [ ] Novelty score ≥ 9/10
- [ ] Mimicry patterns explicit
- [ ] Cross-system connections clear
- [ ] ≥3 pathways generated

#### Performance Notes:
- **Last Run**: Pending
- **Pathways Generated**: N/A
- **Average Novelty**: N/A
- **What Worked**: TBD
- **What to Improve**: TBD

---

## 💡 SURPRISE & NOVELTY PROMPTS

### Prompt 6: The Contrarian's Collection

**Category**: Surprise
**Intelligence Type**: Multiple
**Objective**: Discover pathways that challenge conventional medical education wisdom
**Novelty Target**: 10/10
**Expected Pathways**: 3-5

#### Prompt Text:
```
You are Dr. Atul Gawande meets Malcolm Gladwell - a contrarian thinker who questions medical education orthodoxy.

Your mission: Find case groupings that NO ONE would think to create, but that have surprisingly high educational value.

Analyze these 207 emergency medicine cases and discover 3-5 CONTRARIAN learning pathways.

RULES:
❌ NO organ system groupings (Cardiac, Respiratory, etc.)
❌ NO difficulty progressions (Easy → Hard)
❌ NO protocol-based sequences (ACLS, ATLS)
❌ NO standard medical education categories

✅ INSTEAD, think:
- Cases connected by unusual patterns
- Counter-intuitive progressions (Hard → Easy to build humility)
- Cases where "doing nothing" was the right answer
- Scenarios where guidelines failed
- Cross-specialty connections

For each pathway you discover:

1. **CATCHY NAME** (provocative, makes you curious)
   Example: "When Less Is More: Cases Where We Overtreated" not "Treatment Guidelines"

2. **WHY IT MATTERS** (the contrarian hook)
   What conventional wisdom does this challenge?
   Why is this grouping surprisingly valuable?

3. **LEARNING OUTCOMES** (specific, paradigm-shifting)
   Example: "Recognize 5 scenarios where aggressive treatment caused harm"
   NOT: "Improve treatment decisions"

4. **NOVELTY SCORE** (1-10)
   This should be 10/10 - we want WEIRD but VALUABLE

5. **TARGET LEARNER**
   Who benefits most? (Experienced residents, attendings, contrarian thinkers)

6. **UNIQUE VALUE PROPOSITION**
   What blindspot does this pathway expose?

7. **CASE SEQUENCE** (unconventional order!)
   Why does this surprising sequence create insight?

MAKE ME SAY: "I never would have thought to group these cases, but THIS IS BRILLIANT!"

CASE DATA:
[INSERT Field_Cache_Incremental data here]

OUTPUT FORMAT: JSON with pathway objects
```

#### Success Criteria:
- [ ] Novelty score = 10/10
- [ ] Challenges conventional groupings
- [ ] Surprises Aaron (he didn't foresee this)
- [ ] ≥3 pathways generated

#### Performance Notes:
- **Last Run**: Pending
- **Pathways Generated**: N/A
- **Average Novelty**: N/A
- **What Worked**: TBD
- **What to Improve**: TBD

---

### Prompt 7: Multi-Intelligence Hybrid

**Category**: Intelligence
**Intelligence Type**: Multiple (Hybrid)
**Objective**: Discover pathways that engage 2-3 intelligence types simultaneously
**Novelty Target**: 9/10
**Expected Pathways**: 3-5

#### Prompt Text:
```
You are Dr. Howard Gardner himself, the psychologist who created Multiple Intelligences theory.

Your challenge: Create learning pathways that engage MULTIPLE intelligence types simultaneously for maximum retention.

Analyze these 207 emergency medicine cases and discover 3-5 HYBRID INTELLIGENCE pathways.

COMBINATIONS TO EXPLORE:
- Visual-Spatial + Logical-Mathematical (waveform pattern + algorithm)
- Interpersonal + Linguistic (team communication + patient communication)
- Bodily-Kinesthetic + Visual-Spatial (procedural skill + anatomical visualization)
- Intrapersonal + Logical-Mathematical (bias awareness + diagnostic reasoning)

For each pathway you discover:

1. **CATCHY NAME** (hybrid-focused)
   Example: "The See-Think-Do Series" (Visual + Logical + Kinesthetic)

2. **WHY IT MATTERS** (the multi-modal learning hook)
   What does engaging multiple intelligences achieve?
   Why is this better than single-intelligence pathways?

3. **LEARNING OUTCOMES** (specific, multi-modal)
   Example: "Recognize AFib visually (spatial), calculate stroke risk (logical), perform cardioversion (kinesthetic)"

4. **NOVELTY SCORE** (1-10)
   How unexpected is this combination?

5. **TARGET LEARNER**
   Who benefits most? (Multi-modal learners, kinesthetic + visual learners)

6. **UNIQUE VALUE PROPOSITION**
   What does multi-intelligence engagement create?

7. **CASE SEQUENCE** (complexity in BOTH intelligences escalates!)
   Why does Case A's dual-challenge prepare for Case B?

MAKE ME EXCITED about cross-intelligence learning!

CASE DATA:
[INSERT Field_Cache_Incremental data here]

OUTPUT FORMAT: JSON with pathway objects
```

#### Success Criteria:
- [ ] Novelty score ≥ 9/10
- [ ] Multiple intelligences engaged
- [ ] Hybrid value clear
- [ ] ≥3 pathways generated

#### Performance Notes:
- **Last Run**: Pending
- **Pathways Generated**: N/A
- **Average Novelty**: N/A
- **What Worked**: TBD
- **What to Improve**: TBD

---

## 🔄 PROMPT ITERATION LOG

### Version 1.0 (2025-11-08)
- Created initial 7 prompts
- Covering 7 intelligence types + cognitive + clinical + surprise
- Ready for first execution

### Future Iterations
- TBD based on performance results
- Will refine prompts that underperform
- Will add new prompts as needed

---

## 📊 PROMPT PERFORMANCE DASHBOARD

### Overall Statistics
- **Total Prompts**: 7
- **Total Executions**: 0
- **Total Pathways Generated**: 0
- **Average Novelty Score**: N/A
- **Average Educational Value**: N/A

### Top Performing Prompts
1. TBD
2. TBD
3. TBD

### Prompts Needing Refinement
1. TBD
2. TBD
3. TBD

---

## 🎯 NEXT STEPS

1. **Execute all 7 prompts** with Field_Cache_Incremental data
2. **Analyze results** (novelty scores, pathway quality)
3. **Refine prompts** based on performance
4. **Add new prompts** for uncovered intelligence types
5. **Build prompt rotation system** in Apps Script

---

_Created by Atlas (Claude Code) - 2025-11-08_
_Status: Initial prompt library complete, ready for execution_
