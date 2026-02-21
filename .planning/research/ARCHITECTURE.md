# Architecture Research

**Domain:** Productivity RPG — React 19 + Phaser 3 + Express + Firebase Auth/Firestore
**Researched:** 2026-02-21
**Confidence:** HIGH (Firebase patterns verified against official docs; combat patterns verified against established game dev literature)

## Standard Architecture

### System Overview

The target architecture adds Firebase Auth + Firestore as a new layer while keeping the existing React/Phaser/Express stack intact. The combat engine gets extracted from the two duplicate modal components into a shared module.

```
┌─────────────────────────────────────────────────────────────────────┐
│                     BROWSER (Client)                                 │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                   React UI Layer                             │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │    │
│  │  │AuthModal │  │BattleModal│  │CharPanel │  │TaskModal │   │    │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │    │
│  │       │             │              │              │          │    │
│  │  ┌────┴─────────────┴──────────────┴──────────────┴─────┐  │    │
│  │  │              App.jsx (State Orchestrator)              │  │    │
│  │  │         playerStats | currentUser | modalState         │  │    │
│  │  └────────────────────┬──────────────────────────────────┘  │    │
│  └───────────────────────┼──────────────────────────────────────┘   │
│                           │ game.events.emit/on                       │
│  ┌────────────────────────┴──────────────────────────────────────┐  │
│  │                  Phaser 3 (Game World)                         │  │
│  │              MainScene.js — sprites, NPCs, input               │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │               Firebase JS SDK (Client-Side)                    │   │
│  │   ┌─────────────────┐      ┌────────────────────────────┐   │   │
│  │   │  Firebase Auth   │      │  Firestore (save data)     │   │   │
│  │   │  getAuth()       │      │  users/{uid}/saveSlots/    │   │   │
│  │   │  onAuthStateChng │      │  setDoc / getDoc           │   │   │
│  │   └─────────────────┘      └────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                │ fetch POST /api/*
┌─────────────────────────────────────────────────────────────────────┐
│                     EXPRESS BACKEND (server.js)                      │
│   POST /api/generate-verification   POST /api/evaluate-task          │
│   Claude API (Anthropic SDK)        multer (image uploads)           │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `App.jsx` | State orchestrator: playerStats, currentUser, modal visibility | All React modals, Phaser (via events), Firebase Auth, Firestore |
| `src/firebase.js` (new) | Firebase app initialization, exports `auth` and `db` instances | Imported by App.jsx and any hook that touches Firebase |
| `src/hooks/useAuth.js` (new) | Wraps `onAuthStateChanged`, exposes `currentUser`, `signIn`, `signUp`, `signOut` | App.jsx |
| `src/hooks/useSaveData.js` (new) | Wraps Firestore `setDoc`/`getDoc` for save slot CRUD | App.jsx |
| `src/hooks/useBattle.js` (new) | Encapsulates all combat state machine logic, turn queue, status effects | BattleModal, ArenaModal (both consume same hook) |
| `BattleModal.jsx` (refactored) | Single combat UI that accepts `enemyConfig` prop; renders based on `useBattle` state | `useBattle` hook, App.jsx |
| `ArenaModal.jsx` (removed/merged) | Logic merged into BattleModal via `enemyConfig`; ArenaModal becomes a thin wrapper or deleted | BattleModal |
| `AuthModal.jsx` (new) | Login/Register UI; calls `useAuth` hook methods | `useAuth` hook, App.jsx |
| `MainScene.js` | Phaser game world; NPC interactions; emits events to React | App.jsx via game.events |
| `server.js` | Task evaluation via Claude API; no change for this milestone | TaskSubmissionModal via fetch |

## Recommended Project Structure

```
src/
├── firebase.js               # Firebase app init (initializeApp, getAuth, getFirestore)
│
├── hooks/
│   ├── useAuth.js            # onAuthStateChanged wrapper, sign-in/up/out methods
│   ├── useSaveData.js        # Firestore save slot CRUD (load, save, list slots)
│   └── useBattle.js          # Combat state machine, turn queue, damage calc
│
├── components/
│   ├── AuthModal.jsx         # Login + Register UI (username/password)
│   ├── BattleModal.jsx       # Single unified combat UI (replaces BattleModal + ArenaModal)
│   ├── CharacterPanel.jsx    # (unchanged)
│   ├── TaskSubmissionModal.jsx # (unchanged)
│   └── ...                   # All other existing components unchanged
│
├── config/
│   ├── classes.js            # (unchanged)
│   ├── abilities.js          # Add status effect tags: { causesStun, providesShield }
│   ├── equipment.js          # (unchanged)
│   ├── levelingSystem.js     # (unchanged)
│   └── appearance.js         # (unchanged)
│
└── scenes/
    └── MainScene.js          # (unchanged, except receives currentUser from App.jsx if needed)
