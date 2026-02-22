# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-21)

**Core value:** Real-life productivity directly levels up your game character
**Current focus:** Phase 1 - Firebase Auth

## Current Position

Phase: 1 of 7 (Firebase Auth)
Plan: 1 of 3 in current phase
Status: In progress — Plan 01-01 complete
Last activity: 2026-02-22 — Plan 01-01 complete (Firebase SDK singleton + useAuth hook)

Progress: [█░░░░░░░░░] 5%

## Performance Metrics

**Velocity:**
- Total plans completed: 1
- Average duration: 3 min
- Total execution time: 0.05 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-firebase-auth | 1 | 3 min | 3 min |

**Recent Trend:**
- Last 5 plans: 3 min (01-01)
- Trend: -

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Firebase Auth + Firestore for accounts/saves (low ops overhead, good free tier)
- Username/password auth only — no social login for v1
- Consolidate battle modals before adding new mechanics — prevents 2x work
- Keep AI verification but simplify proof requirements
- [01-01] Used initializeAuth + browserLocalPersistence instead of getAuth() to fix Vite session-restore bug (firebase-js-sdk #8626)
- [01-01] useAuth hook uses .jsx extension (not .js) — Vite requires .jsx for JSX syntax
- [01-01] Username stored lowercased under /usernames/{usernameLower} for O(1) lookup; login resolves username -> email -> signIn

### Pending Todos

None yet.

### Blockers/Concerns

- **Phase 1:** Phaser/Firebase initialization race condition — Phaser must init only AFTER `onAuthStateChanged` fires its first value. Current App.jsx creates Phaser in `useEffect` on mount — may need restructuring.
- **Phase 3:** Mana initialization bug root cause unconfirmed (characters open with 0/undefined mana). Must investigate before writing `useBattle` hook.
- **Phase 7:** SHA-256 hash deduplication edge cases — same task type done legitimately twice in a row. Cooldown timestamp is the primary throttle; hash is secondary.

## Session Continuity

Last session: 2026-02-22
Stopped at: Completed 01-01-PLAN.md (Firebase Auth Foundation)
Resume file: .planning/phases/01-firebase-auth/01-02-PLAN.md
