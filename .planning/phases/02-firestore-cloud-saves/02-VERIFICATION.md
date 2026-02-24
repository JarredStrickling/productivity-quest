---
phase: 02-firestore-cloud-saves
verified: 2026-02-23T00:00:00Z
status: passed
score: 10/10 must-haves verified
re_verification: false
human_verification:
  - test: "Cross-device save persistence"
    expected: "Character saved on Device A appears with correct stats on Device B after login"
    why_human: "Cannot verify actual Firestore round-trip reads across real network sessions programmatically"
  - test: "Session lock blocks second device"
    expected: "Second browser/incognito tab sees 'Session Active Elsewhere' screen; first device continues normally"
    why_human: "Multi-session concurrency requires two live browser contexts"
  - test: "Connection overlay on network loss"
    expected: "Chrome DevTools offline mode triggers full-screen overlay; removing offline restores gameplay without user action"
    why_human: "Requires simulating a real network state change in a running browser"
  - test: "XP devtools manipulation rejected by Firestore"
    expected: "A raw setDoc call from browser console with an XP delta > 200 is rejected by Firestore security rules"
    why_human: "Security rule enforcement requires a live Firestore project with deployed rules"
---

# Phase 2: Firestore Cloud Saves - Verification Report

**Phase Goal:** Character save slots are stored in Firestore and accessible from any device the user logs into
**Verified:** 2026-02-23
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Contextual Adjustments Applied

Two ROADMAP success criteria are evaluated against authoritative decisions documented in `02-CONTEXT.md`:

- **Criterion #1 ("3 character slots"):** Game was reduced to 2 slots during Phase 1 UI work. CONTEXT.md line 9 states "The game currently supports 2 save slots." The implementation correctly uses 2 slots throughout. This is not a gap — the ROADMAP has a stale number.
- **Criterion #4 (localStorage migration):** CONTEXT.md explicitly decided "No localStorage-to-Firestore migration. Cloud starts fresh." This overrides the ROADMAP success criterion. REQUIREMENTS.md also places ACCT-06 (migration) in v2 scope and the Out-of-Scope table explicitly lists "Cloud save migration from localStorage." Criterion #4 is evaluated as N/A by user decision.

---

## Goal Achievement

### Observable Truths

All truths are derived from the phase goal and plan `must_haves` frontmatter across all three plans.

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `saveCharacter` writes a full playerStats object to Firestore at `users/{uid}/characters/{slotId}` | VERIFIED | `saveManager.js` line 14-17: `setDoc(doc(db, 'users', uid, 'characters', String(slotId)), { ...stats, savedAt: serverTimestamp() })` |
| 2 | `loadCharacterSlots` reads both character slots from Firestore and returns `{ 1: data\|null, 2: data\|null }` | VERIFIED | `saveManager.js` lines 26-36: `getDocs` on characters subcollection, iterates snapshot, slot IDs 1 and 2 only |
| 3 | `deleteCharacterSlot` removes the Firestore document and cleans up the legacy localStorage key | VERIFIED | `saveManager.js` lines 45-48: `deleteDoc` + `localStorage.removeItem('saveSlot' + slotId)` |
| 4 | `saveWithRetry` retries up to 3 times with exponential backoff and calls a warning callback on final failure | VERIFIED | `saveManager.js` lines 65-81: `attempt < 3` check, `Math.pow(2, attempt) * 1000` delays, `onWarning(true)` on exhaustion |
| 5 | Security rules enforce owner-only access, XP monotonic increase, level increase capped at 1 per write | VERIFIED | `firestore.rules` lines 17-48: owner-only read/create/delete; update rule enforces `xp >= resource.data.xp` (same level) or `xp >= 0 && xp <= 200` (level-up), level delta <= 1 |
| 6 | Only one browser tab/device can play on a given account at a time — a second device sees a blocked message | VERIFIED | `useSessionLock.jsx`: acquireLock checks existing session age vs 5-minute timeout and different deviceId; App.jsx lines 456-468: renders `session-blocked` div when `isBlocked` is true |
| 7 | Session lock auto-expires after 5 minutes if the user closes the tab without logging out | VERIFIED | `useSessionLock.jsx` line 5: `SESSION_TIMEOUT_MS = 5 * 60 * 1000`; lock deliberately NOT released on beforeunload — heartbeat timeout handles expiry |
| 8 | A session heartbeat renews the lock every 2 minutes on active sessions | VERIFIED | `useSessionLock.jsx` line 6: `HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000`; `startHeartbeat` called after successful lock acquire; stored in `useRef` to avoid re-renders |
| 9 | SaveSlotSelection loads from Firestore and all save events in App.jsx use `saveWithRetry` instead of localStorage | VERIFIED | `SaveSlotSelection.jsx` line 4: imports `loadCharacterSlots, deleteCharacterSlot`; `App.jsx` lines 254, 282, 371: `saveWithRetry` called in `handleTaskSubmit`, `handleAllocateStat`, `handleCharacterCreation` |
| 10 | Connection overlay appears when offline; `handleLogout` releases session lock before signing out | VERIFIED | `App.jsx` line 473: `<ConnectionOverlay visible={!isOnline} />`; `App.jsx` line 410: `await releaseLock()` before `await logout()` |

