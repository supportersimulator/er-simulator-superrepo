# Documentation Maintenance Protocol

**Purpose**: Ensure all Adaptive Salience and project documentation remains **current, accurate, and synchronized** as the project evolves through hundreds of scenarios, database migrations, voice integration, and multi-language expansion.

**Philosophy**: "Living documentation that evolves with the codebase"

**Last Updated**: 2025-10-31

---

## Core Principles

### 1. Documentation as Code
- Documentation lives in `/docs/` alongside source code
- Version controlled via git
- Updated in same commit as code changes
- Reviewed in pull requests

### 2. AI-Readable Format
- All docs use **GitHub-flavored Markdown**
- Consistent structure for AI parsing
- Code examples in fenced blocks with language tags
- Clear section hierarchy with `##` headers

### 3. Single Source of Truth
- Each concept documented **once** in primary location
- Other docs reference the primary (not duplicate)
- Primary documents clearly identified

### 4. Evergreen Documentation
- Every doc has "Last Updated" date
- Outdated docs moved to `/docs/archive/`
- Breaking changes trigger version bumps

---

## Document Hierarchy

### Tier 1: Project Constitution (Highest Authority)

**File**: `/CLAUDE.md`

**Authority Level**: ABSOLUTE - All AI agents MUST adhere

**When to Update**:
- ✅ Core project principles change
- ✅ New sacred architecture added
- ✅ Performance budgets change
- ✅ GitHub sync protocol changes
- ✅ New collaboration patterns emerge

**Update Frequency**: Rarely (major milestones only)

**Review Required**: Aaron Tjomsland + GPT-5 approval

---

### Tier 2: System Architecture (Technical Canon)

**File**: `/docs/ADAPTIVE_SALIENCE_ARCHITECTURE.md`

**Authority Level**: HIGH - Defines how everything works

**When to Update**:
- ✅ New vital parameter added
- ✅ New component created
- ✅ Integration point added
- ✅ Naming convention changed
- ✅ Performance budget adjusted
- ✅ Expandability hook added

**Update Frequency**: With every feature addition

**Review Required**: Aaron + Claude Code validation

**Update Checklist**:
```markdown
- [ ] Update "Last Updated" date
- [ ] Add entry to relevant section
- [ ] Update component hierarchy diagrams (if affected)
- [ ] Add code examples for new patterns
- [ ] Update expandability hooks section (if applicable)
- [ ] Update migration strategies (if database/external systems affected)
- [ ] Run spell check
- [ ] Verify all code examples compile/run
```

---

### Tier 3: Integration & Safety Guides (Developer Handbooks)

**Files**:
- `/docs/ADAPTIVE_SALIENCE_INTEGRATION_GUIDE.md`
- `/docs/ADAPTIVE_SALIENCE_IMPLEMENTATION.md`

**Authority Level**: MEDIUM-HIGH - Defines safe practices

**When to Update**:
- ✅ New safe modification pattern discovered
- ✅ New dangerous pattern identified
- ✅ Testing requirement added
- ✅ Performance validation method changed
- ✅ Common extension pattern emerged

**Update Frequency**: With every integration or expansion

**Update Checklist**:
```markdown
- [ ] Add new pattern to "Safe Modification Patterns" (if safe)
- [ ] Add new warning to "Don'ts" (if dangerous)
- [ ] Update integration testing requirements (if new tests added)
- [ ] Update performance validation (if metrics changed)
- [ ] Add code example for new pattern
- [ ] Document migration path (if breaking change)
```

---

### Tier 4: Analysis & Compliance (Audit Trail)

**Files**:
- `/docs/ADAPTIVE_SALIENCE_ANALYSIS.md`
- `/docs/ADAPTIVE_SALIENCE_FIXES_YYYY-MM-DD.md`

**Authority Level**: MEDIUM - Historical record

**When to Update**:
- ✅ Major compliance audit performed
- ✅ Specification discrepancy resolved
- ✅ Performance benchmark updated
- ✅ New enhancement opportunity identified

**Update Frequency**: After major audits or fixes

**Archive Strategy**: Move to `/docs/archive/audits/` after 6 months

---

## Update Triggers

### Automatic Update Triggers (MUST Update Docs)

| Code Change | Docs to Update | Update Type |
|-------------|---------------|-------------|
| **New vital parameter added** | ARCHITECTURE.md, INTEGRATION_GUIDE.md | Add section + example |
| **New severity level added** | ARCHITECTURE.md, INTEGRATION_GUIDE.md | Extend enum docs |
| **New component created** | ARCHITECTURE.md | Add to hierarchy + data flow |
| **Integration point changed** | ARCHITECTURE.md, INTEGRATION_GUIDE.md | Update integration section |
| **Threshold value changed** | ARCHITECTURE.md, IMPLEMENTATION.md | Update threshold tables |
| **Phase timing changed** | CLAUDE.md, ARCHITECTURE.md, IMPLEMENTATION.md | **BREAKING** - full update |
| **Volume level changed** | CLAUDE.md, ARCHITECTURE.md, IMPLEMENTATION.md | **BREAKING** - full update |
| **Performance budget violated** | INTEGRATION_GUIDE.md | Update validation requirements |
| **New safe pattern discovered** | INTEGRATION_GUIDE.md | Add to "Do's" section |
| **New dangerous pattern found** | INTEGRATION_GUIDE.md | Add to "Don'ts" section |
| **Database migration implemented** | ARCHITECTURE.md | Update migration strategies |
| **Voice integration completed** | ARCHITECTURE.md, IMPLEMENTATION.md | Update voice integration section |
| **Multi-language added** | ARCHITECTURE.md | Update localization strategy |

