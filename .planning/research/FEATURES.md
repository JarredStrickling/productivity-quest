# Feature Research

**Domain:** Productivity RPG / Gamified Habit Tracker with Turn-Based Combat
**Researched:** 2026-02-21
**Confidence:** MEDIUM — core feature expectations verified via multiple sources; AI verification design is novel territory with no direct analogues found

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Persistent user accounts | Any multiplayer-adjacent or cross-device game requires accounts; users expect their character to survive app restarts | LOW | Firebase Auth + Firestore is already the chosen path; username/password is sufficient for v1 |
| Cloud save data | Characters created with real effort must not be lost; localStorage wipes on browser reset or new device | MEDIUM | Firestore migration from localStorage requires schema design and data migration path for existing saves |
| Session persistence (stay logged in) | Nobody wants to enter credentials every launch; mobile users especially expect instant resume | LOW | Firebase Auth JWT tokens persist on device automatically; just wire up auth state listener |
| Character progress tied to account | XP, level, stats, equipment must be per-account not per-device | MEDIUM | Currently localStorage-keyed; needs Firestore document per user with 3 slot sub-documents |
| Visible save confirmation | Users need to know their progress was saved to the cloud | LOW | Add save indicator or toast notification after Firestore writes succeed |
| Turn-based combat with multiple distinct moves | Players expect abilities to feel different, not all deal flat damage | MEDIUM | Already have 4-slot ability system; differentiation is about effect (stun, shield, AoE) not just numbers |
| Status effects with clear visual state | Stun, shield, and buffs must have visible indicators so players can track combat state | MEDIUM | Standard RPG convention since Final Fantasy; missing this makes combat feel opaque |
| Critical hit system | Any RPG combat without crits feels flat; 1986 Dragon Quest established this expectation | LOW | Crit chance stat already in PROJECT.md scope; standard 1.5x-2x multiplier is sufficient for v1 |
| Task submission with reward feedback | The core loop must close: do real task, see character improve | LOW | Already exists; refinement (simpler verification UX) is the work |
| Onboarding / tutorial for new users | Mobile games must explain the loop on first launch; no tutorial = high early abandonment | MEDIUM | Currently absent per CONCERNS.md; needed before sharing with friends |
| Error recovery and network feedback | When server is offline or API fails, users need an explanation not a blank screen | LOW | Currently shows "[object Object]" per CONCERNS.md; needs proper error messages |
| Mute / audio control | Background music autoplays; users expect to be able to silence it without closing the app | LOW | Currently absent per CONCERNS.md; add volume slider to settings, persist to localStorage |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| AI-verified task evaluation (photo proof + description) | The only gamified habit tracker with genuine verification — not just a checkbox. Closes the gap that all competitors leave open: "no verification, no proof, just your word" | HIGH | Already exists; the differentiator is real. UX refinement is needed — current proof requirements are awkward. Keep this, simplify the flow |
| Tiered XP rewards (Common/Strong Work/Busting Chops/Legendary) | AI judges effort level, not just completion — lazy tasks earn less. Creates authentic connection between effort and reward that honor-system apps cannot replicate | MEDIUM | Already exists; AI prompt tuning is ongoing work. The tier names are memorable and give this app personality |
| Combat shield mechanic (absorbs damage, visible HP bar component) | Adds strategic depth — party members can protect each other, creating multi-turn tactical decisions instead of just trading hits | MEDIUM | Scoped in PROJECT.md. Shields as a secondary health layer (Slay the Spire "Block" model) is the most readable pattern; charge-based rather than infinite |
| Combat stun mechanic (skip-turn debuff) | Adds crowd control decisions — use stun now vs. deal damage? Creates meaningful ability choice | LOW | Key design note: stun must be short-duration (1 turn) to avoid frustration. Add visual animation (convulsing/sparks) for clarity |
| Critical hit system tied to agility stat | Makes agility a genuinely interesting stat choice rather than just speed — crit-fishing build is a recognized player archetype | LOW | 5-15% crit chance range, 1.5x multiplier is standard and well-understood |
| Unique ability animations per move | Differentiates the game visually from generic RPGs; makes abilities feel special rather than reskinned attacks | HIGH | Requires sprite/VFX assets per ability. Phaser tweens (alpha blink, scale punch, screen shake) can simulate impact without custom art. True unique animations require artist work |
| Paper doll character customization with class system | Personal investment in character appearance increases retention — users who customize avatars churn less | MEDIUM | Already exists and is a genuine differentiator vs. Habitica's more limited avatar system |
| Anti-spam protection for task re-submission | Prevents gaming the system by repeating identical photo/description. Maintains authenticity of XP economy | MEDIUM | No analogues found — this is novel design. AI behavioral pattern analysis on repeated submissions is the approach |
| 5 distinct character classes with unique ability rosters | Choice at character creation with meaningful downstream effects (different play styles in combat) | MEDIUM | Already exists; abilities are differentiated but combat feel needs polish to make class choice matter |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Honor-system-only task verification (just tap "done") | Reduces friction; players don't want to photograph every task | Destroys the core value proposition. Every competitor does self-reporting. AI verification is the differentiator — removing it makes this Habitica with worse features | Keep AI verification, lower proof friction instead. Make verification requests shorter and more specific. Accept description-only for low-XP tasks |
| Real-time multiplayer / async party combat with friends | Social features drive retention; players want to show off characters | Requires backend coordination, conflict resolution, matchmaking, and real-time state sync — massive scope increase. Will delay everything else by 3-6 months minimum | Async model only after single-player loop is polished. A friend can be in your "party" without real-time interaction — their character fights as AI |
| Leaderboards / social feeds | Competition is motivating; visibility creates FOMO | Requires accounts to stabilize first, then significant UI work. Early leaderboards with 3-5 users feel empty and undermine motivation | Defer until post-account milestone. Add only after friend group is large enough for meaningful competition |
| Character respec / stat reset | Players make mistakes during leveling and feel locked in | Low priority for a hobby project with friends. Forces meaningful early decisions. Can add later as a gold cost feature | Accept locked builds for v1. Document it as "choose carefully" in onboarding |
| Full unique sprite animations per ability (artist-quality) | Makes abilities feel polished and special | Requires significant art assets per ability, per character class — 20+ animations minimum. Scope explosion | Use Phaser tweens (scale punch, shake, flash, particle burst) to simulate impact. True unique sprites are a v2+ art milestone |
| Weekly quest persistence | Quest system shell exists; players expect it to work | Quest state not saved (confirmed broken in CONCERNS.md). Building it properly requires server-side state, reset timers, and reward tracking — medium complexity | Either remove quest UI entirely or build it properly. Shipping a broken feature is worse than no feature |
| Social login (Google, Discord, OAuth) | Reduces signup friction; users already have these accounts | Not needed for a friend group. Adds OAuth flow complexity, requires app registrations with each provider, and privacy policy requirements. Username/password is sufficient for v1 | Username/password only for v1. Add social login when/if the game opens to public |
| Financial stakes (like Beeminder) | Creates real accountability — money on the line | Introduces payment processing, legal liability, and massive complexity. Photo + AI verification already provides accountability without financial risk | Keep AI verification as the accountability layer |
| Wearable / health data integration | Objective proof of exercise (steps, heart rate) is more reliable than photos | Requires native app, health kit API access, and platform-specific integrations. Not viable for web-first mobile game | Photo proof is sufficient — AI judges authenticity. Wearable integration is a future milestone after native app wrapper |

