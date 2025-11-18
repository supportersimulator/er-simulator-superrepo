# AI Pathway Discovery - Product Specification

## Vision
**Transform the bird's eye view into an AI-powered consultation where GPT pitches you on the best possible pathway groupings, explaining WHY each one has unique educational value.**

Instead of static cards showing "57 cases, 95% confidence", you get:
- **Compelling narratives** about what makes each pathway special
- **Educational ROI** - what learners will gain
- **Novelty scores** - how creative/unexpected the grouping is
- **Use cases** - when to deploy this pathway
- **Unique value propositions** - what this teaches that others don't

## User Experience Flow

### 1. Initial View: AI-Generated Pitch Cards
When you open "Intelligent Pathway Opportunities":

```
┌──────────────────────────────────────────────────────────────┐
│  🧠 Pathway Chain Builder - AI-Powered Recommendations      │
│                                                             │
│  [🤖 Discover Novel Pathways]  [🔄 Refresh AI Analysis]    │
└──────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│ 🎯 "The Diagnostic Traps Collection"                      │
│ ⭐⭐⭐⭐⭐ Novelty Score: 9/10 | 8 cases                   │
│                                                           │
│ WHY THIS PATHWAY MATTERS:                                 │
│ These aren't just chest pain cases - they're the ones    │
│ that fool even experienced clinicians. Each presents as  │
│ an obvious MI but turns out to be something else entirely│
│ (aortic dissection, PE, esophageal rupture). Perfect for │
│ fighting anchoring bias.                                  │
│                                                           │
│ LEARNING OUTCOMES:                                        │
│ • Recognize red flags that break typical MI patterns     │
│ • Systematic approach to "too perfect" presentations     │
│ • Decision-making under diagnostic uncertainty           │
│                                                           │
│ BEST FOR:                                                 │
│ 🎓 Residents who've seen 50+ STEMIs                      │
│ 🧠 Cognitive debiasing training                          │
│ 📊 QI/M&M case review preparation                        │
│                                                           │
│ [🚀 Build This Pathway] [💡 Tell Me More]                │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│ 💢 "The Great Mimickers: When Everything Looks Cardiac"  │
│ ⭐⭐⭐⭐ Novelty Score: 8/10 | 6 cases                    │
│                                                           │
│ WHY THIS PATHWAY MATTERS:                                 │
│ Pneumonia presenting as MI. PE presenting as MI. Panic   │
│ attack presenting as MI. This pathway teaches the art of │
│ differential diagnosis when your gut screams "heart" but │
│ the answer is elsewhere.                                  │
│                                                           │
│ [🚀 Build This Pathway] [💡 Tell Me More]                │
└───────────────────────────────────────────────────────────┘
```

### 2. Click "🤖 Discover Novel Pathways"
AI analyzes your entire case catalog and returns 5-8 unique groupings with detailed pitches.

### 3. Click "💡 Tell Me More"
Expands the card to show:
- Full case list with titles
- Specific sequencing recommendations
- Estimated learning time
- Prerequisite knowledge required
- Related pathways to explore next

### 4. Click "🚀 Build This Pathway"
Opens the pathway chain builder pre-loaded with these cases.

## AI Prompt Engineering

The AI system is prompted to act as a **senior medical educator consultant** who:

