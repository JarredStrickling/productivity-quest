# Architecture

**Analysis Date:** 2026-02-21

## Pattern Overview

**Overall:** React + Phaser 3 Hybrid Architecture

**Key Characteristics:**
- React handles UI overlays, state management, and modal dialogs
- Phaser 3 manages the 2D game world, player movement, NPC interactions, and real-time visuals
- Cross-framework communication via game events (emit/on pattern)
- Paper doll sprite system with layered rendering for character customization
- Single-scene Phaser game with persistent player state stored in localStorage

## Layers

**Presentation (React):**
- Purpose: Render UI overlays, modals, and HUD elements on top of game canvas
- Location: `src/App.jsx`, `src/components/`
- Contains: Modal components, HUD, character panels, battle/arena UI
- Depends on: Game instance events, player stats state
- Used by: Root application, user-facing interactions

**Game World (Phaser MainScene):**
- Purpose: Manage the 2D town environment, player sprite, NPCs, interactions, animations
- Location: `src/scenes/MainScene.js`
- Contains: Sprite creation, collision logic, input handling, animation sync
- Depends on: Phaser physics/graphics, appearance config
- Used by: All game world interactions, visual rendering

**Configuration (Data):**
- Purpose: Define game constants, class stats, abilities, equipment, leveling
- Location: `src/config/`
- Contains: Class definitions, ability systems, sprite appearance mappings, equipment database
- Depends on: Nothing (pure data)
- Used by: React components, MainScene, battle logic

## Data Flow

**Player Creation Flow:**

1. `MainMenu` triggers `handleNewGame()` in `App.jsx`
2. `CharacterCreationModal` opens, collects class/appearance/stats
3. `handleCharacterCreation()` creates initial player state with defaults from `CLASS_DEFAULT_EQUIPMENT` and `getEquippedAbilitiesForLevel()`
4. Player stats saved to localStorage (`saveSlot1`-`saveSlot3`)
5. Phaser receives `update-stats` event via `game.events.emit()`, applies appearance layers
6. `MainScene` displays player with paper doll visuals

**XP / Level Up Flow:**

1. Player taps NPC (Task Master), Phaser emits `open-task-modal`
2. React shows `TaskSubmissionModal`, player enters real-world task + XP value
3. `handleTaskSubmit()` calls `calculateLevelUp()` from levelingSystem config
4. If level up occurs: award stat points, auto-equip new abilities
5. Update React state → triggers save to localStorage
6. Emit `xp-gained` event to Phaser
7. `MainScene` renders XP feedback text + particle effects + optional level-up animation

**State Management:**

- **React State** (`App.jsx`): player stats (level, XP, equipment, abilities, appearance)
- **Phaser Instance Variables** (`MainScene`): player position, animation state, interaction flags
- **localStorage**: 3 save slots with full player data (used on game load)
- **Game Events**: One-way communication from Phaser → React (open modals, update stats)

## Key Abstractions

**Paper Doll Character System:**
- Purpose: Render layered sprites for customizable appearance without multiple texture assets
- Examples: `src/config/appearance.js`, `MainScene.applyAppearanceLayers()`, `MainScene.syncPlayerLayers()`
- Pattern: Base body + outfit + hair + hat layers stacked on top of each other. All sync frame-by-frame with invisible physics sprite driving animation timing.

**Mana Seed Sprite Sheet Configuration:**
- Purpose: Manage sprite sheet paths, texture keys, and frame mappings from Mana Seed Character Base asset pack
- Examples: `MS_PATH`, `MS_ANIMS`, `getSheetsForAppearance()`, `getAppearanceTextureKeys()`
- Pattern: Each appearance combo (skin tone, outfit style/color, hair style/color, hat) has a unique texture key; on-demand loading for mobile memory efficiency.

**Combat Type Mapping:**
- Purpose: Map weapon equipment to combat sprite pages and animation states
- Examples: `COMBAT_PAGE_MAP` in equipment.js (sword → pONE, bow → pBOW, spear → pPOL)
- Pattern: Battle components select correct sprite sheet page based on equipped weapon, then render combat-specific animations.

**Ability System:**
- Purpose: Define class-specific ability trees with unlock levels, mana costs, and effect formulas
- Examples: `src/config/abilities.js`, `getEquippedAbilitiesForLevel()`
- Pattern: Each class has a set of abilities; abilities unlock at specific levels (slot 1 @ level 1, slot 4 @ level 8); player equips abilities to 4 ability slots.

## Entry Points

**Browser Entry:**
- Location: `index.html`
- Triggers: React root render via `src/main.jsx`
- Responsibilities: Mount React app to DOM

**React Root:**
- Location: `src/main.jsx`
- Triggers: Called by index.html
- Responsibilities: Initialize React and render App component

**App Component:**
- Location: `src/App.jsx`
- Triggers: Rendered by main.jsx
- Responsibilities: Manage player state, create Phaser game instance, handle character creation/loading, coordinate all modals and React-Phaser event communication

**Phaser Game:**
- Location: `src/scenes/MainScene.js` (configured in App.jsx)
- Triggers: Created on first App render (via `new Phaser.Game(config)`)
- Responsibilities: Create world, player, NPCs, handle input, sync sprites, emit game events to React

## Error Handling

**Strategy:** Logging + graceful fallbacks (placeholders for missing assets)

**Patterns:**
- Asset load errors logged to console; placeholder graphics generated if sprites fail to load (e.g., taskmaster.png missing → orange circle placeholder)
- `try-catch` around music playback (browser autoplay policy can block)
- Validation checks before applying player stats to Phaser (skip if no `characterClass` set)
- Appearance layer sync safeguards: check layer.active before updating
- localStorage migration for old save formats (backwards compatible)

## Cross-Cutting Concerns

**Logging:** Mostly console.log with emoji prefixes (✅, ⚠️, ❌, 🎵) for quick visual scanning. No centralized logger.

**Validation:**
- Class validation: check `characterClass` exists before rendering
- Stat bounds: unspent stat points tracked, max HP scaling tied to mindPower
- Equipment defaults: CLASS_DEFAULT_EQUIPMENT ensures no null equipment slots after level up

**Authentication:** Not applicable; single-player game with no backend auth. Save data is unencrypted localStorage.

**Mobile Responsiveness:**
- Phaser camera zoom dynamically calculated based on screen width (14 tiles across, 0.53x scale factor)
- Touch input only (drag to move, tap to interact)
- Responsive world bounds (extended to 1536px height for tall phone screens)
- Scale mode set to RESIZE for window resize handling

---

*Architecture analysis: 2026-02-21*
