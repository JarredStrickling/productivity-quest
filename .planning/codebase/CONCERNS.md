# Codebase Concerns

**Analysis Date:** 2026-02-21

## Tech Debt

**Battle System Code Duplication:**
- Issue: Two nearly identical battle modal implementations (`BattleModal.jsx` for boss, `ArenaModal.jsx` for orc enemy) with duplicated damage calculation, ability handling, and AI logic
- Files: `src/components/BattleModal.jsx` (428 lines), `src/components/ArenaModal.jsx` (1184 lines)
- Impact: Bug fixes must be applied to both files, features added twice, maintenance burden increases exponentially
- Fix approach: Extract shared battle logic into `src/hooks/useBattle.ts` or `src/utils/battleEngine.js` with pluggable enemy configs. Create single BattleModal component that accepts enemy type.

**Hardcoded Magic Numbers Throughout:**
- Issue: Zoom levels, animation timings, interaction distances, damage formulas scattered across files without clear constants
- Files: `src/scenes/MainScene.js` (zoom 0.53, tile 14/32), `src/components/ArenaModal.jsx` (animation timings 180, 100, 400ms), `src/config/abilities.js` (damage multipliers as inline numbers)
- Impact: Tuning gameplay balance requires hunting through multiple files; easy to introduce inconsistencies
- Fix approach: Create `src/config/gameBalance.js` with centralized constants for zoom, timings, distances, and damage formulas

**Loose Type Safety:**
- Issue: No TypeScript used; ability effects, battle states, and equipment are plain objects with no validation
- Files: `src/config/abilities.js`, `src/config/equipment.js`, battle modals
- Impact: Easy to pass wrong shape of data; runtime errors when ability properties are missing; refactoring requires manual grep
- Fix approach: Gradually introduce TypeScript interfaces for key data structures (Ability, BattleCharacter, Equipment) starting with battle system

**Event System Relies on String Keys:**
- Issue: React-Phaser communication uses `game.events.emit/on` with magic string event names ('update-stats', 'xp-gained', 'open-task-modal', etc.)
- Files: `src/App.jsx`, `src/scenes/MainScene.js`
- Impact: Easy to typo event names; no IDE support for refactoring; unclear what events exist
- Fix approach: Create `src/config/eventNames.ts` with exported constants; use TypeScript for type safety

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

---

*Concerns audit: 2026-02-21*