### Git Pre-Commit Hook

**Install** `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# Pre-commit hook to validate documentation updates

# Check if Adaptive Salience code changed
ADAPTIVE_FILES=$(git diff --cached --name-only | grep -E "(AdaptiveSalienceEngine|SoundManager|useAdaptiveSalience|Monitor).js")

if [ -n "$ADAPTIVE_FILES" ]; then
  # Check if documentation also changed
  DOC_FILES=$(git diff --cached --name-only | grep -E "docs/ADAPTIVE_SALIENCE")

  if [ -z "$DOC_FILES" ]; then
    echo "⚠️  WARNING: Adaptive Salience code changed but documentation not updated"
    echo "📄 Files changed:"
    echo "$ADAPTIVE_FILES"
    echo ""
    echo "Required: Update at least one of these docs:"
    echo "  - docs/ADAPTIVE_SALIENCE_ARCHITECTURE.md"
    echo "  - docs/ADAPTIVE_SALIENCE_INTEGRATION_GUIDE.md"
    echo "  - docs/ADAPTIVE_SALIENCE_IMPLEMENTATION.md"
    echo ""
    echo "Bypass this check with: git commit --no-verify (NOT RECOMMENDED)"
    exit 1
  fi
fi

echo "✅ Documentation validation passed"
exit 0
```

**Install command**:
```bash
chmod +x .git/hooks/pre-commit
```

---

## Documentation Review Cadence

### Weekly: Quick Audit (5 minutes)

**Checklist**:
- [ ] Check "Last Updated" dates - flag if >30 days old
- [ ] Review recent commits - verify docs updated
- [ ] Check for TODOs in docs - resolve or escalate
- [ ] Verify examples still compile

**Command**:
```bash
npm run docs:audit:weekly
```

### Monthly: Comprehensive Review (30 minutes)

**Checklist**:
- [ ] Read ARCHITECTURE.md top-to-bottom
- [ ] Verify all code examples run
- [ ] Check for outdated sections
- [ ] Update performance metrics (if improved)
- [ ] Archive old audit documents
- [ ] Update CHANGELOG.md

**Command**:
```bash
npm run docs:audit:monthly
```

### Quarterly: Major Validation (2 hours)

**Checklist**:
- [ ] Full specification compliance check
- [ ] Performance benchmark against budget
- [ ] User experience validation
- [ ] Breaking change assessment
- [ ] Version number evaluation (semantic versioning)
- [ ] Archive outdated docs
- [ ] Generate compliance report

**Command**:
```bash
npm run docs:audit:quarterly
```

### Before Major Releases: Deep Audit (4 hours)

**Checklist**:
- [ ] Complete ADAPTIVE_SALIENCE_ANALYSIS.md refresh
- [ ] Update all "Last Updated" dates
- [ ] Verify 100% specification compliance
- [ ] Run full test suite + performance benchmarks
- [ ] Review all TODOs in docs
- [ ] Create release notes
- [ ] Update CHANGELOG.md
- [ ] Bump version numbers
- [ ] Archive pre-release docs

**Command**:
```bash
npm run docs:audit:release
```

---

## Documentation Templates

### New Feature Documentation Template

When adding a new feature to Adaptive Salience:

```markdown
## [Feature Name] (Added YYYY-MM-DD)

**Purpose**: [1-sentence description]

**Use Case**: [Specific scenario this solves]

**Implementation**:

### Files Modified:
- `/path/to/file1.js` - [What changed]
- `/path/to/file2.js` - [What changed]

### Code Example:
\`\`\`javascript
// Example usage
const result = newFeature(params);
\`\`\`

### Integration:
\`\`\`javascript
// How to integrate with existing code
const { newFeature } = useAdaptiveSalience({
  vitals: displayVitals,
  muted: isMuted,
  newFeatureEnabled: true, // ← NEW
});
\`\`\`

### Performance Impact:
- CPU: +0.1% (acceptable, <1% total)
- Memory: +50KB (acceptable, <500KB total)
- Latency: +2ms (acceptable, <50ms total)

### Testing:
\`\`\`javascript
describe('New Feature', () => {
  test('should do X when Y', () => {
    // Test implementation
  });
});
\`\`\`

### Breaking Changes:
- None (backward compatible)

OR

- **BREAKING**: [Describe what breaks]
- **Migration Path**: [How to upgrade]
```

### Bug Fix Documentation Template

```markdown
## Bug Fix: [Brief Description] (Fixed YYYY-MM-DD)

**Issue**: [What was broken]

**Root Cause**: [Why it was broken]

**Fix**: [What changed]

**Files Modified**:
- `/path/to/file.js:LineNumber` - [Specific change]

**Before**:
\`\`\`javascript
// Buggy code
const result = brokenFunction();
\`\`\`

**After**:
\`\`\`javascript
// Fixed code
const result = fixedFunction();
\`\`\`

**Test Added**:
\`\`\`javascript
test('should not break when X', () => {
  // Regression test
});
\`\`\`

**Impact**: [None OR specify if behavior changed]
```

---

## Automation Scripts

### `scripts/validateDocs.js`

