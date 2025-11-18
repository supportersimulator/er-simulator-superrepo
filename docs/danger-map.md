## ER Simulator Danger Map

**Last Updated:** 2025-11-14

This document surfaces **structural, operational, security, cognitive, and migration risks** in the ER Simulator super-repo. It is meant to guide **where to be careful**, **what not to touch casually**, and **which areas require governance decisions before implementation work.**

---

## **1. Structural & Organizational Risks**

### **1.1 Mixed Concerns in `simulator-core/er-sim-monitor/`**

- **What’s happening:**
  - The monitor app, Apps Script tool-lab, Node tooling, backups, and experiments all live under one directory.
- **Why it’s dangerous:**
  - Refactors aimed at the React Native app can accidentally break Apps Script tooling or vice versa.
  - Cognitive load is high: it’s hard to know whether a file is runtime-critical or just a one-off migration script.
- **Governance questions:**
  - Which subfolders are **runtime-critical** vs **tooling-only** vs **archive**?
  - Do we want a formal split (e.g., `monitor/`, `apps-script-lab/`, `tools/`)?

### **1.2 Duplicate Monitor Trees**

- **Folders:**
  - `simulator-core/er-sim-monitor/` – active working copy.
  - `github-external/er-sim-monitor/` – imported GitHub clone.
- **Why it’s dangerous:**
  - Easy to accidentally open, edit, or run the wrong copy in tools like Cursor or VS Code.
  - Subtle drift between the two could cause confusion about which behavior is “current.”
- **Mitigation principle:**
  - Treat `github-external/` as **read-only reference**.
  - All active development happens under `simulator-core/`.

### **1.3 Apps Script Sprawl and Variants**

- **Where:**
  - `google-drive-code/apps-script/`
  - Apps Script-related files also appear in `simulator-core/er-sim-monitor/scripts/` and root.
- **Patterns:**
  - Multiple `Code_*.gs` variants.
  - Multiple `Phase2_*.gs`, `TEST_*.gs`, `Ultimate_*.gs` with overlapping responsibilities.
- **Why it’s dangerous:**
  - No single obvious "production lineage" for the Sim Builder.
  - Hard to know which file is authoritative when debugging or migrating.
- **Governance need:**
  - Explicitly choose which files form the **canonical production set** and mark others as archived.

---

## **2. Operational & Process Risks**

### **2.1 No Automated Testing**

- **Monitor:**
  - No Jest tests, no React Native Testing Library, no E2E.
- **Apps Script:**
  - Only manual testing, logs, and ad-hoc scripts; no formal unit or integration tests.
- **Why it’s dangerous:**
  - Any refactor can silently break:
    - Adaptive Salience thresholds and phase logic.
    - Row mapping logic (Input row N → Output row N).
    - Sheets ↔ JSON sync scripts.
- **Governance guidance:**
  - Define a **small set of sacred invariants** and write tests specifically for those before deep migrations.

### **2.2 Manually Orchestrated Pipelines**

- **Reality today:**
  - Many steps rely on you remembering sequences:
    - Trigger Apps Script batch.
    - Export CSVs.
    - Run local Node scripts.
    - Refresh Expo app.
- **Why it’s dangerous:**
  - High risk of stale data or partial updates.
  - Hard to repeat reliably under time pressure (e.g., before a teaching session).
- **Governance need:**
  - Decide which flows must be **one-command** or **single-button** before they are “allowed” for routine use.

### **2.3 Apps Script Monolith & Execution Limits**

- **Constraints:**
  - Apps Script runtime limits (6 minutes, API rate limits).
  - Monolithic `Code.gs` and its variants with many responsibilities.
- **Why it’s dangerous:**
  - Coupled and complex code makes bug-fix changes risky.
  - Scaling up scenario count or feature set can push against hard quota limits.
- **Governance implication:**
  - Use the upcoming Node/Django migration as an opportunity to **strip Apps Script down to UI + glue only**.

---

## **3. Security & Secrets Risks**

### **3.1 Secrets Stored in Sheets (Settings Tab)**

- **Where:**
  - `Settings` tab in the main Google Sheet (`Settings.csv` snapshot).
- **What:**
  - OpenAI API key and other configuration secrets in plaintext.
- **Why it’s dangerous:**
  - Any collaborator with sheet access can see and copy keys.
  - If the sheet is ever shared incorrectly, keys can leak.
- **Governance stance:**
  - Long term: "**No secrets live in Sheets**".
  - Short term: restrict sharing + plan migration to Secret Manager / `.env`.

### **3.2 OAuth Tokens and Credentials in Repo**

- **Where:**
  - `simulator-core/er-sim-monitor/config/` (token/credentials files).
