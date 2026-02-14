import './CharacterHUD.css';
import { CLASS_CONFIG } from '../config/classes';

export default function CharacterHUD({ playerStats, onClick }) {
  if (!playerStats.characterClass || !playerStats.username) {
    return null;
  }

  const classData = CLASS_CONFIG[playerStats.characterClass];
  const xpPercent = (playerStats.xp / playerStats.xpToNextLevel) * 100;

  // Map class to row index in sprite sheet (1024x1536, 5 rows)
  // Assuming order: paladin, warrior, mage, archer, cleric
  const classToRow = {
    paladin: 0,
    warrior: 1,
    mage: 2,
    archer: 3,
    cleric: 4
  };

  const rowIndex = classToRow[playerStats.characterClass] || 0;

  // Sprite sheet is 1024x1536 with 5 rows (each row is 1024x307.2)
  // Calculate scaling to fit container width while maintaining aspect
  const spriteSheetHeight = 1536;
  const rowHeight = spriteSheetHeight / 5; // 307.2px

  // Scale the sprite sheet so each row fits the container
  const containerHeight = 120; // matches CSS
  const scale = containerHeight / rowHeight; // ~0.39
  const scaledSheetHeight = spriteSheetHeight * scale; // ~600px

  const backgroundY = -(rowIndex * containerHeight);

  return (
    <div className="character-hud" onClick={onClick}>
      {/* Character Menu Background Sprite */}
      <div
        className="hud-background"
        style={{
          backgroundImage: 'url(/assets/sprites/character-menu-xp-bars.png)',
          backgroundPosition: `center ${backgroundY}px`,
          backgroundSize: `auto ${scaledSheetHeight}px`,
        }}
      />

      {/* XP Progress Bar Overlay */}
      <div className="hud-xp-bar">
        <div
          className="hud-xp-fill"
          style={{ width: `${xpPercent}%` }}
        />
      </div>

      {/* Level Text */}
      <div className="hud-level-text">
        Lv {playerStats.level}
      </div>
    </div>
  );
}