```

### Structure Rationale

- **`src/firebase.js`:** Single initialization point. Firebase app created once; `auth` and `db` exported as singletons. Prevents double-initialization bugs that cause "Firebase App already exists" errors.
- **`src/hooks/`:** Three focused hooks isolate Firebase from React component trees. App.jsx calls hooks; modals receive data as props. This keeps modals testable without Firebase.
- **`useBattle.js` centralization:** The existing 428-line BattleModal and 1184-line ArenaModal share near-identical damage calc, AI logic, and turn sequencing. Extracting to a hook eliminates the "fix it twice" problem before adding shields, stun, and crits.

## Architectural Patterns

### Pattern 1: Auth Context via onAuthStateChanged

**What:** Firebase fires `onAuthStateChanged` on every auth state change (login, logout, page refresh). A `useAuth` hook subscribes and exposes `currentUser` as reactive state. App.jsx conditionally shows `AuthModal` or the game based on whether `currentUser` is null.

**When to use:** Always — this is the only Firebase-recommended pattern for auth state. Polling is wrong; conditional rendering based on auth state requires the listener.

**Trade-offs:** Auth state loads asynchronously on page refresh (brief null state before Firebase resolves). Show a loading spinner during this window to avoid flashing the login screen for logged-in users.

**Example:**
```javascript
// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase.js';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true); // true until Firebase resolves

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return unsubscribe; // cleanup on unmount
  }, []);

  const signIn = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const signUp = (email, password) => createUserWithEmailAndPassword(auth, email, password);
  const logOut = () => signOut(auth);

  return { currentUser, authLoading, signIn, signUp, logOut };
}
```

### Pattern 2: Firestore Save Slot CRUD

**What:** Each user's three save slots live at `users/{uid}/saveSlots/slot_1` (and slot_2, slot_3). Save = `setDoc`. Load = `getDoc` + read `.data()`. List available slots = `getDocs` on the subcollection.

**When to use:** Any time playerStats changes that would currently trigger `localStorage.setItem()`. Replace those calls with `setDoc`. On game load, replace `localStorage.getItem()` with `getDoc`.

**Trade-offs:** `setDoc` is async (returns a Promise); saves are no longer synchronous. Must handle save errors gracefully. localStorage writes stay as a local cache to avoid blocking UX on every stat change — sync to Firestore on meaningful milestones (task completion, level-up) rather than every stat point allocation.

**Example:**
```javascript
// src/hooks/useSaveData.js
import { doc, setDoc, getDoc, getDocs, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase.js';

export function useSaveData(uid) {
  const saveSlot = async (slotNumber, playerStats) => {
    const ref = doc(db, 'users', uid, 'saveSlots', `slot_${slotNumber}`);
    await setDoc(ref, { ...playerStats, lastSaved: serverTimestamp() });
  };

  const loadSlot = async (slotNumber) => {
    const ref = doc(db, 'users', uid, 'saveSlots', `slot_${slotNumber}`);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  };

  const listSlots = async () => {
    const ref = collection(db, 'users', uid, 'saveSlots');
    const snap = await getDocs(ref);
    const slots = {};
    snap.forEach(doc => { slots[doc.id] = doc.data(); });
    return slots;
  };

  return { saveSlot, loadSlot, listSlots };
}
```

### Pattern 3: Combat State Machine in useBattle

**What:** Combat has a finite set of phases. Model them explicitly as a state machine rather than chains of `setTimeout` and `setState` calls. The state machine lives in a `useReducer` inside `useBattle.js` and emits the current state to BattleModal for rendering.

**When to use:** Replacing the existing complex `setTimeout` chains in ArenaModal (lines 420-456, 737-779) which are fragile and cause the "battle stuck in active state" bug. A state machine makes illegal transitions impossible — you can't be in `ENEMY_TURN` and `PLAYER_TURN` simultaneously.

**Trade-offs:** Higher upfront complexity to set up; pays off immediately when adding shields, stun, and crits because each mechanic plugs into specific state transitions rather than scattered conditionals.

**States:**
```
IDLE → PLAYER_TURN → RESOLVING_ACTION → ENEMY_TURN → RESOLVING_ACTION → CHECK_OUTCOME
                                                                              ↓
                                                                   VICTORY | DEFEAT | PLAYER_TURN
```

**Example:**
```javascript
// src/hooks/useBattle.js (skeleton)
const BATTLE_STATES = {
  IDLE: 'IDLE',
  PLAYER_TURN: 'PLAYER_TURN',
  RESOLVING_ACTION: 'RESOLVING_ACTION',
  ENEMY_TURN: 'ENEMY_TURN',
  VICTORY: 'VICTORY',
  DEFEAT: 'DEFEAT',
};

function battleReducer(state, action) {
  switch (action.type) {
    case 'START_BATTLE':
      return { ...state, phase: BATTLE_STATES.PLAYER_TURN, turnNumber: 1 };
    case 'PLAYER_ACTION':
      return { ...state, phase: BATTLE_STATES.RESOLVING_ACTION, pendingAction: action.payload };
    case 'ACTION_RESOLVED':
      if (action.payload.enemiesDead) return { ...state, phase: BATTLE_STATES.VICTORY };
      if (action.payload.partyDead) return { ...state, phase: BATTLE_STATES.DEFEAT };
      return { ...state, phase: BATTLE_STATES.ENEMY_TURN };
    case 'ENEMY_TURN_COMPLETE':
      // Apply stun: skip affected characters' next turn
      const nextPhase = action.payload.partyDead ? BATTLE_STATES.DEFEAT : BATTLE_STATES.PLAYER_TURN;
      return { ...state, phase: nextPhase, turnNumber: state.turnNumber + 1 };
    default:
      return state;
  }
}

export function useBattle(party, enemyConfig) {
  const [battleState, dispatch] = useReducer(battleReducer, {
    phase: BATTLE_STATES.IDLE,
    party: initParty(party),       // normalize party from playerStats
    enemies: initEnemies(enemyConfig),
    statusEffects: {},             // { charId: { stunned, shielded, critBoost } }
    turnNumber: 0,
    log: [],
  });
  // ...expose dispatch actions and computed values
  return { battleState, performPlayerAction, advanceEnemyTurn };
}
```

### Pattern 4: Status Effects as Data, Not Logic Forks

**What:** Shield, stun, and crit are status effect entries on the character, not `if (isShielded)` forks scattered through damage calculation. A single `applyDamage(target, damage, effects)` function reads the effect list and modifies accordingly.

**When to use:** When adding stun (skip turn), shield (absorb damage), and crit (1.5x multiplier). This pattern lets you add future effects (poison, haste, taunt) by adding a new effect definition, not new conditional branches.

**Trade-offs:** Requires upfront normalization of `statusEffects` shape. Worth it: the alternative is the existing pattern where every new mechanic requires edits in 4 places.

**Example:**
```javascript
// src/config/abilities.js additions
// Add to ability definitions:
// { causesStun: true, stunDuration: 1 }   // for stun abilities
// { providesShield: true, shieldAmount: 50 } // for shield abilities
// { critChance: 0.2 }  // for crit-boosting abilities

// src/hooks/useBattle.js
function applyDamage(target, rawDamage, attackerEffects) {
  const isCrit = Math.random() < (attackerEffects.critChance || 0);
  const damage = isCrit ? Math.floor(rawDamage * 1.5) : rawDamage;

  const shieldAbsorb = Math.min(target.currentShield || 0, damage);
  const hpDamage = damage - shieldAbsorb;

  return {
    newHp: Math.max(0, target.currentHp - hpDamage),
    newShield: target.currentShield - shieldAbsorb,
    isCrit,
    damageDealt: damage,
  };
}
```

## Data Flow

### Auth + Save Load Flow (New)

```
Page Load
    ↓
Firebase SDK resolves onAuthStateChanged
    ↓
  [null]  → App.jsx shows AuthModal (login/register)
  [user]  → App.jsx calls useSaveData.listSlots(user.uid)
                ↓
            SaveSlotSelection renders slots from Firestore
                ↓
            User selects slot → useSaveData.loadSlot(uid, slotNumber)
                ↓
            playerStats set from Firestore data
                ↓
            game.events.emit('update-stats', playerStats)
                ↓
            Phaser syncs appearance layers
```

### Task Submission → Save Flow (Modified)

```
Player completes task → XP awarded (existing flow unchanged)
    ↓
App.jsx handleTaskSubmit():
  1. calculateLevelUp() [existing]
  2. setPlayerStats(newStats) [existing React state]
  3. localStorage.setItem() [keep as local cache]
  4. useSaveData.saveSlot(uid, slotNumber, newStats) [NEW — async, non-blocking]
  5. game.events.emit('xp-gained', newStats) [existing]
```

**Key decision:** Keep localStorage as a write-through cache. If Firestore save fails (network issue), the local cache preserves data. On next successful auth, load from Firestore as source of truth. This avoids blocking the game UX on every network round-trip.

### Combat Flow (Refactored)

```
NPC interaction → game.events.emit('open-battle', { enemyConfig })
    ↓
App.jsx sets showBattle = true, battleEnemyConfig = enemyConfig
    ↓
<BattleModal enemyConfig={battleEnemyConfig} party={playerStats} />
    ↓
useBattle(party, enemyConfig) initializes state machine at IDLE
    ↓
START_BATTLE dispatch → phase = PLAYER_TURN
    ↓
Player selects ability → PLAYER_ACTION dispatch
    ↓
applyDamage() with status effects → ACTION_RESOLVED dispatch
    ↓
Check outcomes → ENEMY_TURN or VICTORY/DEFEAT
    ↓
Enemy AI selects action → applyDamage() to party
    ↓
Check stun, shields, check party alive → PLAYER_TURN or DEFEAT
    ↓
On VICTORY: onBattleComplete(xpReward) callback → App.jsx awards XP
```

### State Management

```
Firebase Auth (server-side session)
    ↓ onAuthStateChanged
currentUser (App.jsx useState)
    ↓ triggers
useSaveData(currentUser.uid)
    ↓
playerStats (App.jsx useState) ←→ Firestore + localStorage (dual write)
    ↓ props
All modals receive playerStats as props (unchanged pattern)
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-100 users (current) | Firebase free tier handles this trivially. No changes needed. |
| 100-10k users | Firebase Spark plan limit is 50k reads/day. At this scale, add Firestore read caching (load once per session, not on every modal open). Still within free tier for hobby project. |
| 10k+ users | Upgrade to Blaze pay-as-you-go. Consider Firestore security rules audit. Express backend may need rate limiting for task evaluation endpoint. |

### Scaling Priorities

1. **First bottleneck:** Claude API costs (task evaluation) — not Firebase. Each evaluation = one API call. Rate limit on the Express endpoint before Firestore becomes a concern.
2. **Second bottleneck:** Firestore reads if save data is fetched too frequently (e.g., on every modal open). Cache `playerStats` in React state and only re-fetch from Firestore on explicit load-game action.

## Anti-Patterns

### Anti-Pattern 1: Initializing Firebase Inside Components

**What people do:** Call `initializeApp(config)` inside a React component or useEffect.
**Why it's wrong:** Fires on every render cycle. Causes "Firebase App named '[DEFAULT]' already exists" error. Results in multiple auth listeners.
**Do this instead:** Create `src/firebase.js` that calls `initializeApp()` once at module load time. Export `auth` and `db` as singletons. Import them wherever needed.

### Anti-Pattern 2: Blocking Game UI on Firestore Writes

**What people do:** `await saveSlot(uid, slot, data)` before closing the save dialog or returning from task submission.
**Why it's wrong:** Network latency (100-500ms) blocks the game. On mobile with weak signal, this is a multi-second freeze. Players perceive the game as broken.
**Do this instead:** Write to localStorage synchronously (existing pattern), then fire-and-forget `saveSlot()` to Firestore. Add error handling that retries on next interaction. Show a subtle "saving..." indicator, not a blocking spinner.

### Anti-Pattern 3: Keeping Two Combat Modal Implementations

**What people do:** Add the new shield/stun/crit mechanics to BattleModal, then copy the changes to ArenaModal.
**Why it's wrong:** The CONCERNS.md documents this explicitly — the codebase already has this problem. ArenaModal is 1184 lines because features were added without consolidation. Every new mechanic doubles the maintenance burden.
**Do this instead:** Extract `useBattle` hook before adding any new mechanics. New mechanics go in the hook once. BattleModal and ArenaModal merge into a single `BattleModal` that accepts `enemyConfig`.

### Anti-Pattern 4: Using Firestore Real-Time Listeners for Save Data

**What people do:** Set up `onSnapshot(saveSlotRef, callback)` to reactively sync Firestore changes to playerStats.
**Why it's wrong:** This game is single-player. Real-time listeners cost Firestore reads per update and maintain an open connection. There's no other client modifying the data.
**Do this instead:** Use `getDoc` (one-time read) on load, `setDoc` on save. Only use `onSnapshot` if multiplayer is added.

### Anti-Pattern 5: Encoding Username as Firebase Email

**What people do:** Since Firebase Auth requires an email, accept a username and transform it: `${username}@game.local`.
**Why it's wrong:** Fragile. Breaks if Firebase validates email format more strictly. Confuses users who see "email" in error messages.
**Do this instead:** Use Firebase Auth with a real email field (can be `${username}@scrollsofdoom.local` internally), OR store the display username in the Firestore user document as a separate field. The `displayName` field on the Firebase user object also works. Keep the auth email as implementation detail; show `displayName` everywhere in-game.

### Anti-Pattern 6: Stun/Shield Logic as Scattered Conditionals

**What people do:** Add `if (character.isStunned) { skipTurn() }` in five different places across combat methods.
**Why it's wrong:** Adding a new effect requires hunting down all five places. Missing one causes inconsistent behavior.
**Do this instead:** Centralize in `useBattle`'s `statusEffects` map. Before each turn, run `resolveStatusEffects(character)` which returns the normalized character state for that turn. All combat methods operate on the resolved state.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Firebase Auth | `onAuthStateChanged` listener in `useAuth` hook; modular SDK v9 (tree-shakeable) | HIGH confidence — official Firebase docs. Use `signInWithEmailAndPassword` for username/password auth. |
| Firestore | `setDoc`/`getDoc` at `users/{uid}/saveSlots/slot_N`; one-time reads, not real-time listeners | HIGH confidence — official Firestore docs. Stay under 1MB document limit (current save is ~2KB, safe). |
| Claude API (Anthropic) | No changes. Stays in Express backend, called via `POST /api/*` from TaskSubmissionModal | Existing pattern is correct. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| App.jsx ↔ Firebase Auth | `useAuth` hook; `currentUser` returned as state | `currentUser.uid` is the Firestore document key |
| App.jsx ↔ Firestore | `useSaveData` hook; `saveSlot`, `loadSlot`, `listSlots` functions | Async; do not await in the hot path |
| App.jsx ↔ Phaser | `game.events.emit/on` — unchanged | Auth state does not need to reach Phaser directly |
| BattleModal ↔ useBattle | Props in, dispatch callbacks out | Hook is pure logic; BattleModal is pure rendering |
| useBattle ↔ config/ | Imports from `abilities.js`, `classes.js` — unchanged | Combat logic reads config data directly |

## Build Order Implications

This architecture has clear dependencies that dictate phase ordering:

**Must build first:**
1. `src/firebase.js` — Every Firebase feature depends on this initialization module
2. `useAuth` hook — Cannot show login UI or gate save data without auth state
3. `AuthModal` — Users must be able to log in before saves mean anything

**Must build second (depends on auth):**
4. `useSaveData` hook — Requires `currentUser.uid` which comes from `useAuth`
5. Save slot migration — Existing localStorage saves need to be importable to Firestore on first login

**Can build in parallel with auth:**
6. `useBattle` hook extraction — Pure combat logic, no Firebase dependency
7. `BattleModal` consolidation — Depends only on `useBattle`, not on Firebase

**Build last (depends on useBattle):**
8. Shield mechanic — Plugs into `useBattle.statusEffects` and `applyDamage`
9. Stun mechanic — Same: adds turn-skip logic to `PLAYER_TURN` state
10. Crit mechanic — Same: adds crit roll to `applyDamage`

**Suggested phase sequence based on dependencies:**
```
Phase 1: Firebase Auth + AuthModal (login/register/logout)
Phase 2: Firestore save slots (replace localStorage with Firestore + localStorage dual-write)
Phase 3: useBattle extraction + BattleModal/ArenaModal consolidation
Phase 4: New combat mechanics (shield, stun, crit) built on useBattle
```

## Sources

- [Firebase Auth Web — Get Started](https://firebase.google.com/docs/auth/web/start) — HIGH confidence (official docs)
- [Firebase Modular SDK v9 — Upgrade Guide](https://docs.cloud.google.com/identity-platform/docs/web/modular-sdk-upgrade) — HIGH confidence (official docs)
- [Firestore — Choose a Data Structure](https://firebase.google.com/docs/firestore/manage-data/structure-data) — HIGH confidence (official docs)
- [Firestore — Add Data](https://firebase.google.com/docs/firestore/manage-data/add-data) — HIGH confidence (official docs)
- [Turn-Based Game Architecture Guide](https://outscal.com/blog/turn-based-game-architecture) — MEDIUM confidence (verified against multiple game dev sources)
- [Turn-Based Game Loop](https://journal.stuffwithstuff.com/2014/07/15/a-turn-based-game-loop/) — MEDIUM confidence (established game dev literature)
- [Phaser 3 Firebase Plugin Notes](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/firebase-overview/) — MEDIUM confidence (community-maintained, not official Firebase)
- [Firebase Modular SDK + React Context Pattern](https://modularfirebase.web.app/common-use-cases/authentication/) — MEDIUM confidence (community docs)
- [LogRocket: Firebase v9 with React](https://blog.logrocket.com/refactor-react-app-firebase-v9-web-sdk/) — MEDIUM confidence (verified patterns against official SDK)

---
*Architecture research for: Scrolls of Doom — Productivity RPG*
*Researched: 2026-02-21*
