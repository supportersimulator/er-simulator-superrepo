# CLAUDE.md

This file provides high-level guidance to Claude Code when working within this repository.

---

## 🩺 Project Overview

**ER Simulator Monitor**  
This project is a **React Native + Expo** module that powers the **live patient monitor interface** for the *Sim Mastery / ER Simulator* ecosystem.

Its purpose is to simulate realistic vital sign behavior — ECG, SpO₂, BP, and EtCO₂ — with **animated waveforms**, **dynamic vital interpolation**, and **synchronized audio feedback** (beep, alarm, flatline).  
This monitor operates locally and will later connect to AI-driven branching medical scenarios.

---

## 🧩 Core Objectives

- Real-time waveform rendering (`@shopify/react-native-skia` or SVG fallback)
- Smooth vital sign transitions and rhythm control
- Synchronized audio feedback from `assets/sounds`
- Developer controls for live testing (heart rate slider, rhythm selector)
- JSON-driven vitals import for future scenario linkage
- Offline-first design, Expo SDK 54 compatibility

---

## 🧠 Claude Behavior Rules

1. **Do NOT** suggest login, authentication, or backend user systems.  
2. Focus exclusively on **front-end simulation**, waveform math, hooks, and audio synchronization.
3. Prioritize **Expo-compatible** and **cross-platform (iOS/web)** safe code.
4. When improving components, preserve developer ergonomics (hot reload, `__DEV__` controls).
5. Coordinate decisions with ChatGPT (project architect) before structural changes.
6. Assume this module may later run **headlessly as part of a simulation engine** — avoid dependencies requiring navigation context or persistent state.

---

## 🧩 Architecture Summary

### File-Based Routing (Expo Router)
- `app/_layout.tsx` — Root layout (theme + navigation)
- `app/(tabs)/index.tsx` — Main screen rendering the **Monitor**
- `app/(tabs)/explore.tsx` — Secondary tab for testing or settings
- `app/modal.tsx` — Placeholder for overlays (not used yet)

### Core Components
**Monitor.js**
- Main visual for vitals
- Displays HR, SpO₂, BP, and EtCO₂
- Manages rhythm (sinus, afib, vtach, asystole)
- Smooth transitions via `interpolate()`
- Dev tools: HR slider, rhythm picker (in `__DEV__` mode)
- Expected prop structure:
  ```js
  {
    hr, spo2, rr,
    bp: { sys, dia },
    temp,
    rhythm
  }