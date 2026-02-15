import { useEffect, useRef, useState } from 'react'
import Phaser from 'phaser'
import MainScene from './scenes/MainScene'
import TaskSubmissionModal from './components/TaskSubmissionModal'
import CharacterCreationModal from './components/CharacterCreationModal'
import CharacterPanel from './components/CharacterPanel'
import BattleModal from './components/BattleModal'
import TitleScreen from './components/TitleScreen'
import CharacterHUD from './components/CharacterHUD'
import MainMenu from './components/MainMenu'
import './App.css'

function App() {
  const gameRef = useRef(null)
  const gameInstanceRef = useRef(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showCharacterCreation, setShowCharacterCreation] = useState(false)
  const [showCharacterPanel, setShowCharacterPanel] = useState(false)
  const [showBattle, setShowBattle] = useState(false)
  const [showTitleScreen, setShowTitleScreen] = useState(true)
  const [showMainMenu, setShowMainMenu] = useState(false)
  const [gameLoaded, setGameLoaded] = useState(false)
  const [currentSaveSlot, setCurrentSaveSlot] = useState(null)
  const [playerStats, setPlayerStats] = useState({
    // Identity
    username: '',
    characterClass: '', // 'paladin', 'warrior', 'mage', 'archer', 'cleric'

    // Progression
    level: 1,
    xp: 0,
    xpToNextLevel: 100,

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

    // Inventory (for future use)
    inventory: [],
    equipment: {
      weapon: null,
      armor: null,
      accessory: null
    },

    // Combat
    equippedAbilities: []
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
    // Add XP to player
    const newXp = playerStats.xp + result.xp
    let newLevel = playerStats.level
    let remainingXp = newXp

    // Check for level ups
    let xpNeeded = playerStats.xpToNextLevel
    while (remainingXp >= xpNeeded) {
      remainingXp -= xpNeeded
      newLevel++
      xpNeeded = newLevel * 100 // Each level needs more XP
    }

    // Preserve all existing stats and only update level/xp
    const newStats = {
      ...playerStats,
      level: newLevel,
      xp: remainingXp,
      xpToNextLevel: newLevel * 100
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
      // Load existing save
      setCurrentSaveSlot(slot.slotId)
      setPlayerStats(slot.data)
      setShowMainMenu(false)

      if (gameInstanceRef.current) {
        gameInstanceRef.current.events.emit('update-stats', slot.data)
      }
    }
  }

  const handleCharacterCreation = ({ username, characterClass, stats }) => {
    const maxMana = stats.mindPower * 10
    const newStats = {
      username,
      characterClass,
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
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
      equipment: { weapon: null, armor: null, accessory: null },
      equippedAbilities: [] // Track which abilities are equipped
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

  // Update game when player stats change
  useEffect(() => {
    if (gameInstanceRef.current) {
      gameInstanceRef.current.events.emit('update-stats', playerStats)
    }
  }, [playerStats])

  return (
    <div className="app-container">
      <div className="game-header">
        <h1>⚔️ Productivity Quest</h1>
        <p>A 2D MMO RPG where real-life achievements power your adventure!</p>
      </div>

      {/* Character HUD - replaces old stats bar and character button */}
      {playerStats.username && !showTitleScreen && !showMainMenu && !showCharacterCreation && gameLoaded && (
        <CharacterHUD
          playerStats={playerStats}
          onClick={() => setShowCharacterPanel(true)}
        />
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
      />

      <BattleModal
        isOpen={showBattle}
        onClose={() => setShowBattle(false)}
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
