export const CLASS_CONFIG = {
  paladin: {
    name: 'Paladin',
    description: 'Heavily armored tank with high HP and defense',
    color: '#f59e0b', // Gold
    icon: '🛡️',
    // 20 points total: 1 point = 50 HP or 1 stat point
    baseStats: {
      hp: 350,       // 7 pts
      strength: 8,   // 8 pts
      agility: 3,    // 3 pts
      mindPower: 2   // 2 pts  = 20
    }
  },
  warrior: {
    name: 'Warrior',
    description: 'Fierce melee fighter with devastating strength',
    color: '#dc2626', // Red
    icon: '⚔️',
    baseStats: {
      hp: 200,       // 4 pts
      strength: 12,  // 12 pts
      agility: 3,    // 3 pts
      mindPower: 1   // 1 pt   = 20
    }
  },
  mage: {
    name: 'Mage',
    description: 'Powerful spellcaster with immense mind power',
    color: '#3b82f6', // Blue
    icon: '🔮',
    baseStats: {
      hp: 100,       // 2 pts
      strength: 2,   // 2 pts
      agility: 2,    // 2 pts
      mindPower: 14  // 14 pts = 20
    }
  },
  archer: {
    name: 'Archer',
    description: 'Swift ranged attacker with deadly precision',
    color: '#10b981', // Green
    icon: '🏹',
    baseStats: {
      hp: 150,       // 3 pts
      strength: 4,   // 4 pts
      agility: 11,   // 11 pts
      mindPower: 2   // 2 pts  = 20
    }
  },
  cleric: {
    name: 'Cleric',
    description: 'Holy support with healing and balanced stats',
    color: '#8b5cf6', // Purple
    icon: '✨',
    baseStats: {
      hp: 150,       // 3 pts
      strength: 2,   // 2 pts
      agility: 5,    // 5 pts
      mindPower: 10  // 10 pts = 20
    }
  }
};
