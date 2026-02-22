---
phase: 01-firebase-auth
plan: 03
subsystem: auth-integration
tags: [react, phaser, firebase, auth-gate, splash, logout]

# Dependency graph
requires:
  - 01-01 (useAuth hook — currentUser, authResolved, logout)
  - 01-02 (SplashScreen + AuthModal components)
provides:
  - Auth-gated App.jsx: SplashScreen -> AuthModal -> Game flow
  - Phaser initialization only after auth resolves and user is authenticated
  - Minimum 1.5s splash screen duration on every load (auto-login and fresh)
  - Logout from in-game with confirm dialog, full state cleanup, Phaser destroy
affects:
  - All future phases that render game UI (gated behind auth now)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Auth gate via early return in App: SplashScreen -> AuthModal -> Game
    - Phaser init in useEffect dependent on currentUser (not [] mount)
    - Separate useEffect destroys Phaser when currentUser becomes null
    - splashMinTimeElapsed state enforces 1.5s minimum splash via setTimeout
    - showTransition state provides smooth post-auth visual handoff

key-files:
  created: []
  modified:
    - src/App.jsx
    - src/App.css

key-decisions:
  - "Auth gate uses early return pattern (not conditional JSX inline) — cleaner stage boundaries and avoids rendering game DOM during auth stages"
  - "Phaser useEffect depends on currentUser, not [] — prevents race condition where Phaser inits before onAuthStateChanged fires"
  - "Separate destroy useEffect watches currentUser null to clean up Phaser on logout — keeps init and teardown effects decoupled"
  - "splashMinTimeElapsed enforces minimum 1.5s logo display so auto-login users still see the splash briefly"
  - "Logout button (RPG parchment-red) replaces emoji home button — logout is the only screen-level action in Phase 1"

requirements-completed: [ACCT-01, ACCT-02, ACCT-03]

# Metrics
duration: 3min
completed: 2026-02-22
---

# Phase 1 Plan 03: Auth Gate Integration Summary

**App.jsx restructured with auth-gated render stages (Splash -> AuthModal -> Game), Phaser initialization fixed to only run after Firebase auth resolves with an authenticated user, and logout wired with confirm dialog and full game state cleanup.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-02-22T17:55:00Z
- **Completed:** 2026-02-22T17:57:13Z
- **Tasks:** 1 of 2 complete (Task 2 is human-verify checkpoint — awaiting verification)
- **Files modified:** 2

## Accomplishments

- `App.jsx` completely restructured with three auth render stages using early-return pattern:
  - Stage 1 (Splash): `!authResolved || !splashMinTimeElapsed || showTransition` — Firebase is resolving, or minimum 1.5s splash not elapsed, or post-login transition playing
  - Stage 2 (AuthModal): `authResolved && !currentUser` — auth resolved, no user
  - Stage 3 (Game): `authResolved && currentUser` — full game UI rendered
- Phaser `useEffect` dependency array changed from `[]` to `[currentUser]` — Phaser only inits when `currentUser` is truthy AND `gameRef.current` is mounted (which only happens in Stage 3)
- Separate `useEffect` watches `currentUser` becoming null to destroy the Phaser instance on logout
- `splashMinTimeElapsed` state (1.5s `setTimeout` on mount) ensures the splash logo always shows briefly — prevents instant flash-through for auto-logged-in users
- `showTransition` state provides a 1.5s post-auth splash that smoothly bridges login success into the game
- Logout button (top-right, RPG parchment-red) replaces the old emoji house button — calls `window.confirm()` then `useAuth.logout()`, resets all game state
- `TitleScreen` import and all references removed — `SplashScreen` fully replaces it
- `showTitleScreen` state removed entirely
- `App.css`: `.logout-button` class replaces `.home-button` with RPG dark-red parchment styling; mobile responsive override updated to match

## Task Commits

1. **Task 1: Restructure App.jsx with auth gate and Phaser init fix** — `7fb959b` (feat)

## Files Created/Modified

- `src/App.jsx` — Auth gate rendering, Phaser init fix, logout handler, splashMinTime, showTransition
- `src/App.css` — `.logout-button` replaces `.home-button`; mobile breakpoint updated

## Decisions Made

- Used early-return auth gate pattern (not inline conditional JSX) for cleaner stage separation and to prevent any game DOM elements from being in the React tree during auth stages
- Phaser `useEffect` depends on `[currentUser]` rather than `[]` — `gameRef.current` is only populated in Stage 3 so the guard `if (!gameRef.current || !currentUser || ...)` cleanly prevents spurious inits
- Kept init and teardown as separate `useEffect` hooks (one creates on `currentUser` truthy, one destroys on `currentUser` null) — decouples responsibilities and avoids cleanup-in-init anti-pattern
- `splashMinTimeElapsed` is set to true after 1.5s on first mount — combined with `authResolved` check ensures returning auto-login users still see the full splash
- Logout resets all game state (playerStats, showMainMenu, showCharacterCreation, etc.) before calling `useAuth.logout()` — ensures clean slate when AuthModal appears

## Deviations from Plan

None — plan executed exactly as written.

The plan's `key_links` section referenced `src/hooks/useAuth.js` but per the deviation in 01-01-SUMMARY, the import uses `'./hooks/useAuth'` (no extension), which Vite resolves to the `.jsx` file automatically.

## Auth Gates Encountered

None during Task 1 (code changes only). The human verification checkpoint (Task 2) requires a valid `.env` file with Firebase config to test the live auth flow.

## Next Steps (Task 2 — awaiting human verification)

Task 2 is a blocking `checkpoint:human-verify`. The complete auth flow needs end-to-end verification:

1. Fresh load shows splash (1.5s), then auth modal
2. Registration works with inline validation, spinner, "Account created!" flash
3. Session persistence — close and reopen browser, auto-logs in after brief splash
4. Logout shows confirm dialog, Phaser destroyed, returns to splash then auth modal
5. Login with existing credentials works
6. Forgot password sends reset email and shows confirmation
7. Error messages are human-readable
8. Mobile layout shows full-screen auth modal

Prerequisites: `.env` file with valid `VITE_FIREBASE_*` config values and Firebase project with Email/Password auth + Firestore enabled.

---
*Phase: 01-firebase-auth*
*Completed: 2026-02-22*
