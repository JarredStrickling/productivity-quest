---
phase: 01-firebase-auth
plan: 02
subsystem: auth-ui
tags: [react, auth, modal, splash-screen, css, rpg-theme]

# Dependency graph
requires:
  - 01-01 (useAuth hook — register, login, resetPassword, getAuthErrorMessage)
provides:
  - SplashScreen component (logo + glow animation, optional error+retry state)
  - AuthModal component (register/login/forgot-password views, RPG parchment theme)
affects:
  - 01-03 (App.jsx needs to render SplashScreen + AuthModal conditionally on authResolved)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Auth modal with view state machine (login | register | forgot)
    - Per-field inline error clearing on onChange
    - Password show/hide toggle with text button inside field wrapper
    - CSS-only spinner via border animation inside disabled submit button
    - Mobile-first full-screen modal via max-width 480px media query
    - backdrop-filter blur + brightness on overlay (matching MainMenu.css pattern)
    - CSS @keyframes drop-shadow animation for logo glow (warm amber, alpha 0.4 -> 0.8)

key-files:
  created:
    - src/components/SplashScreen.jsx
    - src/components/SplashScreen.css
    - src/components/AuthModal.jsx
    - src/components/AuthModal.css
  modified: []

key-decisions:
  - "AuthModal imports useAuth from '../hooks/useAuth' (no extension) — Vite resolves to .jsx automatically"
  - "SplashScreen is purely presentational — no auth dependency, no auto-dismiss timers — parent controls visibility"
  - "Login view uses username field only (no email) — matches username-first auth pattern from 01-01"
  - "Register error routing: USERNAME_TAKEN/auth/invalid-username -> username field, auth/email-* -> email field, auth/weak-password -> password field, else -> general strip"

# Metrics
duration: 2min
completed: 2026-02-22
---

# Phase 1 Plan 02: Auth UI Components Summary

**SplashScreen (logo + warm glow animation on black) and AuthModal (RPG parchment-themed register/login/forgot-password modal) providing the complete visual auth experience.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-22T17:50:00Z
- **Completed:** 2026-02-22T17:52:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- `SplashScreen` renders the Scrolls of Doom logo centered on a black full-viewport background with a `@keyframes splash-glow` pulsing warm amber drop-shadow. Supports optional `showError` + `errorMessage` + `onRetry` props for auto-login failure state. No timers — parent controls visibility.
- `AuthModal` provides three views (login, register, forgot-password) in one component with a `view` state machine. Register collects username/email/password/confirmPassword with client-side validation and routes server errors to the correct inline field. Login uses username only (matching the username-first auth pattern). Forgot-password sends a Firebase reset email and shows a success confirmation.
- Both components use the existing RPG parchment color palette (`#f4e4c1`, `#3b2415`, `#a08050`, `#8b3030`) consistent with `TaskSubmissionModal.css` and `CharacterCreationModal.css`.
- `npm run build` succeeds with no import errors on both tasks.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create SplashScreen component with logo and glow animation** — `5bef0f5` (feat)
2. **Task 2: Create AuthModal component with register/login/forgot-password views** — `853c8fc` (feat)

## Files Created/Modified

- `src/components/SplashScreen.jsx` — Purely presentational: logo img + optional error/retry. No auth imports.
- `src/components/SplashScreen.css` — Black backdrop, `@keyframes splash-glow`, `@keyframes splash-fade-in`, RPG retry button.
- `src/components/AuthModal.jsx` — Three-view modal with useAuth hook, per-field error state, password toggle, spinner, success flash.
- `src/components/AuthModal.css` — Parchment modal card, blur overlay, full-screen mobile breakpoint, CSS spinner keyframes.

## Decisions Made

- `AuthModal` imports `useAuth` from `'../hooks/useAuth'` without extension — Vite resolves `.jsx` automatically, avoiding hardcoded extension coupling.
- `SplashScreen` has zero auth dependencies — it is a pure display component. This keeps the splash decoupled from Firebase and usable for any loading state in future phases.
- Login view shows only username field (no email field) — matches the username-first login pattern established in 01-01.
- Error routing in register: `USERNAME_TAKEN` and `auth/invalid-username` go to the username field; email errors to the email field; `auth/weak-password` to the password field; everything else to the general error strip above the form.

## Deviations from Plan

None — plan executed exactly as written.

The plan referenced `src/hooks/useAuth.js` in the key_links section, but per the important_deviation note and 01-01 SUMMARY, the file is `src/hooks/useAuth.jsx`. The import in AuthModal uses the extensionless path `'../hooks/useAuth'` which resolves correctly in Vite.

## Next Phase Readiness

- Plan 01-03 (Phaser init gate + App.jsx wiring) can now import `SplashScreen` and `AuthModal` and render them based on `authResolved` and `currentUser` from `useAuth`.
- The known Phase 1 blocker (Phaser/Firebase race condition) is addressed by `authResolved` from the useAuth hook — 01-03 will restructure App.jsx to delay Phaser init until `authResolved` is true.

---
*Phase: 01-firebase-auth*
*Completed: 2026-02-22*

## Self-Check: PASSED

- FOUND: src/components/SplashScreen.jsx (23 lines, min 20 required)
- FOUND: src/components/SplashScreen.css (@keyframes splash-glow confirmed)
- FOUND: src/components/AuthModal.jsx (357 lines, min 150 required)
- FOUND: src/components/AuthModal.css (parchment gradient confirmed)
- FOUND: .planning/phases/01-firebase-auth/01-02-SUMMARY.md
- COMMIT 5bef0f5: feat(01-02): create SplashScreen — verified
- COMMIT 853c8fc: feat(01-02): create AuthModal — verified
- npm run build: PASSED
