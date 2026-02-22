# Phase 1: Firebase Auth - Research

**Researched:** 2026-02-22
**Domain:** Firebase Authentication (v9 modular SDK) + React Context + Firestore username index
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- Modal overlay (not full page) — full-screen on mobile
- Combined register/login form with a toggle to switch between views
- RPG-themed visual style — parchment textures, fantasy fonts, pixel-art accents matching the classic RPG pixel game aesthetic
- "Scrolls of Doom" logo/title art displayed prominently above the form
- Blurred game world renders behind the modal as the background
- Smooth fade-in animation for the modal
- Straightforward button labels: "Log In", "Sign Up"
- Registration fields: username, email, password, confirm password
- Password field has a show/hide toggle (eye icon)
- No format hints on username field — only show errors on invalid input
- Username is the login credential, NOT the in-game display name
- Characters have their own names (shown on health bars, player hub, main map)
- Username visible in settings menu only for Phase 1
- Usernames are case-insensitive — "Hero" and "hero" are the same
- Relaxed format: 3-20 characters, letters, numbers, underscores
- Username is permanent once set — no name changes
- Username availability checked on submit (not real-time)
- Password rules: Firebase defaults (6-char minimum)
- Fresh start for new accounts — no localStorage migration
- All loading screens: Scrolls of Doom logo on black background
- Subtle glow animation on the logo
- No loading indicator on splash — logo + glow implies loading
- Fixed minimum splash duration (1-2 seconds) even if auth resolves instantly
- Brief transition animation from auth screen into the game after successful login
- Returning users who are auto-logged-in still see the brief splash screen
- After logout: splash screen first, then auth modal appears
- Auth failure on auto-login: stay on splash with retry button and error message
- Straightforward error tone — "Username already taken", not RPG-flavored
- Inline errors below the specific field that has the problem
- Errors persist until the field is corrected
- Submit buttons disable with spinner while request is in flight
- Brief "Account created!" confirmation after successful registration before transitioning to game
- Confirm dialog before logout
- Specific offline message when network is down
- "Forgot password?" link on login form → email input → "Check your email" confirmation

### Claude's Discretion

- Local data caching strategy on logout (cache vs clear)
- Exact splash screen glow animation implementation
- Typography and spacing details within the RPG theme
- Exact transition animation style between auth and game

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ACCT-01 | User can create an account with a unique username and password | Firestore `usernames/{usernameLower}` collection enforces uniqueness; `createUserWithEmailAndPassword` creates the Firebase Auth record; batch write atomically writes both `users/{uid}` and `usernames/{usernameLower}` |
| ACCT-02 | User can log in and stay logged in across browser sessions | `initializeAuth` with `browserLocalPersistence` + `onAuthStateChanged` listener; known Vite bug requires explicit persistence to be set at init time |
| ACCT-03 | User can log out from any screen | `signOut(auth)` clears the Firebase auth token; custom localStorage keys (save slots) must be cleared manually as part of the logout flow |
</phase_requirements>

---

## Summary

Firebase Auth v9 (modular SDK) is the standard approach for this project. The username-as-login-credential requirement means the app must use email/password internally — usernames are stored in Firestore and mapped to Firebase Auth emails at login time. Because Firebase has no native username-login feature, the registration flow creates an email from the username (e.g., `username@scrollsofdoom.game`) or stores a `username -> uid` mapping and requires the user to enter their username, then the app resolves the email from Firestore before calling `signInWithEmailAndPassword`. The Firestore `usernames` collection (document ID = lowercased username) enforces uniqueness atomically.

The Phaser initialization race condition documented in STATE.md is the most critical technical risk. The current `App.jsx` creates a `Phaser.Game` instance inside a `useEffect` on mount — before `onAuthStateChanged` has fired. The fix is to conditionally render the `<div ref={gameRef}>` (and call `new Phaser.Game()`) only after `onAuthStateChanged` has resolved its first value and confirmed an authenticated user. The `loading` state from the `useAuth` hook is what gates Phaser initialization.

