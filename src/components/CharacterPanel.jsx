import './CharacterPanel.css';
import { CLASS_CONFIG } from '../config/classes';
import { getEquipmentDisplayInfo } from '../config/equipment';
import { CLASS_DEFAULT_APPEARANCE } from '../config/appearance';
import { getClassAbilities, ABILITY_UNLOCK_LEVELS } from '../config/abilities';
import PaperDollPreview from './PaperDollPreview';

export default function CharacterPanel({ isOpen, onClose, playerStats, onAllocateStat }) {
  if (!isOpen) return null;

  const classData = CLASS_CONFIG[playerStats.characterClass];
  if (!classData) return null;

  const weaponInfo = getEquipmentDisplayInfo(playerStats.equipment?.weapon);
  const offHandInfo = getEquipmentDisplayInfo(playerStats.equipment?.offHand);
  const armorInfo = getEquipmentDisplayInfo(playerStats.equipment?.armor);

  const hpPercent = (playerStats.stats.hp / playerStats.stats.maxHp) * 100;
  const manaPercent = (playerStats.stats.mana / playerStats.stats.maxMana) * 100;

  const appearance = playerStats.appearance
    || CLASS_DEFAULT_APPEARANCE[playerStats.characterClass];

  const dollSize = window.innerHeight < 580 ? 128 : 160;
  const pts = playerStats.unspentStatPoints || 0;

  // Build ability slot display
  const classAbilities = getClassAbilities(playerStats.characterClass);
  const equipped = playerStats.equippedAbilities || {};
  const slotConfig = [
    { key: 'slot1', label: 'Basic', unlockLevel: ABILITY_UNLOCK_LEVELS.SLOT_1 },
    { key: 'slot2', label: 'Utility', unlockLevel: ABILITY_UNLOCK_LEVELS.SLOT_2 },
    { key: 'slot3', label: 'Flex', unlockLevel: ABILITY_UNLOCK_LEVELS.SLOT_3 },
    { key: 'slot4', label: 'Ultimate', unlockLevel: ABILITY_UNLOCK_LEVELS.SLOT_4 },
  ];
  const abilitySlots = slotConfig.map(slot => {
    const abilityId = equipped[slot.key];
    const ability = abilityId ? Object.values(classAbilities).find(a => a.id === abilityId) : null;
    const unlocked = playerStats.level >= slot.unlockLevel;
    const isFlex = slot.key === 'slot3';
    return { ...slot, ability, unlocked, isFlex };
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="character-panel-rpg" onClick={e => e.stopPropagation()}>

        <button className="rpg-close-btn" onClick={onClose}>X</button>

        {/* Header */}
        <div className="cpanel-header">
          <span className="cpanel-name">{playerStats.username}</span>
          <span className="cpanel-class" style={{ color: classData.color }}>
            {classData.name}
          </span>
          <span className="cpanel-level">Lv {playerStats.level}</span>
        </div>

        <div className="rpg-divider" />

        {/* Equipment Doll */}
        <div className="equip-doll-area">
          <div className="equip-column equip-column--left" style={{ height: dollSize }}>
            <EquipSlot label="Helm" item={null} locked />
            <EquipSlot label="Body" item={armorInfo} />
            <EquipSlot label="Boots" item={null} locked />
          </div>

          <div className="equip-doll-center">
            <PaperDollPreview
              appearance={appearance}
              equipment={playerStats.equipment}
              size={dollSize}
            />
          </div>

          <div className="equip-column equip-column--right">
            <EquipSlot label="Main" item={weaponInfo} />
            <EquipSlot label="Off" item={offHandInfo} />
          </div>
        </div>

        <div className="rpg-divider" />

        {/* HP and Mana Bars */}
        <div className="cpanel-bars">
          <div className="cpanel-bar-group">
            <span className="cpanel-bar-label">HP</span>
            <div className="rpg-bar">
              <div
                className="rpg-bar-fill rpg-bar-fill--hp"
                style={{ width: `${hpPercent}%` }}
              />
              <span className="rpg-bar-text">
                {playerStats.stats.hp} / {playerStats.stats.maxHp}
              </span>
            </div>
            {pts > 0 && (
              <button className="stat-plus-btn" onClick={() => onAllocateStat('hp')} title="+50 HP">+</button>
            )}
          </div>
          <div className="cpanel-bar-group">
            <span className="cpanel-bar-label">MP</span>
            <div className="rpg-bar">
              <div
                className="rpg-bar-fill rpg-bar-fill--mana"
                style={{ width: `${manaPercent}%` }}
              />
              <span className="rpg-bar-text">
                {playerStats.stats.mana} / {playerStats.stats.maxMana}
              </span>
            </div>
          </div>
        </div>

        <div className="rpg-divider" />

        {/* Unspent Points Banner */}
        {pts > 0 && (
          <div className="stat-points-banner">
            {pts} stat point{pts !== 1 ? 's' : ''} available
          </div>
        )}

        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-badge">
            <span className="stat-badge-value">{playerStats.stats.strength}</span>
            <span className="stat-badge-label">STR</span>
            {pts > 0 && (
              <button className="stat-plus-btn" onClick={() => onAllocateStat('strength')} title="+1 STR">+</button>
            )}
          </div>
          <div className="stat-badge">
            <span className="stat-badge-value">{playerStats.stats.agility}</span>
            <span className="stat-badge-label">AGI</span>
            {pts > 0 && (
              <button className="stat-plus-btn" onClick={() => onAllocateStat('agility')} title="+1 AGI">+</button>
            )}
          </div>
          <div className="stat-badge">
            <span className="stat-badge-value">{playerStats.stats.mindPower}</span>
            <span className="stat-badge-label">MIND</span>
            {pts > 0 && (
              <button className="stat-plus-btn" onClick={() => onAllocateStat('mindPower')} title="+1 MIND">+</button>
            )}
          </div>
        </div>

        <div className="rpg-divider" />

        {/* Ability Slots */}
        <div className="ability-slots-row">
          {abilitySlots.map(slot => (
            <div
              key={slot.key}
              className={`ability-slot ${slot.unlocked ? 'ability-slot--unlocked' : 'ability-slot--locked'}`}
              title={slot.ability ? `${slot.ability.name}: ${slot.ability.description}` : slot.isFlex ? 'Coming soon' : `Unlocks at Lv ${slot.unlockLevel}`}
            >
              <span className="ability-slot-type">{slot.label}</span>
              {slot.ability ? (
                <span className="ability-slot-name">{slot.ability.name}</span>
              ) : slot.isFlex ? (
                <span className="ability-slot-locked-text">TBD</span>
              ) : slot.unlocked ? (
                <span className="ability-slot-locked-text">--</span>
              ) : (
                <span className="ability-slot-locked-text">Lv {slot.unlockLevel}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EquipSlot({ label, item, locked }) {
  const cls = [
    'equip-slot',
    locked ? 'equip-slot--locked' : '',
    item ? 'equip-slot--filled' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={cls} title={item ? item.name : locked ? 'Locked' : 'Empty'}>
      {item ? (
        <span className="equip-slot-item-name">{item.name}</span>
      ) : locked ? (
        <span className="equip-slot-locked-icon">--</span>
      ) : (
        <span className="equip-slot-label">{label}</span>
      )}
    </div>
  );
}
