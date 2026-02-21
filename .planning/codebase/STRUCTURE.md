# Codebase Structure

**Analysis Date:** 2026-02-21

## Directory Layout

```
productivity-game/
├── public/                          # Static assets served by Vite dev server and included in build
│   ├── assets/
│   │   ├── sprites/
│   │   │   ├── map1.png            # Town background map (1024x1536)
│   │   │   ├── taskmaster.png      # NPC sprite (task submission NPC)
│   │   │   ├── taskboard.png       # Quest board sprite
│   │   │   ├── dungeon.png         # Dungeon entrance sprite
│   │   │   ├── ARENA1background.png # Battle arena background
│   │   │   ├── Baddiearena1.png    # Boss enemy sprite
│   │   │   ├── scrolls-of-doom-logo.png # Menu logo
│   │   │   ├── new-game-button.png # UI button sprite
│   │   │   ├── continue-button.png # UI button sprite
│   │   │   └── manaseed/           # Mana Seed paper doll sprite sheets (third-party asset)
│   │   │       ├── Character_Base_2.5c/
│   │   │       │   └── char_a_p1/  # Page 1 (idle/walk/run animations)
│   │   │       │       ├── base body layers (skin tones)
│   │   │       │       ├── 1out/   # Outfit variant layers
│   │   │       │       ├── 2clo/   # Clothing color variants
│   │   │       │       ├── 3fac/   # Face variants
│   │   │       │       ├── 4har/   # Hair style variants
│   │   │       │       ├── 5hat/   # Hat/headgear layers
│   │   │       │       ├── 6tla/   # Tail layer A
│   │   │       │       └── 7tlb/   # Tail layer B
│   │   │       └── Bow_Combat_3.2/ # Combat sprite sheets for bow-wielders
│   │   │           └── (similar layer structure for combat animations)
│   │   └── music/
│   │       └── town-theme.wav      # Background music loop
│   └── index.html                   # Root HTML file
│
├── src/
│   ├── main.jsx                     # React entry point (mounts React app to DOM)
│   ├── App.jsx                      # Root React component (state orchestrator, Phaser game manager)
│   ├── App.css                      # Root component styles
│   ├── index.css                    # Global styles
│   ├── config.js                    # API configuration (development vs production)
│   │
│   ├── scenes/
│   │   └── MainScene.js             # Phaser scene (game world, player, NPCs, input, animations)
│   │
│   ├── components/                  # React modal and UI components
│   │   ├── TitleScreen.jsx          # Opening intro sequence
│   │   ├── MainMenu.jsx             # Main menu (New Game / Continue buttons)
│   │   ├── SaveSlotSelection.jsx    # Save slot selection UI (helper to MainMenu)
│   │   ├── CharacterCreationModal.jsx # Class selection, appearance customization, stat allocation
│   │   ├── CharacterPanel.jsx       # Character sheet overlay (stats, equipment, abilities)
│   │   ├── CharacterHUD.jsx         # Legacy HUD component (not used)
│   │   ├── SimpleHUD.jsx            # Top-left HUD (character portrait, XP bar, level)
│   │   ├── PaperDollPreview.jsx     # Paper doll preview during character creation
│   │   ├── TaskSubmissionModal.jsx  # Real-world task entry form with verification request
│   │   ├── BattleModal.jsx          # Battle/dungeon encounter UI (turn-based combat)
│   │   ├── ArenaModal.jsx           # Arena multi-battle mode (long fight sequence)
│   │   ├── DungeonConfirm.jsx       # Confirmation dialog before starting battle
│   │   ├── WeeklyQuestsModal.jsx    # Weekly quests list (not fully implemented)
│   │   └── [Component].css          # Component-specific styles (12 CSS files)
│   │
│   └── config/                      # Game configuration and data constants
│       ├── classes.js               # CHARACTER CLASSES (paladin, warrior, mage, archer, cleric)
│       │                            # Defines: CLASS_CONFIG with base stats, colors, icons
│       ├── abilities.js             # ABILITY DEFINITIONS organized by class
│       │                            # Defines: ABILITIES, ABILITY_UNLOCK_LEVELS, ABILITY_TYPES, TARGET_TYPES, FLOW_STATE
│       ├── equipment.js             # EQUIPMENT DATABASE (weapons, armor, accessories)
│       │                            # Defines: EQUIPMENT, CLASS_DEFAULT_EQUIPMENT, combat page mappings
│       ├── appearance.js            # PAPER DOLL SPRITE CONFIGURATION
│       │                            # Defines: Mana Seed texture keys, sprite sheet paths, appearance functions
│       └── levelingSystem.js        # XP TABLE and LEVEL-UP CALCULATIONS
│                                    # Defines: XP_TABLE (levels 1-50), calculateLevelUp(), getXpForNextLevel()
│
├── .planning/codebase/              # GSD codebase analysis documents (generated)
│   ├── ARCHITECTURE.md              # Architecture patterns and data flows
│   ├── STRUCTURE.md                 # This file
│   ├── CONVENTIONS.md               # Coding style conventions
│   ├── TESTING.md                   # Testing patterns and coverage
│   ├── STACK.md                     # Technology stack overview
│   ├── INTEGRATIONS.md              # External APIs and services
│   └── CONCERNS.md                  # Technical debt and issues
│
├── uploads/                         # Temporary upload directory (created by server.js)
│                                    # Stores uploaded task verification images temporarily
│
├── dist/                            # Build output (generated by `npm run build`)
│                                    # Contains compiled HTML, CSS, JS, and assets for production
│
├── node_modules/                    # NPM dependencies (generated by `npm install`)
│
├── .env                             # Environment variables (secrets, NOT committed)
│                                    # Contains: ANTHROPIC_API_KEY
│
├── .env.example                     # Environment variable template (for reference)
│
├── .gitignore                       # Git exclusion rules
│
├── .git/                            # Git version control (hidden directory)
│
├── package.json                     # NPM dependencies, scripts, project metadata
│
├── package-lock.json                # Locked dependency versions (generated by npm install)
│
├── vite.config.js                   # Vite build tool configuration
│
├── eslint.config.js                 # ESLint linting rules
│
├── index.html                       # Redirect to public/index.html (kept for compatibility)
│
├── server.js                        # Express backend server (AI task evaluation)
│
├── DEPLOYMENT.md                    # Deployment guide (production setup)
│
├── SETUP.md                         # Development setup guide
│
├── README.md                        # Project overview and feature description
│
└── (Asset processing scripts)
    ├── convert_transparency.py      # Python script for sprite transparency conversion
    ├── extract_class_huds.py        # Python script for HUD sprite extraction
    └── extract_scrolls_title.py     # Python script for title screen sprite extraction
```