```javascript
/**
 * Validates all Adaptive Salience documentation
 * Run: npm run docs:validate
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '../docs');
const REQUIRED_DOCS = [
  'ADAPTIVE_SALIENCE_ARCHITECTURE.md',
  'ADAPTIVE_SALIENCE_INTEGRATION_GUIDE.md',
  'ADAPTIVE_SALIENCE_IMPLEMENTATION.md',
];

function validateDoc(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const errors = [];

  // Check for "Last Updated" date
  if (!content.includes('**Last Updated**:')) {
    errors.push('Missing "Last Updated" date');
  }

  // Check for outdated date (>90 days)
  const dateMatch = content.match(/\*\*Last Updated\*\*:\s*(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    const lastUpdated = new Date(dateMatch[1]);
    const daysSince = (Date.now() - lastUpdated) / (1000 * 60 * 60 * 24);
    if (daysSince > 90) {
      errors.push(`Document outdated (${Math.floor(daysSince)} days since update)`);
    }
  }

  // Check for broken code examples (basic validation)
  const codeBlocks = content.match(/```javascript[\s\S]*?```/g) || [];
  codeBlocks.forEach((block, i) => {
    if (block.includes('❌ BAD') || block.includes('⚠️ DANGER')) {
      // Skip intentionally broken examples
      return;
    }
    // Basic syntax check (count braces)
    const openBraces = (block.match(/\{/g) || []).length;
    const closeBraces = (block.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push(`Code block ${i + 1} has mismatched braces`);
    }
  });

  return errors;
}

function main() {
  console.log('🔍 Validating Adaptive Salience documentation...\n');

  let totalErrors = 0;

  REQUIRED_DOCS.forEach(docName => {
    const filePath = path.join(DOCS_DIR, docName);
    console.log(`Checking ${docName}...`);

    if (!fs.existsSync(filePath)) {
      console.log(`  ❌ File missing!`);
      totalErrors++;
      return;
    }

    const errors = validateDoc(filePath);
    if (errors.length === 0) {
      console.log(`  ✅ Valid`);
    } else {
      console.log(`  ⚠️  Issues found:`);
      errors.forEach(err => console.log(`     - ${err}`));
      totalErrors += errors.length;
    }
    console.log('');
  });

  if (totalErrors === 0) {
    console.log('✅ All documentation valid!\n');
    process.exit(0);
  } else {
    console.log(`⚠️  Found ${totalErrors} issue(s) - please review\n`);
    process.exit(1);
  }
}

main();
```

### `scripts/updateDocDates.js`

```javascript
/**
 * Updates "Last Updated" dates in documentation
 * Run: npm run docs:update-dates
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '../docs');
const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

function updateDocDate(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace existing "Last Updated" line
  const updated = content.replace(
    /\*\*Last Updated\*\*:\s*\d{4}-\d{2}-\d{2}/,
    `**Last Updated**: ${today}`
  );

  if (updated !== content) {
    fs.writeFileSync(filePath, updated, 'utf8');
    return true;
  }

  return false;
}

function main() {
  console.log(`📅 Updating documentation dates to ${today}...\n`);

  const docs = fs.readdirSync(DOCS_DIR)
    .filter(f => f.startsWith('ADAPTIVE_SALIENCE') && f.endsWith('.md'));

  docs.forEach(docName => {
    const filePath = path.join(DOCS_DIR, docName);
    const updated = updateDocDate(filePath);
    console.log(`${updated ? '✅' : '⏭️ '} ${docName}`);
  });

  console.log('\n✅ Date update complete!\n');
}

main();
```

### Add to `package.json`:

```json
{
  "scripts": {
    "docs:validate": "node scripts/validateDocs.js",
    "docs:update-dates": "node scripts/updateDocDates.js",
    "docs:audit:weekly": "npm run docs:validate",
    "docs:audit:monthly": "npm run docs:validate && npm run test -- --coverage",
    "docs:audit:quarterly": "npm run docs:validate && npm run benchmark:adaptive-salience && npm run test -- --coverage",
    "docs:audit:release": "npm run docs:validate && npm run benchmark:adaptive-salience && npm run test -- --coverage && npm run build"
  }
}
```

---

## Future-Proofing Strategies

### 1. Database Migration (Google Sheets → Supabase)

**Documentation Impact**: MEDIUM

**Files to Update When Migrating**:
- ✅ `ARCHITECTURE.md` - Update "Data Flow Architecture" section
- ✅ `ARCHITECTURE.md` - Update "Migration Strategies" section with Supabase patterns
- ✅ `INTEGRATION_GUIDE.md` - Add "Supabase Integration" pattern
- ✅ `CLAUDE.md` - Update "Integration Systems" section

**Key Insight**: AdaptiveSalienceEngine requires **ZERO documentation changes** (data-source-agnostic)

### 2. Voice-to-Voice AI Integration

**Documentation Impact**: LOW (already prepared)

**Files to Update When Implementing**:
- ✅ `ARCHITECTURE.md` - Update "Voice Integration Readiness" section (remove "Future")
- ✅ `IMPLEMENTATION.md` - Update "Audio Ducking" section with actual implementation
- ✅ `INTEGRATION_GUIDE.md` - Add "Voice Activity Detection" actual code example

**Key Insight**: `isSpeaking` prop already exists - docs just need "how to connect" examples

### 3. Multi-Language Expansion

**Documentation Impact**: LOW (sound assets language-neutral)

**Files to Update When Adding Languages**:
- ✅ `ARCHITECTURE.md` - Update "Multi-Language Expansion Strategy" with actual implementation
- ✅ `INTEGRATION_GUIDE.md` - Add localization code examples
- ✅ `CLAUDE.md` - Update "Multi-Language Support" section

**Key Insight**: Only UI text needs localization - engine unchanged

### 4. Scenario Expansion (100s of Cases)

**Documentation Impact**: ZERO

**Why No Updates Needed**:
- ✅ Engine is **scenario-agnostic** - adapts to any vital pattern
- ✅ Thresholds are **universal** - apply to all scenarios
- ✅ Phase escalation **automatic** - no per-scenario config

