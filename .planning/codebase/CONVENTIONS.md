# Coding Conventions

**Analysis Date:** 2026-02-21

## Naming Patterns

**Files:**
- React components use PascalCase: `CharacterCreationModal.jsx`, `SimpleHUD.jsx`, `TaskSubmissionModal.jsx`
- Config files use camelCase: `abilities.js`, `classes.js`, `levelingSystem.js`, `appearance.js`
- Phaser scene files use PascalCase: `MainScene.js`
- CSS files match component names: `CharacterCreationModal.css`, `SimpleHUD.css`

**Functions:**
- React components are arrow functions (default exports): `export default function ComponentName({ props })`
- Regular functions use camelCase: `calculateLevelUp()`, `getXpForNextLevel()`, `getClassAbilities()`, `handleTaskSubmit()`, `handleCharacterCreation()`
- Helper/utility functions use camelCase: `cycle()`, `cycleObj()`, `getObjName()`
- Event handlers use handle prefix: `handleImageChange()`, `handleUsernameNext()`, `handleClassSelect()`, `handleSubmit()`

**Variables:**
- State variables use camelCase: `isModalOpen`, `playerStats`, `selectedClass`, `username`, `appearance`, `isSubmitting`, `stage`
- Boolean state variables use `is`/`show` prefix: `isModalOpen`, `showCharacterCreation`, `showBattle`, `isDragging`, `musicStarted`, `canInteract`
- Refs use camelCase with `Ref` suffix: `gameRef`, `gameInstanceRef`, `handleTaskSubmitRef`
- Constants use UPPER_CASE: `XP_TABLE`, `WORLD_WIDTH`, `WORLD_HEIGHT`, `MS_PATH`, `MS_FRAME`, `MS_ANIMS`
- Object keys use camelCase: `characterClass`, `maxHp`, `mindPower`, `equippedAbilities`, `xpToNextLevel`

**Types/Classes:**
- Config objects use camelCase keys: `CLASS_CONFIG`, `ABILITIES`, `CLASS_DEFAULT_EQUIPMENT`
- Animation configuration objects use camelCase: `MS_ANIMS`, `FLOW_STATE`

## Code Style

**Formatting:**
- ESLint with `@eslint/js` recommended config (`eslint.config.js`)
- No Prettier config detected, styles enforced via ESLint rules
- 2-space indentation (inferred from files)
- Semicolons optional but present in statements
- Single quotes for strings (observed in imports, config files)
- Double quotes for HTML attributes and some string literals

**Linting:**
- ESLint enabled with browser globals (`globals.browser`)
- Recommended rules: no unused variables (but varsIgnorePattern allows uppercase/underscore)
- React Hooks plugin: `eslint-plugin-react-hooks` with recommended config
- React Refresh plugin: `eslint-plugin-react-refresh` with Vite config
- No TypeScript - pure JavaScript/JSX

**Key Rules:**
- `no-unused-vars`: Error with pattern `^[A-Z_]` (allows uppercase constants to be unused)
- ES2020+ syntax support (ecmaVersion: 2020)
- Module type enabled (sourceType: 'module')
- JSX support enabled (ecmaFeatures.jsx: true)

## Import Organization

**Order:**
1. React core imports: `import { useState, useRef, useEffect } from 'react'`
2. Third-party libraries: `import Phaser from 'phaser'`
3. Local components: `import ComponentName from './components/ComponentName'`
4. Local configs: `import { CONSTANT } from './config/moduleName'`
5. CSS files: `import './App.css'` (always last)

**Path Style:**
- Relative paths: `./components/`, `./scenes/`, `./config/`
- No path aliases or `@` imports
- Explicit directory structure in imports

## Error Handling

**Patterns:**
- Try-catch blocks for async operations (fetch, FileReader)
- Error logging with `console.error()`: `console.error('Error message:', error)`
- User-facing errors via `alert()`: `alert('Error generating verification: ' + error.message)`
- Validation errors as return values: `validateUsername()` returns error string or empty
- Event-based error handling: Phaser asset load errors via `this.load.on('loaderror', ...)`

