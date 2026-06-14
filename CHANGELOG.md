# Changelog

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