There is a known Vite + Firebase bug (GitHub Issue #8626) where `onAuthStateChanged` never fires with a valid user unless persistence is explicitly set at init time. The project MUST use `initializeAuth(app, { persistence: browserLocalPersistence })` instead of `getAuth()` to avoid silent auto-login failures in the Vite build.

**Primary recommendation:** Install `firebase@^12.x`, create `src/firebase.js` singleton using `initializeAuth` with explicit `browserLocalPersistence`, implement `useAuth` hook with `AuthContext`, and gate Phaser initialization on `authResolved && currentUser !== null`.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| firebase | ^12.9.0 (latest as of Feb 2026) | Auth + Firestore | Official Google SDK, modular v9+ API, tree-shakable |
| react | ^19.2.0 (already installed) | Component model | Already in project |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| firebase/auth | (part of firebase pkg) | `initializeAuth`, `onAuthStateChanged`, `signOut`, `sendPasswordResetEmail` | All auth operations |
| firebase/firestore | (part of firebase pkg) | `usernames` collection, `users` collection, batch writes | Username uniqueness + user profile storage |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom `useAuth` hook + Context | `react-firebase-hooks` (`useAuthState`) | `react-firebase-hooks` is convenient but adds a dependency; custom hook gives full control over loading/error states needed for the splash screen flow |
| `initializeAuth` with `browserLocalPersistence` | `getAuth()` (default) | `getAuth()` has a known Vite bug where persistence may not work; `initializeAuth` is explicit and bug-free |
| Firestore username lookup before signIn | Firebase Auth custom tokens | Custom tokens require a backend; Firestore lookup is client-side and sufficient |

**Installation:**

```bash
npm install firebase
```

No other packages needed. Firebase SDK is modular — only imported subpaths are bundled.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── firebase.js              # Singleton: initializeApp + initializeAuth + getFirestore
├── hooks/
│   └── useAuth.js           # AuthContext + useAuth() custom hook
├── components/
│   ├── AuthModal.jsx        # Register/Login/ForgotPassword UI (tabbed)
│   ├── AuthModal.css        # RPG parchment theme, matches existing modal styles
│   ├── SplashScreen.jsx     # Replaces TitleScreen — shows during auth resolution
│   └── SplashScreen.css
└── App.jsx                  # Auth gate: renders SplashScreen → AuthModal → game
```

Note: `SplashScreen` replaces the existing `TitleScreen` component since the splash must now serve double duty (initial load AND post-logout return). The existing `TitleScreen.jsx` can be repurposed or replaced.

### Pattern 1: Firebase Singleton (`src/firebase.js`)

**What:** One `initializeApp` call, one `initializeAuth` call, one `getFirestore` call — exported as named constants.
**When to use:** Always. Firebase throws if `initializeApp` is called twice with the same config.

```javascript
// Source: Firebase official docs + Vite bug fix (GitHub Issue #8626)
import { initializeApp } from 'firebase/app';
import { initializeAuth, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// MUST use initializeAuth (not getAuth) to avoid Vite persistence bug
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
});

export const db = getFirestore(app);
```

Config values go in `.env` (never committed) using `VITE_` prefix so Vite exposes them to the client bundle.

### Pattern 2: `useAuth` Hook with AuthContext

**What:** React Context that provides `currentUser`, `loading`, `authResolved`, and auth functions. Any component can call `useAuth()`.
**When to use:** Wrap `App` (or `main.jsx`) with `AuthProvider`.

```javascript
// Source: Verified pattern from multiple authoritative sources (Fireship, LogRocket, official Firebase)
import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authResolved, setAuthResolved] = useState(false); // true after first onAuthStateChanged fires

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthResolved(true); // Always set to true whether user is null or not
    });
    return () => unsubscribe(); // Critical: prevents memory leak
  }, []);

  // Auth operations return promises — callers handle errors
  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const register = (email, password) => createUserWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);
  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  const value = { currentUser, authResolved, login, register, logout, resetPassword };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
