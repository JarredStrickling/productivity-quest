// Equipment System Configuration
// Defines all items, class defaults, and helpers

// ── EQUIPMENT DATABASE ─────────────────────────────────────────────
// Each item maps to a Mana Seed sprite layer (6tla, 7tlb, or 1out)

export const EQUIPMENT_DATABASE = {
  // ── WEAPONS (6tla layer) ──
  sw01: {
    id: 'sw01', name: 'Iron Sword', slot: 'weapon',
    spriteId: 'sw01', combatType: 'sword',
    icon: '🗡️', description: 'A reliable iron sword.',
    colorVariants: ['v01', 'v02', 'v03', 'v04', 'v05'],
  },
  sw02: {
    id: 'sw02', name: 'Twin Blade', slot: 'weapon',
    spriteId: 'sw02', combatType: 'sword',
    icon: '⚔️', description: 'A double-edged blade for aggressive fighters.',
    colorVariants: ['v01', 'v02', 'v03', 'v04', 'v05'],
  },
  ax01: {
    id: 'ax01', name: 'Battle Axe', slot: 'weapon',
    spriteId: 'ax01', combatType: 'sword',
    icon: '🪓', description: 'A heavy axe that deals devastating blows.',
    colorVariants: ['v01', 'v02', 'v03', 'v04', 'v05'],
  },
  mc01: {
    id: 'mc01', name: 'Mace', slot: 'weapon',
    spriteId: 'mc01', combatType: 'sword',
    icon: '🔨', description: 'A sturdy mace favored by clerics and mages.',
    colorVariants: ['v01', 'v02', 'v03', 'v04', 'v05'],
  },
  bo01: {
    id: 'bo01', name: 'Short Bow', slot: 'weapon',
    spriteId: 'bo01', combatType: 'bow',
    icon: '🏹', description: 'A nimble bow for quick shots.',
    colorVariants: ['v01', 'v02', 'v03', 'v04', 'v05'],
  },
  bo02: {
    id: 'bo02', name: 'Long Bow', slot: 'weapon',
    spriteId: 'bo02', combatType: 'bow',
    icon: '🏹', description: 'A powerful long-range bow.',
    colorVariants: ['v01', 'v02', 'v03', 'v04', 'v05'],
  },
  bo03: {
    id: 'bo03', name: 'Composite Bow', slot: 'weapon',
    spriteId: 'bo03', combatType: 'bow',
    icon: '🏹', description: 'An advanced composite bow.',
    colorVariants: ['v01', 'v02', 'v03', 'v04', 'v05'],
  },
  sp01: {
    id: 'sp01', name: 'Spear', slot: 'weapon',
    spriteId: 'sp01', combatType: 'spear',
    icon: '🔱', description: 'A long spear with excellent reach.',
    colorVariants: ['v01', 'v02', 'v03', 'v04', 'v05'],
  },
  sp02: {
    id: 'sp02', name: 'Lance', slot: 'weapon',
    spriteId: 'sp02', combatType: 'spear',
    icon: '🔱', description: 'A heavy lance for charging attacks.',
    colorVariants: ['v01', 'v02', 'v03', 'v04', 'v05'],
  },
  hb01: {
    id: 'hb01', name: 'Halberd', slot: 'weapon',
    spriteId: 'hb01', combatType: 'spear',
    icon: '🪓', description: 'A polearm with an axe blade.',
    colorVariants: ['v01', 'v02', 'v03', 'v04', 'v05'],
  },

  // ── OFF-HAND (7tlb layer) ──
  sh01: {
    id: 'sh01', name: 'Wooden Shield', slot: 'offHand',
    spriteId: 'sh01', combatType: 'sword',
    icon: '🛡️', description: 'A sturdy wooden shield.',
    colorVariants: ['v01', 'v02', 'v03', 'v04', 'v05'],
  },
  sh02: {
    id: 'sh02', name: 'Iron Shield', slot: 'offHand',
    spriteId: 'sh02', combatType: 'sword',
    icon: '🛡️', description: 'A reinforced iron shield.',
    colorVariants: ['v01', 'v02', 'v03', 'v04', 'v05'],
  },
  sh03: {
    id: 'sh03', name: 'Tower Shield', slot: 'offHand',
    spriteId: 'sh03', combatType: 'sword',
    icon: '🛡️', description: 'A massive tower shield.',
    colorVariants: ['v01', 'v02', 'v03', 'v04', 'v05'],
  },
  qv01: {
    id: 'qv01', name: 'Quiver', slot: 'offHand',
    spriteId: 'qv01', combatType: 'bow',
    icon: '🏹', description: 'A leather quiver for arrows.',
    colorVariants: ['v01', 'v02', 'v03', 'v04', 'v05', 'v06', 'v07', 'v08'],
  },

  // ── ARMOR (1out layer - outfit swap) ──
  fstr: {
    id: 'fstr', name: 'Adventurer Tunic', slot: 'armor',
    spriteId: 'fstr',
    icon: '👕', description: 'Standard adventurer outfit.',
    colorVariants: ['v01', 'v02', 'v03', 'v04', 'v05'],
  },
  pfpn: {
    id: 'pfpn', name: 'Padded Armor', slot: 'armor',
    spriteId: 'pfpn',
    icon: '🧥', description: 'Light padded armor for agile fighters.',
    colorVariants: ['v01', 'v02', 'v03', 'v04', 'v05'],
  },
};

// ── CLASS DEFAULT EQUIPMENT ────────────────────────────────────────
// Applied when a new character is created

export const CLASS_DEFAULT_EQUIPMENT = {
  paladin: {
    weapon:  { itemId: 'sw01', color: 'v01' },
    offHand: { itemId: 'sh01', color: 'v01' },
    armor:   { itemId: 'fstr', color: 'v04' },
  },
  warrior: {
    weapon:  { itemId: 'sw02', color: 'v01' },
    offHand: null,
    armor:   { itemId: 'fstr', color: 'v01' },
  },
  archer: {
    weapon:  { itemId: 'bo01', color: 'v01' },
    offHand: { itemId: 'qv01', color: 'v01' },
    armor:   { itemId: 'fstr', color: 'v05' },
  },
  mage: {
    weapon:  { itemId: 'mc01', color: 'v01' },
    offHand: null,
    armor:   { itemId: 'fstr', color: 'v02' },
  },
  cleric: {
    weapon:  { itemId: 'mc01', color: 'v01' },
    offHand: null,
    armor:   { itemId: 'fstr', color: 'v03' },
  },
};

// ── COMBAT PAGE MAPPING ───────────────────────────────────────────
// Maps weapon combatType to the Mana Seed combat idle page
export const COMBAT_PAGE_MAP = {
  sword: 'pONE2', // sword, twin blade, axe, mace
  bow:   'pBOW2',
  spear: 'pPOL2',
};

// ── HELPERS ────────────────────────────────────────────────────────

export function getEquipmentDisplayInfo(equipped) {
  if (!equipped) return null;
  const item = EQUIPMENT_DATABASE[equipped.itemId];
  if (!item) return null;
  return { ...item, equippedColor: equipped.color };
}

// Get the combat page for a weapon item
export function getCombatPageForWeapon(weaponItemId) {
  const item = EQUIPMENT_DATABASE[weaponItemId];
  if (!item) return null;
  return COMBAT_PAGE_MAP[item.combatType] || null;
}
