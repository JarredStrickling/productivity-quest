# Codebase Concerns

**Analysis Date:** 2026-02-21

## Tech Debt

**Battle System Code Duplication:**
- Issue: Two nearly identical battle modal implementations (`BattleModal.jsx` for boss, `ArenaModal.jsx` for orc enemy) with duplicated damage calculation, ability handling, and AI logic
- Files: `src/components/BattleModal.jsx` (428 lines), `src/components/ArenaModal.jsx` (1184 lines)
- Impact: Bug fixes must be applied to both files, features added twice, maintenance burden increases exponentially
- Fix approach: Extract shared battle logic into `src/hooks/useBattle.ts` or `src/utils/battleEngine.js` with pluggable enemy configs. Create single BattleModal component that accepts enemy type.

**Hardcoded Cache Bust Version:**
- Issue: Static cache bust string `?v=24` used instead of dynamic timestamp or build hash
- Files: `src/scenes/MainScene.js` (line 63)
- Impact: Asset updates require manual code change and redeploy; easy to forget and ship stale assets to users
- Fix approach: Implement dynamic cache busting using build timestamp, git hash, or environment variable (e.g., `import.meta.env.VITE_BUILD_HASH`)

**Placeholder Asset Fallbacks:**
- Issue: Multiple NPC/object sprites (taskmaster, taskboard, dungeon, quest giver, test dummy) create runtime placeholder graphics instead of loading proper assets
- Files: `src/scenes/MainScene.js` (lines 247-280, 379-424, 426-473, 475-511, 513-546)
- Impact: NPCs appear as colored circles/squares instead of intended sprites; impacts visual polish and immersion
- Fix approach: Verify all asset paths in public/assets/sprites/; ensure sprite files exist before release; consider preload check with clear error messaging

**Collision Barriers Disabled:**
- Issue: Collision barriers completely removed with placeholder empty group in `src/scenes/MainScene.js` line 549 with comment "Barriers removed — will revisit with a proper tilemap later"
- Files: `src/scenes/MainScene.js` (lines 548-552)
- Impact: Player can walk through buildings and world objects; breaks game world consistency
- Fix approach: Implement proper tilemap-based collision system; load collision layer from map editor

**Hardcoded Magic Numbers Throughout:**
- Issue: Zoom calculations, tile sizes, party slot positions, animation timings hardcoded throughout without clear constants
- Files:
  - `src/scenes/MainScene.js` (lines 103-113: zoom calculation with magic 0.53 multiplier)
  - `src/components/ArenaModal.jsx` (lines 9-16: party slot positions, lines 24-44: animation frame timings)
  - `src/scenes/MainScene.js` (lines 613, 629, 645, 661: interaction distances 60-70 pixels)
- Impact: Difficult to adjust responsive design or animation timing; requires code changes across multiple files
- Fix approach: Extract to config constants; create `src/config/gameBalance.js` for these values

**Event System Relies on String Keys:**
- Issue: React-Phaser communication uses `game.events.emit/on` with magic string event names ('update-stats', 'xp-gained', 'open-task-modal', etc.)
- Files: `src/App.jsx`, `src/scenes/MainScene.js`
- Impact: Easy to typo event names; no IDE support for refactoring; unclear what events exist
- Fix approach: Create `src/config/eventNames.ts` with exported constants; use TypeScript for type safety

**Loose Type Safety:**
- Issue: No TypeScript used; ability effects, battle states, and equipment are plain objects with no validation
- Files: `src/config/abilities.js`, `src/config/equipment.js`, battle modals
- Impact: Easy to pass wrong shape of data; runtime errors when ability properties are missing; refactoring requires manual grep
- Fix approach: Gradually introduce TypeScript interfaces for key data structures (Ability, BattleCharacter, Equipment) starting with battle system

## Known Bugs

