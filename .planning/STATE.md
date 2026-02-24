# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-21)

**Core value:** Real-life productivity directly levels up your game character
**Current focus:** Phase 2 - Firestore Cloud Saves

## Current Position

Phase: 2 of 7 (Firestore Cloud Saves)
Plan: 3 of 5 in current phase
Status: In progress — Plans 02-01, 02-02, and 02-03 complete
Last activity: 2026-02-23 — Plan 02-03 complete (Cloud Save Integration: SaveSlotSelection + MainMenu + App.jsx rewired to Firestore)

Progress: [████░░░░░░] 30%

## Performance Metrics

**Velocity:**
- Total plans completed: 5
- Average duration: 6 min
- Total execution time: 0.62 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-firebase-auth | 2 | 5 min | 2.5 min |
| 02-firestore-cloud-saves | 3 | 32 min | 10.7 min |

**Recent Trend:**
- Last 5 plans: 3 min (01-01), 2 min (01-02), 2 min (02-02), 5 min (02-01)
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
- [Phase 01-02]: AuthModal imports useAuth from '../hooks/useAuth' without extension — Vite resolves .jsx automatically
- [Phase 01-02]: SplashScreen is purely presentational with no auth dependency — parent controls visibility via auth state
- [Phase 01-02]: Login view shows username only (no email) — matches username-first auth from 01-01
- [Phase 01-03]: Auth gate uses early-return pattern (Splash->AuthModal->Game) for clean stage boundaries — no game DOM rendered during auth stages
- [Phase 01-03]: Phaser useEffect depends on [currentUser] not [] — init only after auth resolves with authenticated user, destroying on logout
- [Phase 01-03]: splashMinTimeElapsed (1.5s timeout) ensures minimum splash display for both fresh load and auto-login returning users
- [02-01]: XP cap set to 200 (Legendary tier max 150 XP + 50 buffer) — corrected from research suggestion of 500
- [02-01]: saveCharacter uses return (not await) for fire-and-forget pattern — prevents hanging offline in event handlers
- [02-01]: saveWithRetry uses setTimeout recursion (not async/await sleep) to keep retry chain non-blocking
- [02-01]: Full overwrite (no merge: true) prevents stale field drift when always writing complete playerStats
- [02-02]: releaseLock not called on beforeunload — deleteDoc is unreliable in beforeunload; heartbeat timeout handles tab-close expiry
- [02-02]: deviceId generated via crypto.randomUUID() at module load — stable for tab lifetime, unique per tab
- [02-02]: Heartbeat stored in useRef (not useState) to avoid re-renders on interval ticks
- [02-02]: useConnection initializes isOnline from navigator.onLine to avoid false offline flash on mount
- [02-03]: saveSlots state owned by App.jsx and passed as prop — avoids duplicate Firestore reads in child components
- [02-03]: MainMenu derives slotsFull from saveSlots prop (not localStorage) — zero localStorage reads in UI layer
- [02-03]: Firestore security rules patched post-checkpoint: public reads on /usernames/ for login resolution, XP reset allowed on level-up
- [02-03]: Phaser input state reset on game entry — prevents stuck controls after save slot navigation
- [02-03]: Remember username stored in localStorage (not save data) — no cloud save concern

### Pending Todos

None yet.

### Blockers/Concerns

- **Phase 1:** Phaser/Firebase initialization race condition — Phaser must init only AFTER `onAuthStateChanged` fires its first value. Current App.jsx creates Phaser in `useEffect` on mount — may need restructuring.
- **Phase 3:** Mana initialization bug root cause unconfirmed (characters open with 0/undefined mana). Must investigate before writing `useBattle` hook.
- **Phase 7:** SHA-256 hash deduplication edge cases — same task type done legitimately twice in a row. Cooldown timestamp is the primary throttle; hash is secondary.

## Session Continuity

Last session: 2026-02-23
Stopped at: Completed 02-03-PLAN.md (Cloud Save Integration: full Firestore wiring complete)
Resume file: .planning/phases/02-firestore-cloud-saves/02-04-PLAN.md
