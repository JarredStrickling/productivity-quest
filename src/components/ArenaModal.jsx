import { useState, useEffect } from 'react';
import './BattleModal.css';
import { CLASS_CONFIG } from '../config/classes';
import { getClassAbilities, isAbilityUnlocked } from '../config/abilities';
import { MS_PATH, getCombatAppearancePaths, getAppearancePaths, getEffectiveAppearance, CLASS_DEFAULT_APPEARANCE } from '../config/appearance';
import { CLASS_DEFAULT_EQUIPMENT, EQUIPMENT_DATABASE, COMBAT_PAGE_MAP } from '../config/equipment';

// Side-view layout: party on left facing right, boss on right facing left
const PARTY_SLOTS = [
  { left: 20, top: 82 },
  { left: 13, top: 74 },
  { left: 24, top: 67 },
  { left: 15, top: 60 },
];

const ENEMY_SLOT = { left: 78, top: 70 };

// ── ANIMATION HELPERS ────────────────────────────────────────────────
// Returns { page, row, frames[], timings[], loop } for each animation state
function getAnimConfig(animation, combatType) {
  if (animation === 'attack') {
    if (combatType === 'bow') {
      // pBOW3 top half: 8-frame shoot-up, right-facing = row 2
      return { page: 3, row: 2, frames: [0,1,2,3,4,5,6,7], timings: [180,100,100,100,400,50,50,100], loop: false };
    }
    // pONE3/pPOL3 top-left: 4-frame slash, right-facing = row 2
    return { page: 3, row: 2, frames: [0,1,2,3], timings: [160,65,65,200], loop: false };
  }
  if (animation === 'hurt') {
    // Page 1: col 5 = hurt, cols 6-7 = knockdown, right-facing = row 2
    return { page: 1, row: 2, frames: [5,6,7], timings: [200,200,400], loop: false };
  }
  // idle: page 2 cols 0-3, 200ms each, loops
  return { page: 2, row: 2, frames: [0,1,2,3], timings: [200,200,200,200], loop: true };
}

// Total ms for an attack animation
function getAttackDuration(combatType) {
  if (combatType === 'bow') return 1080; // 180+100+100+100+400+50+50+100
  return 490; // 160+65+65+200 (sword & spear)
}

// Resolve combat type from a character's equipment
function getCombatTypeForCharacter(character) {
  const eq = character.equipment || CLASS_DEFAULT_EQUIPMENT[character.characterClass];
  if (eq?.weapon) {
    const item = EQUIPMENT_DATABASE[eq.weapon.itemId];
    if (item) return item.combatType;
  }
  return 'sword';
}

// ── ANIMATED SPRITE FRAME ────────────────────────────────────────────
function SpriteFrame({ characterClass, appearance, equipment, maxSize = 220, animation = 'idle' }) {
  const [frameIdx, setFrameIdx] = useState(0);

  const baseAppearance = appearance || CLASS_DEFAULT_APPEARANCE[characterClass];
  const effectiveEquipment = equipment || CLASS_DEFAULT_EQUIPMENT[characterClass] || null;

  // Determine combat type & idle page from weapon
  let combatType = null;
  let idlePage = null;
  if (effectiveEquipment?.weapon) {
    const weaponItem = EQUIPMENT_DATABASE[effectiveEquipment.weapon.itemId];
    if (weaponItem) {
      combatType = weaponItem.combatType;
      idlePage = COMBAT_PAGE_MAP[combatType]; // 'pONE2', 'pBOW2', 'pPOL2'
    }
  }

  // Animation config for current state
  const animConfig = getAnimConfig(animation, combatType);

  // Swap page number: 'pONE2' → 'pONE3' for attack, 'pONE1' for hurt
  let combatPage = idlePage;
  if (idlePage && animConfig.page !== 2) {
    combatPage = idlePage.slice(0, -1) + animConfig.page;
  }

  // Frame cycling effect
  useEffect(() => {
    setFrameIdx(0);
    const config = getAnimConfig(animation, combatType);

    if (config.loop) {
      const interval = setInterval(() => {
        setFrameIdx(prev => (prev + 1) % config.frames.length);
      }, config.timings[0]);
      return () => clearInterval(interval);
    } else {
      const timeouts = [];
      let elapsed = 0;
      for (let i = 1; i < config.frames.length; i++) {
        elapsed += config.timings[i - 1];
        const idx = i;
        timeouts.push(setTimeout(() => setFrameIdx(idx), elapsed));
      }
      return () => timeouts.forEach(clearTimeout);
    }
  }, [animation, combatType]);

  if (!baseAppearance) return null;

  // Build layer paths
  let paths, layerOrder;
  if (combatPage) {
    paths = getCombatAppearancePaths(baseAppearance, effectiveEquipment, combatPage);
    layerOrder = ['base', 'outfit', 'hair', 'hat', 'weapon', 'offHand'];
  } else {
    const effective = getEffectiveAppearance(baseAppearance, effectiveEquipment);
    paths = getAppearancePaths(effective);
    layerOrder = ['base', 'outfit', 'hair', 'hat'];
  }
  if (!paths) return null;

  const col = animConfig.frames[frameIdx] || 0;
  const row = animConfig.row;
  const scale = maxSize / 64;
  const sheetPx = Math.round(512 * scale);
  const xOffset = -col * maxSize;
  const yOffset = -row * maxSize;

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
              backgroundPosition: `${xOffset}px ${yOffset}px`,
              backgroundRepeat: 'no-repeat',
              imageRendering: 'pixelated',
            }}
          />
        );
      })}
    </div>
  );
}