---

## Feature Dependencies

```
[Firebase Auth accounts]
    └──requires──> [Firestore save data]
                       └──requires──> [Schema design for 3 slots per user]
                                          └──enables──> [Cross-device save sync]

[Combat shield mechanic]
    └──requires──> [Battle system consolidation (single BattleModal)]
                       └──requires──> [Shared battle engine / useBattle hook]

[Combat stun mechanic]
    └──requires──> [Battle system consolidation]

[Critical hit system]
    └──requires──> [Agility stat in combat calculation]
                       └──requires──> [Combat damage formula refactor]

[Unique ability animations]
    └──requires──> [Battle system consolidation]
    └──requires──> [Animation asset inventory (existing sprites)]

[Anti-spam task protection]
    └──requires──> [User accounts (to track submission history per user)]

[Onboarding tutorial]
    └──requires──> [Core game loop is stable (no major combat bugs)]

[Weekly quests (if built)]
    └──requires──> [User accounts]
    └──requires──> [Server-side quest state storage]
```

### Dependency Notes

- **Battle system consolidation must come before any new combat mechanics:** BattleModal and ArenaModal are near-identical duplicates. Every mechanic added to one must be added to the other. This doubles implementation cost and doubles bug surface. The consolidation is load-bearing for the combat milestone — do it first.
- **Accounts must come before anti-spam:** Repeated submission detection requires a persistent user identity to compare against. localStorage-based identity is too easily bypassed.
- **Auth + Firestore are tightly coupled:** Firebase Auth gives you the user ID; Firestore is keyed on that user ID. Do not implement one without the other in the same phase.
- **Critical hits require stat plumbing:** Agility must actually influence crit chance in the damage formula. If agility is currently purely a turn-order or evasion stat, the formula needs updating before crits can be implemented correctly.