**Mana Initialization Bug (Partially Fixed):**
- Symptoms: Battle components sometimes display 0 mana when they should show full mana
- Files: `src/components/BattleModal.jsx` (line 91-95), `src/components/ArenaModal.jsx` (line 214-217)
- Trigger: Opening battle when playerStats.stats.mana is undefined; fallback logic calculates from mindPower
- Workaround: Defensive null checks added but underlying issue is that App.jsx can set stats with undefined mana
- Proper fix: Ensure mana is always set in `handleCharacterCreation` and `handleLoadGame` in `src/App.jsx` (lines 271-298, 233-269); validate player stats shape at React state initialization

**Paper Doll Direction Confusion:**
- Symptoms: Sprite direction animation references are confusing and error-prone
- Files: `src/scenes/MainScene.js` (lines 12-14 comments, 287-300 animation setup)
- Trigger: Wrong direction row mapping causes walking animation to play incorrect frames
- Workaround: Comment explaining "Down, Up, LEFT, RIGHT" (line 14) conflicts with animation code that uses different order
- Impact: Easy to add new animations with wrong directions; already confused developers once (comments show uncertainty)
- Fix approach: Create `src/config/manaSeedSprites.js` with validated sprite constants including direction enums and frame lookup tables

**Battle State Can Get Stuck in "active" with No Living Characters:**
- Symptoms: Party entirely dead but battleState remains 'active', blocking UI updates
- Files: `src/components/ArenaModal.jsx` (lines 895-908 has setTimeout that may not fire)
- Trigger: Rare edge case when last party member dies during enemy attack sequence; async setState timing issue
- Workaround: Current code checks `anyAlive` but setTimeout can prevent the check from running
- Impact: Game UI becomes unresponsive if this edge case triggers
- Fix approach: Add explicit checks in useEffect that monitors party state independently of complex setTimeout chain

**Save Data Migration Vulnerability:**
- Symptoms: Old save format errors could silently fail and delete playerStats key
- Files: `src/App.jsx` (lines 314-329)
- Trigger: Loading app with old `playerStats` localStorage key and corrupted JSON
- Current state: Has try-catch but silently removes old key even on parse failure
- Improvement: Better error logging and user notification if save migration fails

**Modal Open State Race Condition:**
- Symptoms: Game input processing continues briefly if modal closes during pending operation
- Files: `src/scenes/MainScene.js` (lines 564-567, 684, 694, 734, 784)
- Trigger: User rapidly closes modal while animation frame is queued
- Mitigation: `isModalOpen` flag checked in update loop, but animation state not guaranteed to sync
- Improvement: Add debouncing or queuing for modal state transitions

## Security Considerations

**API Key Exposure Risk (Server-Side):**
- Risk: `server.js` line 24 has fallback to hardcoded placeholder 'your-api-key-here' if env var missing
- Files: `src/server.js` (line 24)
- Current mitigation: `.env` file required at runtime; error will occur if missing
- Recommendations: (1) Add explicit validation at startup to throw error if ANTHROPIC_API_KEY is missing or is the placeholder, (2) Add .env.example with placeholder explaining required vars, (3) Log warning at server startup confirming API key loaded

**Image Upload Directory Not Cleaned:**
- Risk: Multer saves uploaded images to `uploads/` directory; `fs.unlinkSync()` cleans up after processing but crashes will leak files
- Files: `src/server.js` (lines 17, 118, 150)
- Current mitigation: Files are deleted immediately after processing
- Recommendations: (1) Add startup cleanup to remove orphaned uploads, (2) Implement max upload size limit in multer config, (3) Add periodic cleanup job for files older than 1 hour

**CORS Configured But Not Restricted:**
- Risk: `server.js` line 19 uses `cors()` with default options (allow all origins)
- Files: `src/server.js` (line 19)
- Current mitigation: None; any website can make requests to the API
- Recommendations: Configure CORS whitelist with allowed origins: `cors({ origin: ['http://localhost:3000', 'https://productivity-quest.example.com'] })`

**Client Detects Environment by Hostname:**
- Risk: `src/config.js` line 3 checks `window.location.hostname === 'localhost'` to pick API URL; can be spoofed in proxy scenarios
- Files: `src/config.js` (lines 3-7)
- Impact: Low (only affects which server to call), but not robust
- Recommendations: Use build-time environment variable `import.meta.env.VITE_API_URL` instead of runtime detection