**Exception**: If new vital parameters needed (e.g., lactate, troponin), follow "Adding New Vital Parameter" pattern

### 5. New Columns in Master CSV

**Documentation Impact**: LOW

**Files to Update**:
- ✅ `CLAUDE.md` - Update "Google Sheets Integration" section with new schema
- ✅ (Optional) `ARCHITECTURE.md` - Update "Data Flow Architecture" if vital structure changes

**Key Insight**: If new columns are additional vitals, follow "Adding New Vital Parameter" pattern

---

## Version Control for Documentation

### Semantic Versioning

**Documentation Version** = **Code Version**

**Format**: `vMAJOR.MINOR.PATCH`

**Version Bumps**:
- **MAJOR** (Breaking Changes):
  - Phase timing changed
  - Volume levels changed
  - Vital thresholds changed (non-clinically justified)
  - Sound asset naming convention changed
  - Vitals object structure changed

- **MINOR** (New Features):
  - New vital parameter added
  - New severity level added
  - New integration point added
  - New safe pattern discovered

- **PATCH** (Bug Fixes):
  - Threshold bug fixed
  - Phase progression bug fixed
  - Documentation typo fixed
  - Performance optimization (no behavior change)

### CHANGELOG.md

**Maintain** `/docs/CHANGELOG.md`:

```markdown
# Adaptive Salience Changelog

## [1.2.0] - 2025-11-15

### Added
- Temperature monitoring vital parameter
- Hypothermia/fever threshold detection
- Temperature sound assets (awareness, persistence, neglect)

### Changed
- None

### Fixed
- None

### Documentation
- Updated ARCHITECTURE.md with temperature evaluation logic
- Updated INTEGRATION_GUIDE.md with temperature pattern example
- Updated IMPLEMENTATION.md with temperature thresholds

### Performance
- CPU: +0.1% (total: 0.4%)
- Memory: +50KB (total: 250KB)

---

## [1.1.1] - 2025-11-05

### Fixed
- SpO2 threshold evaluation bug (was checking <85 twice)

### Documentation
- Updated ARCHITECTURE.md with corrected threshold logic

---

## [1.1.0] - 2025-10-31

### Added
- Smart ducking (critical alarms at 50% during voice activity)
- Hypertension threshold correction (160 vs 180)

### Fixed
- Critical alarm ducking too aggressive (was 30%, now 50%)
- Hypertension threshold (was 180, now 160)

### Documentation
- Updated ARCHITECTURE.md with smart ducking logic
- Updated IMPLEMENTATION.md with corrected BP thresholds
- Created ADAPTIVE_SALIENCE_FIXES_2025-10-31.md

### Performance
- No change (same metrics)

---

## [1.0.0] - 2025-10-31

### Initial Release
- Event-driven audio engine
- Three-phase escalation model
- Six vital parameters (HR, SpO2, BP, RR, EtCO2, Rhythm)
- Smart ducking (voice activity aware)
- Acknowledgment system
- 100% specification compliance

### Documentation
- ADAPTIVE_SALIENCE_ARCHITECTURE.md
- ADAPTIVE_SALIENCE_INTEGRATION_GUIDE.md
- ADAPTIVE_SALIENCE_IMPLEMENTATION.md
- ADAPTIVE_SALIENCE_ANALYSIS.md
```

---

## Emergency Documentation Recovery

### If Documentation Becomes Outdated

**Red Flags**:
- "Last Updated" >90 days old
- Code examples don't compile
- Performance metrics outdated
- Threshold values don't match code

**Recovery Protocol**:

1. **Freeze Development** (temporarily)
2. **Run Full Audit**:
   ```bash
   npm run docs:audit:quarterly
   ```
3. **Generate Fresh Analysis**:
   ```bash
   npm run analyze:adaptive-salience
   ```
4. **Compare Code vs. Docs**:
   - Read all source files
   - Compare with ARCHITECTURE.md
   - Flag mismatches
5. **Update Systematically**:
   - Start with ARCHITECTURE.md (foundation)
   - Then INTEGRATION_GUIDE.md (patterns)
   - Then IMPLEMENTATION.md (specifics)
   - Finally CLAUDE.md (principles)
6. **Validate**:
   ```bash
   npm run docs:validate
   npm test
   npm run benchmark:adaptive-salience
   ```
7. **Resume Development**

---

---

## Self-Evolving Documentation Protocol

### Philosophy: The Documentation System Can Improve Itself

**Core Principle**: This protocol is not sacred - it's a **living system** that should evolve when better approaches emerge.

**Golden Rule**: **Never silently deviate from documented protocols**. Instead, follow this process:

---

### When AI Agents Discover Better Approaches

**If you (AI agent) discover a more efficient/strategic/better approach that contradicts current documentation:**

#### Step 1: STOP and Document

**Do NOT** proceed with the better approach immediately.

**Instead**:
1. ✅ Clearly identify which current protocol would be violated
2. ✅ Document the better approach in detail
3. ✅ Explain why it's superior (performance, maintainability, user experience)
4. ✅ Assess impact (breaking changes, migration effort, risks)
5. ✅ Propose protocol amendment

#### Step 2: Present to User