```

### Pattern 3: Username-as-Login via Firestore Lookup

**What:** Firebase Auth uses email internally. Username login requires a Firestore lookup to resolve email from username, then sign in with that email.
**When to use:** Every login attempt (username field → lookup → signInWithEmailAndPassword).

```javascript
// Source: Fireship custom usernames tutorial (verified pattern)
import { doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';

// Registration: store username → uid mapping
async function registerWithUsername(username, email, password) {
  const usernameLower = username.toLowerCase();
  const usernameRef = doc(db, 'usernames', usernameLower);

  // Check availability first (on submit, not real-time)
  const usernameSnap = await getDoc(usernameRef);
  if (usernameSnap.exists()) {
    throw new Error('USERNAME_TAKEN');
  }

  // Create Firebase Auth account
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  // Atomic batch: write usernames/{lower} and users/{uid} together
  const batch = writeBatch(db);
  batch.set(usernameRef, { uid: cred.user.uid });
  batch.set(doc(db, 'users', cred.user.uid), {
    username,           // display casing preserved
    usernameLower,      // for queries
    email,
    createdAt: new Date(),
  });
  await batch.commit();

  return cred;
}

// Login: resolve email from username, then signIn
async function loginWithUsername(username, password) {
  const usernameLower = username.toLowerCase();
  const usernameSnap = await getDoc(doc(db, 'usernames', usernameLower));

  if (!usernameSnap.exists()) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const uid = usernameSnap.data().uid;
  const userSnap = await getDoc(doc(db, 'users', uid));
  const email = userSnap.data().email;

  return signInWithEmailAndPassword(auth, email, password);
}
```

### Pattern 4: Auth Gate in App.jsx (Phaser Race Condition Fix)

**What:** Phaser only initializes after `authResolved === true` AND `currentUser !== null`. The splash screen shows during the auth resolution window and after logout.
**When to use:** App root — replaces the current unconditional `useEffect` Phaser init.

```javascript
// Source: Derived from STATE.md concern + onAuthStateChanged documentation
function App() {
  const { currentUser, authResolved } = useAuth();

  // Show splash while Firebase resolves auth state (prevents Phaser init before auth)
  if (!authResolved) {
    return <SplashScreen />;
  }

  // Auth resolved but no user — show auth modal (over blurred game world)
  if (!currentUser) {
    return <AuthModal />;
  }

  // Auth resolved AND user confirmed — safe to render game
  return <GameWithPhaser />;
}
```

`new Phaser.Game()` is called inside `<GameWithPhaser>` which only mounts after auth resolves.

### Pattern 5: Human-Readable Error Mapping

**What:** Firebase Auth error codes are mapped to user-friendly strings. This must be a dedicated mapping function, not inline.
**When to use:** All `catch` blocks in auth operations.

```javascript
// Source: Derived from Firebase error code docs + verified error behavior
const AUTH_ERROR_MESSAGES = {
  // Login errors
  'auth/invalid-credential': 'Incorrect username or password.',
  'auth/invalid-login-credentials': 'Incorrect username or password.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/too-many-requests': 'Too many attempts. Try again later.',
  'auth/network-request-failed': 'No internet connection — check your connection and try again.',
  // Registration errors
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/invalid-email': 'Please enter a valid email address.',
  // Custom errors
  'USERNAME_TAKEN': 'Username already taken.',
  'INVALID_CREDENTIALS': 'Incorrect username or password.',
};

function getAuthErrorMessage(error) {
  return AUTH_ERROR_MESSAGES[error.code || error.message] || 'Something went wrong. Please try again.';
}
```

Note: When **Email Enumeration Protection** is enabled in the Firebase console (default in newer projects), Firebase returns `auth/invalid-credential` instead of `auth/user-not-found` or `auth/wrong-password`. The mapping above handles both the old and new codes.

### Pattern 6: Logout + Cache Cleanup

**What:** `signOut(auth)` only clears Firebase's auth token. The game's localStorage save slots must be manually cleared (or retained — see Claude's Discretion section).
**When to use:** Logout handler in `useAuth` or wherever logout is triggered.

```javascript
// Source: Firebase signOut behavior documentation + community findings
async function handleLogout() {
  await signOut(auth);
  // Firebase clears its own firebase:authUser:* localStorage key automatically.
  // App save slot keys (saveSlot1, saveSlot2, saveSlot3) must be cleared manually
  // if we want a clean slate. Per CONTEXT.md this is Claude's discretion.
  // Recommended: clear them to prevent the next user on the same device
  // from seeing someone else's save data.
  localStorage.removeItem('saveSlot1');
  localStorage.removeItem('saveSlot2');
  localStorage.removeItem('saveSlot3');
}
```

### Anti-Patterns to Avoid

- **Using `getAuth()` instead of `initializeAuth`:** Causes silent auth state failures in Vite (GitHub Issue #8626). Always use `initializeAuth` with explicit `browserLocalPersistence`.
- **Calling `new Phaser.Game()` before `onAuthStateChanged` fires:** The current App.jsx does this. Must be gated behind `authResolved`.
- **Real-time username availability checking:** CONTEXT.md specifies check on submit only. Debounced real-time checks would add unnecessary Firestore reads.
- **Storing the Firebase auth email as the login identifier visible to users:** Users see and use their username only; email is an internal Firebase detail.
- **Using `setPersistence()` after initialization:** Not idempotent — can wipe existing sessions (GitHub Issue #9319). Only set persistence at `initializeAuth` time.
- **Relying on `auth.currentUser` synchronously at app start:** It is `null` before `onAuthStateChanged` fires. Always use the `authResolved` gate.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session persistence across browser restarts | Custom cookie/localStorage auth token | Firebase `initializeAuth` + `browserLocalPersistence` | Firebase handles token refresh, revocation, expiry |
| Password reset emails | Custom email sending | `sendPasswordResetEmail(auth, email)` | Firebase manages email templates, secure tokens, and link expiry |
| Username uniqueness enforcement | Firestore query for existing usernames | `usernames/{usernameLower}` document ID (acts as unique constraint) | Document IDs are unique; queries are not atomic |
| Error message localization | Manual string parsing of error objects | Dedicated `AUTH_ERROR_MESSAGES` map keyed by `error.code` | Firebase error codes are stable; messages are not |
| Auth state rehydration on reload | Manual localStorage user fetch | `onAuthStateChanged` listener | Firebase handles token validation and renewal |

**Key insight:** Firebase Auth handles every session lifecycle edge case (token expiry, device revocation, network errors during token refresh). Building anything custom in this space invites subtle security bugs and mobile/offline edge cases.

---

## Common Pitfalls

### Pitfall 1: Vite + Firebase Persistence Bug

**What goes wrong:** Returning users are not auto-logged-in — `onAuthStateChanged` never fires with a valid user on page load, even though the user was previously authenticated.
**Why it happens:** GitHub Issue #8626 — the default `getAuth()` persistence behavior does not work correctly in Vite + React apps. Reported on Firebase SDK 11.x but still present in 12.x.
**How to avoid:** Use `initializeAuth(app, { persistence: browserLocalPersistence })` instead of `getAuth()`. Set this in the `firebase.js` singleton, not in components.
**Warning signs:** Logged-in user sees the auth modal every time they refresh, even in a working network environment.

### Pitfall 2: Phaser Initialization Before Auth Resolves

**What goes wrong:** Phaser renders and may try to load character data before Firebase knows if the user is logged in. If the game emits events that depend on player state, undefined behavior occurs.
**Why it happens:** Current `App.jsx` calls `new Phaser.Game()` in `useEffect(() => {...}, [])` — which runs immediately on mount, before `onAuthStateChanged` has had a chance to fire.
**How to avoid:** Do not mount the Phaser container `<div>` or call `new Phaser.Game()` until `authResolved === true` AND `currentUser !== null`.
**Warning signs:** Race condition errors, character appearing un-initialized, game events firing before player data is loaded.

### Pitfall 3: Email Enumeration Protection Causes Unexpected Error Code

**What goes wrong:** During login, valid email + wrong password returns `auth/invalid-credential` instead of `auth/wrong-password`. Code checking for `auth/wrong-password` never matches, falling through to a generic error.
**Why it happens:** Firebase projects created in 2023+ have Email Enumeration Protection enabled by default. This deliberately obscures whether an email exists.
**How to avoid:** Map BOTH `auth/invalid-credential` AND `auth/wrong-password` (and `auth/user-not-found`) to the same user-facing message: "Incorrect username or password." Never tell users which field is wrong when email enumeration is enabled.
**Warning signs:** Login errors show raw Firebase error text or fall through to unhandled error state.

### Pitfall 4: Batch Write Failure Leaves Orphaned Auth Account

**What goes wrong:** `createUserWithEmailAndPassword` succeeds but `batch.commit()` fails (network error). The user now has a Firebase Auth account but no Firestore `users` or `usernames` document. On re-registration with the same email, `auth/email-already-in-use` is thrown, but username availability check passes (username doc doesn't exist).
**Why it happens:** Two separate write operations without cleanup on partial failure.
**How to avoid:** If the batch write fails, call `cred.user.delete()` to clean up the orphaned Auth account before surfacing the error to the user. Wrap the entire registration flow in try/catch with cleanup.
**Warning signs:** Users report "email already in use" even though they've never successfully registered; username appears available but account creation fails.

### Pitfall 5: `onAuthStateChanged` Fires Before Firestore User Profile Exists

**What goes wrong:** On initial registration, `onAuthStateChanged` fires with the new Firebase user object immediately after `createUserWithEmailAndPassword` — BEFORE the Firestore batch write completes. If `App.jsx` reads the Firestore user profile in response to `onAuthStateChanged`, the profile may not exist yet.
**Why it happens:** Firebase Auth state updates are instant; Firestore writes are async and take a separate round trip.
**How to avoid:** The `users` Firestore profile read should happen after the full registration flow is complete (including batch write), not in response to `onAuthStateChanged`. Use the `authResolved` state only for the auth gate; fetch the Firestore profile separately after successful registration/login.
**Warning signs:** Character creation flow is skipped or errors on fresh account creation.

### Pitfall 6: Username Field Mapped Directly to Firebase Auth Email

**What goes wrong:** Some tutorials use the username as the email (e.g., `hero@app.com`). If usernames use characters invalid in email addresses, registration fails silently.
**Why it happens:** Shortcuts to avoid Firestore lookup.
**How to avoid:** Require real email addresses at registration. Store `username -> email` mapping in Firestore. At login, look up the email by username, then call `signInWithEmailAndPassword` with the resolved email. This is the pattern documented in the Architecture section.

---

## Code Examples

Verified patterns from official sources and cross-verified community patterns:

### Firebase Singleton (src/firebase.js)

```javascript
// Source: Firebase official docs (firebase.google.com/docs/web/setup) +
//         Vite persistence fix (GitHub firebase-js-sdk Issue #8626)
import { initializeApp } from 'firebase/app';
import { initializeAuth, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, { persistence: browserLocalPersistence });
export const db = getFirestore(app);
```

### Username Availability Check (on-submit)

```javascript
// Source: Fireship custom usernames tutorial + Firestore docs
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

async function isUsernameAvailable(username) {
  const snap = await getDoc(doc(db, 'usernames', username.toLowerCase()));
  return !snap.exists();
}
```

### Registration Flow with Cleanup on Partial Failure

```javascript
// Source: Derived from Firebase docs + batch write pattern
async function register(username, email, password) {
  const usernameLower = username.toLowerCase();

  // 1. Check username availability
  const available = await isUsernameAvailable(username);
  if (!available) throw { code: 'USERNAME_TAKEN' };

  // 2. Create Firebase Auth account
  let cred;
  try {
    cred = await createUserWithEmailAndPassword(auth, email, password);
  } catch (err) {
    throw err; // auth/email-already-in-use, auth/weak-password, etc.
  }

  // 3. Atomic Firestore writes — clean up auth account if this fails
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'usernames', usernameLower), { uid: cred.user.uid });
    batch.set(doc(db, 'users', cred.user.uid), {
      username,
      usernameLower,
      email,
      createdAt: new Date(),
    });
    await batch.commit();
  } catch (err) {
    // Cleanup orphaned auth account
    await cred.user.delete();
    throw { code: 'REGISTRATION_FAILED' };
  }

  return cred;
}
```

### Password Reset

```javascript
// Source: Firebase official docs (firebase.google.com/docs/auth/web/manage-users)
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';

