# Architecture

**Analysis Date:** 2026-02-21

## Pattern Overview

**Overall:** Hybrid Client-Server RPG with React Frontend + Phaser Game Engine + Express Backend

**Key Characteristics:**
- React 19 manages UI modals, menus, character creation, and game state
- Phaser 3 handles 2D game rendering, player sprite animations, NPC interactions, and collision physics
- Express backend evaluates real-world task submissions using Claude AI API
- Player stats and progression stored in browser localStorage with 3-slot save system
- Event-driven communication between React and Phaser using Phaser's event emitter pattern
- Game loop driven by Phaser physics and animation timers, UI updates driven by React state changes

## Layers

**Presentation Layer (React):**
- Purpose: Render all UI modals, menus, HUD displays, and character interaction panels
- Location: `src/components/` (13 modal components) and `src/App.jsx` (orchestrator)
- Contains: Modal components (TaskSubmissionModal, BattleModal, CharacterCreationModal, ArenaModal, etc.), HUD displays, main menu, save slot selection
- Depends on: Game instance ref, player stats, config data (classes, abilities, equipment)
- Used by: App.jsx coordinates all state and modal visibility
- Examples: `TaskSubmissionModal.jsx` (form for submitting real-world tasks), `CharacterPanel.jsx` (stats/equipment display), `BattleModal.jsx` (combat UI), `MainMenu.jsx` (save/load interface)

**Game Engine Layer (Phaser):**
- Purpose: Render game world, handle sprite animation, player movement, NPC interactions, collision detection, audio playback
- Location: `src/scenes/MainScene.js` (single scene, ~500+ lines)
- Contains: Scene lifecycle (preload/create/update), sprite/animation setup, input handling (drag-to-move), NPC creation and interaction zones, collision barriers, camera zoom logic
- Depends on: Config files for appearance and sprites, asset paths in public/assets/
- Used by: React calls game methods via gameInstanceRef; game emits events to React
- Key responsibilities: Player animation (idle/walk/run in 4 directions), NPC positioning and interaction triggers, camera following player, world bounds and collision detection, music playback

**Configuration Layer:**
- Purpose: Define all game data structures (classes, abilities, equipment, leveling progression, sprite appearance mappings)
- Location: `src/config/` directory (5 files)
- Contains: `classes.js` (CLASS_CONFIG: 5 character classes with base stats), `abilities.js` (ABILITIES: class-specific skill trees with unlock levels), `equipment.js` (item database with stat bonuses), `levelingSystem.js` (XP table for levels 1-50), `appearance.js` (Mana Seed sprite sheet configuration and texture key mappings)
- Depends on: Nothing (pure data constants)
- Used by: All other layers reference for game mechanics
- Examples: CharacterPanel uses CLASS_CONFIG to display stats, BattleModal calculates damage using ABILITIES formulas, MainScene loads textures using appearance.js mappings

**Backend API Layer:**
- Purpose: Evaluate task submissions using Claude AI, generate verification requests, handle state calculations server-side
- Location: `server.js` (Express Node.js server, ~240 lines)
- Contains: Two main POST endpoints plus health check, multer for file uploads, Anthropic SDK for Claude API calls
- Depends on: express, cors, multer, dotenv, Anthropic SDK (v0.72.1)
- Used by: TaskSubmissionModal makes fetch requests from browser
- Key responsibilities: Generate unique verification requests (photo proof requirements), evaluate task authenticity and verification compliance, assign XP tiers (Common/Strong Work/Busting Chops/Legendary), handle image uploads and cleanup
- Environment: Runs on port 3001 (development) or process.PORT (production), ANTHROPIC_API_KEY required for API calls, DEMO_MODE flag allows mock evaluation without API

**Persistence Layer:**
- Purpose: Store player data across sessions and browser reloads
- Location: Browser localStorage API (built-in, client-side only)
- Contains: Three save slots (saveSlot1, saveSlot2, saveSlot3) as JSON strings
- Depends on: Nothing (browser standard)
- Used by: App.jsx loads on mount and saves after every state change
- Structure: Each slot stores complete playerStats object with identity (username, class, appearance), progression (level, XP), stats (hp, mana, strength, etc.), equipment, equipped abilities, unspent stat points
- Limitations: No server-side sync, no cloud backup, local to current browser only

## Data Flow

**Task Submission & XP Award Flow (Primary User Interaction):**

