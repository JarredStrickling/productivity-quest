import { useEffect, useRef, useState } from 'react'
import Phaser from 'phaser'
import MainScene from './scenes/MainScene'
import TaskSubmissionModal from './components/TaskSubmissionModal'
import './App.css'

function App() {
  const gameRef = useRef(null)
  const gameInstanceRef = useRef(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [playerStats, setPlayerStats] = useState({
    level: 1,
    xp: 0,
    xpToNextLevel: 100
  })

  useEffect(() => {
    // Phaser game configuration - responsive for mobile
    const config = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: gameRef.current,
      backgroundColor: '#2d3748',
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

    const newStats = {
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

    // Save to localStorage
    localStorage.setItem('playerStats', JSON.stringify(newStats))
  }

  // Load player stats from localStorage on mount
  useEffect(() => {
    const savedStats = localStorage.getItem('playerStats')
    if (savedStats) {
      setPlayerStats(JSON.parse(savedStats))
    }
  }, [])

  // Update game when player stats change
  useEffect(() => {
    if (gameInstanceRef.current) {
      gameInstanceRef.current.events.emit('update-stats', playerStats)
    }
  }, [playerStats])

  const xpPercentage = (playerStats.xp / playerStats.xpToNextLevel) * 100

  return (
    <div className="app-container">
      <div className="game-header">
        <h1>⚔️ Productivity Quest</h1>
        <p>A 2D MMO RPG where real-life achievements power your adventure!</p>
      </div>

      <div className="player-stats-bar">
        <div className="stat-item">
          <span className="stat-label">Level</span>
          <span className="stat-value">{playerStats.level}</span>
        </div>
        <div className="xp-display">
          <span className="xp-text">
            {playerStats.xp} / {playerStats.xpToNextLevel} XP
          </span>
          <div className="xp-bar-container">
            <div
              className="xp-bar-fill"
              style={{ width: `${xpPercentage}%` }}
            />
          </div>
        </div>
      </div>

      <div ref={gameRef} className="game-canvas" />

      <div className="game-info">
        <p>
          💡 <strong>How to play:</strong> Drag to move (or WASD). Tap Task Master NPC (or press E) to submit tasks!
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
    </div>
  )
}

export default App
