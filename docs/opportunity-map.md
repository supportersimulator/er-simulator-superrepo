## ER Simulator Opportunity Map

**Last Updated:** 2025-11-14

This document highlights **high-leverage opportunities** across architecture, process, pedagogy, and platform. It is meant to help decide **where small efforts can produce outsized benefits**, especially given limited time and energy.

---

## **1. System Design & Separation Opportunities**

### **1.1 Clarify Three-Layer Architecture (Language & Boundaries)**

Introduce and consistently use a three-layer mental model:

- **Layer 1 – Authoring Factory (Cloud):**
  - Google Sheets + Apps Script (Sim Builder and related tools).
  - Responsibility: transform messy clinical/narrative input into structured, pedagogically rich scenarios.

- **Layer 2 – Scenario Platform (Backend):**
  - Future Django REST API + PostgreSQL (RDS/Supabase) + queues/workers.
  - Responsibility: store, version, serve, and batch-process scenarios for many instructors/learners.

- **Layer 3 – Experiences (Frontends):**
  - React Native monitor (this repo), future Next.js dashboard, and other modalities.
  - Responsibility: deliver tension, pacing, visuals, and audio in line with educational philosophy.

**Opportunity:**
- Use these layer names in docs, commit messages, and to label tasks.
- Before starting any work, ask: *“Which layer am I changing?”*

---

### **1.2 Lightly Separate Concerns Inside `er-sim-monitor`**

Without heavy refactors, you can still clarify the internal structure:

- Label subfolders in `simulator-core/er-sim-monitor/README.md` as:
  - **Runtime App:** `app/`, `components/`, `engines/`, `hooks/`, `assets/`, `data/`.
  - **Apps Script Lab:** specific subsets of `scripts/`, `.gs` working files, diagnostics.
  - **Docs & Logs:** `docs/`, `testing/`, `future-upgrades/`.

**Opportunity:**
- A few sentences of documentation can significantly lower cognitive friction every time you re-enter the project.
- Later, when you’re ready, this becomes the blueprint for physically splitting these into clearer subtrees.

---

## **2. Process & Safety Opportunities**

### **2.1 "Sacred Invariant" Testing (Small, Powerful Test Suite)**

Rather than aiming for full test coverage, define a tiny set of **sacred behaviors** and test only those first:

- **Invariant 1 – Row Mapping:**
  - `Input` row N → `Master Scenario Convert` row N → JSON entry N.
- **Invariant 2 – Adaptive Salience Thresholding:**
  - Given a fixed sequence of vitals changes, the engine moves through phases (Awareness → Persistence → Neglect) as designed.

**Opportunity:**
- Just a handful of tests here will protect you through Phase II–III migrations.
- They can be written once and then reused as guardrails for many refactors.

---

### **2.2 One-Command Pipelines for Critical Flows**

Pick 1–2 workflows that you rely on most often and turn them into **single commands**:

- Example candidates:
  - "Update monitor with latest scenarios":
    - Today: run Apps Script batch → export → run Node script → refresh app.
    - Target: `npm run update-scenarios` that orchestrates everything it safely can.

**Opportunity:**
- Reduces cognitive load and error risk.
- Eases the path toward automated CI/CD later.

---

### **2.3 Codify Secrets Governance**

Define a simple, strong principle:

- **Medium-term rule:**
  - "No secrets live in Sheets or committed files; they live in managed secret stores or `.env` gated by `.gitignore`."

**Opportunity:**
- A single clear rule simplifies many small decisions.
- You can roll this in gradually (starting with OpenAI keys and OAuth tokens).

---

## **3. Architecture & Platform Opportunities**

### **3.1 Scenario Schema as a First-Class Asset**

You already have a very rich scenario schema in `Master_Scenario_Convert.csv`:

- 600+ columns covering:
  - Organization metadata.
  - Narrative hooks (pre-sim, post-sim, why it matters).
  - Vitals JSON fields.
  - Pathways and decision nodes.
  - CME objectives, quiz questions.

**Opportunity:**
- Extract this into an explicit **schema artifact** (e.g., JSON Schema, DB models, or a Markdown spec).
- Treat the schema as the contract between:
  - Authoring tools (Sheets/Apps Script).
  - Backend (Django/DB).
  - Frontends (monitor, dashboards).

This turns your educational philosophy and narrative design into concrete structures that can be validated, versioned, and extended.

---

### **3.2 Introduce a Thin Backend Bridge Before Full Django**

Instead of jumping straight to a full Django stack, consider a **thin bridge service**:

- A small Node or Python API that:
  - Exposes a minimal set of endpoints:
    - `GET /vitals`
    - `GET /scenarios/:case_id`
  - Initially reads from Sheets/CSV.
  - Later swaps to PostgreSQL/Supabase without changing the API shape.

