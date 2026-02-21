# Coding Conventions

**Analysis Date:** 2026-02-21

## Naming Patterns

**Files:**
- React components: PascalCase with `.jsx` extension (e.g., `CharacterCreationModal.jsx`, `SimpleHUD.jsx`, `TaskSubmissionModal.jsx`)
- Config files: camelCase with `.js` extension (e.g., `abilities.js`, `classes.js`, `levelingSystem.js`, `appearance.js`, `equipment.js`)
- Phaser scene files: PascalCase with `.js` extension (e.g., `MainScene.js`)
- CSS files: Match component names in lowercase (e.g., `CharacterCreationModal.css`, `SimpleHUD.css`, `BattleModal.css`)
- Root index and app files: Lowercase (e.g., `main.jsx`, `App.jsx`, `config.js`, `server.js`)

**Functions:**
- React component functions: PascalCase (e.g., `CharacterCreationModal`, `SimpleHUD`, `BattleModal`)
- Helper functions: camelCase (e.g., `generateAITeammate`, `calculateDamage`, `getXpForNextLevel`, `calculateLevelUp`)
- Event handlers: camelCase with `handle` prefix (e.g., `handleTaskSubmit`, `handleUsernameNext`, `handleClassSelect`, `handleImageChange`, `handleSubmit`)
- Internal helper functions (not exported): camelCase (e.g., `cycle`, `cycleObj`, `getObjName`)
- Validation functions: camelCase (e.g., `validateUsername`)

**Variables:**
- React state variables: camelCase (e.g., `username`, `selectedClass`, `playerStats`, `description`, `image`)
- Boolean/UI state: is/show prefix with camelCase (e.g., `isModalOpen`, `showCharacterCreation`, `isSubmitting`, `isDragging`, `canInteract`)
- Refs: camelCase with `Ref` suffix (e.g., `gameRef`, `gameInstanceRef`, `handleTaskSubmitRef`)
- Loop/iterator variables: Single letter or descriptive (e.g., `i`, `idx`, `index`)
- Constants: UPPER_SNAKE_CASE (e.g., `XP_TABLE`, `WORLD_WIDTH`, `MS_FRAME`, `MS_ANIMS`, `DEMO_MODE`, `BOSS`)
- Object properties: camelCase (e.g., `characterClass`, `maxHp`, `mindPower`, `equippedAbilities`, `xpToNextLevel`)

**Types/Classes:**
- Config objects: UPPER_SNAKE_CASE with camelCase inner keys (e.g., `CLASS_CONFIG`, `ABILITIES`, `CLASS_DEFAULT_EQUIPMENT`)
- Animation configuration: UPPER_SNAKE_CASE (e.g., `MS_ANIMS`, `FLOW_STATE`)
- Enum-like constants: UPPER_SNAKE_CASE (e.g., `ABILITY_UNLOCK_LEVELS`, `ABILITY_TYPES`, `TARGET_TYPES`, `XP_TIERS`)

## Code Style

**Formatting:**
- ESLint configuration: `eslint.config.js` using flat config format (ESLint 9.x)
- No Prettier configuration file detected - formatting controlled by ESLint rules only
- 2-space indentation throughout (observed in all files)
- Semicolons used at end of statements
- Single quotes for strings in import/require statements, double quotes in JSX attributes and some literals
- No line length limit enforced

**Linting Rules:**
- Extends: `@eslint/js` recommended, `eslint-plugin-react-hooks` recommended, `eslint-plugin-react-refresh` vite config
- Rule `no-unused-vars`: Error level with varsIgnorePattern `^[A-Z_]` (allows uppercase constants and underscore prefixes)
- Language: ecmaVersion 2020, JSX enabled, browser globals enabled
- No TypeScript - pure JavaScript/JSX codebase

**Key Configuration (from `eslint.config.js`):**
```javascript
rules: {
  'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
},
languageOptions: {
  ecmaVersion: 2020,
  globals: globals.browser,
  parserOptions: {
    ecmaVersion: 'latest',
    ecmaFeatures: { jsx: true },
    sourceType: 'module',
  },
}
```

## Import Organization

**Order (observed pattern):**
1. React imports and hooks (`import { useState, useEffect, useRef } from 'react'`)
2. External packages (e.g., `import Phaser from 'phaser'`)
3. Local component imports (relative paths, `.jsx` files)
4. Local config/utility imports (relative paths, `.js` files)
5. Stylesheet imports (last, `.css` files)

**Path Style:**
- Relative paths only: `./`, `../`
- No path aliases or `@` imports
- Explicit directory references (e.g., `'./components/ComponentName'`, `'../config/abilities'`)

