# Testing Patterns

**Analysis Date:** 2026-02-21

## Test Framework Status

**Current State:** No testing framework installed or configured

**What's Missing:**
- No test runner (Jest, Vitest, Mocha)
- No test files (`.test.js`, `.spec.js`)
- No test configuration files
- No test scripts in `package.json`
- No assertion libraries (Chai, Jest matchers)
- No React testing utilities

**Impact:** All testing is currently manual/ad-hoc. Automated regression testing impossible.

**Gap Risk Level:** HIGH - Core business logic untested, bugs undetectable until production

## Testable Code in Codebase

While tests don't exist, the codebase contains pure functions and business logic that ARE testable. These should be prioritized for test coverage.

### 1. Leveling System (`src/config/levelingSystem.js`)

**Pure Functions - Easily Testable:**

```javascript
/**
 * Get XP required to reach the next level from current level
 * @param {number} currentLevel - The player's current level
 * @returns {number} XP needed to reach next level
 */
export function getXpForNextLevel(currentLevel) {
  if (currentLevel >= 50) {
    return XP_TABLE[50];
  }
  return XP_TABLE[currentLevel] || 100;
}

/**
 * Calculate level ups from XP gain
 * @param {number} currentLevel - Player's current level
 * @param {number} currentXp - Player's current XP towards next level
 * @param {number} xpGained - Amount of XP just earned
 * @returns {object} { newLevel, remainingXp, xpToNextLevel }
 */
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

**Test Coverage Needed:**
- Single level up (XP just crossing threshold)
- Multiple level ups (XP >> threshold)
- Max level behavior (level 50, XP resets to 0)
- Edge cases (level 1, level 50, out-of-range levels)
- XP table lookups with fallback

### 2. Ability System (`src/config/abilities.js`)

**Pure Function - Testable:**

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

**Test Coverage Needed:**
- Ability unlock at correct level (unlockLevel <= playerLevel)
- Multiple abilities per class at different levels
- Slot assignment (one ability per slot maximum)
- Invalid class handling (graceful fallback)
- Level boundary testing (level just before/after unlock)
- Class-specific ability sets (paladin vs warrior vs mage)

### 3. Form Validation (`src/components/CharacterCreationModal.jsx`)

**Pure Function - Testable:**

```javascript
const validateUsername = (value) => {
  if (value.length < 3) return 'Username must be at least 3 characters';
  if (value.length > 16) return 'Username must be 16 characters or less';
  if (!/^[a-zA-Z0-9 ]+$/.test(value)) return 'Letters, numbers, and spaces only';
  return '';
};
```

**Test Coverage Needed:**
- Too short (< 3 chars) → correct error message
- Too long (> 16 chars) → correct error message
- Invalid characters → correct error message
- Valid usernames → empty string
- Boundary cases (exactly 3 chars, exactly 16 chars)
- Whitespace only → treated as invalid
- Special characters rejected (!, @, #, etc.)

### 4. AI Teammate Generation (`src/components/BattleModal.jsx`)

**Partially Pure Function:**

```javascript
function generateAITeammate(index, playerClass) {
  const classes = ['paladin', 'warrior', 'mage', 'archer', 'cleric'];
  const availableClasses = classes.filter(c => c !== playerClass);
  const randomClass = availableClasses[Math.floor(Math.random() * availableClasses.length)];

  const classData = CLASS_CONFIG[randomClass];
  const maxMana = classData.baseStats.mindPower * 10;

  return {
    id: `ai_${index}`,
    name: `AI ${classData.name}`,
    characterClass: randomClass,
    isAI: true,
    stats: { ... }
  };
}
```

**Testability Note:** Has random element (Math.random) - needs mocking for deterministic tests

**Test Coverage Needed:**
- Generated class differs from player class
- Stats match CLASS_CONFIG for selected class
- Mana calculated as mindPower * 10
- Structure matches expected team member format

### 5. Damage Calculation (`src/components/BattleModal.jsx`)

**Pure Function - Testable:**

```javascript
function calculateDamage(ability, casterStats) {
  const formula = ability.effect.formula;

  let damage = 0;

  if (formula.includes('strength')) {
    const multiplier = parseFloat(formula.match(/strength\s*\*\s*(\d+\.?\d*)/)?.[1] || 1);
    damage += casterStats.strength * multiplier;
  }

  if (formula.includes('agility')) {
    const multiplier = parseFloat(formula.match(/agility\s*\*\s*(\d+\.?\d*)/)?.[1] || 1);
    damage += casterStats.agility * multiplier;
  }

  if (formula.includes('mindPower')) {
    const multiplier = parseFloat(formula.match(/mindPower\s*\*\s*(\d+\.?\d*)/)?.[1] || 1);
    damage += casterStats.mindPower * multiplier;
  }

  if (formula.includes('maxHp')) {
    const multiplier = parseFloat(formula.match(/maxHp\s*\*\s*(\d+\.?\d*)/)?.[1] || 1);
    damage += casterStats.maxHp * multiplier;
  }

  return Math.floor(damage);
}
```

**Test Coverage Needed:**
- Single stat formula (e.g., "strength * 4")
- Multi-stat formula (e.g., "(agility * 3) + strength")
- Floating point multipliers
- Result floored to integer
- Missing stat defaults to multiplier of 1
- Edge case: stat = 0

## High-Priority Testable Areas

### Unit Tests (Pure Functions - Easiest to Test)

**1. Leveling System (CRITICAL)**
- Location: `src/config/levelingSystem.js`
- Functions: `getXpForNextLevel()`, `calculateLevelUp()`
- Why: Core progression mechanic - bugs here break entire game progression
- Estimated test count: 15-20 test cases
- Difficulty: Easy (pure functions, no dependencies)

**2. Ability System (HIGH)**
- Location: `src/config/abilities.js`
- Functions: `getEquippedAbilitiesForLevel()`, `getUnlockedAbilities()`
- Why: Combat mechanics depend on correct ability unlocking
- Estimated test count: 12-15 test cases
- Difficulty: Easy (pure functions, config data only)

**3. Form Validation (MEDIUM)**
- Location: `src/components/CharacterCreationModal.jsx`
- Functions: `validateUsername()`
- Why: User input validation - bad data can corrupt saves
- Estimated test count: 8-10 test cases
- Difficulty: Easy (regex and string operations)

### Integration Tests (More Complex)

**1. Character Creation Flow (HIGH)**
- Scope: `CharacterCreationModal.jsx` + `App.jsx`
- Path: Username validation → Class selection → Appearance → Save to localStorage
- Testable interactions:
  - Invalid username blocks progression
  - Valid username allows class selection
  - Class default stats load correctly
  - Appearance customization saves to state
  - Final character saved to localStorage with correct structure

**2. Level-Up Flow (HIGH)**
- Scope: `App.jsx` + `levelingSystem.js` + `abilities.js`
- Path: XP gain → Level calculation → Stat points awarded → Abilities unlocked
- Testable interactions:
  - `handleTaskSubmit()` calls `calculateLevelUp()`
  - New level updates playerStats
  - Unspent stat points increases (2 per level)
  - New abilities auto-equip on level up
  - Data persists to localStorage

**3. Stat Allocation Flow (MEDIUM)**
- Scope: `App.jsx`
- Path: Unspent stat points → Allocate → Update stats → Save
- Testable interactions:
  - `handleAllocateStat()` only works if points > 0
  - Correct stat updated (HP x50, others x1)
  - Mana recalculated if mindPower changed
  - Unspent points decremented
  - Data persists to localStorage

**4. Task Submission Flow (HIGH)**
- Scope: `TaskSubmissionModal.jsx` + API calls
- Path: Description → Generate verification → Upload image → Receive result → Update game
- Testable interactions:
  - Description validation (required, non-empty)
  - API call to `/api/generate-verification`
  - Image file selection and preview
  - FormData construction for upload
  - API call to `/api/evaluate-task`
  - Result XP awarded to player
  - Error messages display correctly

### E2E Tests (Game Flow)

**Critical Game Paths:**
1. New Game → Create Character → Load Game (Save/Load)
2. Submit Task → Gain XP → Level Up → Allocate Stat
3. Enter Battle → Fight Boss → Victory/Defeat
4. Navigate between modals without crashes

## Test File Organization (Recommended)

**Location:** Co-located with source files

```
src/
├── config/
│   ├── abilities.js
│   ├── abilities.test.js          (new)
│   ├── levelingSystem.js
│   ├── levelingSystem.test.js     (new)
│   └── ...
├── components/
│   ├── CharacterCreationModal.jsx
│   ├── CharacterCreationModal.test.jsx   (new)
│   ├── TaskSubmissionModal.jsx
│   ├── TaskSubmissionModal.test.jsx      (new)
│   └── ...
├── App.jsx
├── App.test.jsx                   (new - integration tests)
└── ...
```

**Naming Convention:**
- `*.test.js` for pure function/utility tests
- `*.test.jsx` for React component tests
- All tests in same directory as source

## Test Structure (Examples)

### Unit Test Example (Jest/Vitest syntax)

```javascript
// src/config/levelingSystem.test.js

