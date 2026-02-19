// Mana Seed Paper Doll - Appearance Configuration
// Shared by CharacterCreation, MainScene, SimpleHUD, and ArenaModal

export const MS_PATH = '/assets/sprites/manaseed';

export const SKIN_TONES = [
  'v00', 'v01', 'v02', 'v03', 'v04', 'v05',
  'v06', 'v07', 'v08', 'v09', 'v10',
];

export const HAIR_STYLES = [
  { id: 'dap1', name: 'Short' },
  { id: 'bob1', name: 'Bob' },
  { id: 'bob2', name: 'Bob 2' },
  { id: 'flat', name: 'Flat' },
  { id: 'fro1', name: 'Afro' },
  { id: 'pon1', name: 'Ponytail' },
  { id: 'spk2', name: 'Spiky' },
];

export const HAIR_COLORS = [
  'v00', 'v01', 'v02', 'v03', 'v04', 'v05', 'v06',
  'v07', 'v08', 'v09', 'v10', 'v11', 'v12', 'v13',
];

// All outfit styles available on p1 (walking page)
export const OUTFIT_STYLES = [
  { id: 'fstr', name: 'Adventurer Tunic', colors: ['v01', 'v02', 'v03', 'v04', 'v05'] },
  { id: 'pfpn', name: 'Padded Armor', colors: ['v01', 'v02', 'v03', 'v04', 'v05'] },
  { id: 'boxr', name: 'Boxer', colors: ['v01'] },
  { id: 'undi', name: 'Undergarments', colors: ['v01'] },
];

// Legacy: still used by character creation outfit color cycling (defaults to fstr)
export const OUTFIT_COLORS = ['v01', 'v02', 'v03', 'v04', 'v05'];

export const HAT_STYLES = [
  { id: null, name: 'None' },
  { id: 'pnty', name: 'Wizard' },
  { id: 'pfht', name: 'Ranger' },
];

export const HAT_COLORS = ['v01', 'v02', 'v03', 'v04', 'v05'];

// Suggested starting appearance per class (hats only for mage)
export const CLASS_DEFAULT_APPEARANCE = {
  paladin: { skin: 'v01', hairStyle: 'dap1', hairColor: 'v01', outfit: 'v04', hatStyle: null, hatColor: 'v01' },
  warrior: { skin: 'v01', hairStyle: 'bob1', hairColor: 'v05', outfit: 'v01', hatStyle: null, hatColor: 'v01' },
  mage:    { skin: 'v01', hairStyle: 'dap1', hairColor: 'v08', outfit: 'v02', hatStyle: 'pnty', hatColor: 'v03' },
  archer:  { skin: 'v01', hairStyle: 'bob1', hairColor: 'v09', outfit: 'v05', hatStyle: null, hatColor: 'v01' },
  cleric:  { skin: 'v01', hairStyle: 'dap1', hairColor: 'v11', outfit: 'v03', hatStyle: null, hatColor: 'v01' },
};

// Merge equipment into appearance for rendering
// Armor equipment drives the outfit sprite layer
export function getEffectiveAppearance(appearance, equipment) {
  if (!appearance) return null;
  const effective = { ...appearance };
  if (equipment?.armor) {
    effective.outfitStyle = equipment.armor.itemId; // 'fstr', 'pfpn', etc.
    effective.outfit = equipment.armor.color;        // 'v01'-'v05'
  }
  return effective;
}

// Build sprite sheet file paths from an appearance object
export function getAppearancePaths(appearance) {
  const outfitStyle = appearance.outfitStyle || 'fstr';
  return {
    base:   `char_a_p1/char_a_p1_0bas_humn_${appearance.skin}.png`,
    outfit: `char_a_p1/1out/char_a_p1_1out_${outfitStyle}_${appearance.outfit}.png`,
    hair:   `char_a_p1/4har/char_a_p1_4har_${appearance.hairStyle}_${appearance.hairColor}.png`,
    hat:    appearance.hatStyle
      ? `char_a_p1/5hat/char_a_p1_5hat_${appearance.hatStyle}_${appearance.hatColor}.png`
      : null,
  };
}

// Build Phaser texture keys from an appearance object
export function getAppearanceTextureKeys(appearance) {
  const outfitStyle = appearance.outfitStyle || 'fstr';
  return {
    base:   `ms_base_${appearance.skin}`,
    outfit: `ms_out_${outfitStyle}_${appearance.outfit}`,
    hair:   `ms_hair_${appearance.hairStyle}_${appearance.hairColor}`,
    hat:    appearance.hatStyle
      ? `ms_hat_${appearance.hatStyle}_${appearance.hatColor}`
      : null,
  };
}

