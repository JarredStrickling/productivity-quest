---
phase: 01-firebase-auth
plan: 01
subsystem: auth
tags: [firebase, react, vite, firestore, auth]

# Dependency graph
requires: []
provides:
  - Firebase singleton (auth + db) with Vite-safe persistence
  - AuthContext / AuthProvider / useAuth hook with full auth operations
  - username-to-email login resolution via Firestore
  - Atomic username reservation with Firestore batch writes
  - Orphan auth account cleanup on failed registration
  - localStorage save slot cleanup on logout
affects:
  - 01-02 (auth UI needs useAuth hook)
  - 01-03 (Phaser init gate needs authResolved from useAuth)
  - all future phases that read currentUser or userProfile

# Tech tracking
tech-stack:
  added: [firebase@12.9.0]
  patterns:
    - initializeAuth with browserLocalPersistence instead of getAuth (Vite compatibility)
    - Firestore batch write for atomic username reservation + user profile creation
    - Username-first login (Firestore username lookup -> email -> signIn)
    - Manual userProfile state set after register to avoid onAuthStateChanged race condition
    - AuthContext wrapping entire app at main.jsx level

key-files:
  created:
    - src/firebase.js
    - src/hooks/useAuth.jsx
  modified:
    - src/main.jsx
    - .env.example
    - package.json

key-decisions:
  - "Used initializeAuth + browserLocalPersistence instead of getAuth() to fix Vite persistence bug (firebase-js-sdk #8626)"
  - "useAuth.jsx extension (not .js) required because Vite does not process JSX in .js files"
  - "Username case-insensitively stored in /usernames/{usernameLower} for O(1) availability lookup and login"
  - "Orphaned auth account deleted if Firestore batch write fails (prevents ghost accounts)"
  - "userProfile manually set after register() to avoid race condition with onAuthStateChanged"

patterns-established:
  - "Auth singleton: export auth and db from src/firebase.js, import in hooks"
  - "Error codes: custom code objects like { code: 'USERNAME_TAKEN' } match AUTH_ERROR_MESSAGES map"
  - "Firestore user data shape: { username, usernameLower, email, createdAt }"
  - "Username reservation shape: /usernames/{usernameLower} -> { uid }"

requirements-completed: [ACCT-01, ACCT-02, ACCT-03]

# Metrics
duration: 3min
completed: 2026-02-22
---

# Phase 1 Plan 01: Firebase Auth Foundation Summary

**Firebase SDK installed with Vite-safe auth singleton, useAuth hook providing username-based register/login/logout with atomic Firestore batch writes and orphan cleanup, wrapped into app via AuthProvider.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-22T17:42:57Z
- **Completed:** 2026-02-22T17:46:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Firebase singleton created using `initializeAuth` with `browserLocalPersistence` to avoid the Vite session-restore bug
- `useAuth` hook with full auth operations: register (username uniqueness + atomic batch write + orphan cleanup), login (username-to-email resolution), logout (localStorage cleanup), resetPassword
- `AuthProvider` wraps entire app in `src/main.jsx` — all descendants can call `useAuth()`

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Firebase SDK and create Firebase singleton** - `5bdf573` (feat)
2. **Task 2: Create useAuth hook with AuthProvider and wire into main.jsx** - `ce17f29` (feat)

## Files Created/Modified

- `src/firebase.js` - Firebase singleton: exports `auth` (initializeAuth + browserLocalPersistence) and `db` (Firestore)
- `src/hooks/useAuth.jsx` - AuthContext, AuthProvider, useAuth hook, getAuthErrorMessage, all auth operations
- `src/main.jsx` - App wrapped in AuthProvider inside StrictMode
- `.env.example` - Added 6 VITE_FIREBASE_* config keys
- `package.json` - Added firebase@12.9.0 dependency

## Decisions Made

- Used `initializeAuth` with `browserLocalPersistence` instead of `getAuth()` — fixes firebase-js-sdk Issue #8626 where `onAuthStateChanged` silently fails to restore sessions in Vite
- Username stored lowercased under `/usernames/{usernameLower}` for case-insensitive lookups at O(1) cost
- `userProfile` manually set in `register()` to avoid race condition where `onAuthStateChanged` fires before the Firestore batch write completes

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Renamed useAuth.js to useAuth.jsx**
- **Found during:** Task 2 (build verification)
- **Issue:** Vite does not process JSX syntax in `.js` files by default. The build failed with "Expression expected" at the `<AuthContext.Provider>` JSX return statement.
- **Fix:** Renamed `src/hooks/useAuth.js` to `src/hooks/useAuth.jsx` and updated the import in `src/main.jsx` to match.
- **Files modified:** `src/hooks/useAuth.jsx`, `src/main.jsx`
- **Verification:** `npm run build` succeeds after rename
- **Committed in:** `ce17f29` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required for correct build — file extension convention for JSX in Vite. No scope creep. Plan's `files_modified` listed `.js` but `.jsx` is the correct convention used by all other React files in this project.

## Issues Encountered

None beyond the .js -> .jsx rename above.

## User Setup Required

**External services require manual configuration before auth functionality is live.** The code is complete but requires a Firebase project and environment variables:

1. Create Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Email/Password sign-in: Authentication -> Sign-in method -> Email/Password -> Enable
3. Create Firestore database in production mode
4. Register a Web app in Project Settings -> General -> Add app -> Web
5. Copy the config values into a `.env` file (using `.env.example` as template):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

## Next Phase Readiness

- Auth infrastructure is complete — `useAuth()` can be called from any component
- Plan 01-02 (auth UI modal) can begin immediately — it just needs `useAuth` hook
- Plan 01-03 (Phaser init gate) can use `authResolved` from `useAuth` to delay Phaser init until auth state resolves (addresses the known blocker in STATE.md)

---
*Phase: 01-firebase-auth*
*Completed: 2026-02-22*