import { calculateLevelUp, getXpForNextLevel } from './levelingSystem';

describe('Leveling System', () => {
  describe('getXpForNextLevel', () => {
    it('returns 10 XP for level 1', () => {
      expect(getXpForNextLevel(1)).toBe(10);
    });

    it('returns 20 XP for level 2', () => {
      expect(getXpForNextLevel(2)).toBe(20);
    });

    it('returns max level XP when level >= 50', () => {
      expect(getXpForNextLevel(50)).toBe(155500);
      expect(getXpForNextLevel(100)).toBe(155500);
    });

    it('returns fallback 100 for invalid level', () => {
      expect(getXpForNextLevel(-1)).toBe(100);
      expect(getXpForNextLevel(999)).toBe(100);
    });
  });

  describe('calculateLevelUp', () => {
    it('single level up when XP just crosses threshold', () => {
      const result = calculateLevelUp(1, 0, 10);
      expect(result).toEqual({
        newLevel: 2,
        remainingXp: 0,
        xpToNextLevel: 20
      });
    });

    it('multiple level ups when XP >> threshold', () => {
      const result = calculateLevelUp(1, 0, 100);
      expect(result.newLevel).toBeGreaterThan(1);
      expect(result.remainingXp).toBeLessThan(getXpForNextLevel(result.newLevel));
    });

    it('caps at level 50 and resets XP', () => {
      const result = calculateLevelUp(50, 100, 1000);
      expect(result.newLevel).toBe(50);
      expect(result.remainingXp).toBe(0);
    });

    it('preserves XP with partial progression', () => {
      const result = calculateLevelUp(1, 5, 10);
      expect(result.newLevel).toBe(2);
      expect(result.remainingXp).toBe(5);
    });
  });
});
```

### Component Test Example (React Testing Library)

```javascript
// src/components/CharacterCreationModal.test.jsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CharacterCreationModal from './CharacterCreationModal';

