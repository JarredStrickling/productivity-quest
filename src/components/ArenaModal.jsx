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
  if (animation === 'dead') {
    // Page 1: col 7 = knockdown (lying down), hold on that frame
    return { page: 1, row: 2, frames: [7], timings: [1000], loop: true };
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
const ORC_SPRITES = {
  idle: '/assets/sprites/idleorc.png',
  attack: '/assets/sprites/orchitting.png',
  hurt: '/assets/sprites/orcgettinghit.png',
};

const ORC_ABILITIES = [
  {
    id: 'instaslam',
    name: 'Instaslam',
    damage: 75,
    manaCost: 10,
    target: 'single',
    description: 'A brutal slam on one target.',
  },
  {
    id: 'shreddit',
    name: 'Shreddit',
    damage: 38,
    manaCost: 20,
    target: 'single',
    stuns: true,
    description: 'Shreds a target, stunning them for one turn.',
  },
  {
    id: 'tiktok_pipe_bomb',
    name: 'TikTok Pipe Bomb',
    damage: 45,
    manaCost: 30,
    target: 'all',
    description: 'Explosive blast that hits the entire party.',
  },
];

const ORC_ENEMY = {
  name: 'Orc Warrior',
  maxHp: 8000,
  hp: 8000,
  mana: 50,
  maxMana: 50,
  icon: '🐗',
  agility: 5,
  damage: 23, // Basic melee when out of mana (was 15, 1.5x)
};

// Primary stat per class (AI gets 1 point here + 1 random per level gained)
const AI_PRIMARY_STAT = {
  paladin:  'hp',
  warrior:  'strength',
  mage:     'mindPower',
  archer:   'agility',
  cleric:   'mindPower',
};

function generateArenaTeam(playerStats) {
  const party = [];
  const playerClass = playerStats.characterClass;
  const playerLevel = playerStats.level || 1;

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

  // Build pool of classes excluding player's class (one of each, no duplicates)
  const usedClasses = new Set([playerClass]);

  // Always include paladin and cleric if player isn't one
  const requiredClasses = ['paladin', 'cleric'].filter(c => c !== playerClass);
  requiredClasses.forEach((className, index) => {
    usedClasses.add(className);
    party.push(generateAITeammate(index + 1, className, playerLevel));
  });

  // Fill remaining slots from unused classes
  const allClasses = ['paladin', 'warrior', 'mage', 'archer', 'cleric'];
  const availableClasses = allClasses.filter(c => !usedClasses.has(c));

  while (party.length < 4 && availableClasses.length > 0) {
    const idx = Math.floor(Math.random() * availableClasses.length);
    const picked = availableClasses.splice(idx, 1)[0];
    usedClasses.add(picked);
    party.push(generateAITeammate(party.length, picked, playerLevel));
  }

  party.sort((a, b) => b.stats.agility - a.stats.agility);
  return party;
}

function generateAITeammate(index, characterClass, level) {
  const classData = CLASS_CONFIG[characterClass];

  // Start with base stats, then allocate 2 points per level gained (same as player)
  const stats = {
    hp: classData.baseStats.hp,
    maxHp: classData.baseStats.hp,
    strength: classData.baseStats.strength,
    agility: classData.baseStats.agility,
    mindPower: classData.baseStats.mindPower,
  };

  const levelsGained = level - 1;
  const primaryStat = AI_PRIMARY_STAT[characterClass] || 'strength';
  const allStats = ['hp', 'strength', 'agility', 'mindPower'];

  for (let i = 0; i < levelsGained; i++) {
    // 1 point to primary stat
    if (primaryStat === 'hp') {
      stats.hp += 50;
      stats.maxHp += 50;
    } else {
      stats[primaryStat] += 1;
    }
    // 1 point to a random stat (can include primary)
    const randomStat = allStats[Math.floor(Math.random() * allStats.length)];
    if (randomStat === 'hp') {
      stats.hp += 50;
      stats.maxHp += 50;
    } else {
      stats[randomStat] += 1;
    }
  }

  const maxMana = stats.mindPower * 10;
  stats.mana = maxMana;
  stats.maxMana = maxMana;

  return {
    id: `ai_${index}`,
    name: `${classData.name} Ally`,
    characterClass,
    isAI: true,
    level,
    stats,
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
  const [enemyAnim, setEnemyAnim] = useState('idle');
  const [hurtMemberId, setHurtMemberId] = useState(null);
  const [allyTargetAbility, setAllyTargetAbility] = useState(null); // pending ability needing ally target

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

  const playerLevel = playerStats.level || 1;
  const currentAbilities = currentCharacter
    ? Object.values(getClassAbilities(currentCharacter.characterClass))
        .filter(ability => isAbilityUnlocked(ability, currentCharacter.isAI ? (currentCharacter.level || 1) : playerLevel))
        .sort((a, b) => a.slot - b.slot)
    : [];

  // ── DEAD/STUN SKIP: if current character is dead or stunned, skip turn ──
  useEffect(() => {
    if (battleState !== 'active' || !currentCharacter || animating) return;

    // Dead character — skip silently
    if (!currentCharacter.alive || currentCharacter.stats.hp <= 0) {
      if (!currentCharacter.isAI) {
        // Player is dead — run AI turns then enemy
        setAnimating(true);
        setTimeout(() => executeAITurns(), 300);
      } else {
        // Dead AI — advance to next
        setCurrentTurn(prev => (prev + 1) % party.length);
      }
      return;
    }

    // Stunned character — skip with message
    if (currentCharacter.stunned) {
      setAnimating(true);
      addLog(`${currentCharacter.name} is stunned and can't act!`);

      // Clear the stun
      setParty(prev => {
        const newParty = [...prev];
        const ci = newParty.findIndex(p => p.id === currentCharacter.id);
        if (ci >= 0) newParty[ci] = { ...newParty[ci], stunned: false };
        return newParty;
      });

      setTimeout(() => {
        if (!currentCharacter.isAI) {
          executeAITurns();
        } else {
          setAnimating(false);
          setCurrentTurn(prev => (prev + 1) % party.length);
        }
      }, 800);
    }
  }, [currentTurn, battleState, party]);

  // ── PLAYER ATTACK ──────────────────────────────────────────────────
  const handleAttack = () => {
    if (animating || !currentCharacter) return;
    setAnimating(true);
    setShowAbilityMenu(false);

    // 2-second pause after selection so the player can register the action
    setTimeout(() => {
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
        flashEnemyHurt();
        addLog(`${currentCharacter.name} attacked! Dealt ${baseDamage} damage!`);

        if (newEnemy.hp <= 0) {
          setTimeout(() => {
            setBattleState('victory');
            addLog('Victory! The Orc Warrior has been defeated!');
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
    }, 2000);
  };

  // ── PLAYER ABILITY ─────────────────────────────────────────────────
  const useAbility = (ability) => {
    if (animating || !currentCharacter || currentCharacter.stats.mana < ability.manaCost) return;

    // Heal and Revive need ally targeting — show selection UI first
    if (ability.effect.type === 'heal' || ability.effect.type === 'revive') {
      setShowAbilityMenu(false);
      setAllyTargetAbility(ability);
      return;
    }

    executeAbilityOnEnemy(ability);
  };

  // Execute an ability that targets the enemy (damage, etc.)
  const executeAbilityOnEnemy = (ability) => {
    setAnimating(true);
    setShowAbilityMenu(false);

    // 2-second pause after selection
    setTimeout(() => {
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
          flashEnemyHurt();
          addLog(`${currentCharacter.name} used ${ability.name}! Dealt ${totalDamage} damage!`);

          if (newEnemy.hp <= 0) {
            setTimeout(() => {
              setBattleState('victory');
              addLog('Victory! The Orc Warrior has been defeated!');
              setAnimating(false);
            }, 1000);
            setParty(newParty);
            return;
          }
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
    }, 2000);
  };

  // Execute a heal or revive on a chosen ally
  const executeAllyTargetAbility = (ability, targetId) => {
    setAllyTargetAbility(null);
    setAnimating(true);

    setTimeout(() => {
      const newParty = [...party];
      const charIndex = party.findIndex(p => p.id === currentCharacter.id);
      const targetIndex = newParty.findIndex(p => p.id === targetId);
      newParty[charIndex].stats.mana -= ability.manaCost;

      if (ability.effect.type === 'heal') {
        const healAmount = calculateDamage(ability, currentCharacter.stats);
        const target = newParty[targetIndex];
        const newHp = Math.min(target.stats.maxHp, target.stats.hp + healAmount);
        newParty[targetIndex] = {
          ...target,
          stats: { ...target.stats, hp: newHp }
        };
        addLog(`${currentCharacter.name} healed ${target.name} for ${healAmount} HP!`);
      } else if (ability.effect.type === 'revive') {
        const target = newParty[targetIndex];
        const reviveHp = Math.floor(target.stats.maxHp * (ability.effect.hpPercent || 0.5));
        newParty[targetIndex] = {
          ...target,
          alive: true,
          stats: { ...target.stats, hp: reviveHp }
        };
        addLog(`${currentCharacter.name} used ${ability.name}! ${target.name} revived with ${reviveHp} HP!`);
      }

      setParty(newParty);

      setTimeout(() => {
        if (!currentCharacter.isAI) {
          executeAITurns();
        } else {
          setAnimating(false);
        }
      }, 500);
    }, 1000);
  };

  // ── AI TURNS ───────────────────────────────────────────────────────
  const executeAITurns = () => {
    if (!currentCharacter || currentCharacter.isAI) return;

    const aiTurns = [];
    for (let i = 1; i < party.length; i++) {
      const nextIndex = (currentTurn + i) % party.length;
      const character = party[nextIndex];
      if (character && character.isAI) {
        // Skip dead or stunned AI (stunned will be cleared by the effect)
        if (character.alive && character.stats.hp > 0) {
          aiTurns.push({ character, index: nextIndex });
        }
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
        // Enemy attacks after all party members have acted
        executeEnemyAttack(nextPlayerIndex);
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
            .filter(ab => isAbilityUnlocked(ab, character.level || 1))
            .sort((a, b) => a.slot - b.slot);
          const baseDamage = Math.floor(character.stats.strength + (character.stats.agility * 0.5));

          // AI support logic: cleric heals/revives allies
          const reviveAbility = charAbilities.find(ab => ab.effect.type === 'revive' && character.stats.mana >= ab.manaCost);
          const healAbility = charAbilities.find(ab => ab.effect.type === 'heal' && character.stats.mana >= ab.manaCost);

          // Check for dead allies to revive
          let usedSupportAbility = false;
          if (reviveAbility) {
            const deadAllies = party.filter(m => m.id !== character.id && (!m.alive || m.stats.hp <= 0));
            if (deadAllies.length > 0) {
              const target = deadAllies[0];
              const reviveHp = Math.floor(target.stats.maxHp * (reviveAbility.effect.hpPercent || 0.5));
              setParty(prev => {
                const np = [...prev];
                const ci = np.findIndex(p => p.id === character.id);
                const ti = np.findIndex(p => p.id === target.id);
                if (ci >= 0) np[ci] = { ...np[ci], stats: { ...np[ci].stats, mana: np[ci].stats.mana - reviveAbility.manaCost } };
                if (ti >= 0) np[ti] = { ...np[ti], alive: true, stats: { ...np[ti].stats, hp: reviveHp } };
                return np;
              });
              addLog(`${character.name} used ${reviveAbility.name}! ${target.name} revived with ${reviveHp} HP!`);
              usedSupportAbility = true;
            }
          }

          // Heal lowest HP ally if someone is below 50%
          if (!usedSupportAbility && healAbility) {
            const hurtAllies = party.filter(m => m.id !== character.id && m.alive && m.stats.hp > 0 && m.stats.hp < m.stats.maxHp * 0.5);
            if (hurtAllies.length > 0) {
              const target = hurtAllies.sort((a, b) => a.stats.hp - b.stats.hp)[0];
              const healAmount = calculateDamage(healAbility, character.stats);
              setParty(prev => {
                const np = [...prev];
                const ci = np.findIndex(p => p.id === character.id);
                const ti = np.findIndex(p => p.id === target.id);
                if (ci >= 0) np[ci] = { ...np[ci], stats: { ...np[ci].stats, mana: np[ci].stats.mana - healAbility.manaCost } };
                if (ti >= 0) np[ti] = { ...np[ti], stats: { ...np[ti].stats, hp: Math.min(np[ti].stats.maxHp, np[ti].stats.hp + healAmount) } };
                return np;
              });
              addLog(`${character.name} healed ${target.name} for ${healAmount} HP!`);
              usedSupportAbility = true;
            }
          }

          if (!usedSupportAbility) {
            // Damage ability or basic attack
            const damageAbility = charAbilities.find(ab => ab.effect.type === 'damage' && character.stats.mana >= ab.manaCost);

            if (damageAbility) {
              const abilityDamage = calculateDamage(damageAbility, character.stats);
              const hits = damageAbility.effect.hits || 1;
              const totalDamage = abilityDamage * hits;

              setParty(prev => {
                const newParty = [...prev];
                const ci = newParty.findIndex(p => p.id === character.id);
                if (ci >= 0) newParty[ci].stats.mana -= damageAbility.manaCost;
                return newParty;
              });

              flashEnemyHurt();
              setEnemy(prev => {
                const newHp = Math.max(0, prev.hp - totalDamage);
                if (newHp <= 0) {
                  setTimeout(() => {
                    setBattleState('victory');
                    addLog('Victory! The Orc Warrior has been defeated!');
                    setAnimating(false);
                  }, 1000);
                }
                return { ...prev, hp: newHp };
              });

              addLog(`${character.name} used ${damageAbility.name}! Dealt ${totalDamage} damage!`);
            } else {
              flashEnemyHurt();
              setEnemy(prev => {
                const newHp = Math.max(0, prev.hp - baseDamage);
                if (newHp <= 0) {
                  setTimeout(() => {
                    setBattleState('victory');
                    addLog('Victory! The Orc Warrior has been defeated!');
                    setAnimating(false);
                  }, 1000);
                }
                return { ...prev, hp: newHp };
              });
              addLog(`${character.name} attacked! Dealt ${baseDamage} damage!`);
            }
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

  // ── FLASH ORC HURT ────────────────────────────────────────────────
  const flashEnemyHurt = (duration = 600) => {
    setEnemyAnim('hurt');
    setTimeout(() => setEnemyAnim('idle'), duration);
  };

  // ── INTELLIGENT ENEMY AI ─────────────────────────────────────────────
  // Picks an ability based on mana, party state, and weighted randomness.
  // Returns an ability object or null (basic melee fallback).
  const pickOrcAbility = (currentEnemy, aliveMembers) => {
    const affordable = ORC_ABILITIES.filter(a => currentEnemy.mana >= a.manaCost);
    if (affordable.length === 0) return null;

    // Build weighted scores for each affordable ability
    const scored = affordable.map(ability => {
      let weight = 10; // base weight

      if (ability.target === 'all') {
        // AoE is better with more targets alive
        weight += aliveMembers.length * 6;
        // Extra weight if several members are low-ish HP
        const lowHpCount = aliveMembers.filter(m => m.stats.hp < m.stats.maxHp * 0.4).length;
        if (lowHpCount >= 2) weight += 10;
      }

      if (ability.stuns) {
        // Prefer stunning un-stunned, high-threat targets
        const unstunned = aliveMembers.filter(m => !m.stunned);
        if (unstunned.length > 0) weight += 12;
        // Less valuable if most are already stunned
        const stunnedCount = aliveMembers.filter(m => m.stunned).length;
        weight -= stunnedCount * 4;
      }

      if (ability.id === 'instaslam') {
        // Great for finishing off low-HP targets
        const finishable = aliveMembers.filter(m => m.stats.hp <= ability.damage);
        if (finishable.length > 0) weight += 15;
        // Cheap — mild bonus when mana is low
        if (currentEnemy.mana <= 20) weight += 8;
      }

      // Add randomness (±30% swing) so it's not perfectly predictable
      weight *= 0.7 + Math.random() * 0.6;

      return { ability, weight };
    });

    // Pick the highest scored ability
    scored.sort((a, b) => b.weight - a.weight);
    return scored[0].ability;
  };

  // ── ENEMY ATTACK PHASE ──────────────────────────────────────────────
  const executeEnemyAttack = (nextPlayerIndex) => {
    setAnimating(true);

    // Brief pause before enemy acts
    setTimeout(() => {
      // Show orc attack animation
      setEnemyAnim('attack');

      setTimeout(() => {
        const aliveMembers = party.filter(m => m.alive && m.stats.hp > 0);
        if (aliveMembers.length === 0) {
          setEnemyAnim('idle');
          setAnimating(false);
          return;
        }

        const chosenAbility = pickOrcAbility(enemy, aliveMembers);

        if (chosenAbility && chosenAbility.target === 'all') {
          // ── AoE: TikTok Pipe Bomb ──
          const dmg = chosenAbility.damage + Math.floor(Math.random() * 6 - 3); // ±3

          // Deduct mana
          setEnemy(prev => ({ ...prev, mana: prev.mana - chosenAbility.manaCost }));

          // Flash hurt on all members (we'll flash them sequentially via a brief stagger)
          setHurtMemberId('all');

          setParty(prev => {
            const newParty = [...prev];
            newParty.forEach((m, i) => {
              if (m.alive && m.stats.hp > 0) {
                newParty[i] = {
                  ...m,
                  stats: { ...m.stats, hp: Math.max(0, m.stats.hp - dmg) }
                };
                if (newParty[i].stats.hp <= 0) newParty[i].alive = false;
              }
            });
            return newParty;
          });

          addLog(`${enemy.name} used ${chosenAbility.name}! Hit everyone for ${dmg} damage!`);

        } else if (chosenAbility) {
          // ── Single-target ability (Instaslam or Shreddit) ──
          let target;
          if (chosenAbility.stuns) {
            // Prefer stunning un-stunned targets; pick randomly among them
            const unstunned = aliveMembers.filter(m => !m.stunned);
            const pool = unstunned.length > 0 ? unstunned : aliveMembers;
            target = pool[Math.floor(Math.random() * pool.length)];
          } else if (chosenAbility.id === 'instaslam') {
            // Prefer finishing off low-HP targets
            const finishable = aliveMembers.filter(m => m.stats.hp <= chosenAbility.damage);
            const pool = finishable.length > 0 ? finishable : aliveMembers;
            target = pool[Math.floor(Math.random() * pool.length)];
          } else {
            target = aliveMembers[Math.floor(Math.random() * aliveMembers.length)];
          }

          const dmg = chosenAbility.damage + Math.floor(Math.random() * 6 - 3);

          // Deduct mana
          setEnemy(prev => ({ ...prev, mana: prev.mana - chosenAbility.manaCost }));

          setHurtMemberId(target.id);

          setParty(prev => {
            const newParty = [...prev];
            const ti = newParty.findIndex(p => p.id === target.id);
            if (ti >= 0) {
              newParty[ti] = {
                ...newParty[ti],
                stats: { ...newParty[ti].stats, hp: Math.max(0, newParty[ti].stats.hp - dmg) },
                stunned: chosenAbility.stuns ? true : newParty[ti].stunned,
              };
              if (newParty[ti].stats.hp <= 0) newParty[ti].alive = false;
            }
            return newParty;
          });

          const stunMsg = chosenAbility.stuns ? ` ${target.name} is stunned!` : '';
          addLog(`${enemy.name} used ${chosenAbility.name} on ${target.name}! ${dmg} damage!${stunMsg}`);

        } else {
          // ── Basic melee (out of mana) ──
          const target = aliveMembers[Math.floor(Math.random() * aliveMembers.length)];
          const dmg = enemy.damage + Math.floor(Math.random() * 6 - 3);

          setHurtMemberId(target.id);

          setParty(prev => {
            const newParty = [...prev];
            const ti = newParty.findIndex(p => p.id === target.id);
            if (ti >= 0) {
              newParty[ti] = {
                ...newParty[ti],
                stats: { ...newParty[ti].stats, hp: Math.max(0, newParty[ti].stats.hp - dmg) }
              };
              if (newParty[ti].stats.hp <= 0) newParty[ti].alive = false;
            }
            return newParty;
          });

          addLog(`${enemy.name} attacks ${target.name}! ${dmg} damage!`);
        }

        // Check party wipe after damage resolves
        setTimeout(() => {
          setEnemyAnim('idle');
          setHurtMemberId(null);

          setParty(prev => {
            const anyAlive = prev.some(m => m.stats.hp > 0);
            if (!anyAlive) {
              setTimeout(() => {
                setBattleState('defeat');
                addLog('Your party has been defeated...');
                setAnimating(false);
              }, 500);
            } else {
              setCurrentTurn(nextPlayerIndex);
              setAnimating(false);
            }
            return prev;
          });
        }, 800);
      }, 600); // Attack animation duration
    }, 400); // Pre-attack pause
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
    setShowAbilityMenu(false);
    setShowAbilityInfo(null);
    setAllyTargetAbility(null);
    setAttackingMemberId(null);
    setEnemyAnim('idle');
    setHurtMemberId(null);
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
            const isDead = !member.alive || member.stats.hp <= 0;
            const isHurt = hurtMemberId === member.id || hurtMemberId === 'all';
            const memberAnim = isDead ? 'dead'
              : attackingMemberId === member.id ? 'attack'
              : isHurt ? 'hurt' : 'idle';

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
                  <div className="sprite-name">
                    {member.name}
                    {member.stunned && <span className="stun-badge"> STUN</span>}
                  </div>
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
              <div className="sprite-bar mana-bar">
                <div
                  className="sprite-bar-fill mana-bar-fill"
                  style={{ width: `${(enemy.mana / enemy.maxMana) * 100}%` }}
                />
                <span className="sprite-bar-text">{enemy.mana}</span>
              </div>
            </div>
            <img
              src={ORC_SPRITES[enemyAnim]}
              alt="Orc Warrior"
              className={`arena-enemy-img ${enemyAnim !== 'idle' ? 'arena-enemy-' + enemyAnim : ''}`}
            />
          </div>
        </div>

        {/* Battle Log */}
        <div className="battle-log">
          {battleLog.map((log, index) => (
            <div key={index} className="log-entry">{log}</div>
          ))}
        </div>

        {/* Action Menu — only for living player */}
        {battleState === 'active' && isPlayerTurn && !showAbilityMenu && !allyTargetAbility
          && currentCharacter?.alive && currentCharacter?.stats.hp > 0 && (
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

        {/* Ally Target Selection (for Heal / Resurrection) */}
        {battleState === 'active' && isPlayerTurn && allyTargetAbility && (
          <div className="ability-submenu">
            <div className="submenu-header">
              <span>
                {allyTargetAbility.effect.type === 'revive'
                  ? 'Revive who?'
                  : 'Heal who?'}
              </span>
              <button
                className="back-btn"
                onClick={() => setAllyTargetAbility(null)}
              >
                ← Back
              </button>
            </div>
            <div className="ability-grid">
              {party
                .filter(m => {
                  if (allyTargetAbility.effect.type === 'revive') {
                    return !m.alive || m.stats.hp <= 0;
                  }
                  // Heal: alive allies (not self, or self if desired — let's allow any alive ally)
                  return m.alive && m.stats.hp > 0;
                })
                .map(member => {
                  const hpText = allyTargetAbility.effect.type === 'revive'
                    ? 'DEAD'
                    : `${member.stats.hp}/${member.stats.maxHp}`;
                  return (
                    <button
                      key={member.id}
                      className="ability-option"
                      onClick={() => executeAllyTargetAbility(allyTargetAbility, member.id)}
                    >
                      <span className="ability-icon">
                        {CLASS_CONFIG[member.characterClass]?.icon || '?'}
                      </span>
                      <span className="ability-name">{member.name}</span>
                      <span className="ability-cost">{hpText}</span>
                    </button>
                  );
                })}
              {party.filter(m => {
                if (allyTargetAbility.effect.type === 'revive') return !m.alive || m.stats.hp <= 0;
                return m.alive && m.stats.hp > 0;
              }).length === 0 && (
                <div style={{ color: '#cbd5e1', textAlign: 'center', padding: '12px' }}>
                  No valid targets
                </div>
              )}
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