// Generate sprite sheets for a single appearance (3-4 sheets)
export function getSheetsForAppearance(appearance) {
  if (!appearance) return {};
  const outfitStyle = appearance.outfitStyle || 'fstr';
  const sheets = {};
  sheets[`ms_base_${appearance.skin}`] = `char_a_p1/char_a_p1_0bas_humn_${appearance.skin}.png`;
  sheets[`ms_out_${outfitStyle}_${appearance.outfit}`] = `char_a_p1/1out/char_a_p1_1out_${outfitStyle}_${appearance.outfit}.png`;
  sheets[`ms_hair_${appearance.hairStyle}_${appearance.hairColor}`] = `char_a_p1/4har/char_a_p1_4har_${appearance.hairStyle}_${appearance.hairColor}.png`;
  if (appearance.hatStyle) {
    sheets[`ms_hat_${appearance.hatStyle}_${appearance.hatColor}`] = `char_a_p1/5hat/char_a_p1_5hat_${appearance.hatStyle}_${appearance.hatColor}.png`;
  }
  return sheets;
}

// Generate sprite sheets for all class default appearances (~12 unique sheets)
// Used by Phaser preload so arena AI teammates render correctly
export function getDefaultSpriteSheets() {
  const sheets = {};
  for (const appearance of Object.values(CLASS_DEFAULT_APPEARANCE)) {
    Object.assign(sheets, getSheetsForAppearance(appearance));
  }
  return sheets;
}

// ── COMBAT SPRITE HELPERS ─────────────────────────────────────────
// Combat pages only have bob1 & dap1 hair. Map all styles to nearest.
const COMBAT_HAIR_FALLBACK = {
  dap1: 'dap1', bob1: 'bob1',
  bob2: 'bob1', flat: 'dap1', fro1: 'dap1', pon1: 'bob1', spk2: 'dap1',
};

// pONE2 has fstr/pfpn outfits; pBOW2/pPOL2 only have boxr
const COMBAT_OUTFIT_PAGES = { pONE2: true };

// Build sprite sheet file paths for a combat idle page (right-facing with weapon)
// combatPage: 'pONE2', 'pBOW2', or 'pPOL2'
export function getCombatAppearancePaths(appearance, equipment, combatPage) {
  if (!appearance || !combatPage) return null;
  const skin = appearance.skin;
  const hairStyle = COMBAT_HAIR_FALLBACK[appearance.hairStyle] || 'dap1';
  const hairColor = appearance.hairColor;

  // Outfit: use armor equipment if on a page that supports it, else boxr
  let outfitStyle = 'boxr';
  let outfitColor = 'v01';
  if (COMBAT_OUTFIT_PAGES[combatPage] && equipment?.armor) {
    outfitStyle = equipment.armor.itemId;
    outfitColor = equipment.armor.color;
  } else if (COMBAT_OUTFIT_PAGES[combatPage]) {
    outfitStyle = appearance.outfitStyle || 'fstr';
    outfitColor = appearance.outfit || 'v01';
  }

  const page = `char_a_${combatPage}`;
  const paths = {
    base:   `${page}/${page}_0bas_humn_${skin}.png`,
    outfit: `${page}/1out/${page}_1out_${outfitStyle}_${outfitColor}.png`,
    hair:   `${page}/4har/${page}_4har_${hairStyle}_${hairColor}.png`,
    weapon: null,
    offHand: null,
    hat: null,
  };

  // Weapon layer (6tla)
  if (equipment?.weapon) {
    const wep = equipment.weapon;
    paths.weapon = `${page}/6tla/${page}_6tla_${wep.itemId}_${wep.color}.png`;
  }

  // Off-hand layer (7tlb) - shields on pONE2, quivers on pBOW2, none on pPOL2
  if (equipment?.offHand) {
    const oh = equipment.offHand;
    paths.offHand = `${page}/7tlb/${page}_7tlb_${oh.itemId}_${oh.color}.png`;
  }

  // Hat layer (5hat) - only on pONE2
  if (COMBAT_OUTFIT_PAGES[combatPage] && appearance.hatStyle) {
    paths.hat = `${page}/5hat/${page}_5hat_${appearance.hatStyle}_${appearance.hatColor}.png`;
  }

  return paths;
}

// Generate ALL sprite sheets (every combination) - used only by non-Phaser contexts if needed
export function getAllSpriteSheets() {
  const sheets = {};

  for (const skin of SKIN_TONES) {
    sheets[`ms_base_${skin}`] = `char_a_p1/char_a_p1_0bas_humn_${skin}.png`;
  }

  // All outfit styles and their color variants
  for (const style of OUTFIT_STYLES) {
    for (const color of style.colors) {
      sheets[`ms_out_${style.id}_${color}`] = `char_a_p1/1out/char_a_p1_1out_${style.id}_${color}.png`;
    }
  }

  for (const style of HAIR_STYLES) {
    for (const color of HAIR_COLORS) {
      sheets[`ms_hair_${style.id}_${color}`] = `char_a_p1/4har/char_a_p1_4har_${style.id}_${color}.png`;
    }
  }

  for (const style of HAT_STYLES) {
    if (!style.id) continue;
    for (const color of HAT_COLORS) {
      sheets[`ms_hat_${style.id}_${color}`] = `char_a_p1/5hat/char_a_p1_5hat_${style.id}_${color}.png`;
    }
  }

  return sheets;
}
