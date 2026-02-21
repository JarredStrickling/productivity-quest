# Stack Research

**Domain:** Productivity RPG — Firebase auth/saves, combat system overhaul, AI task verification
**Researched:** 2026-02-21
**Confidence:** HIGH (Firebase), HIGH (Phaser animation), MEDIUM (anti-spam), HIGH (Claude prompt caching)

---

## Context: What Already Exists

This is an additive milestone on a working brownfield project. The existing foundation is NOT to be replaced:

- React 19.2.0 + Phaser 3.90.0 (frontend)
- Vite 7.2.4 (build)
- Express 5.2.1 + @anthropic-ai/sdk 0.72.1 (backend)
- localStorage for saves (3 slots: `saveSlot1`–`saveSlot3`)

The research below covers only what must be **added** to deliver user accounts, combat overhaul, and XP verification refinement.

---

## Recommended Stack

### New Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| firebase | ^12.9.0 | Auth + Firestore SDK | Latest stable (Feb 2026). v11+ has breaking Auth changes from v10; v12 stable. Tree-shakeable modular API eliminates bloat in Vite bundle. Firebase free tier handles hobby-scale easily. |
| Firebase Auth (built into `firebase`) | via firebase pkg | Username+password user accounts | No separate package. `createUserWithEmailAndPassword` + synthetic email pattern is the standard workaround since Firebase requires an email identifier. Store actual username in Firestore user doc. |
| Cloud Firestore (built into `firebase`) | via firebase pkg | Server-side save data (3 slots per user) | Document model maps perfectly to the existing playerStats object. Subcollection pattern: `users/{uid}/saveSlots/{slot1,slot2,slot3}`. `onSnapshot` for real-time sync if needed later. |

### Combat System Libraries (NO new packages needed)

The existing Phaser 3.90.0 already contains everything required for combat overhaul:

| API | Version | Purpose | Why Recommended |
|-----|---------|---------|-----------------|
| `scene.tweens.add()` | Phaser 3.90.0 | Damage pop-ups, screen shake, slide-to-attack motion | Built into Phaser. `onComplete` callback chains attack → hurt → idle animations. |
| `scene.tweens.chain()` | Phaser 3.90.0 | Sequential combat animation steps | Executes tweens sequentially; no third-party animation lib needed. |
| `sprite.play()` + `sprite.chain()` | Phaser 3.90.0 | Sprite animation state machine | `sprite.chain()` schedules next animation after current completes. Clean pattern for attack → idle transitions. |
| `sprite.playAfterDelay()` | Phaser 3.90.0 | Stun/delay mechanics | Built-in delay without manual timers. |
| `this.anims.addMix()` | Phaser 3.90.0 | Smooth transitions between states | Prevents jarring cuts when going attack → run → idle. |
| Phaser Particles (built-in) | Phaser 3.90.0 | Hit sparks, crit flash effects | `scene.add.particles()` — no external particle library. |

### Anti-Spam for Task Submissions (lightweight, server-side)

| Approach | Where | Purpose | Why Recommended |
|----------|-------|---------|-----------------|
| Per-user submission timestamp in Firestore | `users/{uid}` doc, `lastSubmission` field | Cooldown between task submissions | Write timestamp on each submission; Express reads it and rejects if within cooldown window. No third-party rate-limit library needed at hobby scale. |
| Description + image hash comparison | Express server, in-memory or Firestore | Detect repeat photo/description submissions | SHA-256 hash the image buffer + description. Store last N hashes per user in Firestore. Reject if hash matches. Simple, zero cost. |

No Firebase App Check needed for a hobby project with authenticated users — App Check adds meaningful complexity (attestation providers, platform-specific setup) that is not worth it at this scale.

### Claude API Cost Reduction

| Technique | Where | Purpose | Why Recommended |
|-----------|-------|---------|-----------------|
| Prompt caching (`cache_control`) | `server.js`, system prompt | Reduce token costs on repeated verification calls | System prompt + static instructions can be cached. Cache reads are 90% cheaper than base input tokens. For image tasks, images (~85% of tokens) are NOT cacheable — only the static prefix is. Net savings ~14% per call. |
| Simplified system prompt | `server.js` | Reduce output tokens | Shorter, more direct prompts reduce both cost and hallucination risk. Verification request generation does not need a lengthy system prompt. |

