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
  const spriteHeight = 1536 / 5; // 307.2px per class
  const backgroundY = -(rowIndex * spriteHeight);

  return (
    <div className="character-hud" onClick={onClick}>
      {/* Character Menu Background Sprite */}
      <div
        className="hud-background"
        style={{
          backgroundImage: 'url(/assets/sprites/character-menu-xp-bars.png)',
          backgroundPosition: `0 ${backgroundY}px`,
          backgroundSize: '100% 500%', // 5 rows = 500%
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