## Performance Bottlenecks

**Paper Doll Sprite Sheet Reloading:**
- Problem: Each time player changes appearance/equipment, new sprite sheets are dynamically loaded and cached by Phaser
- Files: `src/scenes/MainScene.js` (lines 176-197)
- Cause: Custom appearances may use different sheets than class defaults; sheets aren't pre-loaded
- Impact: Character class changes cause 500ms-1s freeze while loading new textures on mobile
- Improvement path: (1) Pre-load all possible custom appearance combinations at game start, (2) Limit customization to pre-designed combinations, (3) Use texture atlas instead of individual sheets

**Battle Log Array Slice on Every Message:**
- Problem: `setBattleLog(prev => [message, ...prev].slice(0, 5))` creates new array every action
- Files: `src/components/BattleModal.jsx` (line 241), `src/components/ArenaModal.jsx` (line 915)
- Cause: Keeping last 5 messages for display; unnecessary in typical gameplay
- Impact: Negligible (small array), but creates render churn during long battles
- Improvement path: Use useCallback to memoize log updates; consider virtual scroll for 100+ message log

**Async Modal State Transitions:**
- Problem: Complex setTimeout chains (2000ms pause → animation → 500ms delay → next turn) create jank on slower devices
- Files: `src/components/ArenaModal.jsx` (multiple sequences like lines 420-456)
- Cause: Layered timeouts for visual feedback
- Impact: Battle animations skip frames on mobile; unresponsive controls during animations
- Improvement path: (1) Use Framer Motion or React Spring for frame-based animation, (2) Consolidate setTimeout chains into cancellable animation system, (3) Use requestAnimationFrame for smoother timing

**Particle Effect Memory Leak:**
- Problem: Particle emitter created and destroyed for each XP gain without guaranteed cleanup
- Files: `src/scenes/MainScene.js` (lines 859-872)
- Cause: Delayed destroy call (1000ms) may overlap across multiple rapid XP gains
- Improvement: Pool particle emitters or use destroy queue with deduplication

**localStorage Writes on Every Stat Change:**
- Problem: `handleAllocateStat` immediately calls `localStorage.setItem()` for every stat point spent
- Files: `src/App.jsx` (line 211)
- Cause: No batching of writes; stat allocation is rare but shows pattern
- Impact: Minimal (localStorage is fast) but shows poor practice
- Improvement path: Batch writes to localStorage; use debounce for frequent changes like inventory updates (if added)

## Fragile Areas

**Battle AI Decision Logic in ArenaModal:**
- Files: `src/components/ArenaModal.jsx` (lines 737-779, 620-662)
- Why fragile: Weighted ability selection uses magic numbers (weight = 10 base, +6 per target, ±30% randomness). Adding new abilities or changing targeting breaks the weight assumptions. Support ability logic is hardcoded for specific ability types without extensibility.
- Safe modification: (1) Extract weights to config constants, (2) Add ability tags like `isHealer: true, isSupport: true` to ability definitions, (3) Move AI decision tree to separate module with clear rules
- Test coverage: No unit tests for AI logic; no way to verify ability selection weights are correct

**Player Stats Initialization in App.jsx:**
- Files: `src/App.jsx` (lines 34-68, 271-311)
- Why fragile: Complex state shape with nested objects (stats, equipment, equippedAbilities); migrations happen in `handleLoadGame` (lines 233-269) but if schema changes again, old saves break silently
- Safe modification: (1) Create PlayerStats interface/type, (2) Add version field to saves, (3) Create explicit migration functions for each version, (4) Validate loaded data before setting state
- Test coverage: No tests for save migration; manual testing only

**MainScene Paper Doll Layer Sync:**
- Files: `src/scenes/MainScene.js` (lines 356-369, 605)
- Why fragile: `syncPlayerLayers()` called every frame in `update()` copies position + frame from base sprite to outfit/hair/hat. If layer order changes or visibility logic breaks, costumes won't render correctly. No validation that layers exist before copying.
- Safe modification: (1) Add existence checks before copying frame, (2) Create LayerSyncState interface, (3) Move sync logic to separate class, (4) Add debug visualization mode
- Test coverage: No tests; visual testing only

