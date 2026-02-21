# Project Research Summary

**Project:** Scrolls of Doom — Productivity RPG
**Domain:** Gamified Habit Tracker with Turn-Based Combat + AI Task Verification
**Researched:** 2026-02-21
**Confidence:** HIGH

## Executive Summary

Scrolls of Doom is an additive milestone on a working brownfield React + Phaser game. The milestone adds three interconnected capabilities: Firebase user accounts with cloud saves, a combat system overhaul (shield, stun, crits, animations), and XP verification refinement (anti-spam, prompt tuning). Research confirms all three are achievable with minimal new dependencies — only one new package (`firebase`) is required. The recommended approach threads a clear dependency chain: auth enables accounts, accounts enable anti-spam, combat consolidation unlocks all new mechanics. The stack is mature and the patterns are well-documented.

The strongest finding across all four research areas is that **combat system consolidation is the load-bearing prerequisite for combat mechanics**. The existing BattleModal (428 lines) and ArenaModal (1184 lines) share near-identical logic that has diverged over time. Every mechanic added without consolidating first doubles the implementation and doubles the bug surface. This consolidation must come before shields, stun, crits, or animations — not after. Similarly, on the Firebase side, Auth and Firestore are tightly coupled (Firestore save slots are keyed on the Firebase Auth UID) and must be built together, not sequentially.

The primary risks are operational rather than technical: Firestore write costs if the existing localStorage "write on every state change" pattern is carried over naively, security rules that allow client-side XP manipulation, and the localStorage-to-Firestore data migration path for existing saves. All three are well-understood problems with established mitigations. The anti-spam and prompt injection vectors are the least-researched areas (novel territory with no direct analogues) and need validation during implementation.

---

## Key Findings

### Recommended Stack

The existing React 19.2.0 + Phaser 3.90.0 + Vite 7.2.4 + Express 5.2.1 + Anthropic SDK stack is untouched. Only the `firebase` npm package is added. Phaser's built-in tween and animation APIs handle all combat animations with no external library. Anti-spam uses Node's built-in `crypto` module (SHA-256 hashing) plus Firestore timestamps — no third-party library needed. Claude prompt caching (`cache_control`) reduces token costs ~14% per call on the static system prompt prefix.

**Core technologies:**
- `firebase@^12.9.0`: Auth (username/password via synthetic email) + Firestore (cloud save slots) — modular v12 API, full Vite tree-shaking, free tier covers hobby scale
- Phaser built-in Tweens (`scene.tweens.add()`, `scene.tweens.chain()`, `sprite.chain()`): All combat animations — do not introduce GSAP or anime.js inside Phaser scenes (timer desync)
- Firestore subcollection `users/{uid}/saveSlots/{slot1,slot2,slot3}`: Save data structure — per-slot security rules, clean partial reads, maps directly to existing `playerStats` shape
- Node `crypto` (SHA-256) + Firestore `lastSubmission` timestamp: Anti-spam — zero new packages, server-side enforcement only

