---
phase: 02-firestore-cloud-saves
plan: 01
subsystem: data-layer
tags: [firestore, save-manager, security-rules, retry-logic]
dependency_graph:
  requires: [src/firebase.js]
  provides: [src/utils/saveManager.js, firestore.rules]
  affects: [all phase 2 plans that read/write character data]
tech_stack:
  added: [firebase/firestore (doc, collection, setDoc, getDocs, deleteDoc, serverTimestamp)]
  patterns: [fire-and-forget write, exponential backoff retry, subcollection path users/{uid}/characters/{slotId}]
key_files:
  created:
    - src/utils/saveManager.js
    - firestore.rules
  modified: []
decisions:
  - XP cap set to 200 (Legendary tier max is 150 XP, +50 buffer) — plan corrected from research suggestion of 500
  - saveCharacter uses return (not await) so callers can fire-and-forget without hanging offline
  - saveWithRetry uses setTimeout recursion (not async/await sleep) to avoid blocking event handlers
  - Full overwrite (no merge: true) prevents stale field drift when always writing complete playerStats
metrics:
  duration: 5 min
  completed: 2026-02-22
  tasks_completed: 2
  files_created: 2
  files_modified: 0
---

# Phase 2 Plan 01: Firestore Data Layer Summary

Firestore save/load/delete utilities with exponential backoff retry and security rules enforcing owner-only access and anti-cheat XP/level constraints.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create saveManager utility with Firestore save/load/delete and retry | 3a8a512 | src/utils/saveManager.js |
| 2 | Create Firestore security rules file | 8c1b5eb | firestore.rules |

## What Was Built

**`src/utils/saveManager.js`** — Four exported functions forming the Firestore data layer:

- `saveCharacter(uid, slotId, stats)` — Fire-and-forget `setDoc` to `users/{uid}/characters/{slotId}`. Returns Promise for callers to handle errors. Always full overwrite (no merge) to prevent stale field drift.
- `loadCharacterSlots(uid)` — Awaited `getDocs` on the characters subcollection. Returns `{ 1: data|null, 2: data|null }`, ignoring unexpected slot IDs.
- `deleteCharacterSlot(uid, slotId)` — Awaited `deleteDoc` plus `localStorage.removeItem('saveSlot' + slotId)` for legacy cleanup.
- `saveWithRetry(uid, slotId, stats, onWarning, attempt = 0)` — Wraps `saveCharacter` with 3-attempt exponential backoff (1s, 2s, 4s delays via `setTimeout`). Calls `onWarning(false)` on success to clear warnings, `onWarning(true)` after 3 failures to show "Cloud save unavailable" indicator.

**`firestore.rules`** — Deployable Firestore security rules covering four collections:

- `/usernames/{usernameLower}` — Public read (login resolution), auth-only write (registration)
- `/users/{userId}` — Owner-only profile read/write
- `/users/{userId}/characters/{slotId}` — Owner-only read/delete; create enforces `level=1, xp=0`; update enforces XP monotonic increase (max +200 per write), level increment max +1 per write, level cap 100
- `/sessions/{userId}` — Owner-only session lock read/write/delete

## Decisions Made

1. **XP cap corrected to 200** — Research suggested 500, but actual Legendary tier max is 150 XP. Set to 200 for reasonable headroom without exploitability.
2. **Fire-and-forget pattern** — `saveCharacter` returns the Promise without awaiting internally. Callers must not await it in event handlers (hangs offline). `saveWithRetry` is the recommended call site.
3. **setTimeout recursion in retry** — Keeps the retry chain non-blocking. Standard async/await approach would occupy the call stack during delays.
4. **Full overwrite on save** — The game always writes a complete `playerStats` object. Using merge would risk stale fields persisting after a character reset or data migration.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- [x] `src/utils/saveManager.js` exists with 4 named exports
- [x] `firestore.rules` exists at project root with valid structure
- [x] Build passes (`npm run build` — 82 modules, no import errors)
- [x] Commits 3a8a512 and 8c1b5eb exist in git log
- [x] saveCharacter uses `return setDoc(...)` (not await — confirmed fire-and-forget)
- [x] XP cap is 200 in rules (confirmed in `request.resource.data.xp - resource.data.xp) <= 200`)

## Self-Check: PASSED