**Example from `App.jsx` (lines 1-17):**
```javascript
import { useEffect, useRef, useState } from 'react'
import Phaser from 'phaser'
import MainScene from './scenes/MainScene'
import TaskSubmissionModal from './components/TaskSubmissionModal'
import CharacterCreationModal from './components/CharacterCreationModal'
import CharacterPanel from './components/CharacterPanel'
import BattleModal from './components/BattleModal'
import TitleScreen from './components/TitleScreen'
import SimpleHUD from './components/SimpleHUD'
import MainMenu from './components/MainMenu'
import WeeklyQuestsModal from './components/WeeklyQuestsModal'
import ArenaModal from './components/ArenaModal'
import DungeonConfirm from './components/DungeonConfirm'
import { getXpForNextLevel, calculateLevelUp } from './config/levelingSystem'
import { CLASS_DEFAULT_EQUIPMENT } from './config/equipment'
import { getEquippedAbilitiesForLevel } from './config/abilities'
import './App.css'
```

## Error Handling

**Pattern 1: Try-Catch with Alert Fallback**

Used in async operations (`TaskSubmissionModal.jsx`, `App.jsx`):
```javascript
try {
  const response = await fetch(`${API_URL}/api/generate-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description })
  });

  if (!response.ok) throw new Error('Failed to generate verification');

  const data = await response.json();
  // Handle success...
} catch (error) {
  console.error('Error generating verification:', error);
  alert('Error generating verification: ' + error.message);
} finally {
  setIsSubmitting(false);
}
```

**Key Points:**
- Always check `response.ok` before using response data
- Throw custom Error objects with descriptive messages
- Log errors to console with `console.error()` and context prefix
- Use `alert()` for user-facing error messages
- Use `finally` block to clean up loading states

**Pattern 2: Validation with Early Return**

Used in form validation (`CharacterCreationModal.jsx`):
```javascript
const validateUsername = (value) => {
  if (value.length < 3) return 'Username must be at least 3 characters';
  if (value.length > 16) return 'Username must be 16 characters or less';
  if (!/^[a-zA-Z0-9 ]+$/.test(value)) return 'Letters, numbers, and spaces only';
  return '';
};

const handleUsernameNext = () => {
  const error = validateUsername(username);
  if (error) { setUsernameError(error); return; }
  setUsernameError('');
  setStage('class');
};
```

**Key Points:**
- Validation functions return empty string on success, error message on failure
- Handlers check for error message and return early if present
- Error state separately managed in component state

**Pattern 3: Guard Clauses for Conditional Rendering**

Used throughout components:
```javascript
if (!isOpen) return null;
if (!playerStats.username) return null;
if (!classData) return null;
```

**Pattern 4: Data Migration with Error Recovery**

Used in `App.jsx` (lines 314-329):
```javascript
try {
  const parsed = JSON.parse(oldSaveData)
  if (parsed.username && parsed.characterClass) {
    localStorage.setItem('saveSlot1', oldSaveData)
    localStorage.removeItem('playerStats')
  }
} catch (error) {
  console.error('Failed to migrate old save data:', error)
  localStorage.removeItem('playerStats')
}
```

**Key Points:**
- Parse potentially invalid data in try block
- Validate parsed data before using it
- Clean up on error (remove invalid data)

## Logging

**Framework:** Native `console` object (no structured logging)

**Patterns:**

**Informational Logs (console.log):**
```javascript
console.log('✅ Town theme music loaded successfully');
console.log('Asset loaded:', fileName);
```

**Error Logs (console.error):**
```javascript
console.error('ASSET FAILED TO LOAD:', file.key, file.src);
console.error('Error generating verification:', error);
console.error('Failed to migrate old save data:', error);
```

**When to Log:**
- Asset/resource loading status (especially in Phaser scenes)
- Errors during initialization, async operations, or data migration
- NOT used for state changes, component renders, or normal flow

**Emoji Usage:**
- ✅ for successful operations
- 🎵 for audio/music events
- ❌ for errors (implied in error logs)

## Comments

**When to Comment:**
- Complex algorithms or calculations (e.g., damage formulas in `BattleModal.jsx`)
- Non-obvious design decisions (e.g., sprite sheet frame layout in `MainScene.js`)
- Configuration explanations in data files (e.g., XP_TABLE comments: `// Level 1 → 2`)
- Sprite coordinate systems and animation layouts
- State shape explanations (e.g., `// Combat — ability IDs equipped per slot`)
- Sections that need orientation (e.g., `// ── Mana Seed Paper Doll Configuration ──`)

**Comment Style (from `MainScene.js`):**
```javascript
// ── Mana Seed Paper Doll Configuration ──────────────────────────────
const MS_FRAME = { frameWidth: 64, frameHeight: 64 };

// Only preload sheets for class default appearances (~12 sheets)
// Custom player sheets are loaded on-demand to save mobile GPU memory
const MS_SHEETS = getDefaultSpriteSheets();

// Page 1 frame layout (512x512 sheet, 64x64 cells, 8 cols × 8 rows)
// Rows 0-3: stand/push/pull/jump (directions: down, up, left, right)
// Rows 4-7: walk 6-frame + run 2-frame (directions: down, up, left, right)
// Mana Seed direction order: Down, Up, RIGHT, LEFT (rows 2/6 = right, rows 3/7 = left)
const MS_ANIMS = { ... };
// ─────────────────────────────────────────────────────────────────────
```