**Format**:
```
🔍 PROTOCOL IMPROVEMENT OPPORTUNITY DETECTED

Current Protocol:
[Describe existing documented approach]

Location: /docs/FILENAME.md:Section

Better Approach Discovered:
[Describe new approach]

Why It's Better:
- Performance: [e.g., 50% faster, 200KB less memory]
- Maintainability: [e.g., simpler code, fewer edge cases]
- User Experience: [e.g., smoother interaction, more intuitive]
- Future-Proof: [e.g., easier to extend for multi-language]

Trade-Offs:
- [Any disadvantages or risks]

Impact Assessment:
- Breaking Changes: [Yes/No - describe if yes]
- Migration Effort: [None/Low/Medium/High]
- Documentation Updates Required: [List files]
- Testing Required: [Scope]

Recommendation:
[Adopt immediately / Adopt after testing / Defer / Reject]

Question:
Should we adopt this better approach and update our living documentation protocols?

Options:
1. ✅ Yes, adopt and update protocols
2. 🔄 Test first, then decide
3. ⏸️  Defer for future consideration
4. ❌ No, keep current approach (explain why)
```

#### Step 3: Await User Confirmation

**DO NOT PROCEED** until user explicitly confirms:
- "Yes, adopt this approach"
- "Update the protocols accordingly"
- Or similar affirmative response

#### Step 4: Execute with Documentation Update

**Upon confirmation**:
1. ✅ Implement the better approach
2. ✅ Update ALL affected documentation files
3. ✅ Add to CHANGELOG.md with "PROTOCOL EVOLUTION" tag
4. ✅ Update this DOCUMENTATION_MAINTENANCE_PROTOCOL.md with new pattern
5. ✅ Create git commit with special prefix: `Protocol Evolution: [Brief description]`

**Commit Message Format**:
```
Protocol Evolution: [Brief summary]

Evolved Protocol:
- Previous: [Old approach]
- New: [Better approach]

Rationale:
[Why new approach is superior]

Impact:
- Breaking Changes: [None OR describe]
- Performance: [Improvement metrics]
- User Experience: [How it's better]

Documentation Updated:
- /docs/FILENAME1.md - [What changed]
- /docs/FILENAME2.md - [What changed]

User Approval: Aaron Tjomsland (YYYY-MM-DD)
```

---

### Examples of Protocol Evolution Scenarios

#### Example 1: Performance Optimization

**Scenario**: AI discovers that useRef-based phase tracking is 10x faster than current setInterval approach.

**Current Protocol** (ARCHITECTURE.md):
- 1 Hz polling interval checks all vitals for phase progression

**Better Approach**:
- useRef-based event queue with timestamp comparison (no interval needed)

**Presentation**:
```
🔍 PROTOCOL IMPROVEMENT OPPORTUNITY DETECTED

Current Protocol:
Adaptive Salience uses 1 Hz setInterval to poll all vitals for phase progression.

Location: /docs/ADAPTIVE_SALIENCE_ARCHITECTURE.md:Performance Architecture

Better Approach Discovered:
Replace setInterval with useRef-based event queue. Phase check only happens
when vital changes, using timestamp comparison. No continuous polling.

Why It's Better:
- Performance: CPU reduced from 0.4% to 0.1% (-75%)
- Battery Life: No wake-ups every second (mobile battery savings)
- Maintainability: Simpler logic, fewer edge cases
- Accuracy: Exact phase calculation, no drift

Trade-Offs:
- Slightly more complex initialization (minimal)

Impact Assessment:
- Breaking Changes: None (same external behavior)
- Migration Effort: Low (internal refactor only)
- Documentation Updates Required:
  * ARCHITECTURE.md - Performance Architecture section
  * INTEGRATION_GUIDE.md - Performance Validation section
- Testing Required: Full unit + integration + performance benchmarks

Recommendation: Adopt after testing

Question:
Should we adopt this better approach and update our performance architecture protocols?
```

**If Approved**:
- Refactor useAdaptiveSalience.js
- Update performance benchmarks
- Update docs with new pattern
- Commit with `Protocol Evolution: useRef-based phase tracking`

---

#### Example 2: Documentation Structure

**Scenario**: AI discovers that splitting ARCHITECTURE.md into 3 smaller files improves readability.

**Current Protocol**:
- Single 2000-line ARCHITECTURE.md file

**Better Approach**:
- Split into:
  * ARCHITECTURE_CORE.md (philosophy + components)
  * ARCHITECTURE_INTEGRATION.md (integration points)
  * ARCHITECTURE_EXPANSION.md (expandability hooks)

**Presentation**:
```
🔍 PROTOCOL IMPROVEMENT OPPORTUNITY DETECTED

Current Protocol:
All architecture documentation in single ARCHITECTURE.md file (2000+ lines)

Location: /docs/ADAPTIVE_SALIENCE_ARCHITECTURE.md

Better Approach Discovered:
Split into 3 focused documents:
1. ARCHITECTURE_CORE.md - Philosophy, components, data flow
2. ARCHITECTURE_INTEGRATION.md - Integration points, data sources
3. ARCHITECTURE_EXPANSION.md - Adding vitals, Supabase, voice, multi-language

Why It's Better:
- Readability: Easier to find specific information
- Maintainability: Updates scoped to relevant section
- AI Parsing: Faster context loading (smaller files)
- Navigation: Clear separation of concerns

Trade-Offs:
- More files to maintain (but better organized)
- Need cross-references between files

Impact Assessment:
- Breaking Changes: None (content unchanged, just reorganized)
- Migration Effort: Medium (refactor + update all references)
- Documentation Updates Required:
  * Create 3 new files
  * Update CLAUDE.md references
  * Update INTEGRATION_GUIDE.md references
  * Update DOCUMENTATION_MAINTENANCE_PROTOCOL.md
- Testing Required: Validate all references still work

Recommendation: Adopt after migration validation

Question:
Should we split ARCHITECTURE.md into 3 focused documents for better organization?
```