1. Player taps Task Master NPC in Phaser game world
2. MainScene detects interaction and emits 'open-task-modal' event
3. React App receives event and sets isModalOpen = true
4. TaskSubmissionModal renders, player describes real-world accomplishment
5. Player clicks "Get Verification Request" button
6. Modal calls `POST /api/generate-verification` with task description
7. Express server receives request, calls Claude API to generate custom verification request (e.g., "Show me X with thumbs up on top")
8. Claude response returned to modal, player sees verification requirement
9. Player takes photo matching the verification requirement
10. Player submits (photo + task description + verification request)
11. Modal calls `POST /api/evaluate-task` with FormData (multipart image upload)
12. Express server receives request, converts image to base64, calls Claude API with both image and task description
13. Claude evaluates: (1) task authenticity - did they complete the task? (2) verification match - is pose/object correct?
14. Claude responds with tier assignment (COMMON/STRONG_WORK/BUSTING_CHOPS/LEGENDARY)
15. Server parses Claude response, maps to tier data (XP value: 10/25/50/150), returns JSON result
16. Modal receives result, calls handleTaskSubmit callback with {tier, xp, color, explanation, description}
17. App.jsx handleTaskSubmit() function:
    - Calls calculateLevelUp(currentLevel, currentXp, xpGained) from levelingSystem.js
    - Detects level-ups and awards 2 stat points per level gained
    - Calls getEquippedAbilitiesForLevel() to auto-equip newly unlocked abilities
    - Updates playerStats state
    - Saves to localStorage: `localStorage.setItem(`saveSlot${currentSaveSlot}`, JSON.stringify(newStats))`
    - Emits 'xp-gained' event to Phaser with full new stats
18. MainScene receives 'xp-gained' event, updates local player references, triggers visual feedback (could be XP popup text, level-up animation, character portrait update)
19. Cycle complete: new player stats visible in SimpleHUD (level, XP bar) and CharacterPanel

**Game Initialization & Save/Load Flow:**

1. Browser loads index.html → main.jsx mounts React App component
2. App.jsx useEffect runs, creates Phaser game instance with MainScene
3. MainScene.preload() loads all assets (sprites, music, spritesheets)
4. MainScene.create() builds world: town background, player sprite, NPCs, collision barriers
5. App renders TitleScreen (if first load) → MainMenu after title completes
6. MainMenu shows "New Game" and "Continue" buttons
7. User clicks "Continue" → SaveSlotSelection modal renders showing 3 slots
8. User selects slot → if slot has data, handleLoadGame() called:
   - Validates and migrates old save format (e.g., old equipment shape)
   - Backfills missing fields (unspentStatPoints, equippedAbilities) using defaults
   - setPlayerStats(loadedData) triggers React render
   - Emits 'update-stats' event to Phaser MainScene
   - MainScene syncs appearance layers and re-renders player
9. Game shows SimpleHUD and player can interact with NPCs
10. Any change (XP gain, stat allocation) → immediate save: `localStorage.setItem(slotKey, JSON.stringify(newStats))`

**Stat Allocation Flow:**

1. Player opens CharacterPanel (SimpleHUD click or character info button)
2. Panel displays unspentStatPoints (awarded on level-up: 2 points per level)
3. Player clicks "+" to allocate a stat point
4. handleAllocateStat(statKey) called in App.jsx:
   - Decrements unspentStatPoints
   - Increases target stat (hp gives +50 maxHp, mindPower recalculates mana pool)
   - Updates playerStats state with new values
   - Saves to localStorage immediately
5. CharacterPanel re-renders showing updated stat
6. Optional: Emits 'stats-updated' to Phaser (not currently used, could update character visuals)

**Character Creation Flow:**

1. MainMenu → "New Game" clicked
2. handleNewGame() finds first empty save slot (or uses provided slot)
3. CharacterCreationModal renders class selection, base stat allocation, paper doll customization
4. User selects: class (paladin/warrior/mage/archer/cleric), stat distribution, appearance (skin tone, outfit, hair, hat)
5. User submits → handleCharacterCreation() called:
   - Creates newStats object with selected class, appearance, calculated mana from mindPower
   - Fetches CLASS_DEFAULT_EQUIPMENT for selected class
   - Calls getEquippedAbilitiesForLevel(class, 1) to get starting abilities
   - Sets playerStats to newStats
   - Saves to localStorage saveSlot
   - Emits 'update-stats' to Phaser
6. Phaser MainScene receives event, syncs player sprite appearance using appearance layers
7. App closes CharacterCreationModal, game ready to play

## Key Abstractions

**Player Stats Object:**
- Purpose: Single source of truth for all character data passed between React, Phaser, and localStorage
- Full structure (App.jsx lines 34-68):
  ```
  {
    username: string,
    characterClass: 'paladin' | 'warrior' | 'mage' | 'archer' | 'cleric',
    appearance: { /* paper doll choices */ },
    level: number (1-50),
    xp: number,
    xpToNextLevel: number,
    stats: {
      hp: number,
      maxHp: number,
      mana: number,
      maxMana: number,
      strength: number,
      agility: number,
      mindPower: number
    },
    inventory: array,
    equipment: { weapon, offHand, armor },
    equippedAbilities: { slot1, slot2, slot3, slot4 },
    unspentStatPoints: number
  }
  ```