1. **Identifies non-obvious patterns** in your case collection
2. **Crafts compelling narratives** about why each grouping matters
3. **Quantifies educational value** with specific metrics
4. **Recommends target audiences** (interns, residents, attendings)
5. **Explains unique value propositions** (what this teaches that others don't)

### Example AI Prompt Structure

```
You are Dr. Sarah Chen, a renowned medical educator and curriculum designer at Stanford Emergency Medicine. You're consulting with a program director who has 150 simulation cases and wants to build innovative learning pathways.

Your job: Analyze their case catalog and pitch them on 5-8 novel pathway groupings that maximize educational ROI.

For each pathway, write a compelling pitch that includes:

1. CATCHY NAME (not boring like "Cardiovascular System")
2. WHY IT MATTERS (the educational "hook" - why this is special)
3. LEARNING OUTCOMES (specific, measurable)
4. BEST FOR (target audience and use cases)
5. NOVELTY SCORE (1-10, how creative is this grouping)
6. UNIQUE VALUE PROPOSITION (what this teaches that traditional groupings miss)

Be creative! Think beyond systems and symptoms. Consider:
- Cognitive psychology patterns (anchoring, availability bias)
- Practice gaps (things residents struggle with)
- High-impact low-frequency events
- Communication/teamwork scenarios
- Ethical dilemmas
- Resource-limited environments
- Atypical presentations

Make me EXCITED to build these pathways!
```

## Technical Implementation

### Backend Function
```javascript
function discoverPathwaysWithPitch_() {
  // 1. Get all cases
  const analysis = analyzeCatalog_();
  const cases = analysis.allCases;

  // 2. Build case summaries for AI
  const caseSummaries = cases.map(c => ({
    id: c.caseId,
    title: c.sparkTitle,
    diagnosis: c.diagnosis,
    learning: c.learningOutcomes,
    category: c.category
  }));

  // 3. Call OpenAI with "consultant pitch" prompt
  const pathways = callOpenAIForPathwayPitches_(caseSummaries);

  // 4. Return formatted pitch cards
  return pathways;
}
```

### Frontend Rendering
Each pathway card includes:
- **Hero section**: Icon, name, star rating, novelty score
- **Pitch section**: Compelling narrative (2-3 sentences)
- **Learning outcomes**: Bullet list
- **Target audience**: Who this is best for
- **Action buttons**: "Build This Pathway", "Tell Me More"

## Benefits

### For Educators
- ✅ Saves hours of curriculum design time
- ✅ Discovers patterns you might have missed
- ✅ Provides ready-made educational justifications
- ✅ Creates excitement around innovative teaching

### For Learners
- ✅ More engaging pathway names and descriptions
- ✅ Clear learning objectives upfront
- ✅ Pathways designed for their level and needs
- ✅ Non-traditional groupings that boost retention

### For the System
- ✅ Differentiates from generic case libraries
- ✅ Showcases AI-powered innovation
- ✅ Increases pathway creation and usage
- ✅ Provides valuable analytics on pathway popularity

## Example Pitch Cards

### Traditional Approach (Boring)
```
Cardiovascular System Mastery
76 cases | 90% confidence
Sufficient cardiac cases to build comprehensive system-based learning pathway
```

### AI Pitch Approach (Exciting)
```
🫀 "The MI Detective Series: When Classic Isn't Classic"
⭐⭐⭐⭐⭐ Novelty: 9/10 | 12 cases

WHY THIS PATHWAY MATTERS:
You've seen textbook STEMIs. Now see the ones that break all the rules:
posterior MIs with normal troponins, Wellens' syndrome caught between
attacks, and Takotsubo that fooled the cath lab. This pathway turns
pattern recognition into diagnostic skepticism.

LEARNING OUTCOMES:
• Master atypical ECG presentations of ACS
• Recognize limitations of standard troponin protocols
• Navigate gray zones in PCI decision-making

BEST FOR:
🎓 2nd/3rd year residents | 📊 Board prep | 🧠 Cognitive flexibility training

UNIQUE VALUE: While others teach "classic MI", this teaches "convincing
non-MI" and "unconvincing MI" - the diagnostic edges where real expertise lives.

[🚀 Build This Pathway] [💡 Show Me The Cases]
```

## Next Steps

1. ✅ Created enhanced pathway detection (diagnosis, presentation, acuity-based)
2. ✅ Created AI discovery system with OpenAI integration
3. ⏳ Integrate into bird's eye view with pitch cards
4. ⏳ Add "Tell Me More" expansion functionality
5. ⏳ Connect "Build This Pathway" to chain builder
6. ⏳ Add feedback loop (which pathways users actually build)

Ready to deploy this when you give the green light!
