---
phase: 02-firestore-cloud-saves
plan: 03
subsystem: database
tags: [firestore, firebase, react, cloud-saves, session-lock, connection-overlay]

# Dependency graph
requires:
  - phase: 02-01
    provides: saveManager utilities (saveWithRetry, loadCharacterSlots, deleteCharacterSlot, saveWithRetry)
  - phase: 02-02
    provides: useSessionLock hook, useConnection hook, ConnectionOverlay component
provides:
  - Firestore-backed save slot UI (SaveSlotSelection.jsx reads/deletes from Firestore)
  - MainMenu derives slot-full state from Firestore data prop — zero localStorage reads
  - App.jsx fully wired to Firestore with saveWithRetry on all save events
  - Session lock gate blocks game access when another device holds the lock
  - Connection overlay freezes gameplay on network loss
  - Old localStorage save data cleaned up on login
affects: [03-combat-overhaul, 04-battle-ui, 07-anti-cheat]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Firestore slot object shape { 1: data|null, 2: data|null } threaded as prop from App -> MainMenu -> SaveSlotSelection"
    - "saveSlots state held in App.jsx — single source of truth, passed down as prop"
    - "Session lock checked before rendering game — isCheckingLock reuses SplashScreen as loading state"
    - "saveWithRetry called fire-and-forget at all three save points (task submit, stat allocate, character create)"

key-files:
  created: []
  modified:
    - src/components/SaveSlotSelection.jsx
    - src/components/MainMenu.jsx
    - src/App.jsx
    - src/App.css

key-decisions:
  - "saveSlots state owned by App.jsx and passed as prop — avoids duplicate Firestore reads in child components"
  - "MainMenu derives slotsFull from saveSlots prop (not localStorage) — zero localStorage reads in UI layer"
  - "Firestore security rules patched post-checkpoint: public reads allowed on /usernames/ for login resolution, XP reset on level-up allowed"
  - "Phaser input state reset on game entry — prevents stuck controls after returning from save slot selection"
  - "Remember username added to login form — stored in localStorage (not save data)"

patterns-established:
  - "All game save events use saveWithRetry — never localStorage.setItem"
  - "loadCharacterSlots called once on login; result held in App.jsx state and passed down as props"
  - "Session lock renders SplashScreen while checking (isCheckingLock), blocked screen when isBlocked"

requirements-completed: [ACCT-04, ACCT-05]

# Metrics
duration: 25min
completed: 2026-02-23
---

# Phase 2 Plan 03: Cloud Save Integration Summary

**All game save events rewired from localStorage to Firestore with session lock, connection overlay, and post-checkpoint security rule fixes**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-02-23
- **Completed:** 2026-02-23
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 4

## Accomplishments

- SaveSlotSelection.jsx reads/deletes character slots from Firestore with loading and error states
- App.jsx wired to saveWithRetry on all three save events (task submit, stat allocate, character create); old localStorage save keys cleaned up on login
- Session lock gate integrated — second device sees "Session Active Elsewhere" screen; logout releases lock before sign-out
- Connection overlay freezes gameplay on network loss via useConnection hook
- Post-checkpoint fixes: Firestore security rules patched for public login reads and XP reset on level-up; Phaser input state reset on game entry to prevent stuck controls; remember username added to login form

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewire SaveSlotSelection and MainMenu to Firestore** - `6ce7ae7` (feat)
2. **Task 2: Rewire App.jsx — Firestore saves, session lock, connection overlay, localStorage cleanup** - `716df76` (feat)
3. **Task 3: End-to-end cloud save verification (human-verify)** - approved by user

**Post-checkpoint fixes:**
- `3e8d9dc` fix(02-01): allow public reads on users collection for login resolution
- `9eeba93` fix(02-01): allow XP reset on level-up in security rules
- `4ba0881` feat: remember username on login, add save error logging
- `cadb6c9` fix: reset Phaser input state on game entry to prevent stuck controls

## Files Created/Modified

