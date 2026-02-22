# Requirements: Scrolls of Doom

**Defined:** 2026-02-21
**Core Value:** Real-life productivity directly levels up your game character

## v1 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### User Accounts

- [ ] **ACCT-01**: User can create an account with a unique username and password
- [ ] **ACCT-02**: User can log in and stay logged in across browser sessions
- [ ] **ACCT-03**: User can log out from any screen
- [ ] **ACCT-04**: User's 3 character save slots are stored in Firestore (cloud), not localStorage
- [ ] **ACCT-05**: User can access their saves from any device by logging in

### Combat System

- [ ] **CMBT-01**: BattleModal and ArenaModal are consolidated into a single reusable combat system
- [ ] **CMBT-02**: Shield mechanic — abilities can grant a shield that absorbs damage before HP, shown visually on health bar, resets each round
- [ ] **CMBT-03**: Stun mechanic — stunned characters skip 1 turn with a clear visual indicator (sparks/shake)
- [ ] **CMBT-04**: Critical hit system — baseline 10% crit chance, critical hits deal 1.5x damage with visual feedback
- [ ] **CMBT-05**: Certain abilities temporarily increase crit chance for the caster
- [ ] **CMBT-06**: Warrior Blade Flurry mechanic — each attack adds a stack (up to 5), each stack = +10% damage on next attack, resets to 0 at 5 stacks and starts over
- [ ] **CMBT-07**: Multi-hit Warrior abilities (Double Slash, Cyclone) each hit maintains and builds the Blade Flurry stack counter
- [ ] **CMBT-08**: Unique ability animations using Phaser tweens (screen shake, scale punch, flash effects) that visually differentiate abilities
- [ ] **CMBT-09**: Smooth turn flow with responsive timing between turns and actions

### XP Verification

- [ ] **XPVR-01**: AI verification requests are simpler and more achievable (less awkward proof poses)
- [ ] **XPVR-02**: Anti-spam protection prevents submitting the same task/photo repeatedly for XP
- [ ] **XPVR-03**: Task description input is sanitized to prevent prompt injection against the Claude API

## v2 Requirements

Deferred to future milestone. Tracked but not in current roadmap.

### Accounts & Data

- **ACCT-06**: Migrate existing localStorage saves into Firestore account on first login
- **ACCT-07**: Firestore offline persistence for mobile users on spotty connections

### Combat Content

- **CMBT-10**: New enemy types with distinct sprites, stats, and behaviors
- **CMBT-11**: Unique class-specific mechanics for Paladin, Mage, Archer, and Cleric (like Warrior's Blade Flurry)
- **CMBT-12**: Per-ability sprite animations (beyond tween effects — actual animated sprites)

### World & Polish

- **WRLD-01**: Fix placeholder NPC sprites (replace colored circles with proper assets)
- **WRLD-02**: Restore world collision barriers (prevent walking through buildings)
- **WRLD-03**: Tutorial or onboarding flow for new players
- **WRLD-04**: Audio settings with volume control and mute option
- **WRLD-05**: Character respec system (reset allocated stat points)

### Social

- **SOCL-01**: Async multiplayer party combat (friends' characters join your battle)
- **SOCL-02**: Leaderboards or social feeds
- **SOCL-03**: Social login (Google, Discord)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Wearable AI integration | Future tech, not ready yet — awesome vision but not actionable now |
| App store release (iOS/Android) | Web-first, native wrapper is a later milestone |
| Real-time sync between players | Async turn-based is the model for eventual multiplayer |
| Email verification | Username/password is sufficient for v1 |
| Weekly quest persistence | Shell exists but not on critical path |
| Cloud save migration from localStorage | Useful but not blocking v1 — new accounts start fresh |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ACCT-01 | Phase 1 | Pending |
| ACCT-02 | Phase 1 | Pending |
| ACCT-03 | Phase 1 | Pending |
| ACCT-04 | Phase 2 | Pending |
| ACCT-05 | Phase 2 | Pending |
| CMBT-01 | Phase 3 | Pending |
| CMBT-02 | Phase 4 | Pending |
| CMBT-03 | Phase 4 | Pending |
| CMBT-04 | Phase 5 | Pending |
| CMBT-05 | Phase 5 | Pending |
| CMBT-06 | Phase 5 | Pending |
| CMBT-07 | Phase 5 | Pending |
| CMBT-08 | Phase 6 | Pending |
| CMBT-09 | Phase 6 | Pending |
| XPVR-01 | Phase 7 | Pending |
| XPVR-02 | Phase 7 | Pending |
| XPVR-03 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0

---
*Requirements defined: 2026-02-21*
*Last updated: 2026-02-22 after roadmap creation — all 17 requirements mapped*
