import './CharacterPanel.css';
import { CLASS_CONFIG } from '../config/classes';
import { getEquipmentDisplayInfo } from '../config/equipment';

export default function CharacterPanel({ isOpen, onClose, playerStats }) {
  if (!isOpen) return null;

  const classData = CLASS_CONFIG[playerStats.characterClass];
  const weaponInfo = getEquipmentDisplayInfo(playerStats.equipment?.weapon);
  const offHandInfo = getEquipmentDisplayInfo(playerStats.equipment?.offHand);
  const armorInfo = getEquipmentDisplayInfo(playerStats.equipment?.armor);

  if (!classData) {
    return null; // Safety check
  }

  const hpPercent = (playerStats.stats.hp / playerStats.stats.maxHp) * 100;
  const manaPercent = (playerStats.stats.mana / playerStats.stats.maxMana) * 100;
  const xpPercent = (playerStats.xp / playerStats.xpToNextLevel) * 100;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content character-panel" onClick={e => e.stopPropagation()}>
        <div className="panel-header">
          <div className="header-left">
            <div className="class-icon-display" style={{ color: classData.color }}>
              {classData.icon}
            </div>
            <div>
              <h2 className="character-name">{playerStats.username}</h2>
              <div className="character-class" style={{ color: classData.color }}>
                {classData.name} • Level {playerStats.level}
              </div>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* XP Progress */}
        <div className="xp-section">
          <div className="xp-header">
            <span>Experience</span>
            <span>{playerStats.xp} / {playerStats.xpToNextLevel} XP</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill xp-fill"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>

        {/* HP and Mana Bars */}
        <div className="resource-bars">
          <div className="resource-section">
            <div className="resource-header">
              <span>Health</span>
              <span>{playerStats.stats.hp} / {playerStats.stats.maxHp}</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill hp-fill"
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          <div className="resource-section">
            <div className="resource-header">
              <span>Mana</span>
              <span>{playerStats.stats.mana} / {playerStats.stats.maxMana}</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill mana-fill"
                style={{ width: `${manaPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Core Stats */}
        <div className="stats-section">
          <h3>Core Stats</h3>
          <div className="stats-grid-panel">
            <div className="stat-box">
              <div className="stat-icon">💪</div>
              <div className="stat-label">Strength</div>
              <div className="stat-value-large">{playerStats.stats.strength}</div>
            </div>
            <div className="stat-box">
              <div className="stat-icon">⚡</div>
              <div className="stat-label">Agility</div>
              <div className="stat-value-large">{playerStats.stats.agility}</div>
            </div>
            <div className="stat-box">
              <div className="stat-icon">🧠</div>
              <div className="stat-label">Mind Power</div>
              <div className="stat-value-large">{playerStats.stats.mindPower}</div>
            </div>
          </div>
        </div>

        {/* Equipment */}
        <div className="equipment-section">
          <h3>Equipment</h3>
          <div className="equipment-grid">
            <div className="equipment-slot">
              <div className="slot-icon">{weaponInfo ? weaponInfo.icon : '⚔️'}</div>
              <div className="slot-label">Weapon</div>
              {weaponInfo ? (
                <div className="equipped-item">{weaponInfo.name}</div>
              ) : (
                <div className="empty-slot">Empty</div>
              )}
            </div>
            <div className="equipment-slot">
              <div className="slot-icon">{offHandInfo ? offHandInfo.icon : '🛡️'}</div>
              <div className="slot-label">Off-Hand</div>
              {offHandInfo ? (
                <div className="equipped-item">{offHandInfo.name}</div>
              ) : (
                <div className="empty-slot">Empty</div>
              )}
            </div>
            <div className="equipment-slot">
              <div className="slot-icon">{armorInfo ? armorInfo.icon : '👕'}</div>
              <div className="slot-label">Armor</div>
              {armorInfo ? (
                <div className="equipped-item">{armorInfo.name}</div>
              ) : (
                <div className="empty-slot">Empty</div>
              )}
            </div>
          </div>
        </div>

        {/* Inventory */}
        <div className="inventory-section">
          <h3>Inventory</h3>
          <div className="inventory-grid">
            {playerStats.inventory.length === 0 ? (
              <div className="empty-inventory">
                <div className="empty-icon">📦</div>
                <div>No items</div>
              </div>
            ) : (
              playerStats.inventory.map((item, index) => (
                <div key={index} className="inventory-item">
                  {item}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
