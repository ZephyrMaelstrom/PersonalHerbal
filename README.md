# Verdant Codex

A solo, local-first personal herbarium & materia medica. No accounts, no social, no
cloud — all your data lives in your browser on your device. Built as an installable PWA
so you can test it on Android with **no computer involved**.

**Live app:** https://zephyrmaelstrom.github.io/PersonalHerbal/

---

## Test it on your Android phone (no computer needed)

1. **One-time setup (do this once, from your phone's browser):**
   - Make the repo **public** so free GitHub Pages can serve it:
     GitHub → this repo → **Settings → General → Danger Zone → Change repository
     visibility → Public**.
   - The deploy workflow turns GitHub Pages on automatically the first time it runs. If
     GitHub still shows Pages as off, go to **Settings → Pages → Build and deployment →
     Source → "GitHub Actions"** once.

2. **Install the app on Android:**
   - Open https://zephyrmaelstrom.github.io/PersonalHerbal/ in **Chrome**.
   - Tap the **⋮** menu → **Add to Home screen** (or accept the install prompt).
   - Launch it from your home screen — it runs full-screen and works offline.

3. **The iterate loop:** every time changes land on the `main` branch, GitHub Actions
   rebuilds and redeploys automatically (takes ~1–2 min). Reopen the app or pull to
   refresh. The footer on the **Today** screen shows a `build <sha> · <time>` stamp so
   you can confirm you're looking at the latest version.

> Your plant data is stored locally (IndexedDB) and never uploaded. Making the repo
> public only exposes the **source code**, not your data.

---

## What works in this phase

- Installable, offline-capable PWA (manifest + service worker, auto-update).
- **Species**: create (dropdown-first form), browse, search, filter, view, delete.
- **Two-layer detail screen**: a read-only **Reference** tab (AI wiki layer — generated
  in a later phase) and an editable **My Notes** tab (your private observations). The
  layers never mix.
- **Dropdown-first vocab system**: every bounded field is a combobox / multi-select /
  chip picker backed by seed vocabularies in `src/lib/vocab/`. Custom values you type are
  saved and reappear in future dropdowns.

Sightings, Harvests, Preparations, Photos, Journal, Calendar, AI reference generation,
and encrypted backup are scaffolded-for and arrive in later phases.

---

## Tech notes

- **Stack:** Vite + React + TypeScript + Tailwind + Radix/shadcn-style UI, TanStack
  Router (hash history) + TanStack Query.
- **Storage:** IndexedDB via Dexie, behind a `DataStore` interface
  (`src/lib/storage/`). A SQLite-WASM/OPFS backend can be slotted in later without
  touching feature code. (IndexedDB was chosen for v1 because it needs no special
  headers or web workers, so it "just works" on GitHub Pages and Android Chrome.)
- **Routing uses hash history** (`/#/species/...`) so a hard refresh never 404s on
  static hosting.
- **Base path** is env-driven: `VITE_BASE_PATH` defaults to `/PersonalHerbal/` for
  GitHub Pages; set `VITE_BASE_PATH=/` for a future native build.

## Local development (optional — not required for phone testing)

```bash
npm install
npm run dev        # http://localhost:5173/PersonalHerbal/
npm run typecheck
npm run build && npm run preview
```

## Android packaging with Capacitor (later)

```bash
npm i -D @capacitor/core @capacitor/cli @capacitor/android
npx cap init
VITE_BASE_PATH=/ npm run build
npx cap add android
npx cap sync android
```
