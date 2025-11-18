# Migration & Refactoring Roadmap

**Last Updated:** 2025-11-14

---

## 🎯 Strategic Goals

### Immediate (Phase II - Next 2 Weeks)
- [ ] Deduplicate code files
- [ ] Set up automated testing
- [ ] Implement CI/CD pipeline
- [ ] Migrate Apps Script to Clasp (version control)

### Short-term (Phase III - 1-2 Months)
- [ ] Migrate Apps Script → Node.js/TypeScript
- [ ] Replace Google Sheets → Supabase PostgreSQL
- [ ] Build instructor dashboard (Next.js)
- [ ] Implement Django REST backend

### Long-term (Phase IV-V - 3-6 Months)
- [ ] AWS deployment (Amplify + RDS)
- [ ] Voice AI integration (ElevenLabs)
- [ ] Multi-tenant platform
- [ ] Subscription billing

---

## 📋 Phase II: Immediate Action Items

### 1. Code Deduplication

**Problem:** 142 code files imported, many are duplicates.

**Action Plan:**

```bash
# Find duplicate filenames
cd /Users/aarontjomsland/Documents/er-simulator-superrepo
find google-drive-code legacy-apps-script -type f -name "*.gs" | \
  awk -F/ '{print $NF}' | sort | uniq -d > tmp/duplicates.txt
```

**Strategy:**
- Group by filename
- Compare file hashes (MD5)
- Keep newest version (by Drive modified date)
- Move old versions to `tmp/inspect-later/duplicates/`
- Document decisions in `docs/deduplication-log.md`

---

### 2. Apps Script Version Control (Clasp)

**Install Clasp:**

```bash
npm install -g @google/clasp
cd /Users/aarontjomsland/Documents/er-simulator-superrepo
mkdir apps-script-source
cd apps-script-source
clasp clone 12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2
```

**Benefits:**
- Apps Script code in git
- Local development with VS Code
- CI/CD integration possible

---

### 3. Automated Testing

**Monitor Testing (Jest + React Native Testing Library):**

```bash
cd simulator-core/er-sim-monitor
npm install --save-dev jest @testing-library/react-native
```

**Priority:** Test Adaptive Salience Engine first (it's sacred architecture).

**Apps Script Testing:**
- Wait until migrated to Node.js (testing Apps Script directly is difficult)

---

### 4. CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/test.yml`:

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd simulator-core/er-sim-monitor && npm ci
      - run: npm test
```

---

## 🔄 Phase III: Node.js Migration

### Apps Script → Node.js Strategy

**Step 1:** Extract pure logic (no Google APIs)
- Move to `packages/scenario-validation/`, `packages/scoring-engine/`

**Step 2:** Replace Google Sheets API calls
- Use `googleapis` npm package OR migrate to Supabase

**Step 3:** Migrate OpenAI integration
- Use official OpenAI Node.js SDK

**Step 4:** Keep Apps Script as thin UI layer only
- Sidebar just calls Node.js backend API

---

### Google Sheets → Supabase Migration

**Database Schema:**

```sql
CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id TEXT UNIQUE NOT NULL,
  title TEXT,
  vitals JSONB NOT NULL,
  waveform TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Migration Script:**

```javascript
// Read from Sheets
const rows = await sheets.spreadsheets.values.get({
  spreadsheetId: SHEET_ID,
  range: 'Master Scenario Convert!A:Z'
});

// Insert into Supabase
for (const row of rows.data.values) {
  await supabase.from('scenarios').insert({
    case_id: row[0],
    title: row[1],
    vitals: JSON.parse(row[10])
  });
}
```

---

## 🚀 Phase IV-V: Full Stack Platform

### Next.js Instructor Dashboard

**Features:**
- Scenario library (browse, search, filter)
- Scenario editor (create/edit with live preview)
- Batch processing UI
- Analytics dashboard

**Tech Stack:** Next.js 14 + TypeScript + Tailwind + Supabase

---

### Django REST Backend

**Key Endpoints:**
- `GET /api/scenarios/` - List all scenarios
- `POST /api/scenarios/` - Create scenario
- `GET /api/scenarios/{id}/` - Get scenario detail
- `POST /api/batch/process/` - Start batch job

**Models:** Scenario, Curriculum, Subscription, User

---

### AWS Deployment Architecture

```
Route 53 (DNS)
  ↓
CloudFront (CDN)
  ↓
┌──────────┬──────────┬──────────┐
│ S3       │ Amplify  │   ALB    │
│ (Assets) │ (Next.js)│ (Django) │
└──────────┴──────────┴────┬─────┘
                           ↓
                    ┌──────┴──────┐
                    │ RDS         │
                    │ (PostgreSQL)│
                    └─────────────┘
```

---

## 📊 Migration Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| **Phase I** (Super-repo) | 1-2 days | ✅ COMPLETE |
| **Phase II** (Testing + Dedup) | 1-2 weeks | 📅 NEXT |
| **Phase III** (Node.js + Supabase) | 3-4 weeks | 📅 PLANNED |
| **Phase IV** (Next.js + Django) | 4-6 weeks | 📅 PLANNED |
| **Phase V** (AWS + Voice AI) | 2-3 weeks | 📅 PLANNED |

**Total:** ~10-15 weeks (2.5-4 months)

---

## ⚠️ Key Risks

1. **Data Loss During Migration** → Always backup first, test with sample data
2. **Breaking Monitor App** → Use feature flags, maintain backward compatibility
3. **OAuth/API Limits** → Implement rate limiting and caching
4. **AWS Cost Overruns** → Start with Free Tier, set CloudWatch alarms

---

## ✅ Success Criteria

**Phase II:**
- [ ] Zero duplicate files in super-repo
- [ ] All code in git (via Clasp)
- [ ] 80%+ test coverage for Adaptive Salience
- [ ] CI/CD pipeline passing

**Phase III:**
- [ ] All Apps Script logic in Node.js
- [ ] All scenarios in Supabase (Sheets deprecated)
- [ ] Real-time sync working
- [ ] Batch processing 10x faster

**Phase IV-V:**
- [ ] Instructor dashboard live
- [ ] 100+ scenarios in production
- [ ] 10+ instructor users onboarded
- [ ] Voice AI guidance working

---

## 📚 Related Docs

- [superrepo_inventory.md](superrepo_inventory.md) - Full file inventory
- [architecture_overview.md](architecture_overview.md) - System architecture
- [env-setup.md](env-setup.md) - Environment variables guide

---

**Next Action:** Start Phase II - Code Deduplication + Clasp Setup
