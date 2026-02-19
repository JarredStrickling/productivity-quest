import { useState, useEffect } from 'react';
import './BattleModal.css';
import { CLASS_CONFIG } from '../config/classes';
import { getClassAbilities, isAbilityUnlocked } from '../config/abilities';

// Boss configuration
const BOSS = {
  name: 'Doom-Scroll Hydra',
  maxHp: 2500,
  hp: 2500,
  icon: '🐉',
  moves: [
    { name: 'InstaSlam', damage: 150, target: 'tank' },
    { name: 'Tick Tock Pipe Bomb', damage: 100, target: 'random', delay: 2 },
    { name: 'Scrolls of Doom', damage: 40, target: 'all', hits: 4 },
    { name: 'Shred-it', manaBurn: 20, target: 'random' }
  ]
};

// Generate AI teammates
function generateAITeammate(index, playerClass) {
  const classes = ['paladin', 'warrior', 'mage', 'archer', 'cleric'];
  // Don't duplicate player class
  const availableClasses = classes.filter(c => c !== playerClass);
  const randomClass = availableClasses[Math.floor(Math.random() * availableClasses.length)];

  const classData = CLASS_CONFIG[randomClass];
  const maxMana = classData.baseStats.mindPower * 10;

  return {
    id: `ai_${index}`,
    name: `AI ${classData.name}`,
    characterClass: randomClass,
    isAI: true,
    stats: {
      hp: classData.baseStats.hp,
      maxHp: classData.baseStats.hp,
      mana: maxMana,
      maxMana: maxMana,
      strength: classData.baseStats.strength,
      agility: classData.baseStats.agility,
      mindPower: classData.baseStats.mindPower
    },
    alive: true
  };
}

// Calculate damage from ability
function calculateDamage(ability, casterStats) {
  const formula = ability.effect.formula;

  // Parse formula (e.g., "strength * 4" or "(agility * 3) + strength")
  let damage = 0;

  if (formula.includes('strength')) {
    const multiplier = parseFloat(formula.match(/strength\s*\*\s*(\d+\.?\d*)/)?.[1] || 1);
    damage += casterStats.strength * multiplier;
  }

  if (formula.includes('agility')) {
    const multiplier = parseFloat(formula.match(/agility\s*\*\s*(\d+\.?\d*)/)?.[1] || 1);
    damage += casterStats.agility * multiplier;
  }

  if (formula.includes('mindPower')) {
    const multiplier = parseFloat(formula.match(/mindPower\s*\*\s*(\d+\.?\d*)/)?.[1] || 1);
    damage += casterStats.mindPower * multiplier;
  }

  if (formula.includes('maxHp')) {
    const multiplier = parseFloat(formula.match(/maxHp\s*\*\s*(\d+\.?\d*)/)?.[1] || 1);
    damage += casterStats.maxHp * multiplier;
  }

  return Math.floor(damage);
}

