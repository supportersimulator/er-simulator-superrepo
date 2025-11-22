## Backend simulation flow

This backend exposes two primary endpoints for the ER Simulator case simulation:

- **`POST /api/sim/respond/`**
- **`GET /api/trigger-resource`**

### 1. `/api/sim/respond/`

**Method**: POST  
**Auth**: `IsAuthenticated` (Supabase JWT via `authbridge`)  
**Body**:

```json
{
  "session_id": "uuid-or-token (optional)",
  "case_id": "case_12",
  "utterance": "Can I get a chest x-ray and some labs?"
}
```

If `session_id` is omitted, a new one is generated server-side.

**Response**:

```json
{
  "session_id": "abc123",
  "case_id": "case_12",
  "speech_output": "Sure, I'll go ahead and order that chest x-ray and start some labs.",
  "action_triggers": [
    { "type": "resource_request", "resource": "chest_xray" },
    { "type": "resource_request", "resource": "basic_labs" }
  ],
  "ui_updates": {
    "note": "Clinician requested chest x-ray and labs. Resources unlocked."
  }
}
```

- `speech_output`: natural ED-style dialogue to be spoken aloud (frontend sends this to ElevenLabs).
- `action_triggers`: structured signals that the frontend can use to call `/api/trigger-resource` for each `resource_request`.
- `ui_updates`: optional hints for HUD/notes UI.

### 2. `/api/trigger-resource`

**Method**: GET  
**Auth**: `IsAuthenticated`  
**Query params**:

- `session_id`: simulation session identifier.
- `resource`: resource key, e.g. `chest_xray`, `basic_labs`.

Example:

```text
/api/trigger-resource?session_id=abc123&resource=chest_xray
```

**Behavior**:

1. Uses Redis (via `sim.state_store`) to ensure each `(session_id, resource)` is only **marked served once**.
2. Maps `resource` to an S3 key using `sim.resources.S3_RESOURCE_MAP`.
3. Uses `boto3` and `settings.ERSIM_ASSETS_BUCKET` to generate a presigned `get_object` URL.

**Response (first time)**:

```json
{
  "resource": "chest_xray",
  "s3_url": "https://presigned-url-here",
  "resource_type": "image"
}
```

If the same resource is requested again for the same session, the API responds:

```json
{
  "resource": "chest_xray",
  "already_served": true
}
```

### 3. Case primers and available resources

`sim.cases.build_case_primer(case_id)` returns:

```json
{
  "case_id": "case_12",
  "patient": {
    "age": 67,
    "sex": "male",
    "chief_complaint": "shortness of breath"
  },
  "initial_stage": "stage_1",
  "available_resources": ["chest_xray", "ekg", "basic_labs"]
}
```

This metadata is embedded into the system prompt used by `sim.ai_bridge.get_sim_ai_response`, and the GPT model is instructed to:

- Only trigger resources listed in `available_resources`.
- Verbally explain why a non-available resource cannot be ordered (no trigger).

### 4. Environment and infrastructure wiring

The backend expects the following environment variables (typically injected from Terraform outputs into `.env.prod` or similar):

- **Database / RDS**
  - `DATABASE_URL` (already used by `ersim_backend.settings.base`).
- **Redis**
  - `REDIS_URL` (already used by `ersim_backend.settings.base` and `sim.state_store`).
- **S3 buckets**
  - `ERSIM_ASSETS_BUCKET` – primary assets bucket (e.g. images, PDFs).
  - `ERSIM_ASSETS_BUCKET_LOGS` – secondary/logs bucket (reserved for future use).
- **OpenAI / GPT**
  - `OPENAI_API_KEY`
  - `OPENAI_GPT_MODEL` (optional, defaults to `gpt-4o-mini`).

With the Terraform stack deployed and these variables set, the simulation flow is:

1. Frontend sends learner speech → Whisper (existing `/api/voice/*` pipeline).
2. Frontend calls `/api/sim/respond/` with the transcript.
3. Backend calls GPT via `sim.ai_bridge`, receives `speech_output` + `action_triggers`.
4. Frontend speaks `speech_output` via ElevenLabs and, for each resource trigger, calls `/api/trigger-resource`.
5. Backend returns presigned S3 URLs to case assets, gated by Redis so each is only unlocked once per session.

---

## Case Import

Cases are stored in `SimCase` models and can be imported from Google Sheets or CSV files.

### Import from Google Sheets

```bash
# Dry run (preview what would be imported)
python manage.py import_cases_from_gsheet \
  "https://docs.google.com/spreadsheets/d/SHEET_ID/edit?gid=0#gid=0" \
  --dry-run

# Full import
python manage.py import_cases_from_gsheet \
  "https://docs.google.com/spreadsheets/d/SHEET_ID/edit?gid=0#gid=0"

# Import with S3 resource sync (downloads media and uploads to S3)
python manage.py import_cases_from_gsheet \
  "https://docs.google.com/spreadsheets/d/SHEET_ID/edit?gid=0#gid=0" \
  --fetch-resources

# Specific sheet tab (default is gid=0)
python manage.py import_cases_from_gsheet \
  "https://docs.google.com/spreadsheets/d/SHEET_ID/edit" \
  --gid=123456789
```

### Import from local CSV

```bash
python manage.py import_cases_from_csv /path/to/cases.csv --dry-run
python manage.py import_cases_from_csv /path/to/cases.csv
python manage.py import_cases_from_csv /path/to/cases.csv --fetch-resources
```

### Reference test case

**GAST0001** (Cholangitis & Sepsis) from the test sheet is the canonical end-to-end reference case:

- **Sheet**: `https://docs.google.com/spreadsheets/d/1wtFxBA31NsirzNngc0Gn2xzqjVx_bEIoqOeXC4bcX8c/`
- **Case ID**: `GAST0001`
- **Vitals States**: Initial_Vitals, State1_Vitals, State2_Vitals, State3_Vitals

This case validates the full pipeline: Google Sheet → SimCase → vitals roadmap → `/api/sim/respond/` with structured `update_vitals.next_state_id`.

