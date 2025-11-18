/**
 * AI-POWERED PATHWAY DISCOVERY SYSTEM - DUAL MODE
 *
 * TWO creativity levels:
 * 1. STANDARD MODE (temperature: 0.7) - Creative but grounded
 * 2. RADICAL MODE (temperature: 1.0) - Maximum creativity, experimental
 *
 * Uses OpenAI GPT to intelligently discover novel pathway groupings
 * that go beyond traditional rule-based clustering.
 */

/**
 * Generate AI-discovered pathways - STANDARD CREATIVITY
 * This is called when user clicks "🤖 AI: Discover Novel Pathways" button
 */
function discoverNovelPathwaysWithAI_(creativityMode) {
  creativityMode = creativityMode || 'standard'; // 'standard' or 'radical'

  // Get API key from Settings sheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settingsSheet = ss.getSheetByName('Settings');
  let apiKey = '';

  if (settingsSheet) {
    apiKey = settingsSheet.getRange('B2').getValue();
    Logger.log('🔑 Retrieved API key from Settings!B2 for pathway discovery');
  }

  if (!apiKey) {
    return {
      success: false,
      error: 'No OpenAI API key found in Settings!B2. Please add your API key to use AI pathway discovery.',
      pathways: []
    };
  }

  // Get all cases
  const analysis = analyzeCatalog_();
  const cases = analysis.allCases;

  // Build a concise summary of all cases for the AI
  const caseSummaries = cases.map(function(c) {
    return {
      id: c.caseId,
      title: c.sparkTitle,
      diagnosis: c.diagnosis || 'Not specified',
      learning: (c.learningOutcomes || 'Not specified').substring(0, 100),
      category: c.category
    };
  });

  // Create the prompt based on creativity mode
  let prompt = '';
  let temperature = 0.7;

  if (creativityMode === 'radical') {
    temperature = 1.0;
    prompt = `You are Dr. Zara Blackwood, a visionary medical educator who pushes boundaries and challenges conventional thinking. You're known for revolutionary, sometimes controversial, but highly effective teaching methods that create unforgettable learning experiences.

YOUR RADICAL CHALLENGE: Blow my mind. Create pathway groupings so creative they border on experimental, but PROVE their educational value. Think:
- Game design psychology meets emergency medicine
- Behavioral economics meets clinical decision-making
- Film narrative structure meets patient care
- Music theory meets vital sign patterns
- Sports psychology meets resuscitation

RADICAL GROUPING CONCEPTS (go wild):
🎲 "The Gambler's Fallacy Cases" - Learn probability and base rates through cases where intuition fails
🎭 "The Method Actor's Toolkit" - Embody the patient's experience to understand presentations
🧬 "The Butterfly Effect" - Tiny early interventions that cascade into massive outcomes
🎸 "The Jazz Improvisation Protocol" - Cases requiring creative problem-solving when protocols fail
🏋️ "The Mental Strength Training" - Psychological resilience through high-stress scenarios
🎨 "The Art of Diagnosis" - Pattern recognition as visual/spatial skill
🕵️ "The Detective's Casebook" - Sherlock Holmes-style deductive reasoning
⚡ "The Lightning Round" - Rapid-fire decision chains (every 30 seconds matters)
🎯 "The Precision Sniper" - Cases where ONE specific detail changes everything
🧘 "The Zen Master Path" - Calm under chaos, mindfulness in crisis

FORBIDDEN THINKING:
❌ Safe, obvious groupings
❌ Traditional medical categories
❌ Anything a textbook would suggest

RADICAL REQUIREMENTS:
1. Each pathway must teach something NO traditional curriculum teaches
2. Novelty score must be 8-10/10 (aim for 10)
3. Justify WHY this unconventional approach creates better learning
4. Show the psychological/cognitive science behind your method
5. Be provocative but defensible

ANALYZE THESE ${cases.length} CASES:
${JSON.stringify(caseSummaries, null, 2)}

INVENT 5-8 RADICALLY CREATIVE PATHWAYS. For each:

1. pathway_name: Make it PROVOCATIVE and unforgettable
2. pathway_icon: Single emoji that captures the radical vibe
3. grouping_logic_type: Invent a NEW category (be revolutionary)
4. why_this_matters: Your elevator pitch - WHY this radical approach works (2-3 sentences)
5. learning_outcomes: 3-4 specific, measurable outcomes
6. best_for: Target audience and specific use cases
7. unique_value: What this teaches that NOTHING else could teach
8. case_ids: Array of case IDs (minimum 3 cases)
9. novelty_score: 1-10 (AIM FOR 9-10)
10. estimated_learning_time: How long to complete this pathway
11. difficulty_curve: "Gentle", "Steep", or "Rollercoaster"
12. scientific_rationale: What learning science / psychology backs this approach

PUSH BOUNDARIES. BE BOLD. CREATE SOMETHING THAT DOESN'T EXIST YET.

Return ONLY valid JSON array. No markdown, no explanation.`;
  } else {
    // STANDARD MODE
    prompt = `You are Dr. Maria Rodriguez, an award-winning medical educator known for creative but grounded curriculum design. You excel at finding innovative learning pathways that are practical yet engaging.

YOUR CHALLENGE: Create novel pathway groupings that go beyond traditional categories while maintaining educational rigor.

FORBIDDEN (too boring):
❌ "All cardiac cases"
❌ "Respiratory system review"
❌ "Pediatric patients"
❌ Any grouping by body system, age, or acuity alone

ENCOURAGED (creative clustering logic):
✅ Psychological patterns (cases that trigger specific cognitive biases)
✅ Emotional journey (frustration → relief → confidence building)
✅ Narrative arcs (mystery stories, plot twists, "aha!" moments)
✅ Skill scaffolding (micro-skills that build toward mastery)
✅ Common mistakes (cases where residents make the same error)
✅ Time pressure patterns (5-minute decisions vs 2-hour workups)
✅ Communication complexity (difficult conversations, bad news, conflict)
✅ Diagnostic philosophy (Bayesian reasoning, heuristics, system 1 vs 2 thinking)
✅ Real-world chaos (messy presentations, incomplete information, uncertainty)
✅ Career milestones (first code, first death, first save)
✅ Pattern interrupts (cases that shatter assumptions)
✅ Ethical dilemmas (resource allocation, futility, family demands)

EXAMPLES OF BRILLIANT PATHWAYS:
🎭 "The Imposter Syndrome Destroyer" - Cases that LOOK overwhelming but have surprisingly simple solutions (builds confidence)
🧩 "The Puzzle Master Series" - Each case has one weird finding that's the key to everything
🎢 "The Rollercoaster: Stable → Unstable → Saved" - Emotional resilience training
🔮 "The Fortune Teller Challenge" - Predict the diagnosis from just the chief complaint
🎯 "The 90-Second Saves" - Cases where ONE decision in the first 90 seconds changes everything
🧠 "The Overthinking Trap" - Cases where the obvious diagnosis IS correct (fights premature closure)
💡 "The Lightbulb Moments" - Cases designed to create lasting clinical insights
🎪 "The Chaos Theory" - Multiple things going wrong simultaneously
🦸 "The Hero's Journey" - Progression from novice to expert in one pathway

ANALYZE THESE ${cases.length} CASES:
${JSON.stringify(caseSummaries, null, 2)}

INVENT 5-8 PATHWAYS using completely unique grouping logic. For each:

1. pathway_name: Make it EXCITING and memorable (like a Netflix series title)
2. pathway_icon: Single emoji that captures the vibe
3. grouping_logic_type: Invent a NEW category (e.g., "Emotional Arc", "Cognitive Trap Pattern", "Narrative Structure")
4. why_this_matters: Your 30-second elevator pitch - sell me on why this is brilliant (2-3 sentences)
5. learning_outcomes: 3-4 specific, measurable outcomes
6. best_for: Target audience and specific use cases
7. unique_value: What this teaches that NO other grouping could teach
8. case_ids: Array of case IDs (minimum 3 cases)
9. novelty_score: 1-10 (aim for 7+)
10. estimated_learning_time: How long to complete this pathway
11. difficulty_curve: "Gentle", "Steep", or "Rollercoaster"

BE BOLD. BE CREATIVE. INVENT GROUPING TYPES THAT DON'T EXIST YET.

Return ONLY valid JSON array. No markdown, no explanation.`;
  }

  try {
    // Call OpenAI API
    const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: creativityMode === 'radical'
              ? 'You are an experimental medical educator who pushes boundaries while maintaining educational rigor. You specialize in applying cognitive science, game design, and behavioral psychology to medical education.'
              : 'You are an expert medical educator specializing in simulation-based learning and case-based curriculum design. You excel at finding non-obvious educational patterns and creating innovative learning pathways.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: temperature,
        max_tokens: 2500
      }),
      muteHttpExceptions: true
    });

    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    if (responseCode !== 200) {
      Logger.log('❌ OpenAI API error: ' + responseCode + ' - ' + responseText);
      return {
        success: false,
        error: 'OpenAI API error: ' + responseCode,
        pathways: []
      };
    }

    const data = JSON.parse(responseText);
    const aiResponse = data.choices[0].message.content;

    Logger.log('🤖 AI Response (' + creativityMode + ' mode): ' + aiResponse.substring(0, 500) + '...');

    // Parse the AI's JSON response
    let pathways = [];
    try {
      // Try to extract JSON from the response (AI sometimes wraps it in markdown)
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        pathways = JSON.parse(jsonMatch[0]);
      } else {
        pathways = JSON.parse(aiResponse);
      }
    } catch (e) {
      Logger.log('❌ Failed to parse AI response as JSON: ' + e.message);
      return {
        success: false,
        error: 'Failed to parse AI response. Please try again.',
        pathways: []
      };
    }

    // Convert AI pathways to our standard format with ALL creative fields
    const formattedPathways = pathways.map(function(pw, index) {
      return {
        id: 'ai_' + creativityMode + '_' + (index + 1),
        name: pw.pathway_name || 'Unnamed Pathway',
        logicType: pw.grouping_logic_type || 'ai_discovered',
        icon: pw.pathway_icon || '🤖',
        confidence: (pw.novelty_score || 5) / 10, // Convert 1-10 to 0-1
        caseCount: (pw.case_ids || []).length,
        pitch: pw.why_this_matters || '',
        learningOutcomes: pw.learning_outcomes || [],
        bestFor: pw.best_for || '',
        uniqueValue: pw.unique_value || '',
        noveltyScore: pw.novelty_score || 5,
        estimatedTime: pw.estimated_learning_time || 'Not specified',
        difficultyCurve: pw.difficulty_curve || 'Unknown',
        scientificRationale: pw.scientific_rationale || '',
        creativityMode: creativityMode,
        suggestedCases: pw.case_ids || []
      };
    });

    return {
      success: true,
      pathways: formattedPathways,
      aiInsights: 'AI discovered ' + formattedPathways.length + ' ' + creativityMode + ' pathway groupings'
    };

  } catch (e) {
    Logger.log('❌ Error calling OpenAI API: ' + e.message);
    return {
      success: false,
      error: 'Error: ' + e.message,
      pathways: []
    };
  }
}

