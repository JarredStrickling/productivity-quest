# Scrolls of Doom

## What This Is

A mobile-first productivity RPG where completing real-world tasks (exercise, studying, chores, creative work) earns XP for your in-game character. The game features nostalgic pixel art visuals, a paper doll character customization system, and Pokemon/Final Fantasy-style turn-based party combat. Built for the creator and friends as a hobby project, with aspirations to become a mobile app.

## Core Value

Real-life productivity directly levels up your game character — the bridge between doing hard things and feeling rewarded for them must work seamlessly.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ Character creation with 5 classes (paladin, warrior, mage, archer, cleric) and paper doll customization — existing
- ✓ Task submission with AI verification via Claude API (describe task, get verification request, submit photo proof) — existing
- ✓ XP reward tiers (Common/Strong Work/Busting Chops/Legendary) based on AI evaluation — existing
- ✓ Leveling system with XP progression curve (levels 1-50) — existing
- ✓ Stat allocation on level-up (2 points per level across HP, strength, agility, mindPower) — existing
- ✓ Equipment system with class-default loadouts (weapon, off-hand, armor) — existing
- ✓ Ability system with 4 slots unlocking at levels 1, 3, 5, 8 per class — existing
- ✓ Turn-based party combat with AI-controlled party members — existing
- ✓ Boss battles and arena mode — existing
- ✓ Town map with NPC interactions (Task Master, quest board, dungeon entrance) — existing
- ✓ Title screen, main menu, save/load system (3 slots in localStorage) — existing
- ✓ Mobile-responsive design with touch/drag-to-move controls — existing
- ✓ Background music playback — existing
- ✓ Express backend with Claude API integration for task evaluation — existing

### Active

<!-- Current scope. Building toward these. -->

- [ ] User accounts with username/password authentication (Firebase Auth)
- [ ] Server-side save data in Firestore (3 character slots per account, replacing localStorage)
- [ ] Combat shield mechanic (shield adds a visible shield component to health bars)
- [ ] Combat stun mechanic (stunned characters skip their turn)
- [ ] Critical hit system (crit chance stat, critical hits deal 1.5x damage)
- [ ] Unique move/ability animations (visual effects that differentiate abilities)
- [ ] Consolidate duplicate battle modals into single reusable combat system
- [ ] New enemy types with distinct sprites and behaviors
- [ ] Combat visual polish (smooth turn flow, better timing, responsive feel)
- [ ] XP verification refinement (simpler verification requests, less awkward proof requirements)
- [ ] Anti-spam protection for task submissions (prevent repeat photo/description abuse)
- [ ] Fix placeholder NPC sprites (replace colored circles with proper sprite assets)
- [ ] Restore world collision barriers (prevent walking through buildings/objects)
- [ ] Tutorial or onboarding flow for new players

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Multiplayer/async party combat with friends — future milestone after single-player is polished
- Social login (Google, Discord, email verification) — username/password is sufficient for v1
- Wearable AI integration for automatic task detection — future tech, not ready yet
- App store release (iOS/Android native) — web-first, native wrapper is a later step
- Real-time sync between players — async or turn-based is the model for eventual multiplayer
- Leaderboards or social feeds — future milestone after accounts are solid
- Character respec system — nice to have but not blocking v1
- Weekly quest persistence — shell exists but not critical path for MVP

## Context

- Mobile-first design: all UI and Phaser canvas configured for phone viewports with touch input
- Mana Seed Character Base 2.5c asset pack provides the paper doll sprite system (commercial license, layered 512x512 PNG sheets with 64x64 frames)
- Existing combat has two near-identical modal implementations (BattleModal.jsx at 428 lines, ArenaModal.jsx at 1184 lines) that need consolidation
- Combat attack animation assets may already exist in the assets folder — need inventory
- Claude API is used for both generating verification requests and evaluating task submissions with photo proof
- Express backend runs separately from Vite dev server (dual-process model)
- The game is already testable on mobile via `npm run dev:mobile` with `--host` flag
- Brownfield project: significant working codebase mapped in `.planning/codebase/`

## Constraints

- **Tech stack**: React 19 + Phaser 3 frontend, Express backend — keep this foundation
- **Auth**: Firebase Auth for user accounts, Firestore for save data — recommended for low-ops overhead
- **Mobile-first**: All new UI must work on phone screens with touch input
- **AI costs**: Claude API calls cost money per token — verification system must be efficient
- **Assets**: Mana Seed sprite pack is the visual foundation — new art should match this pixel art style
- **Single developer**: Hobby project, progress is incremental — phases should deliver value independently

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Firebase Auth + Firestore for accounts/saves | Low ops overhead, good free tier, scales to app | — Pending |
| Username/password auth only (no social/email) | Simplest path to accounts, social login can be added later | — Pending |
| Consolidate battle modals before adding new mechanics | Duplicated code makes every combat change 2x work | — Pending |
| Keep AI verification but simplify proof requirements | Core differentiator of the game, but current UX is too friction-y | — Pending |
| Mobile-first, web-based (no native app yet) | Reach friends via URL sharing, skip app store complexity | — Pending |

---
*Last updated: 2026-02-21 after initialization*