**If Approved**:
- Create 3 new files with content reorganization
- Update all cross-references
- Archive old ARCHITECTURE.md
- Commit with `Protocol Evolution: Split architecture docs for readability`

---

### Protocol Evolution Tracking

**Maintain** `/docs/PROTOCOL_EVOLUTION_LOG.md`:

```markdown
# Protocol Evolution Log

Track all approved protocol improvements over time.

---

## [Evolution #3] - 2025-11-20

**Protocol**: Performance optimization - useRef-based phase tracking

**Previous Approach**: 1 Hz setInterval polling

**New Approach**: Event-driven timestamp comparison

**Rationale**:
- CPU reduced 75% (0.4% → 0.1%)
- Battery life improved (no continuous polling)
- Same accuracy, simpler logic

**Impact**:
- Breaking Changes: None
- Performance: ✅ 75% CPU reduction
- User Experience: ✅ Better battery life on mobile

**User Approval**: Aaron Tjomsland (2025-11-20)

**Files Updated**:
- useAdaptiveSalience.js - Removed setInterval, added event queue
- ARCHITECTURE.md - Updated Performance Architecture section
- INTEGRATION_GUIDE.md - Updated performance validation

---

## [Evolution #2] - 2025-11-10

**Protocol**: Documentation structure - Split ARCHITECTURE.md

**Previous Approach**: Single 2000-line file

**New Approach**: 3 focused documents (Core, Integration, Expansion)

**Rationale**:
- Easier to find information
- Faster AI context loading
- Better maintainability

**Impact**:
- Breaking Changes: None (content unchanged)
- Readability: ✅ Significantly improved
- Maintainability: ✅ Easier to update specific sections

**User Approval**: Aaron Tjomsland (2025-11-10)

**Files Updated**:
- Created ARCHITECTURE_CORE.md
- Created ARCHITECTURE_INTEGRATION.md
- Created ARCHITECTURE_EXPANSION.md
- Updated CLAUDE.md references
- Archived old ARCHITECTURE.md

---

## [Evolution #1] - 2025-10-31

**Protocol**: Critical alarm ducking override

**Previous Approach**: All alarms duck to 30% during speech

**New Approach**: Critical alarms maintain 50%, others 30%

**Rationale**:
- Emergency safety during voice activity
- Critical alarms must remain audible

**Impact**:
- Breaking Changes: None (enhancement only)
- User Experience: ✅ Safer during emergencies
- Specification Compliance: ✅ 100%

**User Approval**: Aaron Tjomsland (2025-10-31)

**Files Updated**:
- AdaptiveSalienceEngine.js - Added smart ducking logic
- ARCHITECTURE.md - Documented critical alarm protection
- IMPLEMENTATION.md - Updated audio ducking section
```

---

### Continuous Improvement Mindset

**Encourage AI Agents to**:
- ✅ Question current protocols if better approach exists
- ✅ Always present alternatives with clear rationale
- ✅ Never silently deviate (always get approval first)
- ✅ Document all protocol evolutions
- ✅ Maintain audit trail (PROTOCOL_EVOLUTION_LOG.md)
- ✨ **PROACTIVELY suggest aligned enhancements** (see Proactive Suggestion System below)

**User Commits to**:
- ✅ Review protocol improvement proposals seriously
- ✅ Provide clear approval/rejection with reasoning
- ✅ Trust AI agents to identify optimization opportunities
- ✅ Maintain openness to evolution while preserving core principles
- ✨ **Welcome early suggestions** - better to discuss now than retrofit later

**Core Principles That NEVER Change**:
- 🔒 Event-driven philosophy ("Only sound when sound adds value")
- 🔒 Real-time performance budget (<1% CPU, <500KB memory)
- 🔒 Medical accuracy (clinical standards)
- 🔒 Emergency safety (critical alarms audible)
- 🔒 User experience priority (supreme positive experience)

**Everything Else**: Open to evolution if demonstrably better.

---

## Proactive Suggestion System

### Philosophy: Suggest Aligned Enhancements Early

**Core Principle**: AI agents should **proactively suggest** features, improvements, and integrations that align with our documented vision - **while working on related tasks**.

**Why Early Suggestions Matter**:
- ✅ **Better Integration**: Easier to build aligned features together than retrofit later
- ✅ **Holistic Design**: Complete ecosystem vision emerges naturally
- ✅ **Reduced Technical Debt**: No awkward bolted-on afterthoughts
- ✅ **Efficiency**: One integrated development cycle vs multiple refactors

---

### When to Make Proactive Suggestions

**AI agents SHOULD suggest enhancements when**:

1. **Working on related feature** - "While building X, noticed Y would complete the picture"
2. **Spot alignment opportunity** - "This would advance our documented aims"
3. **See missing piece** - "Audio working great, but visual indicator would enhance user experience"
4. **Identify ecosystem synergy** - "This feature would strengthen Adaptive Salience philosophy"

**Example Scenarios**:

#### ✅ GOOD: Aligned Proactive Suggestion

**Context**: Working on Adaptive Salience audio escalation

**Observation**: Monitor has alarm sounds but no visual escalation indicator