**Sprite Frame Lookup in ArenaModal SpriteFrame Component:**
- Files: `src/components/ArenaModal.jsx` (lines 20-104)
- Why fragile: `getAnimConfig()` returns hardcoded frame/timing arrays; one typo breaks animations. `combatPage` is computed by string concatenation (`idlePage.slice(0, -1) + animConfig.page`). If page naming changes, silently loads wrong sprites.
- Safe modification: (1) Create explicit page mapping instead of string manipulation, (2) Add validation that computed page exists, (3) Return structured animation config with validation
- Test coverage: No tests; animations validated only by visual inspection

## Scaling Limits

**localStorage Cap (5-10MB):**
- Current capacity: 3 save slots × ~2KB per save = 6KB used
- Limit: Browser localStorage typically 5-10MB before errors
- Scaling path: (1) For hundreds of save slots, migrate to IndexedDB, (2) Add save compression if JSON grows large, (3) Implement server-side save backup

**Battle Scene Texture Memory:**
- Current capacity: ~30 Mana Seed sprite sheets pre-loaded (512x512 PNG each ≈ 100KB uncompressed, ~10KB compressed)
- Limit: Mobile browsers may cache-limit at 50-100MB; each custom appearance loads new sheets dynamically
- Scaling path: (1) Merge common sheets into single atlas, (2) Implement texture streaming/unloading, (3) Use WebP format if supported

**Battle Turn Queue Linear Growth:**
- Current capacity: 4 party members + 1 boss = 5 entities; O(n) turn management per action
- Limit: 20+ entities would cause noticeable UI lag from constant party filtering/iteration
- Scaling path: (1) Use Set or Map for turn management, (2) Implement entity component system (ECS) for large battles, (3) Batch state updates

**Max Level Cap:**
- Current capacity: Level 50 hardcoded as max
- Files: `src/config/levelingSystem.js` (lines 62, 82, 90)
- Limit: Changing max level requires updates in 3 places (XP_TABLE, level cap checks, ability unlock logic)
- Scaling path: Extract max level to constant; add ability unlock entries for higher levels in `src/config/abilities.js`

## Dependencies at Risk

**Phaser 3 Browser Compatibility:**
- Risk: Phaser 3 requires ES6+ and WebGL; no fallback for older browsers or devices without WebGL
- Current version: 3.90.0
- Impact: Game won't load on IE11 or very old mobile devices
- Migration plan: Document minimum browser requirement (ES6 support); no immediate migration needed unless targeting legacy users

**Multer Disk I/O:**
- Risk: `multer` with `dest: 'uploads/'` option writes all uploaded images to disk before reading. On serverless/ephemeral containers, uploads/ is lost on shutdown
- Current version: 2.0.2
- Impact: Works fine on persistent servers; breaks on Vercel/serverless platforms
- Migration plan: Switch to `memoryStorage()` for temp storage: `const upload = multer({ storage: multer.memoryStorage() })` (no file system dependency)

**Anthropic SDK Version Pinned but Old:**
- Risk: @anthropic-ai/sdk 0.72.1 is from early 2024; newer versions have breaking changes in message format
- Current version: ^0.72.1
- Impact: Upgrade requires testing API response parsing logic
- Migration plan: Test upgrade to latest SDK; response format likely stable but verify `message.content[0].text` still works

## Missing Critical Features

**No Error Boundary:**
- Problem: Any React component crash crashes entire game (no graceful error UI)
- Blocks: Deploying to production reliably
- Why it matters: User loses save state if app crashes mid-battle

**No Input Validation:**
- Problem: `TaskSubmissionModal` doesn't validate task descriptions; server receives any text
- Blocks: Can't prevent spam/abuse
- Why it matters: Claude API costs money per token; bad inputs waste budget

**No Network Error Handling:**
- Problem: If API_URL fails or network is down, fetch calls reject with generic error message
- Blocks: Game tells users "Error submitting task: [object Object]" on network failure
- Why it matters: Players blame game for flaky networks instead of understanding issue