describe('CharacterCreationModal - Username Stage', () => {
  const mockOnComplete = jest.fn();

  it('renders username input when open', () => {
    render(<CharacterCreationModal isOpen={true} onComplete={mockOnComplete} />);
    expect(screen.getByLabelText('Character Name')).toBeInTheDocument();
  });

  it('shows error for username too short', async () => {
    render(<CharacterCreationModal isOpen={true} onComplete={mockOnComplete} />);
    const input = screen.getByLabelText('Character Name');

    fireEvent.change(input, { target: { value: 'ab' } });
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Username must be at least 3 characters')).toBeInTheDocument();
    });
  });

  it('shows error for username too long', async () => {
    render(<CharacterCreationModal isOpen={true} onComplete={mockOnComplete} />);
    const input = screen.getByLabelText('Character Name');

    fireEvent.change(input, { target: { value: 'abcdefghijklmnopq' } });
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Username must be 16 characters or less')).toBeInTheDocument();
    });
  });

  it('shows error for invalid characters', async () => {
    render(<CharacterCreationModal isOpen={true} onComplete={mockOnComplete} />);
    const input = screen.getByLabelText('Character Name');

    fireEvent.change(input, { target: { value: 'Hero@123' } });
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Letters, numbers, and spaces only')).toBeInTheDocument();
    });
  });

  it('allows valid username and moves to class selection', async () => {
    render(<CharacterCreationModal isOpen={true} onComplete={mockOnComplete} />);
    const input = screen.getByLabelText('Character Name');

    fireEvent.change(input, { target: { value: 'ValidHero' } });
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Choose Your Class')).toBeInTheDocument();
    });
  });
});
```

## Mocking Strategies

### What to Mock

**External APIs:**
```javascript
// Mock fetch for API calls
global.fetch = jest.fn((url) => {
  if (url.includes('/api/generate-verification')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        verificationRequest: 'Show three fingers with your index up'
      })
    });
  }
  return Promise.resolve({ ok: false });
});
```

**Browser APIs:**
```javascript
// Mock localStorage
const localStorageMock = {
  getItem: jest.fn((key) => {
    const data = { saveSlot1: '{"username":"Test","characterClass":"warrior"}' };
    return data[key] || null;
  }),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
global.localStorage = localStorageMock;
```

**Phaser Game:**
```javascript
// Mock Phaser.Game for unit tests (not needed if testing React layer only)
jest.mock('phaser', () => ({
  Game: jest.fn(),
  Scene: class {},
  AUTO: 'auto'
}));
```

**Math.random (for deterministic tests):**
```javascript
// Mock for AI teammate generation
jest.spyOn(Math, 'random').mockReturnValue(0.5);
```

### What NOT to Mock

**Pure Functions:**
```javascript
// DO test directly
import { calculateLevelUp } from './levelingSystem';
expect(calculateLevelUp(1, 0, 10)).toEqual({...});
```

**Configuration Data:**
```javascript
// DO use actual config
import { CLASS_CONFIG } from './classes';
// Test against real data
```

**React Hooks (in component tests):**
```javascript
// DO let React Testing Library handle useState/useEffect
// DON'T mock React hooks themselves
```

## Test Data / Fixtures

### Player Stats Fixture

```javascript
export const mockPlayerStats = {
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

### XP Test Cases

```javascript
export const xpTestCases = [
  // Single level up
  { currentLevel: 1, currentXp: 0, xpGained: 10, expected: { newLevel: 2, remainingXp: 0, xpToNextLevel: 20 } },
  // Partial XP + exact threshold
  { currentLevel: 1, currentXp: 5, xpGained: 5, expected: { newLevel: 2, remainingXp: 0, xpToNextLevel: 20 } },
  // Multiple level ups
  { currentLevel: 1, currentXp: 0, xpGained: 100, expected: { newLevel: 3, remainingXp: 60, xpToNextLevel: 30 } },
  // Max level reached
  { currentLevel: 50, currentXp: 100, xpGained: 1000, expected: { newLevel: 50, remainingXp: 0, xpToNextLevel: 155500 } },
  // Overflow XP at max
  { currentLevel: 49, currentXp: 0, xpGained: 200000, expected: { newLevel: 50, remainingXp: 0, xpToNextLevel: 155500 } }
];
```

### Ability Test Cases

```javascript
export const abilityTestCases = [
  { class: 'paladin', level: 1, expectedSlot1: 'stomp', expectedSlot2: null },
  { class: 'warrior', level: 1, expectedSlot1: 'doubleSlash', expectedSlot2: null },
  { class: 'paladin', level: 3, expectedSlot1: 'stomp', expectedSlot2: 'roar' },
  { class: 'paladin', level: 8, expectedSlot4: 'unbreakable', description: 'Ultimate ability at level 8' },
];
```

## Coverage Gaps & Risk Assessment

### Untested Areas (HIGH RISK)

**1. Phaser Game Logic (`src/scenes/MainScene.js`)**
- NPC interaction detection (`canInteract`, `canInteractDungeon`, `canInteractQuestGiver`)
- Player sprite animation and layer synchronization (`syncPlayerLayers()`)
- Camera tracking and world bounds
- Touch/drag input state machine
- Asset preloading and error recovery
- **Risk:** Game physics, animations, or interaction broken unnoticed
- **Priority:** HIGH - Critical to gameplay
- **How to Test:** Game instance mocking + assertions on state changes

**2. React Component Rendering (`src/components/*.jsx`)**
- Modal visibility toggling and animation
- Conditional rendering logic (if/else in JSX)
- Event handler attachment (onClick, onChange)
- CSS class binding and styling
- Form input binding
- **Risk:** UI completely broken but app doesn't crash
- **Priority:** MEDIUM - Affects user experience
- **How to Test:** React Testing Library + screen queries

**3. Async State Updates & localStorage (`src/App.jsx`)**
- Save to localStorage with correct format
- Load from localStorage and hydrate state
- Multiple save slots coexistence
- Data migration from old format
- Equipment migration (accessory → offHand)
- **Risk:** Silent failures, data corruption, lost user progress
- **Priority:** HIGH - Data integrity critical
- **How to Test:** Mock localStorage + assert state updates

**4. API Integration (`src/components/TaskSubmissionModal.jsx`)**
- Fetch to `/api/generate-verification` success/failure
- Fetch to `/api/evaluate-task` success/failure
- FormData construction for image upload
- Network error handling
- Timeout handling
- **Risk:** Task submission silently fails or loses user input
- **Priority:** HIGH - Core user feature
- **How to Test:** Mock fetch + test both success and error paths

**5. Battle Logic (`src/components/BattleModal.jsx`)**
- Damage calculation accuracy
- Party stat generation correctness
- Turn order and action resolution
- Victory/defeat conditions
- Boss move selection and effects
- **Risk:** Combat broken - player can't progress
- **Priority:** HIGH - Gate to end-game content
- **How to Test:** Unit tests for calculation + integration tests for battle flow

**6. Error Boundaries & Recovery**
- No error boundary components exist
- Uncaught errors in any component crash entire app
- No error recovery UI
- **Risk:** Single component bug = entire game breaks for user
- **Priority:** HIGH - Stability/UX
- **How to Test:** Add error boundary tests + error scenario tests

## Recommended Testing Setup

### 1. Install Testing Dependencies

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

**Why Vitest?**
- Faster than Jest (uses Vite config)
- Better ESM support
- Same Jest API (minimal migration)
- Excellent React support

### 2. Create `vitest.config.js`

```javascript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
  },
});
```

### 3. Create Test Setup File (`src/test/setup.js`)

```javascript
import '@testing-library/jest-dom';

// Mock localStorage
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock fetch for tests
global.fetch = jest.fn();
```

### 4. Add Test Scripts to `package.json`

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

### 5. Testing Priority (Recommended Order)

1. **Week 1:** Leveling system tests (5-10 tests, ~30 mins)
2. **Week 1:** Ability system tests (5-8 tests, ~30 mins)
3. **Week 2:** Form validation tests (5-8 tests, ~20 mins)
4. **Week 2:** Damage calculation tests (3-5 tests, ~20 mins)
5. **Week 3:** Component snapshot tests (2-3, ~30 mins)
6. **Week 4:** Integration tests for create character flow (3-4, ~1 hour)
7. **Ongoing:** Increase to 70%+ coverage target

**Estimated Total Time:** 20-25 hours for comprehensive test suite

---

*Testing analysis: 2026-02-21*
