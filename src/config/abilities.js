// Ability unlock levels
export const ABILITY_UNLOCK_LEVELS = {
  SLOT_1: 1,   // Basic
  SLOT_2: 3,   // Utility
  SLOT_3: 15   // Ultimate
};

// Ability slot types
export const ABILITY_TYPES = {
  BASIC: 'basic',
  UTILITY: 'utility',
  ULTIMATE: 'ultimate'
};

// Target types
export const TARGET_TYPES = {
  SELF: 'self',
  ALLY: 'ally',
  ENEMY: 'enemy',
  ALL_ALLIES: 'all_allies',
  ALL_ENEMIES: 'all_enemies'
};

// All abilities organized by class
export const ABILITIES = {
  // PALADIN (Tank)
  paladin: {
    stomp: {
      id: 'stomp',
      name: 'Stomp',
      description: 'Shield yourself based on your max HP',
      type: ABILITY_TYPES.BASIC,
      slot: 1,
      unlockLevel: 1,
      manaCost: 20,
      cooldown: 0,
      targetType: TARGET_TYPES.SELF,
      icon: '🛡️',
      effect: {
        type: 'shield',
        formula: 'maxHp * 0.1'
      }
    },
    roar: {
      id: 'roar',
      name: 'Roar',
      description: 'Reduce boss damage by 20% for 2 turns',
      type: ABILITY_TYPES.UTILITY,
      slot: 2,
      unlockLevel: 3,
      manaCost: 25,
      cooldown: 0,
      targetType: TARGET_TYPES.ENEMY,
      icon: '📢',
      effect: {
        type: 'debuff',
        stat: 'damage',
        modifier: -0.2,
        duration: 2
      }
    },
    unbreakable: {
      id: 'unbreakable',
      name: 'Unbreakable',
      description: 'Redirect all team damage to yourself with 50% damage reduction',
      type: ABILITY_TYPES.ULTIMATE,
      slot: 3,
      unlockLevel: 15,
      manaCost: 50,
      cooldown: 5,
      targetType: TARGET_TYPES.SELF,
      icon: '🛡️✨',
      effect: {
        type: 'redirect',
        damageReduction: 0.5,
        duration: 3
      }
    }
  },

  // WARRIOR (Slayer)
  warrior: {
    doubleSlash: {
      id: 'doubleSlash',
      name: 'Double Slash',
      description: 'Strike twice with your weapon. Builds Flow State stacks.',
      type: ABILITY_TYPES.BASIC,
      slot: 1,
      unlockLevel: 1,
      manaCost: 0,
      cooldown: 0,
      targetType: TARGET_TYPES.ENEMY,
      icon: '⚔️',
      effect: {
        type: 'damage',
        formula: 'strength * 4',
        hits: 2,
        buildsFlow: true
      }
    },
    adrenaline: {
      id: 'adrenaline',
      name: 'Adrenaline',
      description: 'Gain 5 mana and increase crit chance by 20% for 3 turns',
      type: ABILITY_TYPES.UTILITY,
      slot: 2,
      unlockLevel: 3,
      manaCost: 0,
      cooldown: 0,
      targetType: TARGET_TYPES.SELF,
      icon: '💪',
      effect: {
        type: 'buff',
        manaGain: 5,
        stat: 'critChance',
        modifier: 0.2,
        duration: 3
      }
    },
    cyclone: {
      id: 'cyclone',
      name: 'Cyclone',
      description: 'Unleash 6 devastating strikes',
      type: ABILITY_TYPES.ULTIMATE,
      slot: 3,
      unlockLevel: 15,
      manaCost: 40,
      cooldown: 5,
      targetType: TARGET_TYPES.ENEMY,
      icon: '🌪️',
      effect: {
        type: 'damage',
        formula: 'strength * 2',
        hits: 6
      }
    }
  },

  // ARCHER (Seeker)
  archer: {
    rapidShot: {
      id: 'rapidShot',
      name: 'Rapid Shot',
      description: 'Quick shot combining agility and strength',
      type: ABILITY_TYPES.BASIC,
      slot: 1,
      unlockLevel: 1,
      manaCost: 0,
      cooldown: 0,
      targetType: TARGET_TYPES.ENEMY,
      icon: '🏹',
      effect: {
        type: 'damage',
        formula: '(agility * 3) + strength'
      }
    },
    eagleEye: {
      id: 'eagleEye',
      name: 'Eagle Eye',
      description: 'Increase team crit chance by 20% for 3 turns',
      type: ABILITY_TYPES.UTILITY,
      slot: 2,
      unlockLevel: 3,
      manaCost: 20,
      cooldown: 0,
      targetType: TARGET_TYPES.ALL_ALLIES,
      icon: '🦅',
      effect: {
        type: 'buff',
        stat: 'critChance',
        modifier: 0.2,
        duration: 3
      }
    },
    arrowRain: {
      id: 'arrowRain',
      name: 'Arrow Rain',
      description: 'Massive damage with guaranteed stun',
      type: ABILITY_TYPES.ULTIMATE,
      slot: 3,
      unlockLevel: 15,
      manaCost: 50,
      cooldown: 5,
      targetType: TARGET_TYPES.ENEMY,
      icon: '🏹☄️',
      effect: {
        type: 'damage',
        formula: 'agility * 10',
        stun: true
      }
    }
  },

  // MAGE (Worker)
  mage: {
    fireball: {
      id: 'fireball',
      name: 'Fireball',
      description: 'Hurl a bolt of fire at your enemy',
      type: ABILITY_TYPES.BASIC,
      slot: 1,
      unlockLevel: 1,
      manaCost: 40,
      cooldown: 0,
      targetType: TARGET_TYPES.ENEMY,
      icon: '🔥',
      effect: {
        type: 'damage',
        formula: 'mindPower * 10'
      }
    },
    battery: {
      id: 'battery',
      name: 'Battery',
      description: 'Sacrifice 10% HP to gain 40 mana',
      type: ABILITY_TYPES.UTILITY,
      slot: 2,
      unlockLevel: 3,
      manaCost: 0,
      cooldown: 0,
      targetType: TARGET_TYPES.SELF,
      icon: '🔋',
      effect: {
        type: 'conversion',
        hpCost: 0.1,
        manaGain: 40
      }
    },
    blackHole: {
      id: 'blackHole',
      name: 'Black Hole',
      description: 'Massive damage that warps time - both you and enemy skip next turn',
      type: ABILITY_TYPES.ULTIMATE,
      slot: 3,
      unlockLevel: 15,
      manaCost: 60,
      cooldown: 5,
      targetType: TARGET_TYPES.ENEMY,
      icon: '🌑',
      effect: {
        type: 'damage',
        formula: 'mindPower * 20',
        warp: true
      }
    }
  },

  // CLERIC (Aura)
  cleric: {
    heal: {
      id: 'heal',
      name: 'Heal',
      description: 'Restore health to an ally',
      type: ABILITY_TYPES.BASIC,
      slot: 1,
      unlockLevel: 1,
      manaCost: 30,
      cooldown: 0,
      targetType: TARGET_TYPES.ALLY,
      icon: '✨',
      effect: {
        type: 'heal',
        formula: 'mindPower * 6'
      }
    },
    halo: {
      id: 'halo',
      name: 'Halo',
      description: 'Damage to target is split among all party members',
      type: ABILITY_TYPES.UTILITY,
      slot: 2,
      unlockLevel: 3,
      manaCost: 35,
      cooldown: 0,
      targetType: TARGET_TYPES.ALLY,
      icon: '👼',
      effect: {
        type: 'shield',
        splitDamage: true,
        duration: 2
      }
    },
    resurrection: {
      id: 'resurrection',
      name: 'Resurrection',
      description: 'Revive a fallen ally at 50% HP',
      type: ABILITY_TYPES.ULTIMATE,
      slot: 3,
      unlockLevel: 15,
      manaCost: 80,
      cooldown: 5,
      targetType: TARGET_TYPES.ALLY,
      icon: '✨💫',
      effect: {
        type: 'revive',
        hpPercent: 0.5
      }
    }
  }
};

// Helper function to get abilities for a class
export function getClassAbilities(characterClass) {
  return ABILITIES[characterClass] || {};
}

// Helper function to get unlocked abilities based on level
export function getUnlockedAbilities(characterClass, level) {
  const classAbilities = getClassAbilities(characterClass);
  return Object.values(classAbilities).filter(ability => ability.unlockLevel <= level);
}

// Helper function to check if ability is unlocked
export function isAbilityUnlocked(ability, level) {
  return ability.unlockLevel <= level;
}
