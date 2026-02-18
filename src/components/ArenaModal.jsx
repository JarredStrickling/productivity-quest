import { useState, useEffect } from 'react';
import './BattleModal.css';
import { CLASS_CONFIG } from '../config/classes';
import { getClassAbilities, isAbilityUnlocked } from '../config/abilities';
import { MS_PATH, getAppearancePaths, CLASS_DEFAULT_APPEARANCE } from '../config/appearance';

// Floor marker positions (% of arena container)
const PARTY_SLOTS = [
  { left: 20, top: 78 },
  { left: 70, top: 76 },
  { left: 25, top: 60 },
  { left: 65, top: 58 },
];

const ENEMY_SLOT = { left: 48, top: 38 };

// Renders a Mana Seed paper doll character (stacked layers)
// Accepts either a full appearance object or falls back to class defaults
function SpriteFrame({ characterClass, appearance, maxSize = 220 }) {
  const effectiveAppearance = appearance || CLASS_DEFAULT_APPEARANCE[characterClass];
  if (!effectiveAppearance) return null;

  const paths = getAppearancePaths(effectiveAppearance);
  const scale = maxSize / 64;
  const sheetPx = Math.round(512 * scale);
  const layerOrder = ['base', 'outfit', 'hair', 'hat'];

  return (
    <div style={{ position: 'relative', width: maxSize, height: maxSize }}>
      {layerOrder.map(layer => {
        const path = paths[layer];
        if (!path) return null;
        return (
          <div
            key={layer}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: maxSize,
              height: maxSize,
              backgroundImage: `url(${MS_PATH}/${path})`,
              backgroundSize: `${sheetPx}px ${sheetPx}px`,
              backgroundPosition: '0px 0px',
              backgroundRepeat: 'no-repeat',
              imageRendering: 'pixelated',
            }}
          />
        );
      })}
    </div>
  );
}

// Orc enemy configuration
const ORC_ENEMY = {
  name: 'Orc Warrior',
  maxHp: 800, // 2-3 min fight with 4 party members
  hp: 800,
  icon: '🐗',
  agility: 5 // Low agility, attacks last
};

// Generate team with required classes
function generateArenaTeam(playerStats) {
  const party = [];
  const playerClass = playerStats.characterClass;

  // Ensure maxMana is set correctly
  const playerMana = playerStats.stats.mana !== undefined
    ? playerStats.stats.mana
    : playerStats.stats.maxMana || (playerStats.stats.mindPower * 10);
  const playerMaxMana = playerStats.stats.maxMana || (playerStats.stats.mindPower * 10);

  // Add player (carry custom appearance for rendering)
  const playerCombat = {
    id: 'player',
    name: playerStats.username,
    characterClass: playerClass,
    appearance: playerStats.appearance || null,
    isAI: false,
    stats: {
      ...playerStats.stats,
      mana: playerMana,
      maxMana: playerMaxMana
    },
    alive: true
  };
  party.push(playerCombat);

  // Required classes that must be in party
  const requiredClasses = ['paladin', 'cleric'];
  const neededClasses = requiredClasses.filter(c => c !== playerClass);

  // Add required classes first
  neededClasses.forEach((className, index) => {
    party.push(generateAITeammate(index + 1, className));
  });

  // Fill remaining slots with random classes
  const availableClasses = ['warrior', 'mage', 'archer'];
  // If player is paladin or cleric, add one of the others
  if (!neededClasses.includes('paladin')) {
    availableClasses.push('paladin');
  }
  if (!neededClasses.includes('cleric')) {
    availableClasses.push('cleric');
  }

  while (party.length < 4) {
    const randomClass = availableClasses[Math.floor(Math.random() * availableClasses.length)];
    party.push(generateAITeammate(party.length, randomClass));
  }

  // Sort party by agility (highest first)
  party.sort((a, b) => b.stats.agility - a.stats.agility);

  return party;
}

