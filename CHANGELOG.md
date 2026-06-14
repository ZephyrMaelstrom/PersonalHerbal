# Changelog

## Phase 5e — The ArchDruid persona

- The conversational AI is now **the ArchDruid**: an extremely knowledgeable, eager-to-teach
  companion who explains the "why", defines jargon, and proactively flags safety — while
  keeping accuracy, uncertainty, and not-medical-advice guardrails intact.
- Shared persona in `src/lib/ai/persona.ts`, used by both "Ask the ArchDruid" (per species)
  and the ArchDruid companion screen. The structured reference monograph stays objective.

## Phase 5d — AI companion (engagement drop 4)

### Added
- **Ask about this plant** — a chat dialog on each species (header "Ask") that answers
  questions with the plant + your saved reference + region as context.
- **Herbalist companion** (`/companion`, linked from Today) — one-tap prompts ("what to
  harvest now", "what can I make", "safety review") plus free-form questions, grounded in
  your in-season plants, collection, and safety flags.
- Both reuse the existing Anthropic/Claude setup and your local key; clearly labeled as
  reference guidance, not medical advice.

## Phase 5c — Progress & rituals (engagement drop 3, opt-in)

Off by default; enable under Settings → Progress & achievements.

### Added
- **Progress screen** (`/progress`): a level + points bar, a daily-activity **streak**, stat
  tiles, and **13 achievements** (locked/unlocked), all derived from your existing data.
- **Achievement unlock toasts** — earned achievements pop a toast app-wide (initialization
  seeds silently after data loads, so enabling never floods past progress).
- A compact **level/streak card** on Today when enabled.

## Phase 5b — Visual herbarium (engagement drop 2)

### Added
- **Gallery view** on the Species screen — a photo-forward 2-column grid (toggle between
  list and gallery).
- **Map of finds** (`/map`, linked from Today) — an interactive Leaflet/OpenStreetMap map
  pinning every sighting and harvest that has coordinates; tap a pin to jump to the species.
  (Map tiles need a connection; the rest of the app stays offline.)

### Deferred
- Botanical/parchment **theme** — held back to avoid a risky full re-palette; can follow as
  a focused polish pass.

## Phase 5a — Field Companion (engagement drop 1)

Make the app worth opening daily and frictionless to capture in the field.

### Added
- **Quick capture** — a camera FAB on every screen opens a streamlined flow: snap a photo,
  pick *or create* a species inline, drop a pin, save a sighting. First photo of a new
  species becomes its main photo automatically.
- **Living Today**:
  - **Moon phase** (offline) with illumination; **sunrise/sunset + daylight** once a home
    location is set (one-tap GPS, computed offline).
  - **In season now** — your species whose harvest seasons match the current season.
  - **Plant of the day** — a daily species spotlight.
  - **On this day** — past sightings/harvests/journal entries from the same date in prior years.
- Offline astronomy (`src/lib/astro.ts`) and season mapping (`src/lib/season.ts`); optional
  home coordinates in settings.

## Phase 4 — MVP round-out (dashboards, journal, backup, photos, polish)

UX/feature pass to make the app feel complete.

### Requested changes
- **Alphabetical dropdowns** — every controlled-vocabulary picker is now sorted A→Z by label.
- **Main photo beside species** — a thumbnail shows next to each species in the header and
  the list. The first photo added becomes the main automatically; you can switch the main
  from any photo (★) in the Photos tab. Deleting the main reassigns to another photo.
- **Removed the bottom-nav "Add (+)"** — Add lives on the Species and Today screens.

### Added
- **Tab fix** — the species tab bar now wraps to two rows so Photos/History are always
  reachable on a phone (previously clipped off-screen).
- **Backup & Restore** (Settings) — export all data + photos to a JSON file; import replaces
  on-device data (with a confirm dialog). Protects against browser-storage loss / phone moves.
- **Today dashboard** — preparations "ready to press", quick links to Journal/Calendar/Places,
  recent species with thumbnails, and an API-key nudge.
- **Journal** (`/journal`) — dated entries with optional title, body, and species tagging.
- **Calendar** (`/calendar`) — maturing/ready preparations plus a recent-activity agenda.
- **Places** (`/places`) — saved locations with sighting/harvest counts, rename, and delete.
- **Undo on delete** — sightings, harvests, preparations, photos, journal entries, and places
  now delete via a toast with **Undo**.
- **Global toasts**, an **offline indicator**, a **service-worker update prompt** ("New
  version — Refresh"), and an **Install app** action in Settings.

### Notes
- Dexie schema bumped to v3 (adds the journal table; additive — existing data preserved).
- Deferred: Android **share-target** (sharing a photo straight into a new sighting) — it needs
  a custom service worker (injectManifest) plus query handling under hash routing; install +
  offline indicator shipped instead.

## Phase 3 — AI reference generation, version history, Settings, edit species

Completed the last "coming soon" tab and added the AI layer. Reference pages are
AI-generated, validated, versioned, and read-only from the notes side — kept strictly
separate from My Notes, per the two-layer model.

### Added
- **Settings** screen (new bottom-nav tab): Anthropic API key (stored only on device,
  shown masked), default model (Opus 4.8 / Sonnet 4.6 / Haiku 4.5), region/bioregion, and
  units. The key is read only when you explicitly tap Generate.
- **AI reference generation** (`/species/:id/reference`): model + prompt-template +
  region + citation-depth + "send my structured attributes" controls, then **Generate →
  preview (with a changed-fields diff vs the current version) → Save**. Uses the official
  Anthropic SDK with Claude; output is validated against a Zod schema and retried once on
  failure. Each generation is stored as an immutable version with model, prompt version,
  SHA-256 content hash, and timestamp.
- **Reference tab**: renders the current version as a structured monograph; shows a yellow
  **"unsourced"** banner when the model returned no citations.
- **History tab**: browse all versions, view any in a dialog, and **Make current** to
  promote an older version. Current/unsourced badges included.
- **Edit species** (`/species/:id/edit`): an Edit button on the species header reopens the
  full dropdown-first form pre-filled, so you can change or deselect any field as new info
  arises.

### Privacy & safety
- AI output is written **only** to the reference layer, never to My Notes.
- The optional "send my structured attributes" toggle (off by default) sends only
  controlled-vocabulary attributes — never free-text notes, voice memos, or photos.

### Notes
- Provider is Claude via the Anthropic SDK (browser mode); the key lives in local
  device storage only, matching the no-server design. Two new deps: `@anthropic-ai/sdk`
  and `zod`.

## Phase 2 — Sightings, Harvests, Preparations, Photos

Replaced four of the five "coming soon" species-detail tabs with working, fully local
features. Everything works offline and needs no API key. The AI-generated Reference page
and its version **History** remain deferred (the fifth tab still shows a placeholder).

### Added
- **Photos** tab: capture from the Android camera *or* pick from the device library
  (multi-select), client-side downscaling to keep storage small, thumbnail grid, and a
  full-size view/delete dialog. Photos stored as Blobs in the local DB.
- **Sightings** tab: manual-ID log with optional photo, confidence dropdown, location
  (saved place / one-tap GPS / manual lat-lng), date, and notes. No vision AI.
- **Harvests** tab: plant part, amount + unit, condition, location, intended use
  (multi-select), date, and notes.
- **Preparations** tab: method-driven new-prep form that auto-fills solvent/ratio/ready
  date from per-method templates, plus the full lifecycle state machine
  (`macerating → ready → pressed → bottled → in_use → archived`) that stamps dates as you
  advance it and flags preparations that are ready to press.
- **Places**: reusable saved locations with a shared `LocationPicker` (GPS, named places,
  manual coordinates), used by Sightings and Harvests.
- Two new vocabularies: `amount_unit` and `prep_state`.

### Storage
- `DataStore` extended with `places`, `sightings`, `harvests`, `preparations`, and
  `photos` sections; Dexie schema bumped to **v2** (additive — existing on-device data is
  preserved). Deleting a species now cascades to all of its observation/preparation/photo
  records; deleting a sighting removes its linked photo.

## Phase 1 — Scaffold, PWA, Android test loop, Species CRUD

Initial build focused on making the app testable on Android with no computer involvement.

### Added
- Vite + React + TypeScript + Tailwind + Radix/shadcn-style UI scaffold.
- Installable PWA: web manifest, generated icons (192/512/maskable + apple-touch),
  service worker via `vite-plugin-pwa` with auto-update, offline app shell.
- GitHub Actions workflow that builds and deploys to GitHub Pages on every push to
  `main` (with `404.html` SPA fallback and Pages auto-enablement).
- TanStack Router (hash history) + TanStack Query; mobile bottom-nav app shell.
- Dropdown-first vocabulary system: 22 seed vocabularies in `src/lib/vocab/`, a
  `user_vocab` store, and `Combobox`, `MultiSelectChips`, `EnumSelect`, `TagInput`
  primitives. Custom values persist and reappear.
- Storage abstraction (`DataStore`) with an IndexedDB/Dexie backend.
- Species feature: create (dropdown-heavy form), list with search + filters, detail
  screen with **Reference** (read-only, awaiting AI phase) and **My Notes** (editable
  private layer) tabs, and delete.
- Today screen with species count, recents, and a build stamp for verifying deploys.

### Deviations from the original spec (to ease Android testing)
- Storage uses IndexedDB (Dexie) for v1 instead of SQLite-WASM/OPFS — same `DataStore`
  interface, so SQLite can be added later. Avoids web-worker/header requirements that
  make OPFS fragile on static hosting.
- Hash-based routing instead of HTML5 history, to avoid refresh 404s on GitHub Pages.
- Code-based TanStack Router route tree (vs file-based codegen) for simpler, more
  reliable CI builds.

### Verified
- `npm run typecheck` and `npm run build` pass locally.
