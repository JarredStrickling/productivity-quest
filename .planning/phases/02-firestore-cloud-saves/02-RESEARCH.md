# Phase 2: Firestore Cloud Saves - Research

**Researched:** 2026-02-22
**Domain:** Cloud Firestore (saves), Firestore Security Rules (anti-cheat), session locking, connection monitoring
**Confidence:** HIGH (stack already installed; core APIs verified via official docs and WebSearch)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Save Timing & Feedback**
- Save to Firestore on every significant event: XP gain, task submission, quest completion, battle won/lost, level-up, character creation, slot delete
- No visual save indicator — saves happen silently in the background
- On save failure: silent retry (a few attempts). If retries keep failing, show a non-blocking warning like "Cloud save unavailable"
- No periodic/interval-based saving — event-driven only

**Migration (None)**
- No localStorage-to-Firestore migration. Existing localStorage characters are abandoned
- Cloud starts fresh with empty save slots for all users
- localStorage save data should be cleaned up (Claude's discretion on timing/approach)
- Post-deploy, Firestore is the sole storage layer. localStorage caching is Claude's discretion

**Multi-Device Conflicts**
- Only one active session per account at a time
- Implemented via session lock (e.g., Firestore document with device/session ID)
- Logging out clears the session lock immediately, unblocking other devices
- If a user closes the tab without logging out, the lock auto-expires after a timeout (Claude decides timeout duration)
- Blocked device sees a simple, straightforward message: "You're playing on another device. Log out there first."
- No "force takeover" button — must wait for timeout or explicit logout

**Offline / Connectivity**
- If Firestore is unreachable on initial load: Claude's discretion (block or cached fallback)
- If connection drops mid-session: full-screen pause overlay — "Connection lost. Reconnecting..." — gameplay is completely frozen (no movement, no interactions)
- When connection is restored: auto-resume — overlay disappears, gameplay continues instantly without user tap
- No offline play mode — cloud connection is required for active gameplay

### Claude's Discretion

- Whether to use localStorage as a read cache for faster initial loads
- When/how to clear old localStorage save data
- Session lock timeout duration (for closed-tab-without-logout scenario)
- Behavior when Firestore unreachable on cold start
- Firestore data structure and security rule specifics

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ACCT-04 | User's character save slots are stored in Firestore (cloud), not localStorage | Firestore `setDoc`/`updateDoc` with merge, document-per-slot structure, security rules blocking localStorage bypass |
| ACCT-05 | User can access their saves from any device by logging in | UID-keyed Firestore documents loaded on auth, session lock prevents simultaneous multi-device writes |
</phase_requirements>

---

## Summary

Firebase (v12.9.0) is already installed and the project already uses Firestore for user profiles and username lookups (Phase 1). The `db` export from `src/firebase.js` is available throughout the app via import. Phase 2 is entirely an architectural reroute: three localStorage write sites in `App.jsx` and two read sites (`SaveSlotSelection.jsx`, `MainMenu.jsx`) swap to Firestore calls, plus new features are added for session locking and connection monitoring.

The data model is simple: each user has a `users/{uid}/characters/{slotId}` subcollection (2 documents max). The character document shape mirrors the existing `playerStats` object already used in React state. Security rules enforce that only the document owner can read/write their own characters, and constrain XP/level increments so devtools manipulation is blocked.

Session locking uses a single Firestore document (`sessions/{uid}`) holding a `deviceId` (random UUID generated at tab open) and a `lockedAt` server timestamp. On login, the app checks this document: if `lockedAt` is within the timeout window and `deviceId` does not match the current tab, the game is blocked. The lock is cleared on explicit logout. Connection monitoring uses browser `window.addEventListener('online'/'offline')` events combined with `onSnapshot` metadata to drive the full-screen freeze overlay.

**Primary recommendation:** Wire Firestore writes through a single `saveCharacter(uid, slotId, stats)` utility function; swap all three localStorage write sites in `App.jsx` to call it; load saves from Firestore in `SaveSlotSelection.jsx` replacing the `localStorage.getItem` loop; add session lock check before showing the main menu; add connection monitoring hook that controls a freeze overlay above the Phaser canvas.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| firebase (already installed) | 12.9.0 | Firestore reads/writes/security | Already in project; `db` already exported |
| firebase/firestore | 12.9.0 | `setDoc`, `updateDoc`, `getDoc`, `getDocs`, `onSnapshot`, `serverTimestamp`, `collection`, `doc` | Modular tree-shakeable API; same version as auth already used |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| crypto.randomUUID() | Built-in (all modern browsers) | Generate stable per-tab session device ID | Use on app init to identify the current browser tab as a session; no install needed |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Subcollection per user (`users/{uid}/characters/{slotId}`) | Single `characters` collection with `uid` field | Subcollection is cleaner for security rules (owner scoping is trivial); top-level requires query + rule filters |
| `window.online/offline` events | Firestore `onSnapshot` metadata (`fromCache`, `hasPendingWrites`) | Browser events are simpler and fire reliably; metadata approach requires an active listener and is better for distinguishing stale-cache vs. truly disconnected |
| Manual retry loop | Firebase SDK auto-queues writes internally | SDK retries queued writes automatically when connection restores; manual retry is only needed for the user-facing warning after N consecutive failures |

**Installation:** No new packages needed. Firebase 12.9.0 is already installed.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── hooks/
│   ├── useAuth.jsx          # existing — add session lock logic here or new hook
│   ├── useConnection.jsx    # NEW — monitors online/offline, drives freeze overlay
│   └── useCharacterSave.jsx # NEW — wraps Firestore save/load operations
├── components/
│   ├── SaveSlotSelection.jsx  # modify — swap localStorage reads to Firestore
│   ├── MainMenu.jsx           # modify — swap localStorage slot-full check to Firestore count
│   └── ConnectionOverlay.jsx  # NEW — full-screen "Connection lost. Reconnecting..." overlay
├── firebase.js              # existing — no changes needed (db already exported)
└── App.jsx                  # modify — swap localStorage writes, add session lock check
```

### Pattern 1: Character Save Structure (Subcollection)

**What:** Each user's save slots live as documents in a subcollection. The document ID is the slot number (`"1"` or `"2"`). The document data matches the existing `playerStats` shape.

**When to use:** Fixed small count of slots, owner-scoped security rules, no cross-user queries needed.

**Firestore path:** `users/{uid}/characters/{slotId}`

**Example:**
```javascript
// Source: official Firestore docs + existing project pattern
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

async function saveCharacter(uid, slotId, stats) {
  const ref = doc(db, 'users', uid, 'characters', String(slotId));
  await setDoc(ref, {
    ...stats,
    savedAt: serverTimestamp(),
  });
}
```

### Pattern 2: Loading All Save Slots

**What:** Read both slots at app load / slot selection screen open. Use `getDocs` on the subcollection.

```javascript
// Source: firebase/firestore modular API
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

async function loadCharacterSlots(uid) {
  const colRef = collection(db, 'users', uid, 'characters');
  const snapshot = await getDocs(colRef);
  const slots = { 1: null, 2: null };
  snapshot.forEach(docSnap => {
    slots[Number(docSnap.id)] = docSnap.data();
  });
  return slots; // { 1: characterData | null, 2: characterData | null }
}
```

### Pattern 3: Deleting a Save Slot

**What:** Delete the Firestore document. Also clear any localStorage remnant.

```javascript
import { doc, deleteDoc } from 'firebase/firestore';

async function deleteCharacter(uid, slotId) {
  const ref = doc(db, 'users', uid, 'characters', String(slotId));
  await deleteDoc(ref);
  // Clear old localStorage key as part of cleanup
  localStorage.removeItem(`saveSlot${slotId}`);
}
```

### Pattern 4: Session Lock (Single Active Device)

**What:** A document `sessions/{uid}` holds `deviceId` and `lockedAt` (server timestamp). On login/app load, check if a lock exists from a different device that is within the timeout. If so, show a blocked screen. On logout, delete the document.

**Session lock document path:** `sessions/{uid}`

```javascript
// Source: Firestore transaction pattern + serverTimestamp docs
import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes (Claude's discretion)
const deviceId = crypto.randomUUID(); // generated once per tab on module load

async function acquireSessionLock(uid) {
  const lockRef = doc(db, 'sessions', uid);
  const existing = await getDoc(lockRef);

  if (existing.exists()) {
    const data = existing.data();
    const lockedAt = data.lockedAt?.toDate?.() ?? new Date(0);
    const age = Date.now() - lockedAt.getTime();
    const isExpired = age > SESSION_TIMEOUT_MS;
    const isSameDevice = data.deviceId === deviceId;

    if (!isExpired && !isSameDevice) {
      return { locked: true }; // Another active session
    }
  }

  // Acquire / renew lock
  await setDoc(lockRef, { deviceId, lockedAt: serverTimestamp() });
  return { locked: false };
}

async function releaseSessionLock(uid) {
  await deleteDoc(doc(db, 'sessions', uid));
}
```

**Heartbeat:** Write `lockedAt: serverTimestamp()` to `sessions/{uid}` every ~2 minutes while the game is active. This prevents the lock from expiring on long sessions where no save event occurs. Use `setInterval` in the session hook; clear it on logout.

### Pattern 5: Event-Driven Save with Silent Retry

**What:** On each save event, call `saveCharacter()`. Catch errors silently, retry up to 3 times with exponential backoff. After 3 failures, show non-blocking warning.

```javascript
async function saveWithRetry(uid, slotId, stats, attempt = 0) {
  try {
    await saveCharacter(uid, slotId, stats);
    hideSaveWarning();
  } catch (err) {
    if (attempt < 3) {
      const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
      setTimeout(() => saveWithRetry(uid, slotId, stats, attempt + 1), delay);
    } else {
      showSaveWarning(); // "Cloud save unavailable"
    }
  }
}
```

### Pattern 6: Connection Monitoring (Freeze Overlay)

**What:** Listen to browser `online`/`offline` events. When offline mid-session, show a full-screen freeze overlay. When back online, hide it. The Phaser game canvas is visually covered and pointer events are blocked via CSS.

```javascript
// useConnection.jsx
import { useEffect, useState } from 'react';

export function useConnection() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
```

```jsx
// ConnectionOverlay.jsx — rendered above Phaser canvas in App.jsx
{!isOnline && isInGame && (
  <div className="connection-overlay">
    <p>Connection lost. Reconnecting...</p>
  </div>
)}
```

CSS blocks all pointer events on the overlay so the Phaser canvas receives no input while disconnected.

### Anti-Patterns to Avoid

- **Reading from localStorage as primary save source after Phase 2:** Post-deploy, localStorage is stale data. Only use it if explicitly implementing a read cache (Claude's discretion). Don't mix reads between localStorage and Firestore.
- **Awaiting setDoc without a timeout when offline:** Firebase SDK queues writes internally and the `await` will hang indefinitely until connection restores (verified bug: firebase-js-sdk #6515). Use fire-and-forget `setDoc(...).catch(handler)` for event-driven saves — do not `await` in render-blocking paths.
- **Deriving slot availability from localStorage after login:** `MainMenu.jsx` currently calls `localStorage.getItem()` to check if slots are full. After Phase 2, this must check the Firestore slot count. Using stale localStorage would incorrectly show empty slots.
- **Using `addDoc` instead of `setDoc` for saves:** `addDoc` generates a random document ID; saves must use `setDoc(doc(db, 'users', uid, 'characters', String(slotId)), data)` so slot IDs are stable and predictable.
- **Forgetting `{ merge: true }` when partial-updating:** If only XP changes, `setDoc` without merge will wipe other fields. For partial updates, use either `updateDoc` or `setDoc(ref, partialData, { merge: true })`. For game saves where the full `playerStats` object is always written, full `setDoc` (no merge) is cleaner and avoids stale field drift.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Anti-cheat XP validation | Custom validation middleware | Firestore Security Rules with `request.resource.data` constraints | Rules run server-side on every write; client cannot bypass them |
| Connection detection | Ping interval or custom WebSocket | `window.addEventListener('online'/'offline')` | Built into browsers; no extra dependencies; fires reliably on network change |
| Session ID generation | Custom UUID implementation | `crypto.randomUUID()` | Available in all modern browsers, cryptographically random |
| Write queuing / retry | Custom queue with IndexedDB | Firebase SDK internal write queue (+ simple `catch`-based retry) | SDK already handles offline queueing; only need manual retry for user-facing feedback |
| TTL / lock expiry | Cron job or Cloud Function to clean locks | Client-side timestamp comparison in `acquireSessionLock()` | For 2 slots and simple timeout, client comparison is sufficient; Firestore TTL policies add infra overhead |

**Key insight:** Firestore Security Rules are the sole enforcement layer for XP/level validity. The client validates via the game's business logic; the rules validate at the infrastructure layer. Both must agree — but only the rules are authoritative.

---

## Common Pitfalls

### Pitfall 1: `await setDoc` Hangs Offline

**What goes wrong:** The Promise returned by `setDoc` (and `updateDoc`) does not resolve while the client is offline, even with persistence enabled. Code that `await`s a save call will silently block until connectivity returns.

**Why it happens:** Firebase queues the write to IndexedDB locally but only resolves the Promise after server acknowledgment. Confirmed in firebase-js-sdk issue #6515.

**How to avoid:** Use fire-and-forget for event-driven saves: `setDoc(ref, data).catch(err => handleSaveError(err))`. Never `await` in an event handler that blocks UI.

**Warning signs:** Save events appear to freeze the UI or callbacks after save don't fire during testing with network throttling.

### Pitfall 2: Session Lock Race Condition on Multi-Tab Open

**What goes wrong:** User opens two tabs rapidly. Both read the lock document as empty, both write a lock — both succeed, neither is blocked.

**Why it happens:** `getDoc` + `setDoc` is not atomic in the client Web SDK (optimistic concurrency).

**How to avoid:** For this game, the race window is very small (both tabs must open within milliseconds) and the consequence is low severity (user just plays on two tabs until the lock heartbeat reconciles). Accept this limitation. A Firestore transaction would solve it but adds complexity not warranted here. Document this known limitation.

**Warning signs:** Two sessions appear active simultaneously in testing.

### Pitfall 3: `serverTimestamp()` Not Comparable in Security Rules Without Firestore TTL

**What goes wrong:** Security rules can compare `request.resource.data.lockedAt == request.time` to enforce server timestamp on writes, but the session lock expiry check cannot be done in security rules (rules can't compute `request.time - resource.data.lockedAt`).

**Why it happens:** Firestore rules `duration.value()` exists but `request.time - resource.data.lockedAt` arithmetic on Timestamps is not supported in all rule contexts.

**How to avoid:** Do the timeout comparison in client-side JavaScript (as shown in Pattern 4). Security rules only enforce ownership (`request.auth.uid == userId`), not lock expiry math.

**Warning signs:** Attempting to write complex timestamp arithmetic in security rules causes rule evaluation errors.

### Pitfall 4: `MainMenu.jsx` Slot-Full Check Uses localStorage

**What goes wrong:** The `areSlotsFullFn()` call in `MainMenu.jsx` reads `localStorage` synchronously on mount. After Phase 2, all slots will appear empty (localStorage is cleared) even when Firestore has characters.

**Why it happens:** The check is hardcoded to localStorage — must be replaced with the loaded Firestore slot count passed as a prop or from context.

**How to avoid:** Load saves from Firestore before showing `MainMenu`; pass slot count as a prop. Or make `MainMenu` receive `saveSlots` data (array length) rather than reading storage itself.

**Warning signs:** "New Game" button is always enabled even when user has 2 characters.

### Pitfall 5: Forgetting to Clear localStorage on First Login Post-Deploy

**What goes wrong:** Old localStorage `saveSlot1` / `saveSlot2` data persists. `SaveSlotSelection.jsx` after rewrite reads Firestore (empty), but `MainMenu.jsx`'s old check could still see localStorage data if not cleaned. Even with the rewrite, stale data wastes storage.

**Why it happens:** The decision is "no migration, cloud starts fresh" but the cleanup timing is Claude's discretion.

**How to avoid:** On `onAuthStateChanged` (successful login), unconditionally call `localStorage.removeItem('saveSlot1')` and `localStorage.removeItem('saveSlot2')` (and `playerStats`). This is safe because Firestore is now authoritative.

**Warning signs:** Slots appear inconsistently filled on first login after deploy.

### Pitfall 6: Firestore Security Rules Don't Block Reads During Session Lock

**What goes wrong:** A blocked device (another session holds the lock) can still read character data from Firestore unless rules prevent it.

**Why it happens:** The session lock is enforced client-side. A determined user could bypass the UI check and read/write directly.

**How to avoid:** Security rules enforce `request.auth.uid == userId` for all reads/writes. The session document check is client-side UX only — not a security control. For v1, client-side enforcement is acceptable. The game data integrity is protected by ownership rules and XP constraints.

---

## Code Examples

Verified patterns from official sources:

### Full Save (Character Creation, XP Gain, Level-Up)

```javascript
// Source: Firebase Firestore docs (add-data) + modular SDK v9+
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

// Full overwrite — always write complete playerStats shape
export async function saveCharacter(uid, slotId, stats) {
  const ref = doc(db, 'users', uid, 'characters', String(slotId));
  // Fire-and-forget — do NOT await in event handlers
  setDoc(ref, {
    ...stats,
    savedAt: serverTimestamp(),
  }).catch(err => {
    console.error('Save failed:', err);
    throw err; // Let caller handle retry
  });
}
```

### Delete Save Slot

```javascript
import { doc, deleteDoc } from 'firebase/firestore';

export async function deleteCharacterSlot(uid, slotId) {
  const ref = doc(db, 'users', uid, 'characters', String(slotId));
  await deleteDoc(ref);
  localStorage.removeItem(`saveSlot${slotId}`); // Cleanup legacy key
}
```

### Load All Slots

```javascript
import { collection, getDocs } from 'firebase/firestore';

export async function loadCharacterSlots(uid) {
  const colRef = collection(db, 'users', uid, 'characters');
  const snapshot = await getDocs(colRef);
  const slots = { 1: null, 2: null };
  snapshot.forEach(docSnap => {
    const slotNum = Number(docSnap.id);
    if (slotNum === 1 || slotNum === 2) {
      slots[slotNum] = docSnap.data();
    }
  });
  return slots;
}
```

### Security Rules (firestore.rules)

```javascript
// Source: Firebase Security Rules docs (rules-conditions, insecure-rules)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Username lookup — readable by anyone for login; writable only by authenticated users (registration)
    match /usernames/{usernameLower} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // User profiles — owner only
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // Character save slots — owner only, constrained fields
      match /characters/{slotId} {
        allow read: if request.auth != null && request.auth.uid == userId;

        allow create: if request.auth != null
          && request.auth.uid == userId
          && request.resource.data.level == 1
          && request.resource.data.xp == 0;

        allow update: if request.auth != null
          && request.auth.uid == userId
          // XP can only increase or stay the same — no arbitrary jumps
          && request.resource.data.xp >= resource.data.xp
          // XP gain per write capped at 500 (max reasonable task XP reward)
          && (request.resource.data.xp - resource.data.xp) <= 500
          // Level can only go up, never down; max level 100
          && request.resource.data.level >= resource.data.level
          && request.resource.data.level <= 100
          // Level can only increase by 1 per write
          && (request.resource.data.level - resource.data.level) <= 1;

        allow delete: if request.auth != null && request.auth.uid == userId;
      }
    }

    // Session locks — owner only, no constraints (just auth)
    match /sessions/{userId} {
      allow read, write, delete: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `localStorage.setItem('saveSlot1', JSON.stringify(stats))` | `setDoc(doc(db, 'users', uid, 'characters', '1'), stats)` | Phase 2 | Saves are cross-device, survive incognito/cleared storage |
| `localStorage.getItem('saveSlot1')` in `SaveSlotSelection` | `getDocs(collection(db, 'users', uid, 'characters'))` | Phase 2 | Loads from Firestore, requires authenticated user |
| `areSlotsFullFn()` reading localStorage in `MainMenu` | Slot data passed as prop from parent after Firestore load | Phase 2 | Eliminates sync localStorage read; prop is always current |
| No session control | `sessions/{uid}` document with deviceId + lockedAt | Phase 2 | Prevents multi-device conflicts |
| No connection monitoring | `online`/`offline` events + freeze overlay | Phase 2 | Full-screen pause on disconnect, auto-resume on reconnect |

**Deprecated/outdated after Phase 2:**
- `localStorage.setItem/getItem` for save data: replaced by Firestore
- Old localStorage migration logic in `App.jsx` (`useEffect` migrating `'playerStats'` key to `'saveSlot1'`): can be removed — cloud starts fresh

---

## Open Questions

1. **Session lock timeout duration**
   - What we know: User said "Claude decides"; common tab-closed-without-logout scenarios suggest 5-10 minutes is reasonable
   - What's unclear: How long a typical game session lasts without a save event (save events reset the heartbeat)
   - Recommendation: Use **5 minutes** as the timeout. With save events happening frequently (any XP gain, battle, etc.) the heartbeat will keep renewing on active sessions. 5 minutes is long enough to survive a brief navigation away but short enough to unblock another device without being annoying.

2. **Cold start behavior when Firestore unreachable**
   - What we know: User left this as Claude's discretion; offline persistence is disabled (not enabled in `firebase.js`)
   - What's unclear: Whether a brief spinner or an error screen is better UX
   - Recommendation: Show a loading state (spinner) while `getDocs` is in flight. If `getDocs` throws (network error), show an error message in the save slot UI with a retry button. Do not block the entire app — just the slot selection screen. The user can still see the main menu while the load retries.

3. **localStorage read cache**
   - What we know: Claude's discretion; Firestore reads have ~50-200ms latency on first load
   - What's unclear: Whether the latency is noticeable enough to warrant caching
   - Recommendation: **Do not cache** for v1. The save slot screen is shown after login, not on every navigation. Firestore's own in-memory cache (automatic in the SDK) will serve repeat reads within a session. Adding localStorage caching introduces a stale-cache problem. Revisit only if latency is a real complaint.

4. **XP cap per write in security rules**
   - What we know: XP awards come from task submission (up to ~500 XP for highest tier); need a per-write cap
   - What's unclear: What the maximum single-event XP award actually is in the current system
   - Recommendation: Check `TaskSubmissionModal.jsx` or XP config before finalizing the 500 cap. The rule `(request.resource.data.xp - resource.data.xp) <= 500` should be adjusted to reflect actual max XP per task. Set it slightly above the real max to allow legitimate edge cases.

---

## Sources

### Primary (HIGH confidence)

- Firebase official docs — [Writing conditions for Cloud Firestore Security Rules](https://firebase.google.com/docs/firestore/security/rules-conditions) — request.resource.data patterns, type checking, numeric constraints
- Firebase official docs — [Add data to Cloud Firestore](https://firebase.google.com/docs/firestore/manage-data/add-data) — setDoc, updateDoc, serverTimestamp, merge option
- Firebase official docs — [Choose a data structure](https://firebase.google.com/docs/firestore/manage-data/structure-data) — subcollection vs nested map decision
- Firebase official docs — [Build presence in Cloud Firestore](https://firebase.google.com/docs/firestore/solutions/presence) — session lock / connection monitoring patterns
- Firebase official docs — [Enabling Offline Capabilities in JavaScript](https://firebase.google.com/docs/database/web/offline-capabilities) — `.info/connected`, `window.online/offline` events
- Firebase official docs — [Manage data retention with TTL policies](https://firebase.google.com/docs/firestore/ttl) — TTL for session lock cleanup
- Firebase official docs — [Avoid insecure rules](https://firebase.google.com/docs/rules/insecure-rules) — security rule anti-patterns
- Existing codebase — `src/firebase.js`, `src/hooks/useAuth.jsx`, `src/App.jsx`, `src/components/SaveSlotSelection.jsx`, `src/components/MainMenu.jsx` — verified all localStorage call sites (6 write sites, 3 read sites across 3 files)

### Secondary (MEDIUM confidence)

- WebSearch verified with official docs — [Rate Limiting With Firestore Security Rules (smarx.com)](https://smarx.com/posts/2021/01/rate-limiting-with-firestore-security-rules/) — `request.time` + `duration.value()` for time-based locks; note: client-side implementation is used instead due to rule complexity
- WebSearch verified with GitHub — [firebase-js-sdk issue #6515](https://github.com/firebase/firebase-js-sdk/issues/6515) — confirmed `await setDoc` hangs offline; fire-and-forget pattern is the correct mitigation

### Tertiary (LOW confidence)

- WebSearch only — Heartbeat interval recommendation of 2 minutes: not sourced from official Firebase docs; based on community patterns. Validate during implementation that 2 minutes is frequent enough to renew the 5-minute timeout reliably.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Firebase 12.9.0 already installed and working; all APIs used in Phase 1 already
- Architecture: HIGH — Subcollection pattern is the documented standard for per-user nested data; verified in official docs
- Security rules: HIGH — request.resource.data / resource.data patterns verified via official docs; XP cap values are LOW until verified against actual XP award amounts
- Pitfalls: HIGH for async hang (confirmed GitHub issue) and localStorage conflict; MEDIUM for race condition (accepted limitation)
- Connection monitoring: HIGH — `window.online/offline` is a browser standard; no Firebase-specific uncertainty

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (Firebase APIs are stable; security rules syntax unlikely to change)
