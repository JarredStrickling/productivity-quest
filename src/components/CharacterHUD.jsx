import './CharacterHUD.css';
import { CLASS_CONFIG } from '../config/classes';

export default function CharacterHUD({ playerStats, onClick }) {
  if (!playerStats.characterClass || !playerStats.username) {
    return null;
  }

  const classData = CLASS_CONFIG[playerStats.characterClass];
  const xpPercent = (playerStats.xp / playerStats.xpToNextLevel) * 100;

  return (
    <div className="character-hud" onClick={onClick}>
      {/* Class Icon & Info */}
      <div className="hud-header" style={{ borderColor: classData.color }}>
        <div className="class-icon" style={{ color: classData.color }}>
          {classData.icon}
        </div>
        <div className="hud-info">
          <div className="username">{playerStats.username}</div>
          <div className="level-badge" style={{ backgroundColor: classData.color }}>
            Lv {playerStats.level}
          </div>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="hud-xp-section">
        <div className="xp-label">
          {playerStats.xp} / {playerStats.xpToNextLevel} XP
        </div>
        <div className="hud-xp-bar">
          <div
            className="hud-xp-fill"
            style={{ width: `${xpPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