export default function BattleModal({ isOpen, onClose, playerStats }) {
  const [battleState, setBattleState] = useState('intro'); // intro, active, victory, defeat
  const [party, setParty] = useState([]);
  const [boss, setBoss] = useState({ ...BOSS });
  const [currentTurn, setCurrentTurn] = useState(0);
  const [battleLog, setBattleLog] = useState([]);
  const [animating, setAnimating] = useState(false);
  const [showAbilityMenu, setShowAbilityMenu] = useState(false);

  // Initialize battle
  useEffect(() => {
    if (isOpen && party.length === 0) {
      // Ensure mana is set correctly (fix for 0 mana bug)
      const playerMana = playerStats.stats.mana !== undefined
        ? playerStats.stats.mana
        : playerStats.stats.maxMana || (playerStats.stats.mindPower * 10);

      const playerMaxMana = playerStats.stats.maxMana || (playerStats.stats.mindPower * 10);

      // Create party: player + 3 AI teammates
      const playerCombat = {
        id: 'player',
        name: playerStats.username,
        characterClass: playerStats.characterClass,
        isAI: false,
        stats: {
          ...playerStats.stats,
          mana: playerMana,
          maxMana: playerMaxMana
        },
        alive: true
      };

      const teammates = [
        generateAITeammate(1, playerStats.characterClass),
        generateAITeammate(2, playerStats.characterClass),
        generateAITeammate(3, playerStats.characterClass)
      ];

      setParty([playerCombat, ...teammates]);
      setBattleLog(['Battle started! Defeat the Doom-Scroll Hydra!']);
      setBattleState('active');
    }
  }, [isOpen, playerStats, party.length]);

  // Get current turn character
  const currentCharacter = party[currentTurn];
  const isPlayerTurn = currentCharacter && !currentCharacter.isAI;

  // Get available abilities for current character (use player level for unlocking)
  const playerLevel = playerStats.level || 1;
  const currentAbilities = currentCharacter
    ? Object.values(getClassAbilities(currentCharacter.characterClass))
        .filter(ability => isAbilityUnlocked(ability, currentCharacter.isAI ? 1 : playerLevel))
        .sort((a, b) => a.slot - b.slot)
    : [];

  // Handle basic attack (raw damage based on stats)
  const handleAttack = () => {
    if (animating || !currentCharacter) return;

    setAnimating(true);
    setShowAbilityMenu(false);

    // Calculate raw damage: strength + (agility * 0.5)
    const baseDamage = Math.floor(
      currentCharacter.stats.strength + (currentCharacter.stats.agility * 0.5)
    );

    // Apply damage to boss
    const newBoss = { ...boss };
    newBoss.hp = Math.max(0, newBoss.hp - baseDamage);
    setBoss(newBoss);

    addLog(`${currentCharacter.name} attacked! Dealt ${baseDamage} damage!`);

    // Check victory
    if (newBoss.hp <= 0) {
      setTimeout(() => {
        setBattleState('victory');
        addLog('🎉 Victory! The Doom-Scroll Hydra has been defeated!');
      }, 1000);
    }

    // Next turn after animation
    setTimeout(() => {
      setAnimating(false);
      nextTurn();
    }, 1500);
  };

  // Handle ability use
  const useAbility = (ability) => {
    if (animating || !currentCharacter || currentCharacter.stats.mana < ability.manaCost) {
      return;
    }

    setAnimating(true);
    setShowAbilityMenu(false);

    // Deduct mana
    const newParty = [...party];
    const charIndex = party.findIndex(p => p.id === currentCharacter.id);
    newParty[charIndex].stats.mana -= ability.manaCost;

    // Calculate damage/effect
    if (ability.effect.type === 'damage') {
      const baseDamage = calculateDamage(ability, currentCharacter.stats);
      const hits = ability.effect.hits || 1;
      let totalDamage = baseDamage * hits;

      // Apply damage to boss
      const newBoss = { ...boss };
      newBoss.hp = Math.max(0, newBoss.hp - totalDamage);
      setBoss(newBoss);

      addLog(`${currentCharacter.name} used ${ability.name}! Dealt ${totalDamage} damage!`);

      // Check victory
      if (newBoss.hp <= 0) {
        setTimeout(() => {
          setBattleState('victory');
          addLog('🎉 Victory! The Doom-Scroll Hydra has been defeated!');
        }, 1000);
      }
    } else if (ability.effect.type === 'heal') {
      const healAmount = calculateDamage(ability, currentCharacter.stats);
      // Heal self for MVP
      newParty[charIndex].stats.hp = Math.min(
        newParty[charIndex].stats.maxHp,
        newParty[charIndex].stats.hp + healAmount
      );
      addLog(`${currentCharacter.name} used ${ability.name}! Restored ${healAmount} HP!`);
    }

    setParty(newParty);

    // Next turn after animation
    setTimeout(() => {
      setAnimating(false);
      nextTurn();
    }, 1500);
  };

  // AI turn logic
  useEffect(() => {
    if (battleState === 'active' && currentCharacter && currentCharacter.isAI && !animating) {
      // Simple AI: try to use ability, otherwise attack
      setTimeout(() => {
        const availableAbility = currentAbilities.find(
          ab => currentCharacter.stats.mana >= ab.manaCost
        );
        if (availableAbility) {
          useAbility(availableAbility);
        } else {
          // Use basic attack if no mana
          handleAttack();
        }
      }, 1000);
    }
  }, [currentTurn, battleState, animating]);

  const addLog = (message) => {
    setBattleLog(prev => [message, ...prev].slice(0, 5));
  };

  const nextTurn = () => {
    setCurrentTurn(prev => (prev + 1) % party.length);
  };

  const handleClose = () => {
    // Reset battle
    setParty([]);
    setBoss({ ...BOSS });
    setCurrentTurn(0);
    setBattleLog([]);
    setBattleState('intro');
    setAnimating(false);
    onClose();
  };

  if (!isOpen) return null;

  const bossHpPercent = (boss.hp / boss.maxHp) * 100;

  return (
    <div className="modal-overlay battle-overlay" onClick={handleClose}>
      <div className="modal-content battle-modal" onClick={e => e.stopPropagation()}>
        {/* Battle Arena - Side View Layout */}
        <div className="battle-arena">
          {/* Party Side (Left) */}
          <div className="party-side">
            {party.map((member, index) => {
              const classData = CLASS_CONFIG[member.characterClass];
              const hpPercent = (member.stats.hp / member.stats.maxHp) * 100;
              const manaPercent = (member.stats.mana / member.stats.maxMana) * 100;
              const isCurrentTurn = index === currentTurn;

              return (
                <div
                  key={member.id}
                  className={`battle-sprite party-sprite ${isCurrentTurn ? 'active-turn' : ''}`}
                >
                  {/* Character Sprite */}
                  <div className="sprite-icon" style={{ color: classData.color }}>
                    {classData.icon}
                  </div>

                  {/* Floating Bars Above Sprite */}
                  <div className="floating-bars">
                    <div className="sprite-name">{member.name}</div>
                    <div className="sprite-bar hp-bar">
                      <div
                        className="sprite-bar-fill hp-bar-fill"
                        style={{ width: `${hpPercent}%` }}
                      />
                      <span className="sprite-bar-text">{member.stats.hp}</span>
                    </div>
                    <div className="sprite-bar mana-bar">
                      <div
                        className="sprite-bar-fill mana-bar-fill"
                        style={{ width: `${manaPercent}%` }}
                      />
                      <span className="sprite-bar-text">{member.stats.mana}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Boss Side (Right) */}
          <div className="boss-side">
            <div className="battle-sprite boss-sprite">
              {/* Boss Sprite */}
              <div className="sprite-icon boss-icon">
                {boss.icon}
              </div>

              {/* Floating Bars Above Boss */}
              <div className="floating-bars">
                <div className="sprite-name boss-name-tag">{boss.name}</div>
                <div className="sprite-bar hp-bar boss-hp">
                  <div
                    className="sprite-bar-fill hp-bar-fill"
                    style={{ width: `${bossHpPercent}%` }}
                  />
                  <span className="sprite-bar-text">{boss.hp} / {boss.maxHp}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Battle Log */}
        <div className="battle-log">
          {battleLog.map((log, index) => (
            <div key={index} className="log-entry">{log}</div>
          ))}
        </div>

        {/* Action Menu */}
        {battleState === 'active' && isPlayerTurn && !showAbilityMenu && (
          <div className="action-menu">
            <button
              className="menu-btn attack-btn"
              onClick={handleAttack}
              disabled={animating}
            >
              ⚔️ Attack
            </button>
            <button
              className="menu-btn ability-btn"
              onClick={() => setShowAbilityMenu(true)}
              disabled={animating}
            >
              ✨ Ability
            </button>
            <button
              className="menu-btn item-btn"
              disabled={true}
            >
              🎒 Item
            </button>
          </div>
        )}

        {/* Ability Submenu */}
        {battleState === 'active' && isPlayerTurn && showAbilityMenu && (
          <div className="ability-submenu">
            <div className="submenu-header">
              <span>Select Ability</span>
              <button
                className="back-btn"
                onClick={() => setShowAbilityMenu(false)}
              >
                ← Back
              </button>
            </div>
            <div className="ability-grid">
              {currentAbilities.map(ability => {
                const canUse = currentCharacter.stats.mana >= ability.manaCost && !animating;
                return (
                  <button
                    key={ability.id}
                    className={`ability-option ${!canUse ? 'disabled' : ''}`}
                    onClick={() => canUse && useAbility(ability)}
                    disabled={!canUse}
                  >
                    <span className="ability-icon">{ability.icon}</span>
                    <span className="ability-name">{ability.name}</span>
                    {ability.manaCost > 0 && (
                      <span className="ability-cost">💧 {ability.manaCost}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Victory/Defeat Screen */}
        {battleState === 'victory' && (
          <div className="battle-result victory">
            <h2>🎉 Victory!</h2>
            <p>The Doom-Scroll Hydra has been defeated!</p>
            <button onClick={handleClose} className="btn-primary">
              Return to Town
            </button>
          </div>
        )}

        {battleState === 'defeat' && (
          <div className="battle-result defeat">
            <h2>💀 Defeat</h2>
            <p>Your party has been defeated...</p>
            <button onClick={handleClose} className="btn-primary">
              Return to Town
            </button>
          </div>
        )}

        {/* Close Button (top right) */}
        <button className="close-btn" onClick={handleClose}>
          ×
        </button>
      </div>
    </div>
  );
}