---

## Installation

```bash
# Firebase SDK (adds Auth + Firestore + App initialization)
npm install firebase

# No other new packages needed — combat system uses existing Phaser APIs,
# anti-spam uses built-in Node crypto + Firestore,
# Claude prompt caching uses existing @anthropic-ai/sdk
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `firebase` npm package (modular v12) | `@react-native-firebase/app` + modules | Only for React Native (not web). This project is web-first. |
| Synthetic email pattern for username auth | Firebase Custom Auth with backend token minting | Custom auth requires a backend endpoint that mints Firebase tokens. More work, more flexibility. Worth it only if username collision checking needs to be extremely robust (e.g., public-facing app with millions of users). At hobby scale, synthetic email is fine. |
| Firestore subcollection for saves (`users/{uid}/saveSlots/`) | Flat document (`users/{uid}` with embedded slots map) | Flat document is fine when save data is small (<1MB). The playerStats object is small, so either works. Subcollection is recommended because it allows independent security rules per slot and cleaner partial reads. |
| Server-side rate limiting via Firestore timestamps | `express-rate-limit` npm package | Use `express-rate-limit` if you add public endpoints without authentication. All task submission endpoints are already behind user session context, so Firestore-based throttle is sufficient. |
| Built-in Phaser Tweens + sprite.chain() | External animation library (GSAP, anime.js) | GSAP is better for DOM/CSS animations. Phaser's tween system is tightly integrated with the game loop and works directly on game objects. Never use GSAP inside a Phaser scene. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Firebase Realtime Database | Older, less flexible schema, worse query capabilities, no subcollections. Firestore supersedes it for new projects. | Cloud Firestore (included in `firebase` package) |
| `@react-native-firebase/*` packages | These wrap the native iOS/Android Firebase SDKs. This project is a web app using Vite/React. They are incompatible. | `firebase` npm package (web SDK) |
| Firebase Social Auth (Google, Discord) | PROJECT.md explicitly lists this as out of scope. It adds OAuth complexity and callback flows that don't fit the mobile-first Phaser game UI pattern. | Username + password with `createUserWithEmailAndPassword` + synthetic email |
| Firebase App Check | Valid for public APIs but adds attestation provider setup (reCAPTCHA Enterprise, Play Integrity, App Attest) that requires platform-specific config. Too heavy for a hobby project with authenticated users already. | Firestore-based per-user rate limiting |
| GSAP or anime.js inside Phaser scenes | External animation libraries manipulate JS objects on their own timers, disconnected from Phaser's game loop. This causes animation desync with game state, especially on mobile where frame rate varies. | `scene.tweens.add()`, `scene.tweens.chain()`, `sprite.play()` |
| Firebase v9 compat mode (`firebase/compat/*`) | The compat layer exists for migration from v8. Starting fresh in v12, use the modular API. Compat adds bundle size and is deprecated trajectory. | Modular imports: `import { getAuth } from 'firebase/auth'` |

---

## Stack Patterns by Variant

**For the Auth + Firestore integration:**
- Initialize Firebase in a dedicated `src/firebase.js` module, export `auth` and `db` instances
- Auth state changes drive React state via `onAuthStateChanged` in `App.jsx`
- On login, load Firestore save slots into existing `playerStats` state shape — no React state shape changes needed
- On save (after XP gain, stat allocation), write to Firestore instead of localStorage
- Keep localStorage as offline fallback during development; strip it from production or keep as cache layer

**For combat animation in Phaser scenes:**
- Combat happens inside React modals (BattleModal, ArenaModal) — NOT Phaser scenes
- Use React + CSS animations for modal-based combat visuals (damage numbers, shake effects)
- For in-world effects (XP popups, level-up particles), use Phaser tweens in MainScene
- Consolidate BattleModal + ArenaModal before adding shield/stun/crit — duplicated logic is the primary risk

**For XP verification refinement:**
- Move system prompt to a dedicated module in `server.js` with `cache_control: { type: 'ephemeral' }` on the static prefix
- Shorten verification request prompt: remove decorative language, keep only the required proof type
- Add `lastTaskSubmission` timestamp + `lastTaskHashes` array to user's Firestore doc for anti-spam

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| firebase@^12.9.0 | React 19.2.0 | No conflicts. Modular Firebase is framework-agnostic. |
| firebase@^12.9.0 | Vite 7.2.4 | Full tree-shaking support. Import only `firebase/auth` and `firebase/firestore`. |
| firebase@^12.9.0 | Node.js (Express server) | Firebase Admin SDK (`firebase-admin`) is the server-side equivalent if you ever need server-to-Firestore writes. For this project, all Firestore writes happen from the client (React). The Express server only needs the Anthropic SDK. |
| firebase@^12.9.0 | Phaser 3.90.0 | No interaction. Phaser is browser canvas; Firebase is JS SDK. No conflicts. |

---

## Firestore Data Structure (prescriptive)

```
users/ (collection)
  └── {uid}/ (document)
        ├── username: string           // actual display name
        ├── email: string              // synthetic: username@scrollsofdoom.local
        ├── createdAt: Timestamp
        ├── lastSubmission: Timestamp  // anti-spam: time of last task submission
        ├── submissionHashes: string[] // anti-spam: last 10 SHA-256 hashes
        └── saveSlots/ (subcollection)
              ├── slot1/ (document)   // full playerStats JSON object
              ├── slot2/ (document)
              └── slot3/ (document)
```

Security rule pattern (Firestore rules file):
```
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
  match /saveSlots/{slotId} {
    allow read, write: if request.auth != null && request.auth.uid == userId;
  }
}
```

---

## Firebase Auth Pattern for Username-Only Accounts

Firebase requires an email identifier. The standard 2025 workaround:

```js
// Register
const syntheticEmail = `${username.toLowerCase()}@scrollsofdoom.local`;
const cred = await createUserWithEmailAndPassword(auth, syntheticEmail, password);
await setDoc(doc(db, 'users', cred.user.uid), { username, email: syntheticEmail });

// Login
const email = `${username.toLowerCase()}@scrollsofdoom.local`;
await signInWithEmailAndPassword(auth, email, password);
```

**Caveat:** Password reset emails won't work (fake domain). Not a concern — PROJECT.md explicitly excludes email verification.

---

## Sources

- [Firebase JS SDK Release Notes](https://firebase.google.com/support/release-notes/js) — Confirmed v12.9.0 is latest (Feb 5, 2026). HIGH confidence.
- [Firebase Auth Password-Based Accounts](https://firebase.google.com/docs/auth/web/password-auth) — Confirmed `createUserWithEmailAndPassword` pattern. HIGH confidence.
- [Firestore Data Model](https://firebase.google.com/docs/firestore/data-model) — Subcollection structure verified. HIGH confidence.
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/rules-conditions) — `request.auth.uid == userId` ownership pattern. HIGH confidence.
- [Phaser 3 Tweens docs](https://docs.phaser.io/phaser/concepts/tweens) — `scene.tweens.add()`, `scene.tweens.chain()`, `onComplete` verified for v3.90.0. HIGH confidence.
- [Phaser 3 Animations docs](https://docs.phaser.io/phaser/concepts/animations) — `sprite.play()`, `sprite.chain()`, `sprite.playAfterDelay()`, `anims.addMix()` verified for v3.90.0. HIGH confidence.
- [Claude Prompt Caching docs](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) — `cache_control` parameter, 90% cache read discount, image tokens not cacheable. HIGH confidence.
- [Firebase App Check](https://firebase.google.com/products/app-check) — Reviewed; determined overkill for authenticated hobby project. MEDIUM confidence (decision, not fact).
- [Fireship — Firestore Rate Limiting](https://fireship.io/lessons/how-to-rate-limit-writes-firestore/) — Per-user timestamp pattern. MEDIUM confidence (single source, but matches official Firestore docs pattern).

---

*Stack research for: Scrolls of Doom — Firebase Auth + Combat Overhaul + XP Verification milestone*
*Researched: 2026-02-21*