/**
 * Show AI-discovered pathways in a dialog
 * creativityMode: 'standard' or 'radical'
 */
function showAIDiscoveredPathways(creativityMode) {
  creativityMode = creativityMode || 'standard';
  const result = discoverNovelPathwaysWithAI_(creativityMode);

  if (!result.success) {
    const ui = SpreadsheetApp.getUi();
    ui.alert('AI Pathway Discovery Failed', result.error, ui.ButtonSet.OK);
    return;
  }

  const modeLabel = creativityMode === 'radical' ? '🔥 RADICAL EXPERIMENTAL' : '🤖 CREATIVE';
  const modeColor = creativityMode === 'radical' ? '#ff6b00' : '#2357ff';

  // Build stunning HTML for AI pitch cards
  let html = '<style>' +
    'body { font-family: "Segoe UI", Arial, sans-serif; background: #0a0b0e; color: #fff; padding: 24px; margin: 0; }' +
    '.header { text-align: center; margin-bottom: 32px; }' +
    '.header h1 { font-size: 28px; font-weight: 700; background: linear-gradient(135deg, ' + modeColor + ' 0%, #00d4ff 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0; }' +
    '.header .mode-badge { display: inline-block; background: ' + modeColor + '; color: #fff; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 1px; margin-top: 12px; }' +
    '.header p { color: #8b92a0; font-size: 14px; margin-top: 8px; }' +
    '.pathway-card { background: linear-gradient(135deg, #1a1f2e 0%, #141824 100%); border: 2px solid transparent; border-radius: 16px; padding: 24px; margin-bottom: 24px; position: relative; overflow: hidden; transition: all 0.3s ease; }' +
    '.pathway-card::before { content: ""; position: absolute; top: 0; left: 0; right: 0; bottom: 0; border-radius: 16px; padding: 2px; background: linear-gradient(135deg, ' + modeColor + ' 0%, #ff6b00 100%); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; opacity: 0; transition: opacity 0.3s ease; }' +
    '.pathway-card:hover::before { opacity: 1; }' +
    '.pathway-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(' + (creativityMode === 'radical' ? '255, 107, 0' : '35, 87, 255') + ', 0.3); }' +
    '.pathway-header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }' +
    '.pathway-icon { font-size: 42px; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3)); }' +
    '.pathway-title-section { flex: 1; }' +
    '.pathway-name { font-size: 22px; font-weight: 700; margin: 0; line-height: 1.3; }' +
    '.pathway-logic-type { font-size: 11px; text-transform: uppercase; color: #00d4ff; font-weight: 600; letter-spacing: 1px; margin-top: 4px; }' +
    '.pathway-meta { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }' +
    '.meta-badge { background: rgba(255,255,255,0.1); padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; display: flex; align-items: center; gap: 6px; }' +
    '.novelty-badge { background: linear-gradient(135deg, #ff6b00 0%, #ff9500 100%); color: #fff; }' +
    '.time-badge { background: rgba(0, 212, 255, 0.2); color: #00d4ff; }' +
    '.difficulty-badge { background: rgba(255, 107, 0, 0.2); color: #ff9500; }' +
    '.pitch-section { margin-bottom: 20px; }' +
    '.pitch-title { font-size: 13px; font-weight: 600; color: #ff9500; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }' +
    '.pitch-text { font-size: 15px; line-height: 1.7; color: #e0e0e0; }' +
    '.learning-outcomes { margin-bottom: 20px; }' +
    '.outcome-item { font-size: 14px; color: #c0c0c0; margin-bottom: 8px; padding-left: 20px; position: relative; }' +
    '.outcome-item::before { content: "✓"; position: absolute; left: 0; color: #00d4ff; font-weight: 700; }' +
    '.best-for-section { background: rgba(0, 212, 255, 0.1); border-left: 3px solid #00d4ff; padding: 12px; border-radius: 6px; margin-bottom: 16px; }' +
    '.best-for-title { font-size: 12px; font-weight: 600; color: #00d4ff; margin-bottom: 6px; }' +
    '.best-for-text { font-size: 13px; color: #c0c0c0; }' +
    '.unique-value { background: linear-gradient(135deg, rgba(35, 87, 255, 0.2) 0%, rgba(255, 107, 0, 0.2) 100%); padding: 12px; border-radius: 8px; margin-bottom: 16px; border: 1px solid rgba(255,255,255,0.1); }' +
    '.unique-value-title { font-size: 12px; font-weight: 600; color: #ff9500; margin-bottom: 6px; }' +
    '.unique-value-text { font-size: 13px; color: #e0e0e0; font-style: italic; }' +
    '.scientific-rationale { background: rgba(0, 212, 255, 0.05); border: 1px dashed rgba(0, 212, 255, 0.3); padding: 12px; border-radius: 6px; margin-bottom: 16px; }' +
    '.scientific-rationale-title { font-size: 11px; font-weight: 600; color: #00d4ff; text-transform: uppercase; margin-bottom: 6px; }' +
    '.scientific-rationale-text { font-size: 12px; color: #a0a0a0; line-height: 1.6; }' +
    '.action-row { display: flex; gap: 12px; }' +
    '.create-btn { flex: 1; background: linear-gradient(135deg, ' + modeColor + ' 0%, ' + (creativityMode === 'radical' ? '#cc5500' : '#1a47cc') + ' 100%); color: #fff; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; font-size: 15px; font-weight: 600; transition: all 0.2s ease; }' +
    '.create-btn:hover { transform: scale(1.02); box-shadow: 0 4px 16px rgba(' + (creativityMode === 'radical' ? '255, 107, 0' : '35, 87, 255') + ', 0.4); }' +
    '.learn-more-btn { padding: 12px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2); transition: all 0.2s ease; }' +
    '.learn-more-btn:hover { background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.3); }' +
    '.stars { color: #ffd700; margin-left: 8px; }' +
    '</style>';

  html += '<div class="header">';
  html += '  <h1>' + modeLabel + ' AI-Discovered Pathways</h1>';
  html += '  <div class="mode-badge">' + creativityMode.toUpperCase() + ' MODE</div>';
  html += '  <p>' + (creativityMode === 'radical'
    ? 'Experimental groupings that push the boundaries of medical education'
    : 'Creative pathways designed to maximize learning impact and enjoyment') + '</p>';
  html += '</div>';

  result.pathways.forEach(function(pw) {
    const stars = '⭐'.repeat(Math.min(5, Math.round(pw.noveltyScore / 2)));
    const outcomes = Array.isArray(pw.learningOutcomes) ? pw.learningOutcomes : [];

    html += '<div class="pathway-card">';
    html += '  <div class="pathway-header">';
    html += '    <div class="pathway-icon">' + pw.icon + '</div>';
    html += '    <div class="pathway-title-section">';
    html += '      <div class="pathway-name">' + pw.name + '<span class="stars">' + stars + '</span></div>';
    html += '      <div class="pathway-logic-type">Grouping Logic: ' + pw.logicType + '</div>';
    html += '    </div>';
    html += '  </div>';

    html += '  <div class="pathway-meta">';
    html += '    <div class="meta-badge">' + pw.caseCount + ' cases</div>';
    html += '    <div class="meta-badge novelty-badge">🎨 Novelty: ' + pw.noveltyScore + '/10</div>';
    html += '    <div class="meta-badge time-badge">⏱️ ' + pw.estimatedTime + '</div>';
    html += '    <div class="meta-badge difficulty-badge">📊 ' + pw.difficultyCurve + '</div>';
    html += '  </div>';

    html += '  <div class="pitch-section">';
    html += '    <div class="pitch-title">🎯 Why This Pathway Matters</div>';
    html += '    <div class="pitch-text">' + pw.pitch + '</div>';
    html += '  </div>';

    if (outcomes.length > 0) {
      html += '  <div class="learning-outcomes">';
      html += '    <div class="pitch-title">📚 Learning Outcomes</div>';
      outcomes.forEach(function(outcome) {
        html += '    <div class="outcome-item">' + outcome + '</div>';
      });
      html += '  </div>';
    }

    if (pw.bestFor) {
      html += '  <div class="best-for-section">';
      html += '    <div class="best-for-title">👥 Best For</div>';
      html += '    <div class="best-for-text">' + pw.bestFor + '</div>';
      html += '  </div>';
    }

    if (pw.uniqueValue) {
      html += '  <div class="unique-value">';
      html += '    <div class="unique-value-title">💎 Unique Value Proposition</div>';
      html += '    <div class="unique-value-text">' + pw.uniqueValue + '</div>';
      html += '  </div>';
    }

    if (pw.scientificRationale && creativityMode === 'radical') {
      html += '  <div class="scientific-rationale">';
      html += '    <div class="scientific-rationale-title">🔬 Scientific Rationale</div>';
      html += '    <div class="scientific-rationale-text">' + pw.scientificRationale + '</div>';
      html += '  </div>';
    }

    html += '  <div class="action-row">';
    html += '    <button class="create-btn" onclick="google.script.run.createPathwayFromAI(\'' + pw.id + '\')">🚀 Build This Pathway Now</button>';
    html += '    <button class="learn-more-btn" onclick="alert(\'Full case list:\\n' + (pw.suggestedCases || []).join('\\n') + '\')">📋 View Cases</button>';
    html += '  </div>';
    html += '</div>';
  });

  const htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(800)
    .setHeight(600);

  SpreadsheetApp.getUi().showModalDialog(htmlOutput, modeLabel + ' AI-Discovered Pathways');
}

/**
 * Wrapper functions for buttons
 */
function showAIPathwaysStandard() {
  showAIDiscoveredPathways('standard');
}

function showAIPathwaysRadical() {
  showAIDiscoveredPathways('radical');
}
