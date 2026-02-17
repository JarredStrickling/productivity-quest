import './SimpleHUD.css';

export default function SimpleHUD({ playerStats, onClick }) {
  if (!playerStats.username) return null;

  const xpPercent = (playerStats.xp / playerStats.xpToNextLevel) * 100;
  const hpPercent = (playerStats.stats.hp / playerStats.stats.maxHp) * 100;

  return (
    <div className="simple-hud" onClick={onClick}>
      <div className="hud-header">
        <span className="hud-name">{playerStats.username}</span>
        <span className="hud-level">Lv {playerStats.level}</span>
      </div>

      <div className="hud-bar">
        <span className="bar-label">HP</span>
        <div className="bar-container">
          <div className="bar-fill hp-fill" style={{ width: `${hpPercent}%` }} />
        </div>
        <span className="bar-text">{playerStats.stats.hp}/{playerStats.stats.maxHp}</span>
      </div>

      <div className="hud-bar">
        <span className="bar-label">XP</span>
        <div className="bar-container">
          <div className="bar-fill xp-fill" style={{ width: `${xpPercent}%` }} />
        </div>
        <span className="bar-text">{playerStats.xp}/{playerStats.xpToNextLevel}</span>
      </div>

      <div className="hud-hint">Click to view inventory</div>
    </div>
  );
}