**No JSDoc/TSDoc:** Function documentation is minimal. Comments explain WHY not WHAT. No formal JSDoc annotations used (except in `levelingSystem.js` which has documentation blocks).

**Exception: JSDoc in Utility Modules**

Used in `src/config/levelingSystem.js` (lines 55-59):
```javascript
/**
 * Get XP required to reach the next level from current level
 * @param {number} currentLevel - The player's current level
 * @returns {number} XP needed to reach next level
 */
export function getXpForNextLevel(currentLevel) { ... }
```

**No TODO/FIXME Comments:** Search of entire `src/` directory found no unresolved TODO, FIXME, HACK, or XXX comments.

## Function Design

**Size:**
- Small helper functions: 5-20 lines (e.g., `cycle()`, `cycleObj()`, `validateUsername()`)
- Medium handler functions: 20-50 lines (e.g., `handleTaskSubmit()`, `handleCharacterCreation()`)
- Larger functions: 50-200 lines (e.g., Phaser scene lifecycle methods `create()`, `update()`)
- Component functions: 50-465 lines (e.g., App.jsx is largest at 465 lines, ArenaModal.jsx is 1183 lines but includes JSX)

**Parameters:**
- React components: Destructured props at function signature
  ```javascript
  export default function CharacterCreationModal({ isOpen, onComplete }) { ... }
  ```
- Event handlers: Can use arrow functions with implicit parameters or explicit destructuring
  ```javascript
  const handleImageChange = (e) => { const file = e.target.files[0]; ... }
  const handleClassSelect = (classKey) => { setSelectedClass(classKey); }
  ```
- Config functions: Single or few required parameters
  ```javascript
  export function getXpForNextLevel(currentLevel) { ... }
  export function calculateLevelUp(currentLevel, currentXp, xpGained) { ... }
  ```

**Return Values:**
- React components: JSX elements or null for conditional rendering
- Config/utility functions: Objects for multiple values (e.g., `{ newLevel, remainingXp, xpToNextLevel }`)
- Validation functions: String (empty on success, error message on failure)
- Event handlers: void (no return value)
- Pure functions: Explicit return statements (no implicit undefined)

## Module Design

**Exports:**
- React components: `export default function ComponentName({ props }) { ... }`
- Utility functions: `export function functionName() { ... }`
- Constants: `export const CONSTANT_NAME = { ... }`
- Mixed exports allowed (constants and functions in same file, default component export)

**Example from `abilities.js`:**
```javascript
export const ABILITY_UNLOCK_LEVELS = { ... };
export const ABILITY_TYPES = { ... };
export const TARGET_TYPES = { ... };
export const FLOW_STATE = { ... };
export const ABILITIES = { ... };
export function getClassAbilities(characterClass) { ... }
export function getUnlockedAbilities(characterClass, level) { ... }
```

**Barrel Files (Index Exports):**
- NOT used in this project
- All imports target specific files (e.g., `import { CLASS_CONFIG } from '../config/classes'` not `from '../config'`)

**File Structure (One Primary Concern Per File):**
- Component files export one component and its co-located styles
- Config files export related constants and functions (e.g., all abilities in one file)
- No re-exports or aggregation files

## Object Patterns

**State Immutability:**
```javascript
// Spread operator for shallow copy
const newStats = { ...playerStats, level: newLevel, xp: remainingXp }

// Nested object updates
const newStats = {
  ...playerStats,
  stats: { ...playerStats.stats, hp: value },
  equipment: { ...playerStats.equipment, weapon: newWeapon }
}
```

**Config Objects (Large Lookup Tables):**
```javascript
// Nested by category
export const ABILITIES = {
  paladin: {
    stomp: { id: 'stomp', name: 'Stomp', ... },
    roar: { id: 'roar', name: 'Roar', ... },
  },
  warrior: { ... },
}

// Access: ABILITIES.paladin.stomp
```

**Inline Comments in Config:**
```javascript
const CLASS_CONFIG = {
  paladin: {
    // 20 points total: 1 point = 50 HP or 1 stat point
    baseStats: {
      hp: 350,       // 7 pts
      strength: 8,   // 8 pts
      agility: 3,    // 3 pts
      mindPower: 2   // 2 pts  = 20
    }
  }
}
```

## Async & Side Effects

**React Hooks Usage:**
- `useState()` for all component state
- `useRef()` for persistent references (game instance, callbacks)
- `useEffect()` for setup, cleanup, and side effects

**useRef Pattern (App.jsx):**
```javascript
const gameRef = useRef(null)
const gameInstanceRef = useRef(null)
const handleTaskSubmitRef = useRef(null)

// Keep ref in sync with latest function
useEffect(() => {
  handleTaskSubmitRef.current = handleTaskSubmit
}, [handleTaskSubmit]) // Update when function changes
```

**Fetch Pattern:**
- Direct `fetch()` API (no wrapper)
- FormData for multipart uploads
- Always check `response.ok` before parsing

**Error Boundary Pattern:**
- No formal Error Boundary components in use
- App-level try-catch for critical operations
- Validation errors handled inline with state

---

*Convention analysis: 2026-02-21*