**Score: 10/10 truths verified**

---

## Required Artifacts

### Plan 01 Artifacts

| Artifact | Provides | Exists | Substantive | Wired | Status |
|----------|----------|--------|-------------|-------|--------|
| `src/utils/saveManager.js` | 4 exported Firestore functions with retry | Yes | 82 lines, 4 real implementations | Imported in App.jsx + SaveSlotSelection.jsx | VERIFIED |
| `firestore.rules` | Security rules for 4 collections | Yes | 57 lines, valid rule structure | Deployed to Firebase (not client-consumed) | VERIFIED |

### Plan 02 Artifacts

| Artifact | Provides | Exists | Substantive | Wired | Status |
|----------|----------|--------|-------------|-------|--------|
| `src/hooks/useSessionLock.jsx` | Session lock: acquire/release/heartbeat/blocked state | Yes | 91 lines, real Firestore writes | Imported and called in App.jsx line 46 | VERIFIED |
| `src/hooks/useConnection.jsx` | Online/offline status via window events | Yes | 20 lines, listens to `online`/`offline` events | Imported and called in App.jsx line 47 | VERIFIED |
| `src/components/ConnectionOverlay.jsx` | Full-screen connection lost overlay | Yes | 12 lines, real render with guard | Rendered in App.jsx line 473 | VERIFIED |
| `src/components/ConnectionOverlay.css` | Overlay styling with pointer-events blocking | Yes | `pointer-events: all`, `z-index: 10000`, `position: fixed` | Imported in ConnectionOverlay.jsx line 1 | VERIFIED |

### Plan 03 Artifacts

| Artifact | Provides | Exists | Substantive | Wired | Status |
|----------|----------|--------|-------------|-------|--------|
| `src/components/SaveSlotSelection.jsx` | Firestore-backed save slot UI | Yes | 157 lines, real loadCharacterSlots call, loading/error states | Used inside MainMenu.jsx | VERIFIED |
| `src/components/MainMenu.jsx` | Slot-full check from Firestore prop | Yes | Derives `slotsFull` from `saveSlots` prop — no localStorage | Receives `saveSlots` and `uid` from App.jsx | VERIFIED |
| `src/App.jsx` | Game orchestrator with all Firestore wiring | Yes | All 3 save events use `saveWithRetry`; session lock + connection overlay integrated | Is the root component | VERIFIED |
| `src/App.css` | Session-blocked screen and save-warning styles | Yes | `.session-blocked` (line 243), `.save-warning` (line 291) | Used by App.jsx class names | VERIFIED |

---

## Key Link Verification

### Plan 01 Key Links