---

## MVP Definition

### Launch With (this milestone — accounts + combat depth)

- [ ] Firebase Auth username/password — accounts exist, characters persist across devices
- [ ] Firestore save data (3 slots per user), replacing localStorage
- [ ] Session persistence — auto-login on returning visit
- [ ] Battle system consolidation — single BattleModal component before adding mechanics
- [ ] Combat shield mechanic — visible shield health on HP bars, absorbs damage
- [ ] Combat stun mechanic — 1-turn skip with clear visual indicator (sparks/shake)
- [ ] Critical hit system — agility-based crit chance (5-15%), 1.5x multiplier, visual flash
- [ ] At least 1-2 ability animations using Phaser tweens (scale punch + screen shake) — does not require new art assets
- [ ] Anti-spam: basic repeated submission detection per user account
- [ ] XP verification UX simplification — shorter prompts, less friction

### Add After Validation (v1.x)

- [ ] Onboarding tutorial (1-2 screen walkthrough of core loop) — trigger: first friend outside creator reports confusion
- [ ] Audio settings / mute button — trigger: complaints about autoplaying music
- [ ] Error boundary + network error messages — trigger: first production crash
- [ ] More ability animations using Phaser tweens for remaining ability types
- [ ] New enemy types with distinct sprites — trigger: players report arena feeling repetitive

### Future Consideration (v2+)

- [ ] Async multiplayer party combat — after single-player combat loop is polished and fun
- [ ] Leaderboards — after friend group hits 10+ active users
- [ ] Weekly quest persistence — requires committed design scope, not incremental
- [ ] Social login — if/when game opens to public beyond friend group
- [ ] Native app wrapper (Capacitor/React Native) — after web version is stable for 3+ months

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Firebase Auth + Firestore accounts | HIGH | MEDIUM | P1 |
| Battle system consolidation | MEDIUM | MEDIUM | P1 (unlocks everything else) |
| Combat shield mechanic | HIGH | MEDIUM | P1 |
| Combat stun mechanic | MEDIUM | LOW | P1 |
| Critical hit system | MEDIUM | LOW | P1 |
| Session persistence (auto-login) | HIGH | LOW | P1 |
| Ability animations (tween-based) | HIGH | MEDIUM | P1 |
| XP verification UX simplification | MEDIUM | LOW | P1 |
| Anti-spam submission protection | MEDIUM | MEDIUM | P2 |
| Onboarding tutorial | HIGH | MEDIUM | P2 |
| Audio settings / mute | MEDIUM | LOW | P2 |
| Error boundary + network errors | MEDIUM | LOW | P2 |
| New enemy types | MEDIUM | HIGH | P3 |
| Weekly quests persistence | LOW | HIGH | P3 |
| Leaderboards | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for this milestone
- P2: Should have, add when possible
- P3: Nice to have, future milestone

---

## Competitor Feature Analysis