**Suggestion**:
```
💡 PROACTIVE ENHANCEMENT SUGGESTION

Current Work: Implementing Adaptive Salience audio (3-phase escalation)

Aligned Enhancement Opportunity:
Add visual escalation indicator to complement audio system

Rationale:
- Aligns with "supreme positive user experience" principle
- Enhances awareness for users in noisy environments
- Reinforces Adaptive Salience phases visually
- Accessibility improvement (hearing-impaired users)

Proposed Implementation:
- Visual border color changes with escalation phase:
  * AWARENESS: Amber pulse (subtle)
  * PERSISTENCE: Orange glow (moderate)
  * NEGLECT: Red flash (insistent)
- Matches audio escalation timing exactly
- Synchronized with acknowledgment system

Benefits:
- User Experience: ✅ Multi-modal awareness (audio + visual)
- Accessibility: ✅ Works without sound
- Alignment: ✅ Reinforces Adaptive Salience philosophy
- Integration: ✅ Easy to add now (same state machine)

Impact:
- Breaking Changes: None
- Performance: Negligible (<0.1% CPU for CSS animations)
- Implementation Effort: Low (2-3 hours)

This aligns with our evolving vision for supreme user experience.
Should we add this visual enhancement now while building the audio system?
```

**Why This Is Good**:
- ✅ Directly related to current work (audio escalation)
- ✅ Aligns with documented principles (user experience, accessibility)
- ✅ Easy to integrate now (shares state machine)
- ✅ Advances ecosystem goals
- ✅ Presented as suggestion, not requirement

---

#### ✅ GOOD: Ecosystem Synergy Suggestion

**Context**: Implementing vital threshold detection

**Observation**: Thresholds are hardcoded, but future scenarios might need different values

**Suggestion**:
```
💡 PROACTIVE ENHANCEMENT SUGGESTION

Current Work: Implementing HR/SpO2 threshold detection

Future-Proofing Opportunity:
Design threshold system to support scenario-specific overrides

Rationale:
- Aligns with "scenario expansion" documented goal (100s of cases)
- Pediatric scenarios need different thresholds (HR >150 normal for infant)
- Trauma vs cardiac vs sepsis have different clinical priorities
- Supports multi-scenario expansion without engine refactor

Proposed Design Pattern:
```javascript
// Now: Hardcoded thresholds
if (hr >= 120) { /* tachycardia */ }

// Suggested: Configurable with defaults
const thresholds = scenario.customThresholds || DEFAULT_THRESHOLDS;
if (hr >= thresholds.hr.tachycardia) { /* ... */ }
```

Benefits:
- Expandability: ✅ Ready for 100s of scenarios
- Medical Accuracy: ✅ Age/context-appropriate thresholds
- Zero Breaking Changes: ✅ Defaults maintain current behavior
- Future-Proof: ✅ No engine refactor needed later

Impact:
- Breaking Changes: None (backward compatible)
- Performance: No change (same threshold checks)
- Implementation Effort: Low (1-2 hours now vs major refactor later)

This prepares us for the documented "hundreds of scenarios" goal.
Should we build in this flexibility now while implementing thresholds?
```

**Why This Is Good**:
- ✅ Prevents future technical debt
- ✅ Aligns with documented expansion goals
- ✅ Easy now, painful later
- ✅ Backward compatible
- ✅ Supports medical accuracy

---

#### ❌ BAD: Off-Topic Suggestion

**Context**: Working on audio escalation

**Bad Suggestion**:
```
💡 Hey, should we add user authentication? Would be cool to track which clinician acknowledged alarms.
```

**Why This Is Bad**:
- ❌ Violates CLAUDE.md rule #1: "Do NOT suggest login, authentication, or backend user systems"
- ❌ Not related to current work
- ❌ Not aligned with documented vision
- ❌ Adds complexity outside project scope

---

#### ❌ BAD: Premature Optimization

**Context**: Working on basic vital display

**Bad Suggestion**:
```
💡 We should implement advanced waveform compression algorithms to reduce memory by 2KB.
```

**Why This Is Bad**:
- ❌ Doesn't advance documented goals
- ❌ Performance already within budget (<500KB total)
- ❌ Adds complexity for negligible gain
- ❌ Not aligned with "supreme user experience" (invisible to user)

---

### Suggestion Format

**Use this template for proactive suggestions**:

```markdown
💡 PROACTIVE ENHANCEMENT SUGGESTION

Current Work: [What you're currently implementing]

Aligned Enhancement Opportunity:
[Brief 1-sentence description]

Rationale:
- Aligns with [specific documented principle/goal]
- [Why this makes sense now]
- [How it advances the ecosystem]

Proposed Implementation:
[Specific, concrete design - code examples if relevant]

Benefits:
- User Experience: [How it improves UX]
- Alignment: [Which documented goals it advances]
- Integration: [Why it's easier now than later]
- [Other benefits]

Impact:
- Breaking Changes: [None OR describe]
- Performance: [Within budget OR specify]
- Implementation Effort: [Low/Medium/High - with estimate]

This aligns with [specific documented vision element].
Should we [specific question]?
```

---

### Alignment Checklist

**Before suggesting, verify**:

- [ ] ✅ **Related to current work** - Not a random idea
- [ ] ✅ **Aligns with documented principles** - References specific CLAUDE.md/ARCHITECTURE.md goals
- [ ] ✅ **Advances ecosystem vision** - Moves toward stated destination
- [ ] ✅ **Within performance budget** - Won't violate <1% CPU, <500KB memory
- [ ] ✅ **User experience focus** - "Supreme positive experience" test
- [ ] ✅ **Early integration benefit** - Easier now than retrofit later
- [ ] ✅ **Concrete proposal** - Not vague "we should think about..."

**If ALL checkboxes ✅, make the suggestion!**

**If ANY checkbox ❌, defer or don't suggest**

---

### When NOT to Suggest