| From | To | Via | Status | Detail |
|------|----|-----|--------|--------|
| `saveManager.js` | `src/firebase.js` | `import { db }` | WIRED | Line 2: `import { db } from '../firebase'` |
| `saveManager.js` | `firebase/firestore` | `setDoc, getDocs, deleteDoc, serverTimestamp` | WIRED | Line 1: `import { doc, collection, setDoc, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore'` |

### Plan 02 Key Links

| From | To | Via | Status | Detail |
|------|----|-----|--------|--------|
| `useSessionLock.jsx` | `src/firebase.js` | `import { db }` | WIRED | Line 3: `import { db } from '../firebase'` |
| `useSessionLock.jsx` | `firebase/firestore` | `doc, setDoc, getDoc, deleteDoc, serverTimestamp` | WIRED | Line 2: all 5 imports present |
| `useConnection.jsx` | `window online/offline events` | `addEventListener` | WIRED | Lines 7-8: `addEventListener('online', ...)` and `addEventListener('offline', ...)` |

### Plan 03 Key Links

| From | To | Via | Status | Detail |
|------|----|-----|--------|--------|
| `App.jsx` | `src/utils/saveManager.js` | `import { saveWithRetry, loadCharacterSlots }` | WIRED | Line 19: import present; lines 125, 254, 282, 371: all used |
| `App.jsx` | `src/hooks/useSessionLock.jsx` | `import { useSessionLock }` | WIRED | Line 17: import; line 46: called in component body |
| `App.jsx` | `src/hooks/useConnection.jsx` | `import { useConnection }` | WIRED | Line 18: import; line 47: called in component body |
| `App.jsx` | `src/components/ConnectionOverlay.jsx` | `import ConnectionOverlay` | WIRED | Line 15: import; line 473: rendered in JSX |
| `SaveSlotSelection.jsx` | `src/utils/saveManager.js` | `import { loadCharacterSlots, deleteCharacterSlot }` | WIRED | Line 4: import; lines 17, 46: both functions used |
| `MainMenu.jsx` | `props.saveSlots` | saveSlots prop from App.jsx | WIRED | Line 5: destructured; line 9-11: used to derive `slotsFull` |

---

## Requirements Coverage

| Requirement | Description | Plans | Status | Evidence |
|-------------|-------------|-------|--------|----------|
| ACCT-04 | User's character save slots are stored in Firestore, not localStorage | 02-01, 02-03 | SATISFIED | `saveManager.js` writes to `users/{uid}/characters/{slotId}`; `App.jsx` has zero `localStorage.setItem` calls for save data; cleanup removes legacy keys on login |
| ACCT-05 | User can access saves from any device by logging in | 02-02, 02-03 | SATISFIED | Saves stored in Firestore (not device-local); session lock ensures one active session; `loadCharacterSlots` called on every login |

**Note on ACCT-04 wording ("3 character slots"):** The requirement text says "3 character slots" but CONTEXT.md documents the authoritative state as 2 slots. The implementation correctly handles 2 slots. This is a documentation artifact from before Phase 1 reduced the count.

### Orphaned Requirements Check

No requirements in REQUIREMENTS.md map to Phase 2 beyond ACCT-04 and ACCT-05. No orphaned requirements found.

---

## Success Criteria Evaluation (from ROADMAP.md)

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 1 | "A logged-in user's 3 character slots load from Firestore on login, not localStorage" | VERIFIED (2 slots) | Implementation uses 2 slots per CONTEXT.md decision. Firestore load on login confirmed in App.jsx lines 123-134. |
| 2 | "Progress made in-session is written to Firestore and survives a full browser refresh" | VERIFIED (automated) | `saveWithRetry` called on task submit, stat allocate, character create. Human test needed for actual refresh confirmation. |
| 3 | "A user who logs in from a different device sees the same character saves" | HUMAN NEEDED | Architecture is correct (Firestore is source of truth); live cross-device test required. |
| 4 | "Existing localStorage saves imported to Firestore on first login" | N/A — USER DECISION | CONTEXT.md explicitly: "No localStorage-to-Firestore migration. Cloud starts fresh." REQUIREMENTS.md places ACCT-06 (migration) in v2 and Out-of-Scope table. |
| 5 | "Firestore security rules prevent arbitrary XP or level values via devtools" | VERIFIED (rules) + HUMAN for live test | Rules enforce XP monotonic increase (capped +200 per write), level cap +1 per write. Live devtools test requires deployed rules. |