- **Why it’s dangerous:**
  - If ever pushed to a public repo or given broader access, they grant ongoing access to Drive/Sheets.
- **Required mitigations:**
  - Ensure robust `.gitignore` or equivalent; treat config files as **never-commit**.
  - Consider centralizing secrets into a dedicated secure store (e.g., Google Secret Manager, AWS Secrets Manager) during backend migration.

### **3.3 Unclear `.gitignore` / `.cursorignore` Baseline**

- **Missing or incomplete ignore rules** increase risk of:
  - Checking in `node_modules/`.
  - Committing environment files.
  - Committing large backup zips.
- **Governance item:**
  - Establish a **repo-wide ignore policy** that is reviewed and updated as the architecture evolves.

---

## **4. Cognitive & Governance Risks**

### **4.1 Mode Confusion (Engineer vs Gold Miner vs Narrative)**

- **Modes in tension:**
  - **Simulator Core Engineer** – React Native, Expo, audio engine, waveforms.
  - **Apps Script Gold Miner** – `.gs` spelunking, Drive tooling, API surgery.
  - **Lore & Narrative Systems** – case design, progression curves, pedagogy.
- **Why it’s dangerous:**
  - It’s easy to context-switch mid-session, leading to half-finished changes across layers.
  - Decisions made in one mode can inadvertently constrain another.
- **Governance opportunity:**
  - Label tasks and time blocks with mode tags and avoid mixing modes within one session when possible.

### **4.2 Documentation vs Reality Drift**

- **Current status:**
  - Docs are unusually strong and fresh (as of 2025-11-14).
- **Risk:**
  - As soon as Phase II–III migrations begin, architecture and roadmap docs can become outdated.
  - Outdated docs are more dangerous than no docs.
- **Governance rule of thumb:**
  - When a major change is completed, updating the relevant doc is part of "done".

---

## **5. Migration & Future-Architecture Risks**

### **5.1 Sheets as Long-Term Database**

- **Limitations:**
  - Rate limits, poor concurrency, awkward query patterns.
  - Hard to handle multi-tenant, detailed analytics, or high write volume.
- **Why it’s dangerous:**
  - As you add instructors, scenarios, and features, Sheets becomes a brittle foundation.
- **Governance direction:**
  - Treat Sheets as an **authoring UI and staging area**, not the long-term system of record.

### **5.2 Too Many Futures at Once**

- **Mentioned in docs:** Supabase, Django, Next.js, AWS, ElevenLabs, multi-tenant SaaS.
- **Why it’s dangerous:**
  - Temptation to start multiple migrations in parallel (e.g., DB + backend + dashboard + voice AI).
- **Governance safeguard:**
  - Uphold a **strict phasing** discipline:
    - Phase II: Testing + dedup + version control.
    - Phase III: Logic migration (Apps Script → Node/TypeScript + DB).
    - Phase IV: Dashboards and backend.
    - Phase V: AWS & voice AI.

---

## **6. "Do Not Casual-Touch" Zones**

These areas should be treated as **sacred or high-risk** unless you are in the appropriate mode and have a clear plan:

- **Adaptive Salience Engine & SoundManager**
  - `simulator-core/er-sim-monitor/engines/`
  - Changes here impact core learner experience and clinical realism.

- **Canonical Apps Script Production Files**
  - `google-drive-code/sim-builder-production/Code.gs`
  - `google-drive-code/sim-builder-production/Ultimate_Categorization_Tool_Complete.gs`

- **Main Google Sheet Structure**
  - Column headers and row mapping in the Sheet and in `Master_Scenario_Convert.csv`.

- **OAuth/Config Assets**
  - Any files in `config/` that contain secrets or tokens.

Before touching these, it’s worth:
- Identifying the mode you’re in.
- Capturing a before/after snapshot.
- Ensuring at least light test coverage or reversible backups.

---

## **7. Top 5 Active Risk Areas (Short Term)**

From a governance perspective, the following risks are most pressing for the **next 2–4 weeks**:

1. **Undefined production lineage for Apps Script**
   - Risk: Fixes applied to the wrong `Code_*.gs`; production script diverges.

2. **No tests for sacred invariants**
   - Risk: Adaptive Salience or row mapping logic breaks silently in migrations.

3. **Secrets in Sheets and config files**
   - Risk: Key leakage if sharing or repo visibility changes.

4. **Manual and fragile authoring → monitor pipeline**
   - Risk: Stale or inconsistent vitals and scenarios during live use.

5. **Mode confusion and multi-front migration attempts**
   - Risk: Fragmented effort, unfinished work, and loss of trust in the system.

This danger map should be revisited whenever a major migration phase begins or ends, and whenever a significant incident (data bug, strange behavior in monitor, unexpected billing) occurs.