// Generate AI teammate
function generateAITeammate(index, characterClass) {
  const classData = CLASS_CONFIG[characterClass];
  const maxMana = classData.baseStats.mindPower * 10;

  return {
    id: `ai_${index}`,
    name: `${classData.name} Ally`,
    characterClass,
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

export default function ArenaModal({ isOpen, onClose, playerStats }) {
  const [battleState, setBattleState] = useState('intro');
  const [party, setParty] = useState([]);
  const [enemy, setEnemy] = useState({ ...ORC_ENEMY });
  const [currentTurn, setCurrentTurn] = useState(0);
  const [battleLog, setBattleLog] = useState([]);
  const [animating, setAnimating] = useState(false);
  const [showAbilityMenu, setShowAbilityMenu] = useState(false);
  const [showAbilityInfo, setShowAbilityInfo] = useState(null);

  // Initialize battle
  useEffect(() => {
    if (isOpen && party.length === 0) {
      const generatedParty = generateArenaTeam(playerStats);
      setParty(generatedParty);

      // Find player's index after sorting by agility
      const playerIndex = generatedParty.findIndex(member => !member.isAI);
      setCurrentTurn(playerIndex >= 0 ? playerIndex : 0);

      setBattleLog(['Arena battle started! Defeat the Orc Warrior!']);
      setBattleState('active');
    }
  }, [isOpen, playerStats, party.length]);

  // Get current turn character
  const currentCharacter = party[currentTurn];
  const isPlayerTurn = currentCharacter && !currentCharacter.isAI;

  // Get available abilities for current character
  const currentAbilities = currentCharacter
    ? Object.values(getClassAbilities(currentCharacter.characterClass))
        .filter(ability => isAbilityUnlocked(ability, 1))
        .sort((a, b) => a.slot - b.slot)
    : [];

  // Handle basic attack
  const handleAttack = () => {
    if (animating || !currentCharacter) return;

    setAnimating(true);
    setShowAbilityMenu(false);

    const baseDamage = Math.floor(
      currentCharacter.stats.strength + (currentCharacter.stats.agility * 0.5)
    );

    const newEnemy = { ...enemy };
    newEnemy.hp = Math.max(0, newEnemy.hp - baseDamage);
    setEnemy(newEnemy);

    addLog(`${currentCharacter.name} attacked! Dealt ${baseDamage} damage!`);

    if (newEnemy.hp <= 0) {
      setTimeout(() => {
        setBattleState('victory');
        addLog('🎉 Victory! The Orc Warrior has been defeated!');
        setAnimating(false);
      }, 3000);
      return;
    }

    setTimeout(() => {
      if (!currentCharacter.isAI) {
        executeAITurns();
      } else {
        setAnimating(false);
      }
    }, 4500);
  };

  // Handle ability use
  const useAbility = (ability) => {
    if (animating || !currentCharacter || currentCharacter.stats.mana < ability.manaCost) {
      return;
    }

    setAnimating(true);
    setShowAbilityMenu(false);

    const newParty = [...party];
    const charIndex = party.findIndex(p => p.id === currentCharacter.id);
    newParty[charIndex].stats.mana -= ability.manaCost;

    if (ability.effect.type === 'damage') {
      const baseDamage = calculateDamage(ability, currentCharacter.stats);
      const hits = ability.effect.hits || 1;
      let totalDamage = baseDamage * hits;

      const newEnemy = { ...enemy };
      newEnemy.hp = Math.max(0, newEnemy.hp - totalDamage);
      setEnemy(newEnemy);

      addLog(`${currentCharacter.name} used ${ability.name}! Dealt ${totalDamage} damage!`);

      if (newEnemy.hp <= 0) {
        setTimeout(() => {
          setBattleState('victory');
          addLog('🎉 Victory! The Orc Warrior has been defeated!');
          setAnimating(false);
        }, 3000);
        setParty(newParty);
        return;
      }
    } else if (ability.effect.type === 'heal') {
      const healAmount = calculateDamage(ability, currentCharacter.stats);
      newParty[charIndex].stats.hp = Math.min(
        newParty[charIndex].stats.maxHp,
        newParty[charIndex].stats.hp + healAmount
      );
      addLog(`${currentCharacter.name} used ${ability.name}! Restored ${healAmount} HP!`);
    }

    setParty(newParty);

    setTimeout(() => {
      if (!currentCharacter.isAI) {
        executeAITurns();
      } else {
        setAnimating(false);
      }
    }, 4500);
  };

  // Execute all AI turns in sequence
  const executeAITurns = () => {
    if (!currentCharacter || currentCharacter.isAI) return;

    const aiTurns = [];

    // Collect all AI turns that come after the player
    for (let i = 1; i < party.length; i++) {
      const nextIndex = (currentTurn + i) % party.length;
      const character = party[nextIndex];

      if (character && character.isAI) {
        aiTurns.push({ character, index: nextIndex });
      } else {
        // Stop when we reach the next player turn
        break;
      }
    }

    if (aiTurns.length === 0) {
      // No AI turns, go back to player
      setCurrentTurn((currentTurn + 1) % party.length);
      return;
    }

    setAnimating(true);
    let currentAIIndex = 0;

    const executeNextAI = () => {
      if (currentAIIndex >= aiTurns.length) {
        // All AI turns done, find next player turn
        const nextPlayerIndex = (aiTurns[aiTurns.length - 1].index + 1) % party.length;
        setCurrentTurn(nextPlayerIndex);
        setAnimating(false);
        return;
      }

      const { character, index } = aiTurns[currentAIIndex];
      setCurrentTurn(index);

      setTimeout(() => {
        // Execute AI action
        const charAbilities = Object.values(getClassAbilities(character.characterClass))
          .filter(ability => isAbilityUnlocked(ability, 1))
          .sort((a, b) => a.slot - b.slot);

        const availableAbility = charAbilities.find(
          ab => character.stats.mana >= ab.manaCost
        );

        // Perform action
        const baseDamage = Math.floor(
          character.stats.strength + (character.stats.agility * 0.5)
        );

        if (availableAbility) {
          // Use ability
          const abilityDamage = calculateDamage(availableAbility, character.stats);
          const hits = availableAbility.effect.hits || 1;
          const totalDamage = abilityDamage * hits;

          setParty(prev => {
            const newParty = [...prev];
            const charIndex = newParty.findIndex(p => p.id === character.id);
            if (charIndex >= 0) {
              newParty[charIndex].stats.mana -= availableAbility.manaCost;
            }
            return newParty;
          });

          setEnemy(prev => {
            const newHp = Math.max(0, prev.hp - totalDamage);
            if (newHp <= 0) {
              setTimeout(() => {
                setBattleState('victory');
                addLog('🎉 Victory! The Orc Warrior has been defeated!');
                setAnimating(false);
              }, 2000);
            }
            return { ...prev, hp: newHp };
          });

          addLog(`${character.name} used ${availableAbility.name}! Dealt ${totalDamage} damage!`);
        } else {
          // Basic attack
          setEnemy(prev => {
            const newHp = Math.max(0, prev.hp - baseDamage);
            if (newHp <= 0) {
              setTimeout(() => {
                setBattleState('victory');
                addLog('🎉 Victory! The Orc Warrior has been defeated!');
                setAnimating(false);
              }, 2000);
            }
            return { ...prev, hp: newHp };
          });

          addLog(`${character.name} attacked! Dealt ${baseDamage} damage!`);
        }

        // Move to next AI after delay (only if enemy still alive)
        setTimeout(() => {
          setEnemy(prev => {
            if (prev.hp > 0) {
              currentAIIndex++;
              executeNextAI();
            }
            return prev;
          });
        }, 4500);
      }, 1000);
    };

    executeNextAI();
  };

  const addLog = (message) => {
    setBattleLog(prev => [message, ...prev].slice(0, 5));
  };

  const handleClose = () => {
    setParty([]);
    setEnemy({ ...ORC_ENEMY });
    setCurrentTurn(0);
    setBattleLog([]);
    setBattleState('intro');
    setAnimating(false);
    onClose();
  };

  if (!isOpen) return null;

  const enemyHpPercent = (enemy.hp / enemy.maxHp) * 100;

  return (
    <div className="modal-overlay battle-overlay" onClick={handleClose}>
      <div className="modal-content battle-modal arena-modal" onClick={e => e.stopPropagation()}>
        {/* Battle Arena with background */}
        <div className="battle-arena arena-background">
          {/* Party members on floor marker slots */}
          {party.map((member, index) => {
            const slot = PARTY_SLOTS[index];
            if (!slot) return null;
            const hpPercent = (member.stats.hp / member.stats.maxHp) * 100;
            const manaPercent = (member.stats.mana / member.stats.maxMana) * 100;
            const isActive = index === currentTurn;

            return (
              <div
                key={member.id}
                className={`arena-slot ${isActive ? 'arena-slot-active' : ''}`}
                style={{
                  left: `${slot.left}%`,
                  top: `${slot.top}%`,
                  zIndex: Math.round(slot.top),
                }}
              >
                <div className="arena-floating-bars">
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
                <SpriteFrame characterClass={member.characterClass} appearance={member.appearance} />
              </div>
            );
          })}

          {/* Enemy on upper floor marker */}
          <div
            className="arena-slot"
            style={{
              left: `${ENEMY_SLOT.left}%`,
              top: `${ENEMY_SLOT.top}%`,
              zIndex: Math.round(ENEMY_SLOT.top),
            }}
          >
            <div className="arena-floating-bars">
              <div className="sprite-name boss-name-tag">{enemy.name}</div>
              <div className="sprite-bar hp-bar boss-hp">
                <div
                  className="sprite-bar-fill hp-bar-fill"
                  style={{ width: `${enemyHpPercent}%` }}
                />
                <span className="sprite-bar-text">{enemy.hp} / {enemy.maxHp}</span>
              </div>
            </div>
            <img
              src="/assets/sprites/Baddiearena1.png"
              alt="Orc Warrior"
              className="arena-enemy-img"
            />
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
                const isShowingInfo = showAbilityInfo === ability.id;
                return (
                  <div key={ability.id} className="ability-wrapper">
                    <button
                      className={`ability-option ${!canUse ? 'disabled' : ''}`}
                      onClick={() => canUse && useAbility(ability)}
                      disabled={!canUse}
                    >
                      <span className="ability-icon">{ability.icon}</span>
                      <span className="ability-name">
                        {ability.name}
                        <button
                          className="ability-info-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowAbilityInfo(isShowingInfo ? null : ability.id);
                          }}
                        >
                          ℹ️
                        </button>
                      </span>
                      {ability.manaCost > 0 && (
                        <span className="ability-cost">💧 {ability.manaCost}</span>
                      )}
                    </button>
                    {isShowingInfo && (
                      <div className="ability-description">
                        {ability.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Victory Screen */}
        {battleState === 'victory' && (
          <div className="battle-result victory">
            <h2>🎉 Victory!</h2>
            <p>The Orc Warrior has been defeated!</p>
            <button onClick={handleClose} className="btn-primary">
              Return to Town
            </button>
          </div>
        )}

        {/* Close Button */}
        <button className="close-btn" onClick={handleClose}>
          ×
        </button>
      </div>
    </div>
  );
}