## Directory Purposes

**public/assets/sprites/:**
- Purpose: All game sprite graphics (background map, NPCs, UI, character sprites)
- Contains: PNG images for visual assets
- Key files:
  - `map1.png`: 1024x1536 town background (viewport size)
  - `manaseed/`: Third-party Mana Seed Character Base asset pack (frame-by-frame sprites for character customization)
  - Combat backgrounds and boss sprites for battle sequences

**public/assets/music/:**
- Purpose: Audio tracks for game ambiance
- Contains: WAV files (uncompressed, small enough to load quickly)
- Key files: `town-theme.wav` (looped in MainScene)

**src/scenes/:**
- Purpose: Phaser scene definitions
- Contains: Only MainScene.js (single-scene architecture)
- Key file: `MainScene.js` (handles all game world logic: rendering, physics, input, NPCs, animations)

**src/components/:**
- Purpose: React modal and UI overlay components
- Contains: 13 JSX files + 12 CSS files (paired styling)
- Key files:
  - `App.jsx`: Root component that manages game state and coordinates all modals
  - `TaskSubmissionModal.jsx`: Primary user interaction point (submit real-world tasks for XP)
  - `CharacterCreationModal.jsx`: New game character setup
  - `CharacterPanel.jsx`: Character sheet (stats, equipment, abilities, stat allocation)
  - `BattleModal.jsx`: Turn-based combat UI
  - `MainMenu.jsx`: Save/load game selection