async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
  // Firebase sends a reset link to the email address.
  // The link expires in 1 hour by default.
  // No confirmation that the email exists is returned (enumeration protection).
}
```

### Existing Modal CSS Palette (for AuthModal.css)

The project already has an established RPG parchment theme in `TaskSubmissionModal.css`. `AuthModal.css` should reuse `.modal-overlay` and `.modal-content` from that file directly. Key color tokens already in use:

```css
/* Parchment background gradient — already used by TaskSubmissionModal, CharacterCreationModal */
background: linear-gradient(170deg, #f4e4c1 0%, #e8d5a3 40%, #dcc896 70%, #e8d5a3 100%);

/* Dark brown text */
color: #3b2415;

/* Muted brown secondary text */
color: #7a5c3a;

/* Border color */
border: 3px solid #a08050;

/* Error color (already in CharacterCreationModal.css) */
color: #8b3030;

/* Input background */
background: rgba(244, 228, 193, 0.5);

/* Primary button */
background: linear-gradient(145deg, #8b7355, #6b5335);
color: #f4e4c1;
```

The `AuthModal` blur backdrop is already established by `MainMenu.css`:
```css
filter: blur(8px) brightness(0.6);
```

The game canvas will be visible behind the auth modal (blurred) because Phaser runs in `div.game-canvas` which is in the DOM but not yet interactable. This matches the CONTEXT.md requirement of "blurred game world renders behind the modal."

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Firebase v8 (`firebase.auth()`) | Firebase v9+ modular (`import { getAuth } from 'firebase/auth'`) | Aug 2021 (GA) | Tree-shaking reduces bundle size; different import syntax |
| `getAuth()` default persistence | `initializeAuth(app, { persistence: browserLocalPersistence })` | Vite bug discovered 2024+ | Explicit persistence required for Vite apps |
| Email as username | Email + separate Firestore username index | N/A (design decision) | Standard pattern for username-login apps |
| Catch `auth/user-not-found` / `auth/wrong-password` | Catch `auth/invalid-credential` | Email Enumeration Protection (2023+) | Unified error code hides whether email exists |

**Current Firebase SDK version:** 12.9.0 (npm, February 2026)

**Not deprecated but note:**
- `debugErrorMap` exists in Firebase Auth for development — it makes `error.message` human-readable but significantly increases bundle size. Do NOT use in production. Use the custom error mapping pattern instead.

---

## Codebase Integration Notes

### Files to Modify

- **`src/App.jsx`** — Major restructure: wrap with `AuthProvider`, add auth gate logic, move Phaser init into a child component that only mounts when authenticated.
- **`src/components/TitleScreen.jsx`** — Repurpose or replace with `SplashScreen.jsx` that handles both initial load and post-logout state. The existing component has good fade animation patterns to reuse.
- **`src/components/MainMenu.jsx`** — MainMenu currently handles New Game / Continue. After auth is in place, MainMenu should only be shown to authenticated users. The blurred game background pattern from `MainMenu.css` can be reused for `AuthModal`.

### Files to Create

- **`src/firebase.js`** — Firebase singleton (app + auth + db exports)
- **`src/hooks/useAuth.js`** — AuthContext + AuthProvider + useAuth hook
- **`src/components/AuthModal.jsx`** — Register/Login/ForgotPassword UI
- **`src/components/AuthModal.css`** — Extends existing RPG parchment theme
- **`.env`** — Firebase config values (VITE_ prefix, never committed)
- **`.env.example`** — Template showing required keys (safe to commit)

### Firestore Collections Required

```
usernames/
  {usernameLower}/           # doc ID is the lowercase username
    uid: string              # maps to Firebase Auth UID

users/
  {uid}/                     # doc ID is Firebase Auth UID
    username: string         # original casing
    usernameLower: string    # for case-insensitive queries
    email: string            # internal Firebase Auth email
    createdAt: timestamp
```

Firestore will be set up in Phase 1 (for username storage) but the full character save slot migration to Firestore is Phase 2 (ACCT-04, ACCT-05). Phase 1 only uses Firestore for `users` and `usernames` collections.

---

## Open Questions

1. **Login field: username only, or username OR email?**
   - What we know: CONTEXT.md says "Username is the login credential"
   - What's unclear: Whether users can log in with their email address as an alternative
   - Recommendation: Username-only login for Phase 1, matching the CONTEXT.md decision. Users who forget their username can use "Forgot Password" with their email.

2. **Where does character name (in-game display name) come from?**
   - What we know: CONTEXT.md says "Characters have their own names (shown on health bars, player hub, main map)" and "Username visible in settings menu only for Phase 1"
   - What's unclear: Is the character name set during Phase 1's CharacterCreationModal or is that modal unchanged?
   - Recommendation: Phase 1 only adds auth. The existing `CharacterCreationModal` collects a `username` field — this field should be renamed to `characterName` in Phase 1 to avoid confusion with the auth username. The auth username is set during the Firebase registration step.

3. **What email format to use for internal Firebase Auth?**
   - What we know: Firebase Auth requires email-format identifiers; users log in with usernames
   - What's unclear: Whether to use `username@scrollsofdoom.game` (fake domain) or require users to provide a real email
   - Recommendation: Require real email at registration (needed for password reset). Email is an internal credential; users never see it as their login identifier.

4. **Caching strategy on logout (Claude's Discretion)**
   - What we know: `signOut()` does not clear app localStorage keys; CONTEXT.md leaves this to Claude
   - What's unclear: Whether to preserve save slot data (so returning user on same device gets their data) or clear it (security/privacy)
   - Recommendation: Clear save slots on logout. After Phase 2, saves move to Firestore anyway — local saves become ephemeral. Clearing on logout prevents data leakage on shared devices.

---

## Sources

### Primary (HIGH confidence)

- Firebase official docs (firebase.google.com/docs/auth/web/password-auth) — modular v9+ sign-in/sign-up patterns
- Firebase official docs (firebase.google.com/docs/web/setup) — config object and `initializeApp` setup
- GitHub firebase-js-sdk Issue #8626 — confirmed Vite persistence bug requiring `initializeAuth`
- GitHub firebase-js-sdk Issue #9319 — confirmed `setPersistence` is not idempotent (don't use after init)

### Secondary (MEDIUM confidence)

- Fireship custom usernames tutorial (fireship.io/lessons/custom-usernames-firebase/) — `usernames` collection + batch write pattern, cross-verified with official Firestore docs
- LogRocket Firebase Auth guide — `onAuthStateChanged` + React Context pattern, consistent with official docs
- WebSearch (multiple sources) — Email Enumeration Protection → `auth/invalid-credential` error code change, consistent with GitHub issue reports

### Tertiary (LOW confidence)

- WebSearch findings on splash screen minimum duration implementation — common pattern but no single authoritative source

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — firebase@12.x is the current latest; npm confirmed
- Architecture: HIGH — patterns verified against official Firebase docs and confirmed GitHub issues
- Pitfalls: HIGH — Vite bug and Email Enumeration Protection change are documented in official GitHub issues with reproductions
- UI/CSS patterns: HIGH — derived directly from existing project CSS (TaskSubmissionModal.css, MainMenu.css)

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (Firebase moves fast; verify version before install)
