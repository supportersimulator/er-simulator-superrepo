/**
 * ENHANCED VISUAL PANEL WITH SYMPTOM/SYSTEM TOGGLE
 *
 * Adds toggle between:
 * - Symptom-based organization (CP, SOB, ABD, etc.)
 * - System-based organization (Cardiovascular, Pulmonary, etc.)
 */

/**
 * Get category counts for both Symptom and System views
 */
function getCategoryCounts() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName('Master Scenario Convert');

  if (!masterSheet) {
    return { symptoms: {}, systems: {}, total: 0 };
  }

  const data = masterSheet.getDataRange().getValues();
  const headers = data[1]; // Row 2 (Tier 2 headers)

  // Find the category columns
  const symptomIdx = headers.indexOf('Case_Organization_Category_Symptom');
  const systemIdx = headers.indexOf('Case_Organization_Category_System');

  if (symptomIdx === -1 || systemIdx === -1) {
    Logger.log('⚠️ Category columns not found');
    return { symptoms: {}, systems: {}, total: 0 };
  }

  const symptomCounts = {};
  const systemCounts = {};

  // Start from row 3 (skip 2 header rows)
  for (let i = 2; i < data.length; i++) {
    const symptom = data[i][symptomIdx] || 'Uncategorized';
    const system = data[i][systemIdx] || 'Uncategorized';

    symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
    systemCounts[system] = (systemCounts[system] || 0) + 1;
  }

  return {
    symptoms: symptomCounts,
    systems: systemCounts,
    total: data.length - 2
  };
}

/**
 * Build enhanced Categories tab with Symptom/System toggle
 */
