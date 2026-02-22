import { useCallback, useEffect, useRef, useState } from 'react'
import Phaser from 'phaser'
import MainScene from './scenes/MainScene'
import TaskSubmissionModal from './components/TaskSubmissionModal'
import CharacterCreationModal from './components/CharacterCreationModal'
import CharacterPanel from './components/CharacterPanel'
import BattleModal from './components/BattleModal'
import SimpleHUD from './components/SimpleHUD'
import MainMenu from './components/MainMenu'
import WeeklyQuestsModal from './components/WeeklyQuestsModal'
import ArenaModal from './components/ArenaModal'
import DungeonConfirm from './components/DungeonConfirm'
import SplashScreen from './components/SplashScreen'
import AuthModal from './components/AuthModal'
import { useAuth } from './hooks/useAuth'
import { getXpForNextLevel, calculateLevelUp } from './config/levelingSystem'
import { CLASS_DEFAULT_EQUIPMENT } from './config/equipment'
import { getEquippedAbilitiesForLevel } from './config/abilities'
import './App.css'

function App() {
  const gameRef = useRef(null)
  const gameInstanceRef = useRef(null)
  const handleTaskSubmitRef = useRef(null)
  const [gameContainerReady, setGameContainerReady] = useState(false)

  // Callback ref — triggers state update when the game div mounts/unmounts,
  // so the Phaser init effect can re-fire when the div becomes available.
  const gameContainerCallback = useCallback((node) => {
    gameRef.current = node
    setGameContainerReady(!!node)
  }, [])

  // Auth state
  const { currentUser, authResolved, logout } = useAuth()
  const [authError, setAuthError] = useState(null)
  const [showTransition, setShowTransition] = useState(false)
  const [splashMinTimeElapsed, setSplashMinTimeElapsed] = useState(false)

  // Game UI state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showCharacterCreation, setShowCharacterCreation] = useState(false)
  const [showCharacterPanel, setShowCharacterPanel] = useState(false)
  const [showBattle, setShowBattle] = useState(false)
  const [showWeeklyQuests, setShowWeeklyQuests] = useState(false)
  const [showDungeonConfirm, setShowDungeonConfirm] = useState(false)
  const [showArena, setShowArena] = useState(false)
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

    // Combat — ability IDs equipped per slot
    equippedAbilities: { slot1: null, slot2: null, slot3: null, slot4: null },

    // Stat allocation
    unspentStatPoints: 0
  })

  // Enforce minimum splash screen duration (1.5s) so the logo always shows briefly
  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashMinTimeElapsed(true)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  // Phaser initialization — only after auth resolves AND user is authenticated.
  // This fixes the race condition where Phaser inited before onAuthStateChanged fired.
  // gameRef.current is only populated when the game canvas div is rendered (Stage 3),
  // so this effect safely no-ops during splash/auth stages.
  useEffect(() => {
    if (!gameRef.current || !currentUser || gameInstanceRef.current) return

    const config = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: gameRef.current,
      backgroundColor: '#000000',
      pixelArt: true,
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

    const game = new Phaser.Game(config)
    gameInstanceRef.current = game

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

    // No cleanup here — Phaser is destroyed when currentUser becomes null (see logout effect)
  }, [currentUser, gameContainerReady])

  // Destroy Phaser instance when user logs out
  useEffect(() => {
    if (!currentUser && gameInstanceRef.current) {
      gameInstanceRef.current.destroy(true)
      gameInstanceRef.current = null
      setGameLoaded(false)
    }
  }, [currentUser])

  // Called by AuthModal on successful register or login
  const handleAuthSuccess = () => {
    setShowTransition(true)
    setTimeout(() => {
      setShowTransition(false)
    }, 1500)
  }

  const handleTaskSubmit = (result) => {
    const { newLevel, remainingXp, xpToNextLevel } = calculateLevelUp(
      playerStats.level,
      playerStats.xp,
      result.xp
    );

    const levelsGained = newLevel - playerStats.level
    const pointsAwarded = levelsGained * 2

    const updatedAbilities = levelsGained > 0
      ? getEquippedAbilitiesForLevel(playerStats.characterClass, newLevel)
      : playerStats.equippedAbilities

    const newStats = {
      ...playerStats,
      level: newLevel,
      xp: remainingXp,
      xpToNextLevel,
      unspentStatPoints: (playerStats.unspentStatPoints || 0) + pointsAwarded,
      equippedAbilities: updatedAbilities
    }

    setPlayerStats(newStats)

    if (gameInstanceRef.current) {
      gameInstanceRef.current.events.emit('xp-gained', {
        ...result,
        newStats
      })
    }

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
      newStats.stats.hp += 50
    } else {
      newStats.stats[statKey] += 1
      if (statKey === 'mindPower') {
        newStats.stats.maxMana = newStats.stats.mindPower * 10
        newStats.stats.mana = newStats.stats.maxMana
      }
    }

    setPlayerStats(newStats)

    const slotKey = `saveSlot${currentSaveSlot || 1}`
    localStorage.setItem(slotKey, JSON.stringify(newStats))
  }

  const handleNewGame = (slotId = null) => {
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

      // Backfill equippedAbilities for old saves
      if (!data.equippedAbilities || Array.isArray(data.equippedAbilities)) {
        data.equippedAbilities = getEquippedAbilitiesForLevel(data.characterClass, data.level || 1)
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
      appearance,
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
      equippedAbilities: getEquippedAbilitiesForLevel(characterClass, 1),
      unspentStatPoints: 0
    }

    setPlayerStats(newStats)

    const slotKey = `saveSlot${currentSaveSlot || 1}`
    localStorage.setItem(slotKey, JSON.stringify(newStats))

    setShowCharacterCreation(false)

    if (gameInstanceRef.current) {
      gameInstanceRef.current.events.emit('update-stats', newStats)
    }
  }

  // Logout handler — confirm dialog, then call useAuth logout, reset game state
  const handleLogout = async () => {
    const confirmed = window.confirm('Are you sure you want to log out?')
    if (!confirmed) return

    // Reset all game state
    setPlayerStats({
      username: '',
      characterClass: '',
      level: 1,
      xp: 0,
      xpToNextLevel: 10,
      stats: { hp: 0, maxHp: 0, mana: 0, maxMana: 0, strength: 0, agility: 0, mindPower: 0 },
      inventory: [],
      equipment: { weapon: null, offHand: null, armor: null },
      equippedAbilities: { slot1: null, slot2: null, slot3: null, slot4: null },
      unspentStatPoints: 0
    })
    setShowMainMenu(true)
    setShowCharacterCreation(false)
    setShowCharacterPanel(false)
    setIsModalOpen(false)
    setCurrentSaveSlot(null)

    // logout() from useAuth signs out and clears localStorage save slots.
    // onAuthStateChanged then fires with null -> currentUser becomes null ->
    // the Phaser destroy effect runs -> splash screen renders.
    await logout()
  }

  // Migrate old save data to new slot system on first load
  useEffect(() => {
    const oldSaveData = localStorage.getItem('playerStats')
    if (oldSaveData && !localStorage.getItem('saveSlot1')) {
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

  // --- Auth gate rendering ---

  // Stage 1: Splash screen — show while auth is resolving OR during post-login transition
  // Also enforce minimum 1.5s splash display so the logo always shows briefly
  const showSplash = !authResolved || !splashMinTimeElapsed || showTransition
  if (showSplash) {
    return (
      <SplashScreen
        showError={!!authError}
        errorMessage={authError}
        onRetry={() => window.location.reload()}
      />
    )
  }

  // Stage 2: Auth modal — auth resolved, no user
  if (!currentUser) {
    return (
      <AuthModal
        isOpen={true}
        onAuthSuccess={handleAuthSuccess}
      />
    )
  }

  // Stage 3: Full game UI — auth resolved and user is authenticated
  return (
    <div className="app-container">
      <div className="game-header">
        <h1>Scrolls of Doom</h1>
        <p>A 2D RPG where real-life achievements power your adventure!</p>
      </div>

      {/* Simple HUD in top left */}
      {playerStats.username && !showMainMenu && !showCharacterCreation && gameLoaded && (
        <SimpleHUD
          playerStats={playerStats}
          onClick={() => setShowCharacterPanel(true)}
        />
      )}

      {/* Logout button in top right */}
      {playerStats.username && !showMainMenu && !showCharacterCreation && gameLoaded && (
        <button
          className="logout-button"
          onClick={handleLogout}
          aria-label="Log out"
        >
          Log Out
        </button>
      )}

      <div ref={gameContainerCallback} className="game-canvas" />

      <div className="game-info">
        <p>
          <strong>How to play:</strong> Drag to move. Tap the Task Master NPC to submit tasks and earn XP!
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

      {/* Main Menu — shows after auth when user first logs in or loads a save */}
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