// ── BATTLE CONFIG ────────────────────────────────────────────────────
const ORC_ENEMY = {
  name: 'Orc Warrior',
  maxHp: 800,
  hp: 800,
  icon: '🐗',
  agility: 5
};

function generateArenaTeam(playerStats) {
  const party = [];
  const playerClass = playerStats.characterClass;

  const playerMana = playerStats.stats.mana !== undefined
    ? playerStats.stats.mana
    : playerStats.stats.maxMana || (playerStats.stats.mindPower * 10);
  const playerMaxMana = playerStats.stats.maxMana || (playerStats.stats.mindPower * 10);

  const playerCombat = {
    id: 'player',
    name: playerStats.username,
    characterClass: playerClass,
    appearance: playerStats.appearance || null,
    equipment: playerStats.equipment || null,
    isAI: false,
    stats: {
      ...playerStats.stats,
      mana: playerMana,
      maxMana: playerMaxMana
    },
    alive: true
  };
  party.push(playerCombat);

  const requiredClasses = ['paladin', 'cleric'];
  const neededClasses = requiredClasses.filter(c => c !== playerClass);

  neededClasses.forEach((className, index) => {
    party.push(generateAITeammate(index + 1, className));
  });

  const availableClasses = ['warrior', 'mage', 'archer'];
  if (!neededClasses.includes('paladin')) availableClasses.push('paladin');
  if (!neededClasses.includes('cleric')) availableClasses.push('cleric');

  while (party.length < 4) {
    const randomClass = availableClasses[Math.floor(Math.random() * availableClasses.length)];
    party.push(generateAITeammate(party.length, randomClass));
  }

  party.sort((a, b) => b.stats.agility - a.stats.agility);
  return party;
}

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