**src/config/:**
- Purpose: Game configuration data and utility functions
- Contains: Pure data structures and calculation functions
- Key files:
  - `classes.js`: 5 character classes with base stats and visual properties
  - `abilities.js`: Class-specific skill trees with unlocks, costs, and effect formulas
  - `equipment.js`: Weapon/armor database and default loadouts by class
  - `appearance.js`: Paper doll sprite sheet configuration for character customization
  - `levelingSystem.js`: XP progression table (levels 1-50) and level-up calculation

## Key File Locations

**Entry Points:**
- `public/index.html`: HTML document root, loads React app script
- `src/main.jsx`: React app initialization, mounts App component to #root element
- `src/App.jsx`: Root React component, orchestrates game state and Phaser game instance

**Application Root & Config:**
- `vite.config.js`: Vite build configuration (dev server, build output, asset handling)
- `package.json`: NPM dependencies, npm scripts (dev, build, lint, server)
- `src/config.js`: API URL detection (development vs production)
- `.env`: Environment secrets (ANTHROPIC_API_KEY) - not committed to git

**Core Logic & Game Management:**
- `src/App.jsx`: Player state management, Phaser game instantiation, modal coordination, save/load logic
- `src/scenes/MainScene.js`: Phaser scene with game world, player movement, NPC interactions, animations
- `server.js`: Express backend for task evaluation using Claude AI

**Configuration & Game Data:**
- `src/config/classes.js`: CLASS_CONFIG (5 character classes with base stats)
- `src/config/abilities.js`: ABILITIES (class-specific skill definitions and unlock progression)
- `src/config/equipment.js`: EQUIPMENT (weapon/armor database, class defaults)
- `src/config/appearance.js`: APPEARANCE (Mana Seed texture keys and sprite sheet paths)
- `src/config/levelingSystem.js`: XP_TABLE (progression curve 1-50) and calculateLevelUp() function

**UI Components:**
- `src/components/TaskSubmissionModal.jsx`: Task entry form (primary gameplay interaction)
- `src/components/CharacterPanel.jsx`: Character sheet overlay
- `src/components/BattleModal.jsx`: Combat UI (turn-based battles)
- `src/components/CharacterCreationModal.jsx`: Character creation wizard
- `src/components/MainMenu.jsx`: Main menu with save/load

**Styling:**
- `src/App.css`: Root component styles and overall layout
- `src/index.css`: Global styles and CSS variables
- `src/components/*.css`: Component-specific styles (12 files, one per modal)

## Naming Conventions

**Files:**
- React components: `PascalCase.jsx` (e.g., `TaskSubmissionModal.jsx`, `CharacterPanel.jsx`)
- Phaser scenes: `PascalCase.js` (e.g., `MainScene.js`)
- Config files: `camelCase.js` (e.g., `levelingSystem.js`, `appearance.js`)
- Styles: Match component name + `.css` (e.g., `TaskSubmissionModal.css`)
- Assets: descriptive kebab-case for sprites (e.g., `scrolls-of-doom-logo.png`)

**Directories:**
- Feature-based: `components/`, `config/`, `scenes/`
- Asset structure mirrors Mana Seed pack: `public/assets/sprites/manaseed/Character_Base_2.5c/char_a_p1/1out/`
- Utility: `uploads/` for temporary server file storage

**Functions & Variables:**
- camelCase throughout: `calculateLevelUp()`, `playerStats`, `isDragging`, `handleTaskSubmit()`
- Mana Seed texture keys: `ms_` prefix (e.g., `ms_base_v01`, `ms_hair_dap1_v02`)
- Animation keys: descriptive with direction (e.g., `ms_walk_down`, `ms_idle_up`)
- Config constants: UPPER_SNAKE_CASE (e.g., `CLASS_CONFIG`, `ABILITY_TYPES`, `XP_TABLE`)

**CSS Classes:**
- Block Element Modifier (BEM-ish): `component-name__element--modifier` (e.g., `character-panel__stat-row`)
- Phaser elements: Prefixed with `phaser-` or scene name if needed
- Modal overlays: `.modal-overlay` (shared class for all modals)

## Where to Add New Code