function buildEnhancedCategoriesTab() {
  const counts = getCategoryCounts();

  // Build Symptom cards (sorted by count)
  const symptomCards = Object.entries(counts.symptoms)
    .sort((a, b) => b[1] - a[1])
    .map(([symptom, count]) => {
      const icon = symptom === 'Uncategorized' ? '❓' : getSymptomIcon(symptom);

      return `
        <div class="category-card" onclick="viewSymptomCategory('${symptom.replace(/'/g, "\\'")}')">
          <div class="category-icon">${icon}</div>
          <div class="category-name">${symptom}</div>
          <div class="category-count">${count} cases</div>
        </div>
      `;
    }).join('');

  // Build System cards (sorted by count)
  const systemCards = Object.entries(counts.systems)
    .sort((a, b) => b[1] - a[1])
    .map(([system, count]) => {
      const icon = system === 'Uncategorized' ? '❓' : getSystemIcon(system);

      return `
        <div class="category-card" onclick="viewSystemCategory('${system.replace(/'/g, "\\'")}')">
          <div class="category-icon">${icon}</div>
          <div class="category-name">${system}</div>
          <div class="category-count">${count} cases</div>
        </div>
      `;
    }).join('');

  return `
    <style>
      .toggle-container {
        display: flex;
        gap: 8px;
        margin: 16px;
        background: #2a3040;
        padding: 4px;
        border-radius: 8px;
      }

      .toggle-btn {
        flex: 1;
        padding: 10px 16px;
        background: transparent;
        border: none;
        color: #8b92a0;
        font-size: 13px;
        font-weight: 600;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .toggle-btn.active {
        background: #667eea;
        color: #fff;
      }

      .toggle-btn:hover:not(.active) {
        background: rgba(255,255,255,0.05);
      }

      .view-container {
        display: none;
      }

      .view-container.active {
        display: block;
      }

      .category-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 12px;
        padding: 16px;
      }

      .category-card {
        background: linear-gradient(135deg, #2a3040 0%, #1f2633 100%);
        border: 1px solid #3a4050;
        border-radius: 8px;
        padding: 16px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s;
      }

      .category-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        border-color: #667eea;
      }

      .category-icon {
        font-size: 32px;
        margin-bottom: 8px;
      }

      .category-name {
        font-size: 13px;
        font-weight: 600;
        color: #e7eaf0;
        margin-bottom: 4px;
      }

      .category-count {
        font-size: 11px;
        color: #8b92a0;
      }

      .section {
        margin: 0;
      }

      .section-title {
        padding: 16px;
        font-size: 14px;
        font-weight: 600;
        color: #e7eaf0;
        border-bottom: 1px solid #3a4050;
      }

      .ai-tools-banner {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        margin: 16px;
        padding: 16px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
      }

      .ai-tools-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }

      .ai-tools-icon {
        font-size: 32px;
      }

      .ai-tools-title {
        font-size: 15px;
        font-weight: 700;
        color: #fff;
        margin-bottom: 4px;
      }

      .ai-tools-desc {
        font-size: 12px;
        color: rgba(255,255,255,0.9);
      }

      .ai-tools-btn {
        width: 100%;
        background: rgba(255,255,255,0.2);
        border: 2px solid rgba(255,255,255,0.3);
        color: #fff;
        padding: 12px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .ai-tools-btn:hover {
        background: rgba(255,255,255,0.3);
        transform: translateY(-1px);
      }
    </style>

    <!-- AI Tools Banner -->
    <div class="ai-tools-banner">
      <div class="ai-tools-header">
        <span class="ai-tools-icon">🤖</span>
        <div style="flex: 1;">
          <div class="ai-tools-title">AI-Powered Categorization Tools</div>
          <div class="ai-tools-desc">Auto-categorize all ${counts.total} cases with GPT-4 + Review interface</div>
        </div>
      </div>
      <button class="ai-tools-btn" onclick="openAITools()">
        ✨ Open AI Categorization Tools
      </button>
    </div>

    <!-- Toggle between Symptom/System views -->
    <div class="toggle-container">
      <button class="toggle-btn active" id="symptom-toggle" onclick="switchView('symptom')">
        💊 Symptom Categories
      </button>
      <button class="toggle-btn" id="system-toggle" onclick="switchView('system')">
        🏥 System Categories
      </button>
    </div>

    <!-- Symptom View -->
    <div class="view-container active" id="symptom-view">
      <div class="section">
        <div class="section-title">📁 Symptom-Based Organization</div>
        <div class="category-grid">${symptomCards || '<p style="text-align:center; padding:20px; color:#8b92a0;">No symptom categories found. Run AI Categorization first.</p>'}</div>
      </div>
    </div>

    <!-- System View -->
    <div class="view-container" id="system-view">
      <div class="section">
        <div class="section-title">📁 System-Based Organization</div>
        <div class="category-grid">${systemCards || '<p style="text-align:center; padding:20px; color:#8b92a0;">No system categories found. Run AI Categorization first.</p>'}</div>
      </div>
    </div>

    <script>
      function switchView(view) {
        // Update toggle buttons
        document.getElementById('symptom-toggle').classList.remove('active');
        document.getElementById('system-toggle').classList.remove('active');

        if (view === 'symptom') {
          document.getElementById('symptom-toggle').classList.add('active');
        } else {
          document.getElementById('system-toggle').classList.add('active');
        }

        // Update view containers
        document.getElementById('symptom-view').classList.remove('active');
        document.getElementById('system-view').classList.remove('active');

        if (view === 'symptom') {
          document.getElementById('symptom-view').classList.add('active');
        } else {
          document.getElementById('system-view').classList.add('active');
        }
      }

      function viewSymptomCategory(symptom) {
        alert('Viewing ' + symptom + ' cases\\n\\nThis will open a detailed view of all cases with this symptom.\\n\\n(Feature coming soon!)');
      }

      function viewSystemCategory(system) {
        alert('Viewing ' + system + ' cases\\n\\nThis will open a detailed view of all cases in this system.\\n\\n(Feature coming soon!)');
      }

      function openAITools() {
        console.log('🔧 Opening AI Categorization Tools...');
        google.script.run
          .withSuccessHandler(() => {
            console.log('✅ Panel opened successfully');
            // Current sidebar will be replaced
          })
          .withFailureHandler((error) => {
            console.error('❌ Failed to open panel:', error);
            alert('Error opening AI Tools: ' + error.message);
          })
          .openCategoriesPathwaysPanel();
      }
    </script>
  `;
}

/**
 * Get icon for symptom category
 */
function getSymptomIcon(symptom) {
  const icons = {
    'CP': '💔',
    'SOB': '🫁',
    'ABD': '🤰',
    'AMS': '🧠',
    'SYNCOPE': '😵',
    'TRAUMA': '🩹',
    'OB': '👶',
    'NEURO': '🧠',
    'PSYCH': '🧘',
    'FEVER': '🌡️',
    'WEAKNESS': '💪',
    'DIZZY': '😵‍💫',
    'HEADACHE': '🤕',
    'Uncategorized': '❓'
  };

  return icons[symptom] || '📋';
}

/**
 * Get icon for system category
 */
function getSystemIcon(system) {
  const icons = {
    'Cardiovascular': '❤️',
    'Pulmonary': '🫁',
    'Gastrointestinal': '🍽️',
    'Neurologic': '🧠',
    'Endocrine/Metabolic': '⚡',
    'Renal/Genitourinary': '💧',
    'Hematologic/Oncologic': '🩸',
    'Infectious Disease': '🦠',
    'Toxicology': '☠️',
    'Trauma': '🚑',
    'Obstetrics/Gynecology': '👶',
    'Pediatrics': '👶',
    'HEENT': '👁️',
    'Musculoskeletal': '🦴',
    'Critical Care': '🏥',
    'Dermatologic': '🧴',
    'Psychiatric': '🧘',
    'Environmental': '🌡️',
    'Uncategorized': '❓'
  };

  return icons[system] || '🏥';
}
