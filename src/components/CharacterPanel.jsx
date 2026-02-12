import { useState } from 'react';
import './CharacterPanel.css';
import { CLASS_CONFIG } from '../config/classes';
import { getClassAbilities, isAbilityUnlocked } from '../config/abilities';

export default function CharacterPanel({ isOpen, onClose, playerStats }) {
  const [activeTab, setActiveTab] = useState('stats');

  if (!isOpen) return null;

  // Handle case where character hasn't been created yet
  if (!playerStats.characterClass || !playerStats.username) {
    return null;
  }

  const classData = CLASS_CONFIG[playerStats.characterClass];
  const hpPercent = playerStats.stats.maxHp > 0
    ? (playerStats.stats.hp / playerStats.stats.maxHp) * 100
    : 0;
  const manaPercent = playerStats.stats.maxMana > 0
    ? (playerStats.stats.mana / playerStats.stats.maxMana) * 100
    : 0;
  const xpPercent = (playerStats.xp / playerStats.xpToNextLevel) * 100;

  // Get abilities for this class
  const classAbilities = getClassAbilities(playerStats.characterClass);
  const abilitiesArray = Object.values(classAbilities).sort((a, b) => a.slot - b.slot);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content character-panel" onClick={e => e.stopPropagation()}>
        {/* Close button */}
        <button className="close-btn" onClick={onClose} aria-label="Close">
          ×
        </button>

        {/* Header - Character Identity */}
        <div className="character-header">
          <div className="character-icon" style={{ color: classData.color }}>
            {classData.icon}
          </div>
          <div className="character-info">
            <h2>{playerStats.username}</h2>
            <p className="character-class" style={{ color: classData.color }}>
              {classData.name}
            </p>
            <p className="character-level">Level {playerStats.level}</p>
          </div>
        </div>

        {/* XP Progress */}
        <div className="xp-section">
          <div className="xp-header">
            <span className="xp-label">Experience</span>
            <span className="xp-text">
              {playerStats.xp} / {playerStats.xpToNextLevel} XP
            </span>
          </div>
          <div className="xp-bar-container">
            <div
              className="xp-bar-fill"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            Stats
          </button>
          <button
            className={`tab-btn ${activeTab === 'abilities' ? 'active' : ''}`}
            onClick={() => setActiveTab('abilities')}
          >
            Abilities
          </button>
          <button
            className={`tab-btn ${activeTab === 'equipment' ? 'active' : ''}`}
            onClick={() => setActiveTab('equipment')}
          >
            Equipment
          </button>
          <button
            className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            Inventory
          </button>
        </div>

        {/* Stats Section */}
        {activeTab === 'stats' && (
        <div className="stats-section">
          <h3>Stats</h3>

          {/* HP Bar */}
          <div className="hp-section">
            <div className="hp-header">
              <span className="hp-label">❤️ Health</span>
              <span className="hp-text">
                {playerStats.stats.hp} / {playerStats.stats.maxHp}
              </span>
            </div>
            <div className="hp-bar-container">
              <div
                className="hp-bar-fill"
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          {/* Mana Bar */}
          <div className="mana-section">
            <div className="mana-header">
              <span className="mana-label">💧 Mana</span>
              <span className="mana-text">
                {playerStats.stats.mana} / {playerStats.stats.maxMana}
              </span>
            </div>
            <div className="mana-bar-container">
              <div
                className="mana-bar-fill"
                style={{ width: `${manaPercent}%` }}
              />
            </div>
          </div>

          {/* Other Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">⚔️</div>
              <div className="stat-info">
                <span className="stat-label">Strength</span>
                <span className="stat-value">{playerStats.stats.strength}</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⚡</div>
              <div className="stat-info">
                <span className="stat-label">Agility</span>
                <span className="stat-value">{playerStats.stats.agility}</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🔮</div>
              <div className="stat-info">
                <span className="stat-label">Mind Power</span>
                <span className="stat-value">{playerStats.stats.mindPower}</span>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Abilities Section */}
        {activeTab === 'abilities' && (
        <div className="abilities-section">
          <h3>Abilities</h3>
          <p className="abilities-description">
            Unlock new abilities as you level up! Basic (Lv1), Utility (Lv3), Ultimate (Lv15)
          </p>

          <div className="abilities-grid">
            {abilitiesArray.map((ability) => {
              const unlocked = isAbilityUnlocked(ability, playerStats.level);
              return (
                <div
                  key={ability.id}
                  className={`ability-card ${unlocked ? 'unlocked' : 'locked'}`}
                >
                  <div className="ability-header">
                    <span className="ability-icon">{ability.icon}</span>
                    <div className="ability-info">
                      <h4>{ability.name}</h4>
                      <span className="ability-slot">Slot {ability.slot}</span>
                    </div>
                  </div>

                  <p className="ability-description">{ability.description}</p>

                  <div className="ability-stats">
                    {ability.manaCost > 0 && (
                      <span className="ability-cost">💧 {ability.manaCost}</span>
                    )}
                    {ability.cooldown > 0 && (
                      <span className="ability-cooldown">⏱️ {ability.cooldown}T</span>
                    )}
                  </div>

                  {!unlocked && (
                    <div className="ability-locked-overlay">
                      <span>🔒 Level {ability.unlockLevel}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        )}

        {/* Equipment Section */}
        {activeTab === 'equipment' && (
        <div className="equipment-section">
          <h3>Equipment</h3>
          <div className="equipment-grid">
            <div className="equipment-slot">
              {playerStats.equipment.weapon ? (
                <span>{playerStats.equipment.weapon.name}</span>
              ) : (
                <>
                  <span className="slot-icon">🗡️</span>
                  <span className="slot-label">Weapon</span>
                </>
              )}
            </div>
            <div className="equipment-slot">
              {playerStats.equipment.armor ? (
                <span>{playerStats.equipment.armor.name}</span>
              ) : (
                <>
                  <span className="slot-icon">🛡️</span>
                  <span className="slot-label">Armor</span>
                </>
              )}
            </div>
            <div className="equipment-slot">
              {playerStats.equipment.accessory ? (
                <span>{playerStats.equipment.accessory.name}</span>
              ) : (
                <>
                  <span className="slot-icon">💍</span>
                  <span className="slot-label">Accessory</span>
                </>
              )}
            </div>
          </div>
        </div>
        )}

        {/* Inventory Section */}
        {activeTab === 'inventory' && (
        <div className="inventory-section">
          <h3>Inventory</h3>
          <div className="inventory-container">
            {playerStats.inventory.length === 0 ? (
              <div className="empty-inventory">
                <span className="empty-icon">📦</span>
                <p>No items yet</p>
                <small>Complete tasks to earn items!</small>
              </div>
            ) : (
              <div className="inventory-grid">
                {playerStats.inventory.map((item, index) => (
                  <div key={index} className="inventory-item">
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
