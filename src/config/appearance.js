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

// Generate ALL sprite sheets needed for preloading
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
