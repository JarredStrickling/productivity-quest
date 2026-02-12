export const CLASS_CONFIG = {
  paladin: {
    name: 'Paladin',
    description: 'Heavily armored tank with high HP and defense',
    color: '#f59e0b', // Gold
    icon: '🛡️',
    baseStats: {
      hp: 140,
      strength: 8,
      agility: 3,
      mindPower: 2
    }
  },
  warrior: {
    name: 'Warrior',
    description: 'Fierce melee fighter with devastating strength',
    color: '#dc2626', // Red
    icon: '⚔️',
    baseStats: {
      hp: 100,
      strength: 12,
      agility: 5,
      mindPower: 1
    }
  },
  mage: {
    name: 'Mage',
    description: 'Powerful spellcaster with immense mind power',
    color: '#3b82f6', // Blue
    icon: '🔮',
    baseStats: {
      hp: 80,
      strength: 2,
      agility: 2,
      mindPower: 14
    }
  },
  archer: {
    name: 'Archer',
    description: 'Swift ranged attacker with deadly precision',
    color: '#10b981', // Green
    icon: '🏹',
    baseStats: {
      hp: 90,
      strength: 5,
      agility: 12,
      mindPower: 3
    }
  },
  cleric: {
    name: 'Cleric',
    description: 'Holy support with healing and balanced stats',
    color: '#8b5cf6', // Purple
    icon: '✨',
    baseStats: {
      hp: 100,
      strength: 3,
      agility: 4,
      mindPower: 10
    }
  }
};
