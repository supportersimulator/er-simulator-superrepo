## Quick start for AI coding agents

This repository is an Expo (React Native) Monitor app that renders simulated patient vitals and waveforms.
Keep guidance tight and actionable — follow the examples below when making edits.

Key entry points
- `app/_layout.tsx`, `app/(tabs)/index.tsx` — app routing (expo-router).
- `components/Monitor.js` — primary UI, control modes (manual, scenario, livesync) and safe defaults.
- `data/vitals.json` — canonical scenarios used by the Monitor.
- `scripts/*` — developer scripts: `fetchVitalsFromSheetsOAuth.js`, `syncVitalsToSheets.js`, `liveSyncServer.js`.

Important runtime conventions
- The app is Expo SDK 54; start locally with `npm run start` (or `npm run ios` / `android` / `web`).
- LiveSync server listens on port 3333 by default; WebSocket URI used by the app is `ws://localhost:3333`.
- Google Sheets tooling reads/writes `data/vitals.json` and expects OAuth / service account config in `config/` and `.env`.

Data and patterns to preserve
- `DEFAULT_VITALS` in `components/Monitor.js` is the safe-render fallback — do not remove.
- The Monitor expects vitals shaped like:
  `{ hr, spo2, rr, bp: {sys,dia}, temp, etco2, waveform, rhythm }`.
- Waveform vs rhythm: many files use `waveform` and `rhythm` interchangeably; prefer reading `waveform` from parsed vitals and set `rhythm` where UI logic depends on it (see `extractVitalsFromEntry`).
- Scenario parsing honors 2-tier header names from the Sheets export (e.g. `Monitor_Vital_Signs:Initial_Vitals`).

Dev scripts and commands (explicit)
- Start app: `npm run start`
- Google OAuth fetch: `npm run auth-google` (first-time setup)
- Refresh vitals.json: `npm run fetch-vitals`
- Sync back to sheet / remap waveforms: `npm run sync-vitals` (or `npm run remap-waveforms`)
- Start LiveSync server: `npm run live-sync` and expose via `npx ngrok http 3333` for remote webhooks.

Safe editing rules for agents
- Preserve `__DEV__` controls and hot-reload ergonomics — avoid adding blocking build-time logic.
- Keep changes Expo-compatible (no native modules without a plan to add to `app.json` / build config).
- When adjusting waveform math or timing, modify `components/Waveform*.js` and run the app locally to validate visual output.
- When updating Sheets-related parsing or schema, update both the scripts in `scripts/` and the `extractVitalsFromEntry` logic in `components/Monitor.js`.

Integration & security notes
- Credentials: `config/google-service-account.json.example` exists as an example — never commit real credentials. Tokens/cache live under `config/token.json` and `.env` is used for private values.
- Network: LiveSync is local-first; tests should assume `localhost:3333` unless the developer provides an ngrok URL.

Files to check when changing behavior
- `components/Monitor.js`, `components/canonicalWaveformList.js`, `data/vitals.json`, `scripts/syncVitalsToSheets.js`, `scripts/liveSyncServer.js`.

If you need to commit
- Keep commits small and focused. Follow the repo's existing GitHub Sync Protocol in `CLAUDE.md` when collaborating with maintainers.

If anything inferred above is ambiguous, ask for the specific expected behavior (example: how to map a custom waveform key to the ECG renderer).