**Example Patterns:**
```javascript
// Validation with early return
const error = validateUsername(username);
if (error) { setUsernameError(error); return; }

// Try-catch with alert fallback
try {
  const response = await fetch(...);
  if (!response.ok) throw new Error('Failed to...');
} catch (error) {
  console.error('Error:', error);
  alert('Error: ' + error.message);
}

// Null checks before accessing properties
if (!classData) return null;
const info = getEquipmentDisplayInfo(playerStats.equipment?.weapon);
```

## Logging

**Framework:** Native `console` object

**Patterns:**
- Informational logs use `console.log()`: `console.log('✅ Asset loaded')`, `console.log('🎵 Music ready')`
- Error logs use `console.error()`: `console.error('Failed to load:', error)`
- Emoji prefixes for visual distinction in console (✅, 🎵, ❌)
- Logged in lifecycle events: component creation, asset loading, music initialization

**When to Log:**
- Asset/resource loading status (especially in Phaser scenes)
- Errors during initialization or async operations
- Not used for state changes or component renders

## Comments

**When to Comment:**
- Complex game mechanics: `// Page 1: col 7 = knockdown (lying down), hold on that frame`
- Sprite coordinate systems and animation layout: `// Mana Seed direction order: Down, Up, RIGHT, LEFT`
- State shape explanation: `// Combat — ability IDs equipped per slot`
- Algorithm purposes: `// Keep leveling up until we run out of XP or hit max level`
- Section dividers for organization: `// ── ANIMATION HELPERS ────`

**No JSDoc/TSDoc:**
- Function documentation is minimal
- JSDoc not used in codebase
- Comments are inline, explaining WHY not WHAT

## Function Design

**Size:**
- Small to medium functions (50-100 lines typical)
- Config functions are short getters: `getXpForNextLevel()`, `getClassAbilities()`
- Component handlers are medium-sized: `handleTaskSubmit()`, `handleLoadGame()`
- Phaser scene methods can be longer (200+ lines for `create()`, `update()`)

**Parameters:**
- React components use destructured props: `({ isOpen, onClose, playerStats })`
- Handlers use positional or destructured args: `(slotId = null)`, `({ username, characterClass, stats, appearance })`
- Config functions use single required params: `getUnlockedAbilities(characterClass, level)`

**Return Values:**
- Config functions return objects: `{ slot1: 'abilityId', slot2: null, ... }`
- Validation functions return error string or empty: `''` or `'Username must be...'`
- Async handlers use async/await, not promise chains
- Event handlers return nothing (void)

## Module Design

**Exports:**
- React components: `export default function ComponentName({ props })`
- Utilities: `export function functionName() {}`
- Constants: `export const CONSTANT_NAME = {...}`
- No named exports for components, only default

**Barrel Files:**
- No barrel exports (`index.js` files) in use
- Imports always target specific files

## Object Literal & Spread Patterns

**State Updates:**
- Immutable updates using spread: `{ ...playerStats, level: newLevel, xp: remainingXp }`
- Nested object updates: `{ ...playerStats, stats: { ...playerStats.stats, hp: value } }`
- Never mutate state directly, always create new objects

**Config Objects:**
- Large lookup tables: `CLASS_CONFIG`, `ABILITIES`, `EQUIPMENT_DATABASE`
- Nested by category: `ABILITIES.paladin.stomp`, `FLOW_STATE.bonusPerStack`
- Comments inline for clarity: `hp: 350, // 7 pts`

## Async & Side Effects

**React Lifecycle:**
- `useEffect()` for setup/cleanup: game creation, event listeners
- `useState()` for all local state
- `useRef()` for persistent references between renders: `gameInstanceRef`, `gameInstanceRef.current`
- Refs kept in sync manually: `handleTaskSubmitRef.current = handleTaskSubmit`

**Fetch Pattern:**
- `fetch()` API directly (no wrapper)
- FormData for multipart: `new FormData()`, `formData.append()`
- Error handling with `if (!response.ok) throw new Error(...)`

---

*Convention analysis: 2026-02-21*