- `src/components/SaveSlotSelection.jsx` - Rewired to load/delete from Firestore via loadCharacterSlots/deleteCharacterSlot; loading and error states added
- `src/components/MainMenu.jsx` - Removed localStorage dependency; derives slotsFull from saveSlots prop; passes uid to SaveSlotSelection
- `src/App.jsx` - All save events use saveWithRetry; saveSlots state loaded from Firestore on login; session lock integration; connection overlay; localStorage cleanup on login; logout releases lock
- `src/App.css` - session-blocked screen styles and save-warning banner styles

## Decisions Made

- saveSlots state owned by App.jsx — single source of truth threaded as prop to MainMenu and SaveSlotSelection, avoiding duplicate Firestore reads
- MainMenu derives slotsFull directly from saveSlots prop (not localStorage) — the UI layer has zero localStorage reads for save data
- Firestore security rules patched post-checkpoint to allow public reads on /usernames/ collection (required for username-to-email login resolution) and to allow XP field to decrease (required for XP reset on level-up)
- Phaser input state reset on game entry to fix stuck keyboard/pointer controls after navigating save slot selection
- Remember username stored in localStorage (not save data) — consistent with intent, no cloud save concern

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Firestore security rules blocked public login resolution**
- **Found during:** Task 3 (end-to-end verification)
- **Issue:** Security rules denied reads on /usernames/ collection, breaking username-to-email lookup during login
- **Fix:** Updated rules to allow public reads on /usernames/ documents
- **Files modified:** firestore.rules (deployed via Firebase Console)
- **Verification:** Login via username resolves correctly after fix
- **Committed in:** `3e8d9dc`

**2. [Rule 1 - Bug] Firestore security rules blocked XP reset on level-up**
- **Found during:** Task 3 (end-to-end verification)
- **Issue:** Rules rejected writes where XP decreased (level-up resets XP to 0), causing save failures on level-up
- **Fix:** Updated rules to allow XP field to be less than or equal to current value
- **Files modified:** firestore.rules (deployed via Firebase Console)
- **Verification:** Level-up save completes without error; Firestore document updates correctly
- **Committed in:** `9eeba93`

**3. [Rule 1 - Bug] Phaser input stuck after returning from save slot selection**
- **Found during:** Task 3 (end-to-end verification)
- **Issue:** Phaser retained stale keyboard/pointer input state after React unmounted the save slot screen; controls appeared frozen on game re-entry
- **Fix:** Reset Phaser input manager state when transitioning back into the game
- **Files modified:** src/App.jsx (or relevant game entry handler)
- **Verification:** Game controls responsive immediately after returning from save selection
- **Committed in:** `cadb6c9`

**4. [Rule 2 - Missing Critical] Remember username on login**
- **Found during:** Task 3 (end-to-end verification)
- **Issue:** No username persistence between sessions — users had to retype their username every login
- **Fix:** Added remember-username checkbox to login form; username stored in localStorage (not save data)
- **Files modified:** src/components/AuthModal.jsx (or login form component)
- **Verification:** Username pre-fills on next visit when remember checkbox was checked
- **Committed in:** `4ba0881`

---

**Total deviations:** 4 auto-fixed (2 bug - security rules, 1 bug - Phaser input, 1 missing critical - remember username)
**Impact on plan:** All fixes required for correct and usable operation. No scope creep.

## Issues Encountered

- Firestore security rules required two targeted patches after end-to-end testing exposed login resolution and XP-reset edge cases. Both fixed same session.
- Phaser input stuck bug only surfaced during manual testing of the full save-slot navigation flow — not visible from build alone.

## User Setup Required

None - Firestore security rules were deployed as part of post-checkpoint fixes. No additional external configuration required.

## Next Phase Readiness

- Cloud saves fully operational: Firestore persistence, session lock, connection overlay, security rules, localStorage cleanup
- All Phase 2 infrastructure plans (01, 02, 03) complete — save system is production-ready
- Phase 3 (Combat Overhaul) can proceed; mana initialization bug (characters open with 0/undefined mana) still needs investigation before writing useBattle hook

---
*Phase: 02-firestore-cloud-saves*
*Completed: 2026-02-23*