// ── ARENA MODAL ──────────────────────────────────────────────────────
export default function ArenaModal({ isOpen, onClose, playerStats }) {
  const [battleState, setBattleState] = useState('intro');
  const [party, setParty] = useState([]);
  const [enemy, setEnemy] = useState({ ...ORC_ENEMY });
  const [currentTurn, setCurrentTurn] = useState(0);
  const [battleLog, setBattleLog] = useState([]);
  const [animating, setAnimating] = useState(false);
  const [showAbilityMenu, setShowAbilityMenu] = useState(false);
  const [showAbilityInfo, setShowAbilityInfo] = useState(null);
  const [attackingMemberId, setAttackingMemberId] = useState(null);

  // Initialize battle
  useEffect(() => {
    if (isOpen && party.length === 0) {
      const generatedParty = generateArenaTeam(playerStats);
      setParty(generatedParty);

      const playerIndex = generatedParty.findIndex(member => !member.isAI);
      setCurrentTurn(playerIndex >= 0 ? playerIndex : 0);

      setBattleLog(['Arena battle started! Defeat the Orc Warrior!']);
      setBattleState('active');
    }
  }, [isOpen, playerStats, party.length]);

  const currentCharacter = party[currentTurn];
  const isPlayerTurn = currentCharacter && !currentCharacter.isAI;

  const currentAbilities = currentCharacter
    ? Object.values(getClassAbilities(currentCharacter.characterClass))
        .filter(ability => isAbilityUnlocked(ability, 1))
        .sort((a, b) => a.slot - b.slot)
    : [];

  // ── PLAYER ATTACK ──────────────────────────────────────────────────
  const handleAttack = () => {
    if (animating || !currentCharacter) return;
    setAnimating(true);
    setShowAbilityMenu(false);

    // Play attack animation
    const cType = getCombatTypeForCharacter(currentCharacter);
    const duration = getAttackDuration(cType);
    setAttackingMemberId(currentCharacter.id);

    // Apply damage when animation finishes
    setTimeout(() => {
      setAttackingMemberId(null);

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
        }, 1000);
        return;
      }

      setTimeout(() => {
        if (!currentCharacter.isAI) {
          executeAITurns();
        } else {
          setAnimating(false);
        }
      }, 500);
    }, duration);
  };

  // ── PLAYER ABILITY ─────────────────────────────────────────────────
  const useAbility = (ability) => {
    if (animating || !currentCharacter || currentCharacter.stats.mana < ability.manaCost) return;
    setAnimating(true);
    setShowAbilityMenu(false);

    // Play attack animation
    const cType = getCombatTypeForCharacter(currentCharacter);
    const duration = getAttackDuration(cType);
    setAttackingMemberId(currentCharacter.id);

    setTimeout(() => {
      setAttackingMemberId(null);

      const newParty = [...party];
      const charIndex = party.findIndex(p => p.id === currentCharacter.id);
      newParty[charIndex].stats.mana -= ability.manaCost;

      if (ability.effect.type === 'damage') {
        const baseDamage = calculateDamage(ability, currentCharacter.stats);
        const hits = ability.effect.hits || 1;
        const totalDamage = baseDamage * hits;

        const newEnemy = { ...enemy };
        newEnemy.hp = Math.max(0, newEnemy.hp - totalDamage);
        setEnemy(newEnemy);
        addLog(`${currentCharacter.name} used ${ability.name}! Dealt ${totalDamage} damage!`);

        if (newEnemy.hp <= 0) {
          setTimeout(() => {
            setBattleState('victory');
            addLog('🎉 Victory! The Orc Warrior has been defeated!');
            setAnimating(false);
          }, 1000);
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
      }, 500);
    }, duration);
  };

  // ── AI TURNS ───────────────────────────────────────────────────────
  const executeAITurns = () => {
    if (!currentCharacter || currentCharacter.isAI) return;

    const aiTurns = [];
    for (let i = 1; i < party.length; i++) {
      const nextIndex = (currentTurn + i) % party.length;
      const character = party[nextIndex];
      if (character && character.isAI) {
        aiTurns.push({ character, index: nextIndex });
      } else {
        break;
      }
    }

    if (aiTurns.length === 0) {
      setCurrentTurn((currentTurn + 1) % party.length);
      return;
    }

    setAnimating(true);
    let currentAIIndex = 0;

    const executeNextAI = () => {
      if (currentAIIndex >= aiTurns.length) {
        const nextPlayerIndex = (aiTurns[aiTurns.length - 1].index + 1) % party.length;
        setCurrentTurn(nextPlayerIndex);
        setAnimating(false);
        return;
      }

      const { character, index } = aiTurns[currentAIIndex];
      setCurrentTurn(index);

      // Brief pause, then play attack animation
      setTimeout(() => {
        const cType = getCombatTypeForCharacter(character);
        const duration = getAttackDuration(cType);
        setAttackingMemberId(character.id);

        setTimeout(() => {
          setAttackingMemberId(null);

          // AI picks ability or basic attack
          const charAbilities = Object.values(getClassAbilities(character.characterClass))
            .filter(ab => isAbilityUnlocked(ab, 1))
            .sort((a, b) => a.slot - b.slot);
          const availableAbility = charAbilities.find(ab => character.stats.mana >= ab.manaCost);
          const baseDamage = Math.floor(character.stats.strength + (character.stats.agility * 0.5));

          if (availableAbility) {
            const abilityDamage = calculateDamage(availableAbility, character.stats);
            const hits = availableAbility.effect.hits || 1;
            const totalDamage = abilityDamage * hits;

            setParty(prev => {
              const newParty = [...prev];
              const ci = newParty.findIndex(p => p.id === character.id);
              if (ci >= 0) newParty[ci].stats.mana -= availableAbility.manaCost;
              return newParty;
            });

            setEnemy(prev => {
              const newHp = Math.max(0, prev.hp - totalDamage);
              if (newHp <= 0) {
                setTimeout(() => {
                  setBattleState('victory');
                  addLog('🎉 Victory! The Orc Warrior has been defeated!');
                  setAnimating(false);
                }, 1000);
              }
              return { ...prev, hp: newHp };
            });

            addLog(`${character.name} used ${availableAbility.name}! Dealt ${totalDamage} damage!`);
          } else {
            setEnemy(prev => {
              const newHp = Math.max(0, prev.hp - baseDamage);
              if (newHp <= 0) {
                setTimeout(() => {
                  setBattleState('victory');
                  addLog('🎉 Victory! The Orc Warrior has been defeated!');
                  setAnimating(false);
                }, 1000);
              }
              return { ...prev, hp: newHp };
            });
            addLog(`${character.name} attacked! Dealt ${baseDamage} damage!`);
          }

          // Next AI after brief pause
          setTimeout(() => {
            setEnemy(prev => {
              if (prev.hp > 0) {
                currentAIIndex++;
                executeNextAI();
              }
              return prev;
            });
          }, 500);
        }, duration);
      }, 300);
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
    setAttackingMemberId(null);
    onClose();
  };

  if (!isOpen) return null;

  const enemyHpPercent = (enemy.hp / enemy.maxHp) * 100;

  return (
    <div className="modal-overlay battle-overlay arena-overlay" onClick={handleClose}>
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
            const memberAnim = attackingMemberId === member.id ? 'attack' : 'idle';

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
                <SpriteFrame
                  characterClass={member.characterClass}
                  appearance={member.appearance}
                  equipment={member.equipment}
                  animation={memberAnim}
                />
              </div>
            );
          })}

          {/* Enemy on right side */}
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