**New Feature (Game Mechanic):**
- Primary code: Add feature logic to `src/App.jsx` (state management) or `src/scenes/MainScene.js` (game world)
- Config: Add constants to appropriate file in `src/config/` (e.g., new class → `classes.js`)
- Tests: No test framework configured; add manual testing steps to DEPLOYMENT.md
- Assets: Add sprites to `public/assets/sprites/` and reference in MainScene.preload()

**New Component/Modal:**
- Implementation: Create new file in `src/components/` (e.g., `NewModalName.jsx`)
- Styling: Paired CSS file (e.g., `NewModalName.css`) - component-scoped styles
- Integration:
  1. Import in `src/App.jsx`
  2. Add useState for visibility (e.g., `const [showNewModal, setShowNewModal] = useState(false)`)
  3. Add conditional render in JSX return
  4. Implement handler methods (e.g., `handleOpenNewModal = () => setShowNewModal(true)`)
  5. Wire Phaser event if needed: `game.events.on('event-name', () => setShowNewModal(true))`

**New Ability or Class:**
- Class: Add to `CLASS_CONFIG` in `src/config/classes.js` with base stats and color
- Default appearance: Add entry to `CLASS_DEFAULT_APPEARANCE` in `src/config/appearance.js`
- Default equipment: Add entry to `CLASS_DEFAULT_EQUIPMENT` in `src/config/equipment.js`
- Abilities: Add to `ABILITIES[newClass]` in `src/config/abilities.js` with unlock levels
- Sprites: Add texture keys to `appearance.js` and upload sprite sheets to `public/assets/sprites/manaseed/`

**Utilities / Shared Functions:**
- Location: Add to appropriate `src/config/` file (e.g., damage calculation → `abilities.js`, level calculation → `levelingSystem.js`)
- Export: Named exports for functions (not default export)
- Pattern: Pure functions, no side effects, accept parameters and return values

**New Modal State:**
- Add to App.jsx state: `const [showNewModal, setShowNewModal] = useState(false)`
- Pass visibility and handlers as props to component: `<NewModal isOpen={showNewModal} onClose={() => setShowNewModal(false)} />`
- Don't mix modal visibility - only one combat/interaction modal open at a time (prevent modal stacking)

## Special Directories

**dist/:**
- Purpose: Build output directory (production-ready compiled app)
- Generated: Yes (created by `npm run build`)
- Committed: No (.gitignore excludes)
- Contents: Minified HTML/CSS/JS, optimized assets, ready for deployment

**node_modules/:**
- Purpose: NPM dependencies (installed packages)
- Generated: Yes (created by `npm install`)
- Committed: No (.gitignore excludes)
- Size: ~200+ MB (Phaser, React, Vite, and dev dependencies)

**.git/:**
- Purpose: Git version control repository
- Generated: Yes (initialized by `git init`)
- Committed: Yes (hidden directory, always present in git repos)

**public/assets/sprites/manaseed/:**
- Purpose: Third-party Mana Seed Character Base sprite asset pack (commercial license)
- Generated: No (manually downloaded and extracted)
- Committed: Yes (necessary asset files for builds)
- Structure: Follows Mana Seed folder hierarchy (Character_Base, Bow_Combat, etc.)
- Usage: MainScene.preload() dynamically loads sheets based on appearance config

**.planning/codebase/:**
- Purpose: GSD (GitHub Scout Daemon) analysis documents
- Generated: Yes (created by /gsd:map-codebase command)
- Committed: Yes (referenced by planning and execution commands)
- Contents: Architecture, structure, conventions, testing, stack, integrations, concerns analysis

**uploads/:**
- Purpose: Temporary storage for uploaded task verification images
- Generated: Yes (created by server.js during request handling)
- Committed: No (.gitignore excludes)
- Lifecycle: Images deleted immediately after Claude API evaluation (no persistence)

## Migration Notes

**Old Save Format Handling:**
When loading saves, App.jsx performs automatic migrations (lines 237-259):
- Old equipment shape: `{accessory: ...}` → `{offHand: ...}` (field renamed)
- Missing defaults: `unspentStatPoints = 0`, `equippedAbilities = getEquippedAbilitiesForLevel()`
- All-null equipment: Replaced with `CLASS_DEFAULT_EQUIPMENT[class]`
- This ensures old saves from early development versions load correctly in current build

---

*Structure analysis: 2026-02-21*