- Pattern: Immutable updates using spread operator throughout App.jsx to prevent React render bugs

**Game Events (Phaser → React Communication):**
- Purpose: Decouple Phaser game world from React UI, avoid circular dependencies
- Emitted from MainScene: 'open-task-modal', 'close-task-modal', 'open-battle', 'open-weekly-quests', 'dungeon-confirm', 'test-xp', 'game-ready', 'xp-gained', 'update-stats'
- Pattern: game.events.emit(eventName, data) in MainScene → game.events.on(eventName, callback) in App.jsx useEffect
- Managed: Lines 102-129 in App.jsx, all listeners established once on first render

**Config-Driven Mechanics:**
- CLASS_CONFIG: 5 classes with color, icon, base stats distributed across HP/strength/agility/mindPower
- ABILITIES: Organized by class → ability ID → full definition including unlock level (1/3/5/8), mana cost, cooldown, effect formula
- EQUIPMENT: Weapon/offHand/armor definitions with stat bonuses, combat sprite page mappings
- XP_TABLE: Levels 1-50 with non-linear progression (10 XP for level 2, up to 155500 for level 50)
- APPEARANCE: Mana Seed sprite sheet mappings with texture keys for each appearance combo

**Mana Seed Paper Doll System:**
- Purpose: Render customizable character appearance using layered sprite sheets without multiplying asset count
- Location: `src/config/appearance.js` (functions: getSheetsForAppearance, getDefaultSpriteSheets, getAppearanceTextureKeys)
- Pattern: Base body layer + outfit layer + hair layer + hat layer, all animated in sync using a single invisible physics sprite as timing source
- Frame structure: All sheets 512x512 PNG with 64x64 pixel frames in 8×8 grid
  - Rows 0-3: idle/push/pull/jump (4 directions)
  - Rows 4-7: walk (6-frame) + run (2-frame) animations (4 directions)
- On-demand loading: Custom appearance sheets load only when needed (mobile GPU memory optimization); defaults preload

**Leveling System:**
- Purpose: Calculate level progression from XP gains, determine stat point awards, unlock abilities
- Location: `src/config/levelingSystem.js`
- Key functions: `getXpForNextLevel(currentLevel)` returns XP needed to level up; `calculateLevelUp(currentLevel, currentXp, xpGained)` returns {newLevel, remainingXp, xpToNextLevel}
- Pattern: XP overflows carry to next level automatically (can level up multiple times from single task); hitting level 50 caps XP to 0

**Ability System:**
- Purpose: Define class-specific combat abilities with unlock progression, mana costs, and effect formulas
- Location: `src/config/abilities.js`
- Structure: ABILITIES[class][abilityId] = full ability definition
- Unlock levels: Slot 1 (basic) @ level 1, Slot 2 (utility) @ level 3, Slot 3 (flex) @ level 5, Slot 4 (ultimate) @ level 8
- Used by: BattleModal and ArenaModal to calculate damage, apply effects, manage cooldowns

## Entry Points

**Browser Entry:**
- Location: `public/index.html`
- Content: Single `<div id="root"></div>` and `<script type="module" src="/src/main.jsx"></script>`
- Triggers: HTTP request to index.html
- Responsibilities: Provide HTML shell for React mounting

**React Root:**
- Location: `src/main.jsx`
- Code: StrictMode wrapper around App component, mounts to DOM
- Triggers: Browser executes module script from index.html
- Responsibilities: Initialize React and mount App to #root element

**App Component (Main Orchestrator):**
- Location: `src/App.jsx`
- Size: ~465 lines, handles all state and event coordination
- Triggers: Mounted by React from main.jsx
- Core Responsibilities:
  1. Manage playerStats state (source of truth for character data)
  2. Initialize Phaser game instance in useEffect (lines 70-139)
  3. Set up Phaser event listeners (lines 102-129) that trigger modal visibility state changes
  4. Implement handleTaskSubmit, handleCharacterCreation, handleLoadGame, handleAllocateStat
  5. Migrate old save data format on first load (lines 314-328)
  6. Render modals and game canvas conditionally based on state
  7. Coordinate between React modals and Phaser game world
- Key methods:
  - `handleTaskSubmit()`: Calls calculateLevelUp, awards stat points, auto-equips abilities, saves to localStorage, emits to Phaser
  - `handleCharacterCreation()`: Creates initial playerStats with class defaults and appearance choices
  - `handleLoadGame()`: Loads save slot, validates/migrates format, emits to Phaser
  - `handleAllocateStat()`: Increments target stat, decrements points, recalculates derived values, saves

