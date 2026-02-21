# Testing Patterns

**Analysis Date:** 2026-02-21

## Test Framework

**Runner:**
- Not detected - No test framework installed
- No Jest, Vitest, or Mocha configuration present
- No test scripts in `package.json`

**Assertion Library:**
- Not applicable (no testing framework)

**Run Commands:**
```bash
# Currently no test commands available
# Manual testing required
```

**Gap:** Testing is not implemented in this codebase. No automated tests, no test runner configuration, no test files.

## Test File Organization

**Location:**
- Not applicable - no test files exist

**Naming:**
- Test files would use `.test.js` or `.spec.js` suffix by convention, but none exist

**Structure:**
- No test directory exists

## What IS Tested (Manual Testing)

The codebase contains inline validation and verification logic that could serve as test vectors:

**Form Validation (`src/components/CharacterCreationModal.jsx`):**
```javascript
const validateUsername = (value) => {
  if (value.length < 3) return 'Username must be at least 3 characters';
  if (value.length > 16) return 'Username must be 16 characters or less';
  if (!/^[a-zA-Z0-9 ]+$/.test(value)) return 'Letters, numbers, and spaces only';
  return '';
};
```

**Testable:** Username validation (regex, length checks, error messages)

**Leveling System (`src/config/levelingSystem.js`):**
```javascript
export function calculateLevelUp(currentLevel, currentXp, xpGained) {
  let level = currentLevel;
  let xp = currentXp + xpGained;
  let xpNeeded = getXpForNextLevel(level);

  while (xp >= xpNeeded && level < 50) {
    xp -= xpNeeded;
    level++;
    xpNeeded = getXpForNextLevel(level);
  }

  return {
    newLevel: level,
    remainingXp: level >= 50 ? 0 : xp,
    xpToNextLevel: xpNeeded
  };
}
```

**Testable:** Level-up calculations, XP rollover, max level capping

**Ability Unlocking (`src/config/abilities.js`):**
```javascript
export function getEquippedAbilitiesForLevel(characterClass, level) {
  const classAbilities = getClassAbilities(characterClass);
  const equipped = { slot1: null, slot2: null, slot3: null, slot4: null };

  for (const ability of Object.values(classAbilities)) {
    if (ability.unlockLevel <= level) {
      const slotKey = `slot${ability.slot}`;
      if (!equipped[slotKey]) {
        equipped[slotKey] = ability.id;
      }
    }
  }

  return equipped;
}
```

**Testable:** Ability unlock progression by level, slot assignment

## Testable Areas (High Priority for Tests)

### Unit Tests Needed

**Form Validation:**
- Files: `src/components/CharacterCreationModal.jsx`
- Scope: `validateUsername()` function
- Test cases:
  - Username too short (< 3 chars) → error message
  - Username too long (> 16 chars) → error message
  - Invalid characters → error message
  - Valid username → no error
  - Whitespace only → validation behavior
  - Boundary cases (exactly 3, exactly 16 chars)

**Leveling System:**
- Files: `src/config/levelingSystem.js`
- Scope: `calculateLevelUp()`, `getXpForNextLevel()`
- Test cases:
  - Single level up (XP just crossing threshold)
  - Multiple level ups in one go (XP >> threshold)
  - Max level behavior (level 50 XP reset)
  - XP table lookups (edge levels: 1, 50, out of range)
  - Remaining XP calculation accuracy
  - Overflow XP carried forward

**Ability System:**
- Files: `src/config/abilities.js`
- Scope: `getEquippedAbilitiesForLevel()`, `getUnlockedAbilities()`
- Test cases:
  - Ability unlock at correct level
  - Multiple abilities per class at different levels
  - Slot assignment (one ability per slot max)
  - Invalid class handling
  - Level boundary testing (level just before/after unlock)

**State Updates:**
- Files: `src/App.jsx`
- Scope: `handleTaskSubmit()`, `handleAllocateStat()`, `handleLoadGame()`
- Test cases:
  - XP gain triggers level up
  - Stat point allocation deducts points
  - Save slot persistence (localStorage interaction)
  - Equipment migration (old save format compatibility)
  - Ability equipping on level up

### Integration Tests Needed

**Character Creation Flow:**
- Files: `src/App.jsx`, `src/components/CharacterCreationModal.jsx`
- Scope: Username validation → class selection → appearance customization → stats initialization
- Test cases:
  - Valid character creation saves to localStorage
  - Invalid username blocks progression
  - Class default stats load correctly
  - Appearance customization persists

**Game State Management:**
- Files: `src/App.jsx`
- Scope: React state ↔ Phaser game communication via events
- Test cases:
  - `game.events.emit('update-stats', playerStats)` triggers correctly
  - `game.events.on('xp-gained')` state updates
  - Game instance creation and cleanup on unmount
  - Multiple saves can coexist (3 slots)

