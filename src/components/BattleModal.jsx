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

  // Initialize battle
  useEffect(() => {
    if (isOpen && party.length === 0) {
      // Create party: player + 3 AI teammates
      const playerCombat = {
        id: 'player',
        name: playerStats.username,
        characterClass: playerStats.characterClass,
        isAI: false,
        stats: { ...playerStats.stats },
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

  // Get available abilities for current character
  const currentAbilities = currentCharacter
    ? Object.values(getClassAbilities(currentCharacter.characterClass))
        .filter(ability => isAbilityUnlocked(ability, 1)) // Level 1 for MVP
        .sort((a, b) => a.slot - b.slot)
    : [];

  // Handle ability use
  const useAbility = (ability) => {
    if (animating || !currentCharacter || currentCharacter.stats.mana < ability.manaCost) {
      return;
    }

    setAnimating(true);

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
      // Simple AI: use first available ability
      setTimeout(() => {
        const availableAbility = currentAbilities.find(
          ab => currentCharacter.stats.mana >= ab.manaCost
        );
        if (availableAbility) {
          useAbility(availableAbility);
        } else {
          // Skip turn if no mana
          addLog(`${currentCharacter.name} is out of mana!`);
          nextTurn();
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
        {/* Boss Section */}
        <div className="boss-section">
          <h2 className="boss-name">{boss.icon} {boss.name}</h2>
          <div className="boss-hp-container">
            <span className="boss-hp-text">{boss.hp} / {boss.maxHp}</span>
            <div className="boss-hp-bar">
              <div
                className="boss-hp-fill"
                style={{ width: `${bossHpPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Party Section */}
        <div className="party-section">
          {party.map((member, index) => {
            const classData = CLASS_CONFIG[member.characterClass];
            const hpPercent = (member.stats.hp / member.stats.maxHp) * 100;
            const manaPercent = (member.stats.mana / member.stats.maxMana) * 100;
            const isCurrentTurn = index === currentTurn;

            return (
              <div
                key={member.id}
                className={`party-member ${isCurrentTurn ? 'active-turn' : ''}`}
              >
                <div className="member-icon" style={{ color: classData.color }}>
                  {classData.icon}
                </div>
                <div className="member-info">
                  <div className="member-name">{member.name}</div>
                  <div className="member-bars">
                    <div className="mini-bar hp-mini">
                      <div
                        className="mini-bar-fill hp-fill"
                        style={{ width: `${hpPercent}%` }}
                      />
                      <span className="mini-bar-text">{member.stats.hp}</span>
                    </div>
                    <div className="mini-bar mana-mini">
                      <div
                        className="mini-bar-fill mana-fill"
                        style={{ width: `${manaPercent}%` }}
                      />
                      <span className="mini-bar-text">{member.stats.mana}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Battle Log */}
        <div className="battle-log">
          {battleLog.map((log, index) => (
            <div key={index} className="log-entry">{log}</div>
          ))}
        </div>

        {/* Ability Buttons */}
        {battleState === 'active' && isPlayerTurn && (
          <div className="ability-buttons">
            {currentAbilities.map(ability => {
              const canUse = currentCharacter.stats.mana >= ability.manaCost && !animating;
              return (
                <button
                  key={ability.id}
                  className={`ability-btn ${!canUse ? 'disabled' : ''}`}
                  onClick={() => canUse && useAbility(ability)}
                  disabled={!canUse}
                >
                  <span className="ability-btn-icon">{ability.icon}</span>
                  <span className="ability-btn-name">{ability.name}</span>
                  {ability.manaCost > 0 && (
                    <span className="ability-btn-cost">💧 {ability.manaCost}</span>
                  )}
                </button>
              );
            })}
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
