import './CharacterPanel.css';
import { CLASS_CONFIG } from '../config/classes';
import { getEquipmentDisplayInfo } from '../config/equipment';
import { CLASS_DEFAULT_APPEARANCE } from '../config/appearance';
import PaperDollPreview from './PaperDollPreview';

export default function CharacterPanel({ isOpen, onClose, playerStats }) {
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

  // Shrink doll on very short screens
  const dollSize = window.innerHeight < 580 ? 128 : 160;

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

        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-badge">
            <span className="stat-badge-value">{playerStats.stats.strength}</span>
            <span className="stat-badge-label">STR</span>
          </div>
          <div className="stat-badge">
            <span className="stat-badge-value">{playerStats.stats.agility}</span>
            <span className="stat-badge-label">AGI</span>
          </div>
          <div className="stat-badge">
            <span className="stat-badge-value">{playerStats.stats.mindPower}</span>
            <span className="stat-badge-label">MIND</span>
          </div>
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
