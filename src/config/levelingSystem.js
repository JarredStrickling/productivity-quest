// XP required to reach each level (level 1 is starting level, needs 10 XP to reach level 2)
const XP_TABLE = {
  1: 10,    // Level 1 → 2
  2: 20,    // Level 2 → 3
  3: 30,    // Level 3 → 4
  4: 50,    // Level 4 → 5
  5: 100,   // Level 5 → 6
  6: 150,   // Level 6 → 7
  7: 200,   // Level 7 → 8
  8: 300,   // Level 8 → 9
  9: 400,   // Level 9 → 10
  10: 500,  // Level 10 → 11
  11: 700,  // Level 11 → 12
  12: 900,  // Level 12 → 13
  13: 1100, // Level 13 → 14
  14: 1400, // Level 14 → 15
  15: 1700, // Level 15 → 16
  16: 2100, // Level 16 → 17
  17: 2500, // Level 17 → 18
  18: 3000, // Level 18 → 19
  19: 3600, // Level 19 → 20
  20: 4300, // Level 20 → 21
  21: 5100, // Level 21 → 22
  22: 6000, // Level 22 → 23
  23: 7000, // Level 23 → 24
  24: 8200, // Level 24 → 25
  25: 9500, // Level 25 → 26
  26: 11000, // Level 26 → 27
  27: 12700, // Level 27 → 28
  28: 14600, // Level 28 → 29
  29: 16700, // Level 29 → 30
  30: 19000, // Level 30 → 31
  31: 21500, // Level 31 → 32
  32: 24300, // Level 32 → 33
  33: 27400, // Level 33 → 34
  34: 30800, // Level 34 → 35
  35: 34500, // Level 35 → 36
  36: 38600, // Level 36 → 37
  37: 43000, // Level 37 → 38
  38: 47800, // Level 38 → 39
  39: 53000, // Level 39 → 40
  40: 58700, // Level 40 → 41
  41: 65000, // Level 41 → 42
  42: 71800, // Level 42 → 43
  43: 79300, // Level 43 → 44
  44: 87500, // Level 44 → 45
  45: 96500, // Level 45 → 46
  46: 106300, // Level 46 → 47
  47: 117000, // Level 47 → 48
  48: 128700, // Level 48 → 49
  49: 141500, // Level 49 → 50
  50: 155500  // Level 50 (max for now)
};

/**
 * Get XP required to reach the next level from current level
 * @param {number} currentLevel - The player's current level
 * @returns {number} XP needed to reach next level
 */
export function getXpForNextLevel(currentLevel) {
  // Cap at level 50 for now
  if (currentLevel >= 50) {
    return XP_TABLE[50];
  }

  return XP_TABLE[currentLevel] || 100; // Fallback to 100 if not in table
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

  // Keep leveling up until we run out of XP or hit max level
  while (xp >= xpNeeded && level < 50) {
    xp -= xpNeeded;
    level++;
    xpNeeded = getXpForNextLevel(level);
  }

  return {
    newLevel: level,
    remainingXp: level >= 50 ? 0 : xp, // Reset XP if max level
    xpToNextLevel: xpNeeded
  };
}