**No Fallback When Server Offline:**
- Problem: Task evaluation depends on server; if server is down, players can't progress
- Blocks: Offline play or graceful degradation
- Why it matters: Mobile users may hit network interruptions

**No Tutorial or Onboarding:**
- Problem: Game UI jumps into main menu with no guidance on how to play
- Blocks: New users understand the game loop
- Why it matters: TitleScreen exists but MainMenu doesn't explain "drag to move, tap NPC to submit tasks"

**No Audio Settings/Mute Option:**
- Problem: Background music plays automatically; no volume control or mute button
- Files: `src/scenes/MainScene.js` (music initialization)
- Blocks: Mobile users cannot silence game without browser volume; no accessibility option
- Why it matters: Accessibility and user control
- Recommendation: Add settings menu with volume slider; persist to localStorage

**No Character Respec/Reset:**
- Problem: Once stat points allocated, cannot change build; locks player into suboptimal decisions
- Files: `src/components/CharacterPanel.jsx`
- Blocks: Players who make wrong stat choices must restart
- Why it matters: User retention and forgiveness
- Recommendation: Add respec feature (cost gold or one-time free) or separate skill loadout system

**No Persistence of Weekly Quests Progress:**
- Problem: Weekly quests modal exists but quest completion state not saved
- Files: `src/components/WeeklyQuestsModal.jsx`
- Blocks: Weekly quest system non-functional
- Why it matters: Missing gameplay loop
- Recommendation: Implement quest state tracking in playerStats; add completion checks and reward tracking

## Test Coverage Gaps

**No Unit Tests for Game Logic:**
- What's not tested: `calculateDamage()` formula parsing, `getEquippedAbilitiesForLevel()` unlocking, `handleLevelUp()` stat calculations, `calculateLevelUp()` XP math
- Files: `src/config/abilities.js`, `src/config/levelingSystem.js`, `src/App.jsx`
- Risk: Broken math silently breaks progression; discovered only when players hit odd edge cases
- Priority: HIGH - math is easy to test and catches bugs early

**No E2E Tests for Battle Flow:**
- What's not tested: Ability selection → damage dealt → enemy dies → victory screen; AI opponent behavior
- Files: `src/components/BattleModal.jsx`, `src/components/ArenaModal.jsx`
- Risk: Battle system changes may break turn sequence or state transitions
- Priority: MEDIUM - complex state machine hard to debug

**No Integration Tests for Save/Load:**
- What's not tested: Character created → saved to localStorage → loaded → stats match original
- Files: `src/App.jsx` save system, migrations
- Risk: Save corruption silently breaks character progression
- Priority: HIGH - data loss is unacceptable

**No Visual Regression Tests:**
- What's not tested: Sprite rendering, paper doll layers, animation frames
- Files: `src/scenes/MainScene.js`, `src/components/ArenaModal.jsx` SpriteFrame
- Risk: Sprite direction changes go unnoticed until players report visual bugs
- Priority: MEDIUM - requires screenshot comparison tools

**No Tests for API Communication:**
- What's not tested: Network failures, timeout handling, malformed responses, rate limiting
- Files: `server.js`, `src/components/TaskSubmissionModal.jsx`
- Risk: Failed requests cause unhandled errors; user data loss on network issues
- Priority: HIGH - user-facing feature

**No Phaser Game Tests:**
- What's not tested: Sprite loading, animation states, player movement, NPC interaction zones
- Files: `src/scenes/MainScene.js`
- Risk: Asset loading failures, collision/interaction detection bugs only found in manual testing
- Priority: MEDIUM - core gameplay; difficult to test in jest; consider Phaser test utilities

**No React Component Tests:**
- What's not tested: Modal open/close state, form validation, error handling, loading states
- Files: `src/components/*.jsx`
- Risk: UI breaks silently; users see broken forms or missing feedback
- Priority: MEDIUM - could use React Testing Library or Vitest

---

*Concerns audit: 2026-02-21*