**Don't suggest if**:
- ❌ Off-topic (unrelated to current work)
- ❌ Violates documented rules (e.g., authentication systems)
- ❌ Premature optimization (no clear user benefit)
- ❌ Overly complex (doesn't advance goals proportionally)
- ❌ Outside performance budget
- ❌ Purely cosmetic (no UX improvement)
- ❌ "Nice to have" without strategic alignment

---

### Example Suggestion Scenarios (Real Use Cases)

#### Scenario 1: Audio + Visual Pairing

**✅ SUGGEST**: Visual alarm indicators while building audio escalation
**Rationale**: Multi-modal UX, accessibility, same state machine
**Timing**: Perfect - shares implementation

#### Scenario 2: Threshold Configurability

**✅ SUGGEST**: Scenario-specific thresholds while implementing threshold detection
**Rationale**: Prepares for "100s of scenarios" goal, easy now
**Timing**: Perfect - building the threshold system

#### Scenario 3: Waveform Annotations

**✅ SUGGEST**: Clinical annotations on waveforms while building waveform renderer
**Rationale**: Educational value, aligns with simulation goals
**Timing**: Good - easier to add during rendering implementation

#### Scenario 4: Alarm History Log

**⚠️ DEFER**: Alarm event history tracking
**Rationale**: Useful but not critical, can be added anytime
**Timing**: Not urgent - no integration benefit now

#### Scenario 5: Cloud Sync

**❌ DON'T SUGGEST**: Real-time cloud synchronization
**Rationale**: Violates offline-first principle, outside scope
**Timing**: Never - conflicts with documented architecture

---

### Suggestion Response Protocol

**User will respond in one of these ways**:

1. **✅ "Yes, add it now"** - Implement + document
2. **🔄 "Good idea, add to backlog"** - Add to PROTOCOL_EVOLUTION_LOG.md candidates
3. **⏸️ "Defer until [milestone]"** - Note in docs for later
4. **❌ "No, doesn't align"** - Note as rejected with reasoning
5. **🤔 "Tell me more"** - Provide additional detail, pros/cons, examples

**Never implement without explicit approval.**

---

### Tracking Proactive Suggestions

**Maintain section in PROTOCOL_EVOLUTION_LOG.md**:

```markdown
## Proactive Suggestions (Pending Evaluation)

### Suggestion #1: Visual Alarm Escalation Indicators
**Suggested**: 2025-10-31
**Context**: While implementing Adaptive Salience audio
**Status**: ✅ Approved - Implementation in progress
**Rationale**: Multi-modal UX, accessibility, shared state machine

### Suggestion #2: Scenario-Specific Threshold Overrides
**Suggested**: 2025-11-05
**Context**: While implementing threshold detection
**Status**: 🔄 Backlog - Good idea, defer until Supabase migration
**Rationale**: Prepares for 100s of scenarios

### Suggestion #3: Waveform Clinical Annotations
**Suggested**: 2025-11-10
**Context**: While building waveform renderer
**Status**: ⏸️ Deferred - After voice integration complete
**Rationale**: Educational value, but voice is higher priority

### Suggestion #4: Real-Time Collaboration
**Suggested**: 2025-11-12
**Context**: Database migration discussion
**Status**: ❌ Rejected - Outside project scope
**Rationale**: Violates offline-first principle, adds complexity
```

---

### Benefits of Proactive Suggestion System

**For the Project**:
- ✅ Holistic ecosystem design (not piecemeal)
- ✅ Fewer retrofit refactors (build it right first time)
- ✅ Natural evolution toward documented vision
- ✅ Early technical debt prevention

**For User (Aaron)**:
- ✅ See complete picture early
- ✅ Make informed decisions with context
- ✅ Influence direction before too much invested
- ✅ Build momentum toward ultimate vision

**For AI Agents**:
- ✅ Encouraged to think holistically
- ✅ Contribute strategic value (not just tactical coding)
- ✅ Build trust through aligned suggestions
- ✅ Develop deep understanding of project vision

---

### Golden Rules for Proactive Suggestions

1. 🔒 **Always aligned** - References documented principles/goals
2. 🔒 **Always timely** - Related to current work
3. 🔒 **Always concrete** - Specific proposal, not vague idea
4. 🔒 **Always optional** - User chooses, AI suggests
5. 🔒 **Never off-topic** - Stays within project scope
6. 🔒 **Never presumptuous** - "Should we consider?" not "I'm adding this"

**Philosophy**: AI as **strategic partner**, not just code executor.

---

## Summary

This maintenance protocol ensures Adaptive Salience documentation remains **evergreen, accurate, and AI-readable** throughout:
- ✅ Database migrations (Google Sheets → Supabase)
- ✅ Voice integration (isSpeaking connection)
- ✅ Multi-language expansion
- ✅ Scenario expansion (100s of cases)
- ✅ New vital parameters
- ✅ Performance optimizations
- ✅ **Self-evolving protocols** (continuous improvement)

**Key Strategies**:
1. **Update docs in same commit as code** (enforced by pre-commit hook)
2. **Weekly/monthly/quarterly audits** (automated scripts)
3. **Semantic versioning** (documentation = code version)
4. **CHANGELOG.md** (complete audit trail)
5. **Template-driven updates** (consistency)
6. **Automated validation** (catch outdated docs early)
7. **✨ Protocol evolution proposals** (AI-driven continuous improvement)

**Golden Rules**:
- 🔒 If code changed, documentation MUST change
- 🔒 Never silently deviate from protocols
- ✨ **Always propose better approaches when discovered**
- ✨ **Wait for user approval before evolving protocols**
- 🔒 Maintain complete audit trail (PROTOCOL_EVOLUTION_LOG.md)

🎯 **Self-Evolving Documentation Maintenance Protocol - Complete**
