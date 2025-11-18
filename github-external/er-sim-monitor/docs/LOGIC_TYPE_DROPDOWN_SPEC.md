# 📋 LOGIC TYPE DROPDOWN SPECIFICATION
## Dynamic Dropdown with Usage-Based Sorting

**Date**: 2025-11-08
**Version**: 1.0
**Purpose**: Dropdown that sorts logic types by frequency of use

---

## 🎯 SORTING LOGIC

**Primary Sort**: `Times_Used` (descending - most used first)
**Secondary Sort**: `Logic_Type_Name` (alphabetical)

### **Why This Matters**:
- Most frequently used logic types = most valuable to Aaron
- Quick access to favorite discovery lenses
- New logic types start at bottom (Times_Used = 0)
- Natural ranking emerges over time

---

## 📊 DROPDOWN BEHAVIOR

### **Initial State** (All Times_Used = 0):
```
🧠 Select Logic Type
├── Cognitive Bias Exposure (0 uses)
├── Interpersonal Intelligence (0 uses)
├── Logical-Mathematical Intelligence (0 uses)
├── Multi-Intelligence Hybrid (0 uses)
├── The Contrarian Collection (0 uses)
├── The Great Mimickers (0 uses)
├── Visual-Spatial Intelligence (0 uses)
├────────────────────────────────────
└── 🎨 Create New Logic Type...
```

### **After Usage** (Sorted by Times_Used):
```
🧠 Select Logic Type
├── Cognitive Bias Exposure (12 uses) ← Most used
├── The Great Mimickers (8 uses)
├── Visual-Spatial Intelligence (5 uses)
├── Logical-Mathematical Intelligence (3 uses)
├── Interpersonal Intelligence (2 uses)
├── Multi-Intelligence Hybrid (1 use)
├── The Contrarian Collection (0 uses) ← Least used
├── Custom Logic Type 1 (0 uses)
├────────────────────────────────────
└── 🎨 Create New Logic Type...
```

---

## 🔧 IMPLEMENTATION

### **Apps Script Function**:

```javascript
function getLogicTypesForDropdown() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Logic_Type_Library');

  if (!sheet) {
    Logger.log('❌ Logic_Type_Library sheet not found');
    return [];
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  // Column indices
  const idIdx = headers.indexOf('Logic_Type_ID');
  const nameIdx = headers.indexOf('Logic_Type_Name');
  const timesUsedIdx = headers.indexOf('Times_Used');
  const statusIdx = headers.indexOf('Status');

  // Build logic type objects
  const logicTypes = [];
  for (let i = 1; i < data.length; i++) {
    const status = data[i][statusIdx];

    // Only include active logic types
    if (status === 'active') {
      logicTypes.push({
        id: data[i][idIdx],
        name: data[i][nameIdx],
        timesUsed: parseInt(data[i][timesUsedIdx]) || 0
      });
    }
  }

  // Sort by Times_Used (descending), then by name (alphabetical)
  logicTypes.sort((a, b) => {
    if (b.timesUsed !== a.timesUsed) {
      return b.timesUsed - a.timesUsed; // Higher usage first
    }
    return a.name.localeCompare(b.name); // Alphabetical if same usage
  });

  return logicTypes;
}
```

### **HTML Dropdown Generation**:

```javascript
function buildLogicTypeDropdown() {
  const logicTypes = getLogicTypesForDropdown();

  let html = '<select id="logic-type-selector" class="form-control">';
  html += '<option value="">-- Select Logic Type --</option>';

  logicTypes.forEach(lt => {
    const usageLabel = lt.timesUsed > 0 ? ` (${lt.timesUsed} uses)` : '';
    html += `<option value="${lt.id}">${lt.name}${usageLabel}</option>`;
  });

  html += '<option value="CREATE_NEW">──────────────────</option>';
  html += '<option value="CREATE_NEW">🎨 Create New Logic Type...</option>';
  html += '</select>';

  return html;
}
```

---

## 📈 USAGE TRACKING

### **Increment Usage Count**:

```javascript
function incrementLogicTypeUsage(logicTypeId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Logic_Type_Library');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const idIdx = headers.indexOf('Logic_Type_ID');
  const timesUsedIdx = headers.indexOf('Times_Used');

  // Find row with matching Logic_Type_ID
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIdx] === logicTypeId) {
      const currentUsage = parseInt(data[i][timesUsedIdx]) || 0;
      const newUsage = currentUsage + 1;

      // Update Times_Used
      sheet.getRange(i + 1, timesUsedIdx + 1).setValue(newUsage);

      Logger.log(`✅ Incremented ${logicTypeId} usage: ${currentUsage} → ${newUsage}`);
      return newUsage;
    }
  }

  Logger.log(`⚠️ Logic Type ${logicTypeId} not found`);
  return 0;
}
```

### **When to Increment**:

**Trigger**: User clicks "🤖 Discover Pathways" button

**Workflow**:
```
1. User selects logic type from dropdown (e.g., "Cognitive Bias Exposure")
2. User clicks "🤖 Discover Pathways"
3. System increments Times_Used for selected logic type
4. Discovery runs
5. Results stored in Pathways_Master
6. Next time dropdown loads, Cognitive Bias appears higher (due to increased usage)
```

---

## 🎨 UI INTEGRATION

### **Dropdown HTML** (Full Example):

```html
<div class="form-group">
  <label for="logic-type-selector">
    <strong>🧠 Select Discovery Lens (Logic Type)</strong>
  </label>
  <select id="logic-type-selector" class="form-control" onchange="handleLogicTypeChange(this.value)">
    <option value="">-- Select Logic Type --</option>
    <option value="LT004">Cognitive Bias Exposure (12 uses)</option>
    <option value="LT005">The Great Mimickers (8 uses)</option>
    <option value="LT001">Visual-Spatial Intelligence (5 uses)</option>
    <option value="LT002">Logical-Mathematical Intelligence (3 uses)</option>
    <option value="LT003">Interpersonal Intelligence (2 uses)</option>
    <option value="LT007">Multi-Intelligence Hybrid (1 use)</option>
    <option value="LT006">The Contrarian Collection (0 uses)</option>
    <option value="" disabled>──────────────────</option>
    <option value="CREATE_NEW">🎨 Create New Logic Type...</option>
  </select>

  <small class="form-text text-muted">
    Most frequently used logic types appear first
  </small>
</div>

<button id="discover-btn" class="btn btn-primary" onclick="discoverPathways()" disabled>
  🤖 Discover Pathways
</button>

<script>
function handleLogicTypeChange(value) {
  if (value === 'CREATE_NEW') {
    openCreateLogicTypeModal();
  } else if (value) {
    document.getElementById('discover-btn').disabled = false;
  } else {
    document.getElementById('discover-btn').disabled = true;
  }
}

function discoverPathways() {
  const selectedLogicType = document.getElementById('logic-type-selector').value;

  if (!selectedLogicType || selectedLogicType === 'CREATE_NEW') {
    alert('Please select a logic type first');
    return;
  }

  // Show loading
  showLoadingModal('Discovering pathways...');

  // Call server-side discovery function
  google.script.run
    .withSuccessHandler(handleDiscoveryResults)
    .withFailureHandler(handleDiscoveryError)
    .discoverPathwaysWithLogicType(selectedLogicType);
}
</script>
```

---

## ✅ BENEFITS

**User Experience**:
- ✅ **Quick access** to favorite logic types
- ✅ **Natural ranking** emerges from usage
- ✅ **Zero configuration** - sorts automatically
- ✅ **Usage visibility** - shows "(12 uses)" label

**System Intelligence**:
- ✅ **Learns preferences** over time
- ✅ **Adaptive ordering** based on Aaron's workflow
- ✅ **New logic types** don't clutter top of list
- ✅ **Inactive types** can be filtered out

---

## 🚀 READY TO IMPLEMENT

This sorting logic will be integrated into Phase 2 (AI Persuasion & Ranking).

**Next**: Build the full discovery UI with this dropdown!

---

_Generated by Atlas (Claude Code) - 2025-11-08_
_Status: Specification Complete - Ready for Phase 2 Integration_