**Opportunity:**
- Lets you design and test API contracts early.
- Decouples the React Native monitor from Sheets before the full backend is ready.

---

### **3.3 Progressive Migration of Apps Script Logic**

You can gradually move pure logic out of Apps Script into shared libraries:

- **Step 1:** Identify logic that does **not** depend on `SpreadsheetApp`:
  - Parsing fields.
  - Validation rules.
  - Quality scoring.
  - ATSR title transformations.
- **Step 2:** Re-implement those pieces in Node/TypeScript modules under a `packages/` directory.
- **Step 3:** Have Apps Script call those via HTTP (when the backend exists) or keep a temporary duplication until migration is complete.

**Opportunity:**
- Reduces the surface area of Apps Script and prepares clean, testable logic for Django/Node backends.

---

## **4. Narrative & Curriculum Opportunities**

### **4.1 Build "Pathways" and "Journeys" from Existing Fields**

Your schemas already encode:

- Difficulty levels.
- Case categories (GI, RESP, etc.).
- Pathway or course names.
- Learning objectives and quiz questions.

**Opportunity:**
- Use these fields to assemble **course-like flows**:
  - "Nightmare Sepsis Pathway".
  - "Pregnancy Respiratory Emergencies".
  - "Foundational Cases On-Ramp".
- This can be done at the data layer first (e.g., generating CSVs/JSON subsets) before a full dashboard exists.

### **4.2 Tie Adaptive Salience to Narrative Pacing**

Adaptive Salience is already sophisticated and well-documented.

**Opportunity:**
- Connect scenario state (e.g., decision nodes, time-to-deterioration) with audio phases:
  - Awareness → early narrative tension.
  - Persistence → escalating urgency.
  - Neglect → consequences of ignoring key cues.
- This makes the audio engine a direct expression of your pedagogy rather than just "alarms".

---

## **5. Mode-Based Workflow Opportunities**

### **5.1 Mode Tags for Tasks and Time Blocks**

Introduce explicit mode tags when planning or logging work:

- **[Core Engineer]** – React Native, Expo, audio, UI, performance.
- **[Apps Script Gold Miner]** – `.gs` mining, Drive/Sheets integration, Node scripts.
- **[Lore/Narrative]** – scenario writing, curriculum design, story arcs.

**Opportunity:**
- Reduce context switching by planning sessions in a single mode.
- Make it easier to ask for help from the right "agent persona" (Core Engineer vs Gold Miner vs Narrative Systems).

### **5.2 Governance as a Light-Weight Ritual**

Use the three governance docs (`system-map.md`, `danger-map.md`, `opportunity-map.md`) as:

- A quick pre-session read:
  - "Where am I in the system?"
  - "What should I not break?"
  - "What small opportunity can I advance today?"
- A log of decisions:
  - When you resolve a danger or implement an opportunity, add a line under a "Changelog" section.

**Opportunity:**
- Keeps governance actionable and human-scaled instead of heavy and corporate.

---

## **6. Near-Term High-Leverage Opportunities (Next 2–4 Weeks)**

### **6.1 Canonical Apps Script Lineage**

- Choose and document **one** production lineage for Apps Script:
  - Name it explicitly (e.g., "Sim Builder Production Lineage").
  - Point to the exact files and folders.
- This unlocks safer deduplication and migrations.

### **6.2 Minimal Tests for Sacred Invariants**

- Implement a few tests in the monitor repo (or in a small Node harness) for:
  - Adaptive Salience behavior.
  - Scenario row mapping and vitals extraction.

### **6.3 Clean Secret Handling Rule**

- Begin moving secrets out of Sheets and into `.env` or a secret manager.
- Update `env-setup.md` to reflect the new practice.

### **6.4 One-Command Update Flow**

- Wrap your most common “update scenarios → run monitor” pathway into a single script or npm command.

---

## **7. Longer-Term Strategic Opportunities**

- **Backend & DB:**
  - Design API contracts and DB schema so they mirror the existing Sheets schema, making migration less painful.

- **Instructor Dashboard:**
  - Use `Master_Scenario_Convert` + quality scores + categories to build a truly meaningful dashboard for case selection and curriculum planning.

- **Voice & Multi-Modal:**
  - With Adaptive Salience and rich narratives in place, voice AI (e.g., ElevenLabs) can be integrated to provide emotionally resonant guidance and debriefing.

This opportunity map should be treated as a **menu**, not a mandate. At any given time, pick **one or two** items that align with your current energy and the active phase (II, III, IV, V) and deliberately ignore the rest until the phase changes.
