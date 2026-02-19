import { useEffect, useRef, useState } from 'react'
import Phaser from 'phaser'
import MainScene from './scenes/MainScene'
import TaskSubmissionModal from './components/TaskSubmissionModal'
import CharacterCreationModal from './components/CharacterCreationModal'
import CharacterPanel from './components/CharacterPanel'
import BattleModal from './components/BattleModal'
import TitleScreen from './components/TitleScreen'
import SimpleHUD from './components/SimpleHUD'
import MainMenu from './components/MainMenu'
import WeeklyQuestsModal from './components/WeeklyQuestsModal'
import ArenaModal from './components/ArenaModal'
import DungeonConfirm from './components/DungeonConfirm'
import { getXpForNextLevel, calculateLevelUp } from './config/levelingSystem'
import { CLASS_DEFAULT_EQUIPMENT } from './config/equipment'
import './App.css'

function App() {
  const gameRef = useRef(null)
  const gameInstanceRef = useRef(null)
  const handleTaskSubmitRef = useRef(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showCharacterCreation, setShowCharacterCreation] = useState(false)
  const [showCharacterPanel, setShowCharacterPanel] = useState(false)
  const [showBattle, setShowBattle] = useState(false)
  const [showWeeklyQuests, setShowWeeklyQuests] = useState(false)
  const [showDungeonConfirm, setShowDungeonConfirm] = useState(false)
  const [showArena, setShowArena] = useState(false)
  const [showTitleScreen, setShowTitleScreen] = useState(false)
  const [showMainMenu, setShowMainMenu] = useState(true)
  const [gameLoaded, setGameLoaded] = useState(false)
  const [currentSaveSlot, setCurrentSaveSlot] = useState(null)
  const [playerStats, setPlayerStats] = useState({
    // Identity
    username: '',
    characterClass: '', // 'paladin', 'warrior', 'mage', 'archer', 'cleric'

    // Progression
    level: 1,
    xp: 0,
    xpToNextLevel: 10, // XP needed to reach level 2

    // Core Stats
    stats: {
      hp: 0,
      maxHp: 0,
      mana: 0,
      maxMana: 0,
      strength: 0,
      agility: 0,
      mindPower: 0
    },

    // Inventory & Equipment
    inventory: [],
    equipment: {
      weapon: null,
      offHand: null,
      armor: null
    },

    // Combat
    equippedAbilities: [],

    // Stat allocation
    unspentStatPoints: 0
  })

  useEffect(() => {
    // Phaser game configuration - responsive for mobile
    const config = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: gameRef.current,
      backgroundColor: '#000000',
      pixelArt: true, // Enable pixel-perfect rendering
      render: {
        antialias: false,
        roundPixels: true
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      scene: [MainScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    }

    // Create game instance
    if (!gameInstanceRef.current) {
      const game = new Phaser.Game(config)
      gameInstanceRef.current = game

      // Set up event listeners for game events
      game.events.on('open-task-modal', () => {
        setIsModalOpen(true)
      })

      game.events.on('close-task-modal', () => {
        setIsModalOpen(false)
      })

      game.events.on('open-battle', () => {
        setShowBattle(true)
      })

      game.events.on('open-weekly-quests', () => {
        setShowWeeklyQuests(true)
      })

      game.events.on('dungeon-confirm', () => {
        setShowDungeonConfirm(true)
      })

      game.events.on('test-xp', () => {
        handleTaskSubmitRef.current({ xp: 10, tier: 'Test', explanation: 'Test dummy XP', color: '#d97706' })
      })

      game.events.on('game-ready', () => {
        setGameLoaded(true)
      })
    }

    // Cleanup on unmount
    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true)
        gameInstanceRef.current = null
      }
    }
  }, [])

  const handleTaskSubmit = (result) => {
    // Calculate level ups using new leveling system
    const { newLevel, remainingXp, xpToNextLevel } = calculateLevelUp(
      playerStats.level,
      playerStats.xp,
      result.xp
    );

    // Award 2 stat points per level gained
    const levelsGained = newLevel - playerStats.level
    const pointsAwarded = levelsGained * 2

    // Preserve all existing stats and only update level/xp/points
    const newStats = {
      ...playerStats,
      level: newLevel,
      xp: remainingXp,
      xpToNextLevel,
      unspentStatPoints: (playerStats.unspentStatPoints || 0) + pointsAwarded
    }

    setPlayerStats(newStats)

    // Notify the game about XP gain
    if (gameInstanceRef.current) {
      gameInstanceRef.current.events.emit('xp-gained', {
        ...result,
        newStats
      })
    }

    // Save to current save slot
    const slotKey = `saveSlot${currentSaveSlot || 1}`
    localStorage.setItem(slotKey, JSON.stringify(newStats))
  }

  // Keep ref in sync so Phaser event listeners always call the latest version
  handleTaskSubmitRef.current = handleTaskSubmit

  const handleAllocateStat = (statKey) => {
    if ((playerStats.unspentStatPoints || 0) <= 0) return

    const newStats = {
      ...playerStats,
      unspentStatPoints: playerStats.unspentStatPoints - 1,
      stats: { ...playerStats.stats }
    }

    if (statKey === 'hp') {
      newStats.stats.maxHp += 50
      newStats.stats.hp += 50 // Also heal the added HP
    } else {
      newStats.stats[statKey] += 1
      // Recalculate mana if mind power changed
      if (statKey === 'mindPower') {
        newStats.stats.maxMana = newStats.stats.mindPower * 10
        newStats.stats.mana = newStats.stats.maxMana
      }
    }

    setPlayerStats(newStats)

    // Save immediately
    const slotKey = `saveSlot${currentSaveSlot || 1}`
    localStorage.setItem(slotKey, JSON.stringify(newStats))
  }

  const handleNewGame = (slotId = null) => {
    // Use provided slot ID or find first empty slot
    let slotToUse = slotId
    if (!slotToUse) {
      slotToUse = 1
      for (let i = 1; i <= 3; i++) {
        const slotKey = `saveSlot${i}`
        const savedData = localStorage.getItem(slotKey)
        if (!savedData) {
          slotToUse = i
          break
        }
      }
    }
    setCurrentSaveSlot(slotToUse)
    setShowMainMenu(false)
    setShowCharacterCreation(true)
  }

  const handleLoadGame = (slot) => {
    if (slot && slot.data) {
      let data = { ...slot.data }

      // Migrate old equipment shape (accessory -> offHand)
      if (data.equipment && 'accessory' in data.equipment && !('offHand' in data.equipment)) {
        data.equipment = { weapon: data.equipment.weapon, offHand: null, armor: data.equipment.armor }
      }

      // Backfill default equipment for old saves with all-null equipment
      if (data.characterClass && data.equipment &&
          !data.equipment.weapon && !data.equipment.offHand && !data.equipment.armor) {
        const defaults = CLASS_DEFAULT_EQUIPMENT[data.characterClass]
        if (defaults) {
          data.equipment = { weapon: defaults.weapon, offHand: defaults.offHand, armor: defaults.armor }
        }
      }

      // Backfill unspentStatPoints for old saves
      if (data.unspentStatPoints === undefined) {
        data.unspentStatPoints = 0
      }

      setCurrentSaveSlot(slot.slotId)
      setPlayerStats(data)
      setShowMainMenu(false)

      if (gameInstanceRef.current) {
        gameInstanceRef.current.events.emit('update-stats', data)
      }
    }
  }

  const handleCharacterCreation = ({ username, characterClass, stats, appearance }) => {
    const maxMana = stats.mindPower * 10
    const defaultEquipment = CLASS_DEFAULT_EQUIPMENT[characterClass]
    const newStats = {
      username,
      characterClass,
      appearance, // Paper doll customization choices
      level: 1,
      xp: 0,
      xpToNextLevel: getXpForNextLevel(1),
      stats: {
        hp: stats.maxHp,
        maxHp: stats.maxHp,
        mana: maxMana,
        maxMana: maxMana,
        strength: stats.strength,
        agility: stats.agility,
        mindPower: stats.mindPower
      },
      inventory: [],
      equipment: {
        weapon: defaultEquipment.weapon,
        offHand: defaultEquipment.offHand,
        armor: defaultEquipment.armor,
      },
      equippedAbilities: [],
      unspentStatPoints: 0
    }

    setPlayerStats(newStats)

    // Save to the current save slot
    const slotKey = `saveSlot${currentSaveSlot || 1}`
    localStorage.setItem(slotKey, JSON.stringify(newStats))

    setShowCharacterCreation(false)

    if (gameInstanceRef.current) {
      gameInstanceRef.current.events.emit('update-stats', newStats)
    }
  }

  // Migrate old save data to new slot system on first load
  useEffect(() => {
    const oldSaveData = localStorage.getItem('playerStats')
    if (oldSaveData && !localStorage.getItem('saveSlot1')) {
      // Migrate old save to slot 1
      try {
        const parsed = JSON.parse(oldSaveData)
        if (parsed.username && parsed.characterClass) {
          localStorage.setItem('saveSlot1', oldSaveData)
          localStorage.removeItem('playerStats')
        }
      } catch (error) {
        console.error('Failed to migrate old save data:', error)
        localStorage.removeItem('playerStats')
      }
    }
  }, [])

  // Update game when player stats change (only with valid class)
  useEffect(() => {
    if (gameInstanceRef.current && playerStats.characterClass) {
      gameInstanceRef.current.events.emit('update-stats', playerStats)
    }
  }, [playerStats])

  return (
    <div className="app-container">
      <div className="game-header">
        <h1>⚔️ Productivity Quest</h1>
        <p>A 2D MMO RPG where real-life achievements power your adventure!</p>
      </div>

      {/* Simple HUD in top left */}
      {playerStats.username && !showTitleScreen && !showMainMenu && !showCharacterCreation && gameLoaded && (
        <SimpleHUD
          playerStats={playerStats}
          onClick={() => setShowCharacterPanel(true)}
        />
      )}

      {/* Home button in top right */}
      {playerStats.username && !showTitleScreen && !showMainMenu && !showCharacterCreation && gameLoaded && (
        <button
          className="home-button"
          onClick={() => {
            setShowMainMenu(true)
            setPlayerStats({
              username: '',
              characterClass: '',
              level: 1,
              xp: 0,
              xpToNextLevel: 10,
              stats: {
                hp: 0,
                maxHp: 0,
                mana: 0,
                maxMana: 0,
                strength: 0,
                agility: 0,
                mindPower: 0
              },
              inventory: [],
              equipment: {
                weapon: null,
                offHand: null,
                armor: null
              },
              equippedAbilities: []
            })
          }}
          aria-label="Return to main menu"
        >
          🏠
        </button>
      )}

      <div ref={gameRef} className="game-canvas" />

      <div className="game-info">
        <p>
          💡 <strong>How to play:</strong> Drag to move. Tap the Task Master NPC to submit tasks and earn XP!
        </p>
      </div>

      <TaskSubmissionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          if (gameInstanceRef.current) {
            gameInstanceRef.current.events.emit('close-task-modal')
          }
        }}
        onSubmit={handleTaskSubmit}
      />

      <CharacterCreationModal
        isOpen={showCharacterCreation}
        onComplete={handleCharacterCreation}
      />

      <CharacterPanel
        isOpen={showCharacterPanel}
        onClose={() => setShowCharacterPanel(false)}
        playerStats={playerStats}
        onAllocateStat={handleAllocateStat}
      />

      <BattleModal
        isOpen={showBattle}
        onClose={() => setShowBattle(false)}
        playerStats={playerStats}
      />

      <WeeklyQuestsModal
        isOpen={showWeeklyQuests}
        onClose={() => setShowWeeklyQuests(false)}
      />

      <DungeonConfirm
        isOpen={showDungeonConfirm}
        onConfirm={() => {
          setShowDungeonConfirm(false)
          setShowArena(true)
        }}
        onCancel={() => setShowDungeonConfirm(false)}
      />

      <ArenaModal
        isOpen={showArena}
        onClose={() => setShowArena(false)}
        playerStats={playerStats}
      />

      {/* Title Screen - shows on first load */}
      {showTitleScreen && (
        <TitleScreen onComplete={() => {
          setShowTitleScreen(false)
          setShowMainMenu(true)
        }} />
      )}

      {/* Main Menu - shows after title screen */}
      {showMainMenu && (
        <MainMenu
          onNewGame={handleNewGame}
          onLoadGame={handleLoadGame}
        />
      )}
    </div>
  )
}

export default App