**What NOT to use:** Firebase Realtime Database (superseded by Firestore), `@react-native-firebase/*` (native SDKs, not web), Firebase App Check (attestation complexity not warranted for hobby auth'd users), GSAP inside Phaser scenes, `onSnapshot` for save data (single-player needs one-time reads, not real-time listeners).

See `.planning/research/STACK.md` for full details, version compatibility table, and prescriptive Firestore data structure.

### Expected Features

The milestone's feature set is defined. Consolidation of BattleModal and ArenaModal unlocks the entire combat feature tree; Auth + Firestore enables account persistence and anti-spam. These are not optional orderings.

**Must have (table stakes):**
- Firebase Auth username/password accounts — characters must survive app restarts; localStorage is insufficient
- Firestore cloud saves (3 slots per user) with localStorage as write-through cache — cross-device persistence
- Session persistence (auto-login) — Firebase JWT tokens persist automatically via `onAuthStateChanged`
- Battle system consolidation (`useBattle` hook + single `BattleModal`) — prerequisite for all combat mechanics
- Combat shield mechanic (visible shield HP, absorbs damage before HP) — Slay the Spire "Block" model, charge-based
- Combat stun mechanic (1-turn skip, sparks/shake visual indicator)
- Critical hit system (agility-based, 5-15% chance, 1.5x multiplier, visual flash)
- Ability animations using Phaser tweens (scale punch + screen shake, no new art assets required)
- Anti-spam: per-user submission cooldown + SHA-256 hash of photo+description
- XP verification UX simplification: shorter prompts, less friction, prompt caching enabled

**Should have (competitive, add after validation):**
- Onboarding tutorial (trigger: first friend reports confusion)
- Audio mute / volume slider (trigger: autoplaying music complaints)
- Error boundaries + human-readable network error messages
- More ability animations for remaining ability types

**Defer (v2+):**
- Async multiplayer / friend party combat (3-6 month scope increase minimum)
- Leaderboards (only meaningful with 10+ active users)
- Weekly quest persistence (requires committed design scope, not incremental)
- Social login (Google, Discord) — only warranted if game opens to public
- Native app wrapper (Capacitor) — after web version stable 3+ months

**Anti-features to reject:** Honor-system-only task verification (destroys the core differentiator), financial stakes (payment processing complexity), full per-ability sprite animations (20+ art assets — v2+ art milestone).

See `.planning/research/FEATURES.md` for full prioritization matrix, competitor analysis, and dependency graph.

### Architecture Approach

The architecture adds Firebase as a new client-side SDK layer beneath React, without touching Phaser or the Express backend. Three focused hooks (`useAuth`, `useSaveData`, `useBattle`) isolate Firebase and combat logic from React component trees, keeping modals testable and App.jsx as the sole state orchestrator. The combat state machine uses `useReducer` with explicit states (`IDLE → PLAYER_TURN → RESOLVING_ACTION → ENEMY_TURN → CHECK_OUTCOME → VICTORY/DEFEAT`) rather than the existing fragile `setTimeout` chains. Status effects (shield, stun, crit) are data entries on characters, not conditional branches scattered through damage calculation — a single `applyDamage(target, damage, effects)` function handles all effect interactions.

**Major components:**
1. `src/firebase.js` (new) — Single Firebase initialization point; exports `auth` and `db` singletons; prevents double-initialization errors
2. `src/hooks/useAuth.js` (new) — `onAuthStateChanged` wrapper; exposes `currentUser`, `signIn`, `signUp`, `signOut`; `authLoading` state prevents login-screen flash for returning users
3. `src/hooks/useSaveData.js` (new) — Firestore `getDoc`/`setDoc` for save slot CRUD; one-time reads on load, writes only on session milestones (task complete, level-up)
4. `src/hooks/useBattle.js` (new) — Combat state machine via `useReducer`; all damage calc, turn queue, status effects; replaces duplicated logic in both existing modals
5. `AuthModal.jsx` (new) — Login/register UI calling `useAuth`; maps Firebase error codes to human-readable strings
6. `BattleModal.jsx` (refactored) — Single unified combat UI accepting `enemyConfig` prop; ArenaModal merged in or deleted

**Build order dictated by architecture:** `src/firebase.js` → `useAuth` + `AuthModal` → `useSaveData` + save migration → (parallel) `useBattle` + modal consolidation → new combat mechanics.

See `.planning/research/ARCHITECTURE.md` for full component diagram, data flow diagrams, and annotated code examples for all four patterns.

### Critical Pitfalls

1. **Firestore write costs from naïve localStorage replacement** — The existing code writes on every stat allocation. Carrying this into Firestore generates hundreds of billable writes per session per user. Prevention: debounce writes to session milestones (task complete, level-up, battle end); write the full save slot as one atomic `setDoc()` call, never field-by-field. Keep localStorage as the fast in-session store.

2. **Firestore security rules that only check ownership, not field values** — `allow write: if request.auth.uid == userId` is the Firebase default pattern but says nothing about what values are valid. Any logged-in player can write `{ level: 50, xp: 999999 }` from devtools. Prevention: add field-level validation rules (level can only increase within bounds, XP gain per write capped at 150); run rule tests via Firebase Emulator before deployment.

3. **localStorage saves silently lost during Firebase migration** — If existing saves aren't migrated on first login, players lose their characters. Recovery cost is HIGH (irreversible if not anticipated). Prevention: implement local-to-Firestore import on first login before Firestore becomes the source of truth.

4. **Combat refactor breaking both modals simultaneously** — Extracting the `useBattle` hook from two diverged 400-1200 line files is high-risk without tests. Prevention: refactor incrementally (extract from ArenaModal first, verify it works, then apply to BattleModal); write minimal tests for `calculateDamage` and turn-order logic BEFORE starting the refactor; keep enemy-specific config in a config object, not `if (isBossFight)` branches in the hook.

5. **Phaser `game.destroy()` race condition with React unmount** — `game.destroy()` is async (next frame); React cleanup is synchronous. Adding Firebase changes the initialization sequence, increasing the chance of this bug. Prevention: always use `game.destroy(true)`; listen for the Phaser `DESTROY` event before React cleanup; initialize Phaser only AFTER `onAuthStateChanged` fires its first value.

See `.planning/research/PITFALLS.md` for the full list including security mistakes (prompt injection, CORS), performance traps, UX pitfalls, and phase-to-pitfall mapping.

---

## Implications for Roadmap

Based on research, the dependency chain is clear and non-negotiable. All four research files converge on the same 4-phase ordering.

### Phase 1: Firebase Auth + Account System

**Rationale:** Everything else in this milestone depends on a user identity. Anti-spam requires a user UID to track submission history. Firestore saves are keyed on the Firebase Auth UID. No other phase can start without this identity layer. Auth and Firestore are coupled and must be built together.

**Delivers:** User registration, login, session persistence (auto-login on return), logout. The game is gated behind AuthModal for unauthenticated users.

**Addresses:** Persistent user accounts, session persistence, visible save confirmation, cross-device character persistence.

**Uses:** `firebase@^12.9.0`, `src/firebase.js` singleton, `useAuth` hook, `AuthModal.jsx`, synthetic email pattern (`username@scrollsofdoom.local`).

**Avoids:** Firebase double-initialization (singleton pattern), auth state flash (authLoading state + spinner), Phaser/Firebase initialization race condition (create Phaser after first auth state resolves), raw Firebase error codes shown to users.

**Critical verification:** Enable Email/Password sign-in method in Firebase Console before writing any auth code — missing this step causes a cryptic `auth/configuration-not-found` error that is hard to diagnose.

---

### Phase 2: Firestore Cloud Saves + Data Migration

**Rationale:** Auth UID is now available (Phase 1 complete). Save data can be migrated. This phase makes character persistence real — accounts without cloud saves are useless.

**Delivers:** Cloud save data (3 slots per user) reading from and writing to Firestore. Existing localStorage saves imported to Firestore on first login (migration). Write-through pattern: localStorage fast cache + Firestore durable store.

**Addresses:** Cloud save data, character progress tied to account, visible save confirmation toast.

**Uses:** `useSaveData` hook, `users/{uid}/saveSlots/{slot1,slot2,slot3}` subcollection, `setDoc`/`getDoc` (one-time reads, not `onSnapshot`), Firestore security rules with field validation.

**Avoids:** Writing to Firestore on every stat allocation (debounce to milestones only), real-time `onSnapshot` listeners for single-player save data (use `getDoc` instead), security rules that allow client-side level/XP manipulation (add field validation before going live), localStorage saves silently lost on first login (implement import before making Firestore the source of truth).

**Critical verification:** Test the migration path: create a character in the current app (localStorage save), create a Firebase account, verify save is imported and accessible across devices.

---

### Phase 3: Combat System Consolidation

**Rationale:** Before adding shields, stun, or crits, the two combat implementations must merge. This phase does not deliver visible new features to players — it delivers the architectural foundation that makes new mechanics possible without doubling the work. Skip this phase and every combat mechanic in Phase 4 costs 2x the implementation time and has 2x the bug surface.

**Delivers:** Single `useBattle` hook encapsulating combat state machine, damage calculation, and turn sequencing. ArenaModal logic merged into `BattleModal` (accepts `enemyConfig` prop). Mana initialization bug (CONCERNS.md line 56-59) fixed as part of the refactor. Existing combat still works identically from the player's perspective.

**Addresses:** Battle system consolidation, mana initialization bug fix, foundation for all new combat mechanics.

**Uses:** `useReducer`-based combat state machine (`IDLE → PLAYER_TURN → RESOLVING_ACTION → ENEMY_TURN → VICTORY/DEFEAT`), status effects as data map (`statusEffects: { charId: { stunned, shielded } }`), single `applyDamage(target, damage, effects)` function.

**Avoids:** Extracting both modals to the hook simultaneously in one PR (incremental: ArenaModal first, then BattleModal), `if (isBossFight)` branches inside the shared hook (use `enemyConfig` prop instead), adding new mechanics before consolidation is verified.

**Research flag:** Write minimal unit tests for `calculateDamage` and turn-order logic BEFORE this phase begins — not after.

---

### Phase 4: New Combat Mechanics

**Rationale:** `useBattle` hook now exists (Phase 3). Each mechanic plugs into specific state transitions and the shared `applyDamage` function — no scattered conditionals, no duplicate implementations. Shield and stun are data entries in `statusEffects`; crit is a roll in `applyDamage`. Ability animations use existing Phaser tween APIs, requiring no new art.

**Delivers:** Combat shield mechanic (secondary HP bar, absorbs damage), stun mechanic (1-turn skip with sparks/shake visual), critical hit system (agility-based 5-15% chance, 1.5x multiplier, flash visual), at least 2 ability animations using Phaser tweens (scale punch + screen shake).

**Addresses:** Status effects with clear visual state, critical hit system, unique ability animations, turn-based combat with multiple distinct moves.

**Uses:** `useBattle.statusEffects` map, `applyDamage` with shield absorption and crit roll, `abilities.js` additions (`causesStun`, `providesShield`, `critChance` tags), Phaser `scene.tweens.chain()` and `sprite.play()` for animations in MainScene; React CSS animations for combat modal effects.

**Avoids:** `if (isShielded)` scattered across combat methods (centralize in `resolveStatusEffects()`), stun lasting more than 1 turn (frustrating per EN World research), AI party members not using new mechanics (verify party AI handles shield/stun/crit too), external animation libraries (GSAP) inside Phaser scenes.

---

### Phase 5: XP Verification Refinement + Anti-Spam

**Rationale:** Anti-spam requires Firebase user accounts (Phase 1) to have been established — per-user submission history needs a persistent UID. This phase refines the core differentiator (AI verification) and protects it from gaming.

**Delivers:** Claude prompt caching enabled (system prompt prefix cached, ~14% cost reduction per call), simplified verification request prompts (shorter, more direct, less friction for users), per-user submission cooldown (Firestore `lastSubmission` timestamp enforced server-side), photo+description SHA-256 hash deduplication (rejects repeat identical submissions).

**Addresses:** XP verification UX simplification, anti-spam submission protection.

**Uses:** `cache_control: { type: 'ephemeral' }` on static system prompt prefix in `server.js`, Node `crypto` SHA-256 hash of image buffer + description, `lastSubmission` timestamp and `submissionHashes` array in `users/{uid}` Firestore doc.

**Avoids:** User-controlled task description interpolated into system prompt (prompt injection vector — keep description in `user` message, never `system`), client-side-only cooldown (enforce server-side timestamp in Express), `auth/configuration-not-found` gotcha (Firebase Console sign-in method already enabled from Phase 1).

---

### Phase Ordering Rationale

- **Phase 1 must come first:** Firebase Auth UID is the foreign key for Firestore, anti-spam, and session persistence. Nothing else is buildable without it.
- **Phase 2 depends on Phase 1:** Firestore save slots are keyed on `currentUser.uid`. The data migration path from localStorage requires an authenticated user to write to.
- **Phase 3 is independent of Phases 1-2:** Combat consolidation has no Firebase dependency. It can begin in parallel with Phase 2 if development resources allow. However, completing it before Phase 4 is non-negotiable.
- **Phase 4 depends on Phase 3:** New mechanics plug into `useBattle` hook APIs that don't exist until Phase 3. Attempting Phase 4 without Phase 3 recreates the duplication problem.
- **Phase 5 depends on Phase 1:** Anti-spam per-user tracking requires Firebase Auth UID. Prompt caching is independent and can be done anytime, but it's logical to bundle with the broader verification work.

### Research Flags

Phases needing deeper research during planning:
- **Phase 5 (Anti-Spam):** No direct analogues found for AI behavioral pattern analysis on repeated task submissions. The SHA-256 hash approach is logical but untested in this specific domain. Validate hash collision edge cases (same task, different angle of photo).
- **Phase 3 (Combat Consolidation):** The mana initialization bug (CONCERNS.md line 56-59) is known but root cause unconfirmed. Deeper code archaeology needed before writing the `useBattle` hook to ensure the fix is correct.

Phases with standard patterns (skip additional research):
- **Phase 1 (Firebase Auth):** Well-documented official Firebase patterns. HIGH confidence. Follow the `useAuth` hook pattern from ARCHITECTURE.md verbatim.
- **Phase 2 (Firestore Saves):** Firestore CRUD is well-established. The `useSaveData` hook pattern is prescriptive. Focus implementation effort on the localStorage migration path.
- **Phase 4 (Combat Mechanics):** Shield (Slay the Spire Block model), stun (1-turn), crits (1.5x agility-based) are RPG standards. Phaser tween animation patterns are fully documented.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Firebase v12 release notes confirmed; all Phaser APIs verified against v3.90.0 official docs; Claude prompt caching confirmed against Anthropic docs |
| Features | MEDIUM | Core RPG combat features (shield, stun, crit) verified via multiple game dev sources; AI verification anti-spam is novel with no direct analogues |
| Architecture | HIGH | Firebase patterns verified against official docs; combat state machine pattern verified against established game dev literature; code examples are prescriptive, not illustrative |
| Pitfalls | HIGH | Firebase/Firestore pitfalls from official docs; Phaser async destroy from official issue tracker; prompt injection from OWASP and Anthropic; existing codebase pitfalls from first-party CONCERNS.md |

**Overall confidence:** HIGH

### Gaps to Address

- **Anti-spam hash deduplication edge cases:** SHA-256 hashing of photo buffer + description is the proposed approach. Images of the same subject from different angles will produce different hashes (intended — prevents trivial rotation cheating). However, what happens when a player legitimately completes the same type of task twice in a row? Validate the policy during Phase 5 planning: the cooldown timestamp (not the hash alone) is the primary throttle; hash deduplication is secondary.

- **Mana initialization bug root cause:** CONCERNS.md notes characters open with 0 or undefined mana. The `useBattle` hook refactor treats this as a fix vehicle, but the root cause must be confirmed before writing the hook (is it a prop threading issue? A state initialization order issue?). Investigate before Phase 3 begins.

- **Phaser game initialization sequence with Firebase Auth:** The auth state is async (brief null window before Firebase resolves). Research recommends creating the Phaser instance only after `onAuthStateChanged` fires. The current App.jsx creates Phaser in a `useEffect` on mount. This wiring needs architectural validation during Phase 1 planning — the current initialization code may need restructuring.

- **Existing localStorage save migration:** There is currently no documented migration path for existing saves. Phase 2 must design this before any Firestore writes are coded. Specifically: on first login by a user with existing localStorage saves, import them to Firestore, then make Firestore the source of truth. If this is skipped, existing testers lose their characters.

---

## Sources

### Primary (HIGH confidence)
- [Firebase JS SDK Release Notes](https://firebase.google.com/support/release-notes/js) — v12.9.0 confirmed latest, Feb 2026
- [Firebase Auth Password-Based Accounts](https://firebase.google.com/docs/auth/web/password-auth) — `createUserWithEmailAndPassword` pattern
- [Firestore Data Model](https://firebase.google.com/docs/firestore/data-model) — subcollection structure
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/rules-conditions) — ownership + field validation patterns
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices) — write batching, cost management
- [Fix Insecure Firestore Rules](https://firebase.google.com/docs/firestore/enterprise/security/insecure-rules) — field-level validation rules
- [Phaser 3 Tweens docs](https://docs.phaser.io/phaser/concepts/tweens) — `scene.tweens.add()`, `scene.tweens.chain()`
- [Phaser 3 Animations docs](https://docs.phaser.io/phaser/concepts/animations) — `sprite.play()`, `sprite.chain()`, `anims.addMix()`
- [Phaser Issue #4305](https://github.com/phaserjs/phaser/issues/4305) — `game.destroy()` async behavior confirmed
- [Phaser 3 Official React Template](https://phaser.io/news/2024/02/official-phaser-3-and-react-template) — React+Phaser initialization pattern
- [Claude Prompt Caching docs](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) — `cache_control`, 90% cache read discount
- [OWASP LLM Prompt Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html) — system/user message separation
- [Anthropic: Mitigate Jailbreaks](https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks) — prompt injection prevention
- [Claude Vision Documentation](https://docs.claude.com/en/docs/build-with-claude/vision) — spatial reasoning limits, AI-generated image detection limits
- Existing codebase: `.planning/codebase/CONCERNS.md` and `.planning/codebase/ARCHITECTURE.md` — first-party analysis

### Secondary (MEDIUM confidence)
- [Game Developer — Designing Unique Tactical Combat Mechanics](https://www.gamedeveloper.com/design/designing-unique-tactical-combat-mechanics-for-summoners-fate) — shield and stun design patterns
- [Board Game Designers Forum — Shield Mechanics](https://www.bgdf.com/forum/game-creation/mechanics/shield-mechanics-turn-based-combat) — shield as secondary health layer
- [EN World — Stun: The Fun-Killer](https://www.enworld.org/threads/stun-the-fun-killer.703292/page-2) — stun must be short-duration (1 turn)
- [Turn-Based Game Architecture Guide](https://outscal.com/blog/turn-based-game-architecture) — state machine pattern for combat
- [Turn-Based Game Loop](https://journal.stuffwithstuff.com/2014/07/15/a-turn-based-game-loop/) — established game dev literature
- [LogRocket: Firebase v9 with React](https://blog.logrocket.com/refactor-react-app-firebase-v9-web-sdk/) — hook patterns
- [RawHabit.ai — Habit App Comparison 2025](https://rawhabit.ai/blog/habit-app-comparison-2025) — competitor anti-cheat analysis
- [Fireship — Firestore Rate Limiting](https://fireship.io/lessons/how-to-rate-limit-writes-firestore/) — per-user timestamp throttle pattern

### Tertiary (LOW confidence)
- [RPGMaker Forums — Critical Damage](https://forums.rpgmakerweb.com/threads/lets-talk-about-critical-damage.106874/) — community consensus on crit multipliers (needs validation against chosen design)
- [Trophy.so — Gamification Examples](https://trophy.so/blog/productivity-gamification-examples) — editorial, single source

---
*Research completed: 2026-02-21*
*Ready for roadmap: yes*