**Phaser Game Instance:**
- Location: `src/scenes/MainScene.js` (single scene)
- Creation: `new Phaser.Game(config)` in App.jsx line 99
- Triggers: App.jsx useEffect runs once on first render
- Responsibilities:
  1. `preload()`: Load all sprites, spritesheets, audio (lines 56-89)
  2. `create()`: Build world, create player, NPCs, collision barriers, set up UI (lines 91+)
  3. `update()`: Game loop—handle input, update animations, track interactions, emit events
  4. Event handlers: Listen to 'update-stats' and 'xp-gained' from React
  5. Interaction zones: Detect when player overlaps NPC areas and trigger events
- Canvas location: Mounted to `<div ref={gameRef} className="game-canvas" />` in App.jsx line 389

**Express Backend Server:**
- Location: `server.js` (Node.js, 240 lines)
- Start command: `npm run server` or `node server.js`
- Port: 3000 (default) or process.env.PORT
- Responsibilities:
  1. `POST /api/generate-verification` (lines 62-100): Accept task description, call Claude, return verification request
  2. `POST /api/evaluate-task` (lines 102-233): Accept description + image + verification request, call Claude with vision, return tier + XP
  3. `GET /api/health`: Simple health check endpoint
- Configuration: DEMO_MODE flag (line 11) allows mock evaluation without API calls for testing
- External dependency: ANTHROPIC_API_KEY environment variable (from .env)
- File handling: multer uploads images to `uploads/` directory, cleaned up immediately after processing

**API Configuration:**
- Location: `src/config.js` (minimal, 8 lines)
- Purpose: Detect development vs production environment and set API_URL accordingly
- Behavior: localhost → http://localhost:3001, production → VITE_API_URL env var or fallback to Render deployment

## Error Handling

**Strategy:** Try-catch at component and server endpoint level with user-facing alerts and console logging

**Patterns:**

Frontend Error Handling:
- TaskSubmissionModal: Fetch errors caught (lines 47-49, 75-77), displayed as alert() to user
- App.jsx: localStorage migration wrapped in try-catch (lines 318-327), errors logged and old save removed
- Asset loading: MainScene.load listens to 'loaderror' event (line 58), logs missing asset key and path

Backend Error Handling:
- Missing required fields: Return 400 status with error message
- API failures: Return 500 with error details (error.message)
- File upload errors: multer handles automatically, temp files cleaned with fs.unlinkSync
- Parsing failures: Response parsing with fallback to 'COMMON' tier if Claude response malformed

Edge Cases Handled:
- Leveling cap: calculateLevelUp checks level >= 50, stops leveling and caps XP to 0
- Stat allocation validation: handleAllocateStat checks unspentStatPoints > 0 before allowing
- Class defaults: Equipment defaults always applied, appearance defaults always applied
- Save format migration: Old saves missing unspentStatPoints/equippedAbilities/offHand get backfilled with defaults

## Cross-Cutting Concerns

**Logging:**
- Phaser: Console.log with emoji prefixes (✅, ⚠️, 🎵) for visual scanning (MainScene lines 58-88)
- Server: Console.log on startup and error cases
- No structured logging or log aggregation; all output to browser console or server console

**Validation:**
- Task submission: Description must be non-empty before generating verification (TaskSubmissionModal line 28)
- Character class: CLASS_CONFIG key validated before rendering panels
- Equipment: CLASS_DEFAULT_EQUIPMENT ensures all slots (weapon, offHand, armor) exist
- Level bounds: Leveling caps at level 50, XP resets to 0 at max level
- Stat points: Unspent points checked before allocation (App.jsx line 187)

**Authentication & Authorization:**
- Not applicable: Single-player game with no user accounts
- Save slots are browser-local only, no cloud sync
- API calls to Claude authorized server-side via environment variable ANTHROPIC_API_KEY
- No client-side secrets needed (API key never sent to browser)

**Mobile Responsiveness:**
- Phaser game configured with scale.mode = Phaser.Scale.RESIZE (App.jsx line 92)
- Camera zoom dynamically calculated: tiles_across * tile_size formula (MainScene lines 103-106, 118-126)
- Zoom recalculated on window resize (MainScene lines 116-127)
- World bounds extended to 1536px height for tall phone screens (MainScene line 94)
- Touch input only: drag-to-move implemented via Phaser pointer events
- Viewport meta tags enforce no zoom, full bleed, fit-to-screen (index.html line 6)

**State Immutability:**
- React components never mutate playerStats directly
- All state updates use spread operator: `{...playerStats, level: newLevel}`
- Never modify nested objects in-place; always create new objects
- Pattern enforced throughout App.jsx to prevent React render bugs

---

*Architecture analysis: 2026-02-21*