**Task Submission Flow:**
- Files: `src/components/TaskSubmissionModal.jsx`
- Scope: Task description → API verification → image upload → result
- Test cases:
  - API calls succeed/fail gracefully
  - Form validation (description required, image required)
  - FormData construction for multipart uploads
  - Error messages display correctly

## Mocking Approach (If Tests Implemented)

**What to Mock:**
- `fetch()` API calls - Return controlled responses for verification/evaluation
- `localStorage` - Spy on `getItem()`/`setItem()` to verify persistence
- `Phaser.Game` - Constructor and event system (emit/on)
- `FileReader` - Return controlled image data URLs
- `window` location/dimensions for responsive tests

**What NOT to Mock:**
- Core business logic functions (`calculateLevelUp()`, `validateUsername()`)
- Config objects (`CLASS_CONFIG`, `ABILITIES`)
- Pure utility functions (`cycle()`, `getObjName()`)
- React hooks (`useState`, `useRef`, `useEffect`)

## Test Data / Fixtures

**Player Stats Fixture:**
```javascript
const mockPlayerStats = {
  username: 'TestHero',
  characterClass: 'warrior',
  level: 1,
  xp: 0,
  xpToNextLevel: 10,
  stats: {
    hp: 200,
    maxHp: 200,
    mana: 10,
    maxMana: 10,
    strength: 12,
    agility: 3,
    mindPower: 1
  },
  inventory: [],
  equipment: {
    weapon: 'steel_sword',
    offHand: null,
    armor: 'leather_armor'
  },
  equippedAbilities: { slot1: 'doubleSlash', slot2: null, slot3: null, slot4: null },
  unspentStatPoints: 0
};
```

**Class Ability Fixture:**
```javascript
const mockAbility = {
  id: 'doubleSlash',
  name: 'Double Slash',
  description: 'Strike twice with your weapon.',
  type: 'basic',
  slot: 1,
  unlockLevel: 1,
  manaCost: 10,
  cooldown: 0,
  targetType: 'enemy',
  effect: { type: 'damage', formula: 'strength * 4', hits: 2, buildsFlow: true }
};
```

**XP Progression Fixture:**
```javascript
const xpTestCases = [
  { currentLevel: 1, currentXp: 0, xpGained: 10, expected: { newLevel: 2, remainingXp: 0, xpToNextLevel: 20 } },
  { currentLevel: 1, currentXp: 5, xpGained: 10, expected: { newLevel: 2, remainingXp: 5, xpToNextLevel: 20 } },
  { currentLevel: 1, currentXp: 0, xpGained: 50, expected: { newLevel: 3, remainingXp: 20, xpToNextLevel: 30 } },
  { currentLevel: 50, currentXp: 100, xpGained: 1000, expected: { newLevel: 50, remainingXp: 0, xpToNextLevel: 155500 } }
];
```

## Coverage Gaps

**Untested Areas (High Risk):**

**Phaser Game Logic (`src/scenes/MainScene.js`):**
- NPC interaction detection (`canInteract`, `canInteractDungeon`)
- Player sprite animation and layer synchronization (`syncPlayerLayers()`)
- Camera and world bounds
- Touch/drag input state machine
- Asset preloading and error handling
- Music playback lifecycle
- **Risk:** Game physics and visual behavior broken unnoticed
- **Priority:** High - critical to gameplay

**React Component Rendering:**
- Modal visibility toggling
- Conditional rendering based on state
- Event handlers properly called
- CSS class binding
- **Risk:** UI broken but app loads without crashing
- **Priority:** Medium - affects user experience

**Async State Updates:**
- Save/load game from localStorage
- API calls to verification service
- Image processing and preview
- **Risk:** Silent failures, data corruption, user sessions lost
- **Priority:** High - data integrity

**Error Boundaries:**
- No error boundary components exist
- Uncaught errors in components crash entire app
- **Risk:** Single component bug = whole game breaks
- **Priority:** High - stability

**Cross-Browser Compatibility:**
- Mobile responsiveness (game window resizing)
- Touch vs mouse input
- Asset loading on different devices
- **Risk:** Works locally on desktop, fails on mobile
- **Priority:** Medium - mobile is target platform

## Recommended Testing Setup

**Suggested Framework:**
- **Vitest** for fast unit tests + React Testing Library for components
- **Phaser** game tests via game instance mocking
- **Jest** as alternative (slower, but works)

**Configuration Steps:**
1. Install: `npm install --save-dev vitest @testing-library/react @testing-library/jest-dom`
2. Create `vitest.config.js` with React plugin
3. Create `src/**/*.test.jsx` for components, `src/config/**/*.test.js` for functions
4. Add `"test": "vitest"` script to package.json
5. Start with leveling system tests (pure functions, easy to test)

---

*Testing analysis: 2026-02-21*
