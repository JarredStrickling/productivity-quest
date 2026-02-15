import './CharacterHUD.css';
import { CLASS_CONFIG } from '../config/classes';

export default function CharacterHUD({ playerStats, onClick }) {
  if (!playerStats.characterClass || !playerStats.username) {
    return null;
  }

  const classData = CLASS_CONFIG[playerStats.characterClass];
  const xpPercent = (playerStats.xp / playerStats.xpToNextLevel) * 100;

  // Map class to HUD file names
  const hudFiles = {
    paladin: 'paladinHUD.png',
    warrior: 'warrior-hud.png',
    mage: 'mage-hud.png',
    archer: 'archer-hud.png',
    cleric: 'cleric-hud.png'
  };

  const hudFile = hudFiles[playerStats.characterClass] || 'paladinHUD.png';

  return (
    <div className="character-hud" onClick={onClick} style={{ position: 'relative' }}>
      <img
        src={`/assets/sprites/${hudFile}`}
        alt="Character HUD"
        className="hud-background"
      />
      <div className="hud-overlay">
        <div className="hud-level">Lv {playerStats.level}</div>
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
