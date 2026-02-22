---
phase: 02-firestore-cloud-saves
plan: 02
subsystem: session-management
tags: [session-lock, firestore, connection-monitoring, react-hooks]
dependency_graph:
  requires: [src/firebase.js]
  provides: [useSessionLock, useConnection, ConnectionOverlay]
  affects: []
tech_stack:
  added: []
  patterns: [custom-hook, firestore-setDoc, window-events, fixed-overlay]
key_files:
  created:
    - src/hooks/useSessionLock.jsx
    - src/hooks/useConnection.jsx
    - src/components/ConnectionOverlay.jsx
    - src/components/ConnectionOverlay.css
  modified: []
decisions:
  - "releaseLock not called on beforeunload — deleteDoc is unreliable in beforeunload; heartbeat timeout handles tab-close expiry"
  - "deviceId generated via crypto.randomUUID() at module load — stable for tab lifetime, unique per tab"
  - "Heartbeat stored in useRef (not useState) to avoid re-renders on interval ticks"
  - "useConnection initializes isOnline from navigator.onLine to avoid false offline flash on mount"
metrics:
  duration: 2 min
  completed: 2026-02-22
---

# Phase 02 Plan 02: Session Lock + Connection Monitoring Summary

Session lock (one active session per account) and connection monitoring (freeze overlay when offline) using Firestore writes and browser window events.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create useSessionLock hook | 21cae57 | src/hooks/useSessionLock.jsx |
| 2 | Create useConnection hook and ConnectionOverlay | f1dc581 | src/hooks/useConnection.jsx, src/components/ConnectionOverlay.jsx, src/components/ConnectionOverlay.css |

## What Was Built

**useSessionLock (`src/hooks/useSessionLock.jsx`):**
- Acquires a Firestore lock at `sessions/{uid}` on mount when `uid` is provided
- Checks existing lock: if a different `deviceId` holds the lock and it is less than 5 minutes old, sets `isBlocked = true`
- Writes `{ deviceId, lockedAt: serverTimestamp() }` to claim the lock
- Renews the lock every 2 minutes via `setInterval` stored in `useRef`
- Releases (deletes) the lock on unmount or uid change
- Exports: `{ isBlocked, isCheckingLock, acquireLock, releaseLock }`

**useConnection (`src/hooks/useConnection.jsx`):**
- Initializes from `navigator.onLine` to avoid false offline state on mount
- Listens to `window` `online` and `offline` events
- Cleans up event listeners on unmount
- Returns: `isOnline` boolean

**ConnectionOverlay (`src/components/ConnectionOverlay.jsx` + `.css`):**
- Returns `null` when `visible` is false
- Renders full-screen fixed overlay (z-index 10000) when visible
- `pointer-events: all` blocks all input to Phaser canvas and React UI beneath
- "Connection lost. Reconnecting..." text in RPG parchment color `#f4e4c1`

## Verification Results

1. `npm run build` passes — all 4 new files compile without import errors
2. `useSessionLock` exports: `acquireLock`, `releaseLock`, `isBlocked`, `isCheckingLock`
3. `useConnection` exports: `isOnline` boolean
4. `ConnectionOverlay` renders only when `visible` is true
5. Heartbeat interval started on lock acquire, cleared on release/unmount via `useRef`
6. CSS overlay covers full viewport with `pointer-events: all` blocking

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- src/hooks/useSessionLock.jsx: FOUND
- src/hooks/useConnection.jsx: FOUND
- src/components/ConnectionOverlay.jsx: FOUND
- src/components/ConnectionOverlay.css: FOUND
- Commit 21cae57: FOUND
- Commit f1dc581: FOUND