| Feature | Habitica | Beeminder | Our Approach |
|---------|--------------|--------------|--------------|
| Task verification | Honor system (checkbox only) | Financial commitment contract | AI verification with photo proof — the genuine accountability gap |
| Character classes | Warrior/Rogue/Healer/Mage at level 10 | None | 5 classes from creation, paper doll customization — more personal investment |
| Combat / boss battles | Party quests where real tasks deal boss damage | None | Turn-based combat as a separate game mode — more engaging than damage-to-boss from tasks |
| Account system | Full accounts, social features, parties | Email accounts, payment required | Firebase accounts, username/password, friend parties planned |
| Task tiering | One tier (all tasks equal) | Automatic based on stakes | AI evaluates effort level — tiered rewards drive actual effort |
| Social/party | Guilds, parties, group challenges | Accountability partner referee | Friend parties planned; single-player first |
| Visual style | Simple pixel avatars | Minimal (charts only) | Mana Seed paper doll, nostalgic JRPG aesthetic |
| Anti-cheat | None (honor system) | Financial loss as deterrent | AI verification + photo proof + anti-spam detection |
| Mobile | Yes (native iOS/Android) | Yes (native) | Web-first, mobile-responsive (no app store yet) |

---

## Sources

- [Habitica – Wikipedia](https://en.wikipedia.org/wiki/Habitica) — MEDIUM confidence (verified account and party system features)
- [Habitica Features](https://habitica.com/static/features) — MEDIUM confidence (page loaded but limited content; supplemented by Wikipedia)
- [Trophy.so – 20 Productivity App Gamification Examples](https://trophy.so/blog/productivity-gamification-examples) — LOW confidence (editorial, single source)
- [Yuk Kai Chou – Top 10 Gamified Productivity Apps](https://yukaichou.com/lifestyle-gamification/the-top-ten-gamified-productivity-apps/) — LOW confidence (editorial)
- [RawHabit.ai – Best Habit Tracking Apps Honest Comparison 2025](https://rawhabit.ai/blog/habit-app-comparison-2025) — MEDIUM confidence (direct product comparison with candid anti-cheat analysis)
- [Turn Based Lovers – 10 Games with Amazing Turn-Based Combat](https://turnbasedlovers.com/lists/10-games-featuring-an-amazing-turn-based-combat-systems/) — MEDIUM confidence (domain-specific authority)
- [Board Game Designers Forum – Shield Mechanics for Turn-Based Combat](https://www.bgdf.com/forum/game-creation/mechanics/shield-mechanics-turn-based-combat) — MEDIUM confidence (practitioner discussion, multiple designers)
- [Game Developer – Designing Unique Tactical Combat Mechanics (Summoners Fate)](https://www.gamedeveloper.com/design/designing-unique-tactical-combat-mechanics-for-summoners-fate) — HIGH confidence (official industry publication, designer perspective)
- [Wikipedia – Critical Hit](https://en.wikipedia.org/wiki/Critical_hit) — HIGH confidence (historical/definitional reference)
- [Wizards Respite – Mastering Critical Hit Mechanics](https://wizardsrespite.com/2024/10/27/mastering-critical-hit-mechanics-in-ttrpg-design-how-to-calculate-critical-hit/) — LOW confidence (single source, not official)
- [RPGMaker Forums – Let's Talk About Critical Damage](https://forums.rpgmakerweb.com/threads/lets-talk-about-critical-damage.106874/) — LOW confidence (community forum)
- [EN World – Stun: The Fun-Killer](https://www.enworld.org/threads/stun-the-fun-killer.703292/page-2) — MEDIUM confidence (TTRPG practitioner discussion, relevant design lessons)
- [Firebase Authentication Docs](https://firebase.google.com/docs/auth) — HIGH confidence (official documentation)
- [Firebase Cloud Firestore](https://firebase.google.com/products/firestore) — HIGH confidence (official documentation)
- [Authgear – Login & Signup UX 2025 Guide](https://www.authgear.com/login-signup-ux-guide) — MEDIUM confidence (industry practitioner)
- [MojoAuth – Secure Authentication Best Practices for Games](https://mojoauth.com/blog/secure-authentication-best-practices-games) — MEDIUM confidence (industry specific, multiple sources agree)
- [Phaser Animations Docs](https://docs.phaser.io/phaser/concepts/animations) — HIGH confidence (official documentation)
- [GameDev Academy – Turn-Based RPG in Phaser 3](https://gamedevacademy.org/how-to-create-a-turn-based-rpg-game-in-phaser-3-part-1/) — MEDIUM confidence (tutorial, aligns with official docs)

---

*Feature research for: Productivity RPG (Scrolls of Doom) — Milestone: User Accounts + Combat Depth*
*Researched: 2026-02-21*