---

## Anti-Patterns Scan

| File | Pattern | Severity | Finding |
|------|---------|----------|---------|
| `saveManager.js` | Empty/placeholder impl | — | None found |
| `useSessionLock.jsx` | Stub returns | — | None found |
| `App.jsx` | localStorage.setItem for save data | — | None — only `removeItem` (cleanup) calls remain |
| `App.jsx` | localStorage.getItem for save data | — | None — no reads of save keys |
| `SaveSlotSelection.jsx` | localStorage reads | — | None |
| `MainMenu.jsx` | localStorage reads | — | None |

No blockers or warnings found.

---

## Notable Implementation Decisions (Post-Plan Fixes Applied)

The following fixes were applied after the human-verify checkpoint and are confirmed present in the codebase:

1. **`firestore.rules`: Public reads on `/users` collection** — Required for username-to-email login resolution. Confirmed: line 13 `allow read: if true` on `/users/{userId}`.
2. **`firestore.rules`: XP reset allowed on level-up** — Original monotonic-only rule rejected level-up saves. Fixed by splitting the update rule into same-level branch (XP must increase) and level-up branch (XP resets to 0-200 range). Confirmed in lines 31-46.
3. **`saveManager.js`: Error logging in saveWithRetry** — `console.error` added on catch at line 71. Confirmed.
4. **`AuthModal.jsx`: Remember username in localStorage** — Username stored/retrieved for UX convenience (not save data). Confirmed: `localStorage.setItem('rememberedUsername', username)`. This is not a save-data localStorage violation.
5. **`MainScene.js` + `App.jsx`: `resume-game` event** — Phaser input state reset on game entry. Confirmed: App.jsx emits `resume-game` at lines 335 and 380; MainScene.js handles it at line 214.

---

## Human Verification Required

### 1. Cross-Device Save Persistence

**Test:** Log in on Device A. Create a character and gain some XP. Log in on Device B (different browser, same account). Open save slots.
**Expected:** The character from Device A appears on Device B with the same stats (level, XP, class).
**Why human:** Requires two live browser sessions against a real Firestore project.

### 2. Session Lock Blocks Second Device

**Test:** Log in and enter the game on Browser A. Open an incognito window (or different browser) and log into the same account.
**Expected:** The second window shows "Session Active Elsewhere — You're playing on another device. Log out there first." The first window continues normally.
**Why human:** Multi-session concurrency requires two running browser contexts.

### 3. Connection Overlay and Auto-Resume

**Test:** Start a game session. Open Chrome DevTools > Network > Offline. Wait 2 seconds.
**Expected:** Full-screen dark overlay appears with "Connection lost. Reconnecting..." and no game input is accepted. Switch back to Online. Overlay disappears automatically.
**Why human:** Requires simulating real browser network state transitions in a live session.

### 4. Firestore Security Rules Block XP Manipulation

**Test:** In browser DevTools console while logged in, paste a Firebase SDK call attempting to write `xp: 999999` to `users/{uid}/characters/1`.
**Expected:** Firestore rejects the write with a PERMISSION_DENIED error.
**Why human:** Requires deployed Firestore rules and an active auth session for rules evaluation.

---

## Gaps Summary

No gaps found. All must-have truths are verified, all artifacts exist and are substantive, all key links are wired.

Success Criterion #4 (localStorage migration) is correctly excluded by user decision documented in CONTEXT.md and aligned with REQUIREMENTS.md v2 scope. This is not a gap.

The "3 slots vs 2 slots" discrepancy in the ROADMAP success criterion and REQUIREMENTS.md is a stale documentation artifact, not an implementation gap. CONTEXT.md is the authoritative source and the implementation correctly implements 2 slots throughout.

---

_Verified: 2026-02-23_
_Verifier: Claude (gsd-verifier)_
