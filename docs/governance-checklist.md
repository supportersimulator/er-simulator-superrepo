## ER Simulator Governance Checklist (Phase II Focus)

**Last Updated:** 2025-11-14

This checklist turns the **System Map**, **Danger Map**, and **Opportunity Map** into concrete actions for the next **2–4 weeks**. The goal is not to do everything, but to move a few high-leverage items forward safely.

---

## **0. Working Agreements (Meta)**

- **Modes:**
  - **[Core Engineer]** – React Native, Expo, audio engine, UI.
  - **[Apps Script Gold Miner]** – Apps Script, Sheets APIs, Node tooling.
  - **[Lore/Narrative]** – scenario content, progression, pedagogy.
- Before starting a session, pick **one mode** and try to stay in it.
- When in doubt, consult:
  - `docs/system-map.md`
  - `docs/danger-map.md`
  - `docs/opportunity-map.md`

---

## **1. Short-Term Safety & Clarity (Week 1–2)**

### **1.1 Establish Canonical Apps Script Lineage**  
**Mode:** [Apps Script Gold Miner]

- [ ] Open `docs/system-map.md` and `docs/danger-map.md` for context.
- [ ] Confirm that **`google-drive-code/sim-builder-production/Code.gs`** is the current production entry point.
- [ ] Confirm that **`google-drive-code/sim-builder-production/Ultimate_Categorization_Tool_Complete.gs`** is the production categorization tool.
- [ ] In a short note (e.g., add a section to `sim-builder-production-notes.md`), explicitly declare these files as **“Sim Builder Production Lineage”**.
- [ ] Treat all other `Code_*.gs` / `Phase2_*.gs` / `TEST_*.gs` as **non-production** unless explicitly promoted.

### **1.2 Harden Secrets Handling (Minimum Pass)**  
**Mode:** [Apps Script Gold Miner]

- [ ] Review **Settings** tab of the Google Sheet (API keys, secrets).
- [ ] Ensure the sheet is **not shared** beyond trusted accounts.
- [ ] Confirm any token or credential files under `simulator-core/er-sim-monitor/config/` are **ignored by git**.
- [ ] Add or update `.gitignore` (or equivalent) to exclude:
  - `config/token.json`
  - `config/credentials.json`
  - `.env`, `*.env`
- [ ] Add a short “Secrets” section to `env-setup.md` summarizing the current agreed practice.

### **1.3 Snapshot Before Major Changes**  
**Mode:** any

- [ ] Keep `tmp/superrepo-backup-before-drive-import.zip` until Phase II is done.
- [ ] Before large refactors, capture:
  - [ ] A note in `IMPORT_SUMMARY_*.md` or a new changelog section.
  - [ ] Any relevant JSON or CSV snapshots if you are changing schema or vitals.

---

## **2. Minimal Testing for Sacred Invariants (Week 2–3)**

### **2.1 Adaptive Salience Invariant Tests**  
**Mode:** [Core Engineer]

- [ ] Identify a few **representative vitals sequences** (e.g., stable → mild abnormal → critical).
- [ ] Design expected salience phase transitions for those sequences (Awareness → Persistence → Neglect).
- [ ] Add a small test harness (e.g., Jest unit tests) that:
  - [ ] Calls `AdaptiveSalienceEngine` with test vitals.
  - [ ] Asserts that the phase transitions match expectations.
- [ ] Document the test rationale in `ADAPTIVE_SALIENCE_ARCHITECTURE.md` or a new short testing note.

### **2.2 Row Mapping & Scenario Identity Tests**  
**Mode:** [Apps Script Gold Miner or Core Engineer]

- [ ] Pick a few known scenarios in the Sheet (e.g., by `Case_ID`).
- [ ] Verify:
  - [ ] Input row N in the Sheet corresponds to row N in `Master_Scenario_Convert.csv`.
  - [ ] The entry for that case in `data/vitals.json` matches the expected vitals.
- [ ] Add a small script or test that:
  - [ ] Takes a `Case_ID` and checks consistency across Sheet → CSV → JSON.
- [ ] Record the behavior and assumptions in `sheets-notes.md`.

---

## **3. Gentle Structural Clarification (Week 2–4)**

### **3.1 Label Sub-Areas Inside `er-sim-monitor`**  
**Mode:** [Core Engineer]

- [ ] Update `simulator-core/er-sim-monitor/README.md` (or create it if missing) to:
  - [ ] List which folders are **runtime app** (`app/`, `components/`, `engines/`, `hooks/`, `assets/`, `data/`).
  - [ ] List which parts are **Apps Script lab/tooling** (`scripts/`, embedded `.gs` files, etc.).
  - [ ] List **docs/logs** folders (`docs/`, `testing/`, `future-upgrades/`).
- [ ] Note in that README that `github-external/er-sim-monitor/` is a **read-only reference**.

### **3.2 Document One-Command Flow Target (Even Before Implementing)**  
**Mode:** [Core Engineer + Apps Script Gold Miner]

- [ ] In `migration_next_steps.md` or a new short doc, define:
  - [ ] What an ideal "update monitor with latest scenarios" command should do.
  - [ ] Which parts are feasible now (e.g., chaining existing scripts) and which will wait for backend work.

You do **not** need to implement the full one-command flow yet; simply defining it clearly is already valuable governance work.

---

## **4. Narrative & Schema Governance (Optional, Week 3–4)**

### **4.1 Elevate Scenario Schema to a Named Artifact**  
**Mode:** [Lore/Narrative + Apps Script Gold Miner]

- [ ] Create a short `docs/scenario-schema.md` that:
  - [ ] Names the key groups of fields (organization, narrative, vitals, pathways, CME, media).
  - [ ] Points to `Master_Scenario_Convert.csv` as the current source.
- [ ] Identify **3–5 fields** that are **non-negotiable** for a "complete" scenario (e.g., `Case_ID`, `Spark_Title`, `Why_It_Matters`, `Vitals_JSON`).
- [ ] Note any early ideas about future database tables or JSON structures.

---

## **5. Review & Adaptation Ritual**

### **5.1 Weekly 20–30 Minute Governance Review**

Once per week (or whenever you switch phases):

- [ ] Skim:
  - `docs/system-map.md`
  - `docs/danger-map.md`
  - `docs/opportunity-map.md`
- [ ] Mark which checklist items are:
  - [ ] **Still relevant**.
  - [ ] **Completed** (add a short "done" note or date).
  - [ ] **De-prioritized** (explicitly decide not to do them now).
- [ ] Add at most **1–2 new items** that feel truly important; avoid letting this list balloon.

---

## **6. What “Success” Looks Like for Phase II Governance**

By the time you are ready to call Phase II "done", aim for:

- [ ] Clear Apps Script production lineage documented.
- [ ] Secrets no longer stored solely in Sheets or committed files.
- [ ] At least **minimal tests** in place for:
  - [ ] Adaptive Salience phase transitions.
  - [ ] Scenario row mapping across Sheet → CSV → `vitals.json`.
- [ ] `er-sim-monitor` README explaining runtime vs lab vs docs regions.
- [ ] A defined vision for a one-command update flow, even if not fully implemented.

After that, you can confidently transition into **Phase III** work (Node/TypeScript migration + DB introduction) knowing the foundations are safer and clearer.
