# Voice Engine Architecture

## 1. Purpose and Scope

This document describes the **voice-to-voice AI simulation engine** that will power the ER Simulator ecosystem. It focuses on:

- **Backend services** (Django + DRF) and their apps/endpoints
- **Voice Reasoning JSON schema** used by GPT
- **End-to-end pipeline**: Mic → Whisper → GPT → ElevenLabs → client
- **Supabase Auth integration** for user identity

Vitals monitor, CSV ingestion, billing, and other systems will later **consume** this engine’s outputs but are **out of scope** here.

---

## 2. High-Level System Overview

### 2.1 Components

- **Backend (Django + DRF)** – central voice engine:
  - `users/` – user profiles linked to Supabase identities
  - `authbridge/` – Supabase JWT verification & DRF integration
  - `voice/` – Whisper + ElevenLabs orchestration & HTTP endpoints
  - `ai/` – GPT prompting, reasoning JSON, and validation
  - `sessions/` – conversation memory (last 5–10 turns per user)

- **Mobile client (Expo React Native)** – primary learner interface:
  - Supabase Auth login
  - Push-to-talk mic button
  - Audio playback of AI responses
  - Conversation transcript view

- **Web portal (Next.js)** – instructor/desktop interface:
  - Supabase Auth login
  - Dashboard and future controls
  - `/portal/sim/test-voice` page for voice pipeline testing

- **External AI/voice services**:
  - **Whisper** via OpenAI (`OPENAI_API_KEY` / `WHISPER_API_KEY`)
  - **GPT‑4o** (or similar) for reasoning JSON
  - **ElevenLabs** (`ELEVENLABS_API_KEY`) for TTS output

### 2.2 End-to-End Flow

1. **Mic Input** (mobile or web): user holds a push-to-talk button and records audio.
2. **Upload to Backend**: client sends audio to `/api/voice/full`.
3. **Transcription (Whisper)**: backend calls Whisper to obtain a transcript.
4. **Reasoning (GPT)**: backend calls GPT with transcript + recent context to get a **Voice Reasoning JSON** object.
5. **Synthesis (ElevenLabs)**: backend sends `assistant_text` to ElevenLabs, receives audio.
6. **Response to Client**: backend returns transcript, reasoning JSON, assistant text, and audio (base64 or URL).
7. **Playback & Display**: client renders transcript, shows AI text, and plays the audio reply.

The same backend pipeline serves both **mobile** and **web portal** clients.

---

## 3. Backend Apps and Endpoints

### 3.1 Django Apps

- **`users`**
  - Stores local user profiles keyed by Supabase user ID.
  - May track preferences, roles, and simulation settings.

- **`authbridge`**
  - Validates Supabase JWTs using `python-jose` and Supabase configuration.
  - Provides DRF authentication/permission classes.
  - Ensures that `/api/voice/*` endpoints see a consistent `request.user`.

- **`voice`**
  - HTTP surface for the voice pipeline.
  - Orchestrates Whisper + GPT + ElevenLabs calls (via helper functions).

- **`ai`**
  - Encapsulates GPT prompts, parsing, and schema validation.
  - Ensures GPT responses conform to the **Voice Reasoning JSON** contract.

- **`sessions`**
  - Tracks recent turns per user (in Redis or DB fallback).
  - Provides context to `ai` when building new GPT prompts.

### 3.2 Core Endpoints

All endpoints are mounted under `/api/voice/` in the Django project.

#### 3.2.1 `POST /api/voice/transcribe`

- **Input:** multipart/form-data with:
  - `audio` – audio file (e.g., WAV, M4A)
  - optional metadata: `language`, `user_id`
- **Process:**
  - Sends audio to Whisper.
  - Receives transcript and detected language.
- **Output (example):**
  ```json
  {
    "transcript": "He is more short of breath now.",
    "language": "en",
    "duration_sec": 8.7
  }
  ```

#### 3.2.2 `POST /api/voice/respond`

- **Input:** JSON body:
  ```json
  {
    "user_id": "supabase_user_id_or_uuid",
    "transcript": "The patient is more short of breath now."
  }
  ```
- **Process:**
  - Retrieves the last 5–10 conversational turns for this user from `sessions`.
  - Builds a GPT prompt that includes case context + recent turns.
  - Calls GPT‑4o to generate a **Voice Reasoning JSON**.
  - Validates/normalizes the JSON via the `ai` module.
- **Output:**
  ```json
  {
    "reasoning": { /* Voice Reasoning JSON */ },
    "assistant_text": "Okay, tell me his current blood pressure and oxygen saturation.",
    "session_id": "...",
    "turn_id": "..."
  }
  ```

#### 3.2.3 `POST /api/voice/speak`

- **Input:** JSON body:
  ```json
  {
    "assistant_text": "Okay, tell me his current blood pressure and oxygen saturation.",
    "voice_id": "optional_specific_voice_id"
  }
  ```
- **Process:**
  - Sends `assistant_text` to ElevenLabs using `ELEVENLABS_API_KEY`.
  - Receives synthesized speech.
- **Output (example):**
  ```json
  {
    "audio_base64": "...",
    "format": "mp3"
  }
  ```
  or
  ```json
  {
    "audio_url": "https://.../generated_audio.mp3"
  }
  ```

#### 3.2.4 `POST /api/voice/full`

- **Input:** multipart/form-data or JSON + signed URL:
  - `audio` – recorded speech from the learner
  - `user_id` – Supabase user ID (or derived from JWT)
- **Pipeline:**
  1. Call `/api/voice/transcribe` logic.
  2. Feed transcript into `/api/voice/respond` logic.
  3. Pass `assistant_text` into `/api/voice/speak` logic.
  4. Persist this turn to `sessions`.
- **Output (example):**
  ```json
  {
    "transcript": "The patient is more short of breath now.",
    "reasoning": { /* Voice Reasoning JSON */ },
    "assistant_text": "Okay, tell me his current blood pressure and oxygen saturation.",
    "audio_base64": "...",
    "session_id": "...",
    "turn_id": "..."
  }
  ```

A simple `/api/health/` endpoint provides a basic healthcheck.

---

## 4. Voice Reasoning JSON Schema

The **Voice Reasoning JSON** represents what GPT should return for each conversational turn.

### 4.1 Schema

```json
{
  "assistant_text": "What the AI says",
  "clinical_intent": "question | command | explain | reassurance | escalation",
  "vitals_effect": {
    "hr": "+5",
    "bp": "-10",
    "spo2": "-2",
    "mental_status": "worsening"
  },
  "next_step": "suggested follow-up"
}
```

### 4.2 Field Semantics

- **`assistant_text`**
  - The exact text that will be spoken via ElevenLabs and shown in the UI.
  - Plain, conversational language aligned with the learner’s level.

- **`clinical_intent`**
  - Categorical label describing the **purpose** of the AI’s utterance.
  - Allowed values (initial): `"question" | "command" | "explain" | "reassurance" | "escalation"`.
  - Used later for analytics, case design, and adaptive difficulty.

- **`vitals_effect`**
  - Describes **relative changes** expected in simulated vitals in response to learner actions and scenario trajectory.
  - **Relative deltas** as strings (`"+5"`, `"-10"`) allow the vitals engine to adjust from current state.
  - `mental_status` uses descriptive labels (e.g., `"improving"`, `"stable"`, `"worsening"`).

- **`next_step`**
  - A short description of what the learner should do next (from the AI’s perspective).
  - Example: `"Ask about chest pain characteristics"`, `"Order a repeat blood pressure"`.

The vitals monitor engine will later **consume** `vitals_effect` to update heart rate, blood pressure, oxygen saturation, and mental status over time.

---

## 5. Supabase Auth Integration

### 5.1 Identity Flow

1. **Client Login**
   - Mobile and web clients authenticate directly with Supabase using public keys.
   - Supabase issues a JWT that represents the user.

2. **API Requests**
   - Clients include the Supabase JWT in the `Authorization: Bearer <token>` header for all `/api/voice/*` requests.

3. **Backend Verification (`authbridge`)**
   - The `authbridge` app provides a DRF authentication class that:
     - Validates the JWT signature and claims using Supabase config and `python-jose`.
     - Extracts the Supabase user ID from the token.
   - On successful verification, `request.user` is set to a local `User` instance (in the `users` app), created on first access if needed.

4. **Conversation Context**
   - The `sessions` app uses `request.user` (or Supabase user ID) as the key for conversation history.
   - This ensures that both mobile and web calls for the same human end up sharing the same **conversation memory**.

### 5.2 Permissions

- By default, all `/api/voice/*` endpoints require an authenticated user (via Supabase JWT).
- Future extensions may add roles (e.g., learner vs instructor) and rate limiting.

---

## 6. Client Integration (Mobile and Web)

### 6.1 Mobile (Expo React Native)

- Uses Supabase Auth for login.
- Sends recorded audio to `/api/voice/full`.
- Receives transcript, reasoning JSON, and AI audio.
- Displays a scrolling conversation view and plays AI audio responses.

### 6.2 Web Portal (Next.js)

- Uses Supabase Auth listener for user sessions.
- Provides `/portal/sim/test-voice` page where instructors can:
  - Upload an audio file.
  - Call `/api/voice/full`.
  - View the returned reasoning JSON and play audio.

Both clients talk to the **same backend** and share the same voice reasoning engine and conversation memory.

---

## 7. Future Integration with Vitals Monitor

- The vitals monitor will periodically pull or receive events derived from the **Voice Reasoning JSON**.
- The `vitals_effect` block will drive changes to:
  - Heart rate (hr)
  - Blood pressure (bp)
  - Oxygen saturation (spo2)
  - Mental status
- This architecture allows the voice engine to remain relatively independent, while still tightly integrated with the simulator’s physiological model.
