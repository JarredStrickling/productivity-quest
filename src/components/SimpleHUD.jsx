import './SimpleHUD.css';
import { MS_PATH, getAppearancePaths, CLASS_DEFAULT_APPEARANCE } from '../config/appearance';

// Build the CSS for a single paper doll layer showing frame 0 (standing down)
// Zoomed into the face: shows a ~32x32 region from the top-center of the 64x64 cell
function makeLayerStyle(portraitSize, sheetPath) {
  // 2x zoom: show 32px of sprite filling the portrait
  const scale = portraitSize / 32;
  const sheetW = Math.round(512 * scale);
  const sheetH = Math.round(512 * scale);
  // Center horizontally (offset by 16 sprite-px) and crop from near top (offset by 6 sprite-px)
  const offsetX = Math.round(-16 * scale);
  const offsetY = Math.round(-6 * scale);
  return {
    position: 'absolute',
    top: 0,
    left: 0,
    width: portraitSize,
    height: portraitSize,
    backgroundImage: `url(${MS_PATH}/${sheetPath})`,
    backgroundSize: `${sheetW}px ${sheetH}px`,
    backgroundPosition: `${offsetX}px ${offsetY}px`,
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated',
  };
}

export default function SimpleHUD({ playerStats, onClick }) {
  if (!playerStats.username) return null;

  const xpPercent = playerStats.xpToNextLevel > 0
    ? (playerStats.xp / playerStats.xpToNextLevel) * 100
    : 0;

  const portraitSize = 36;
  // Use player's custom appearance, fall back to class defaults for old saves
  const appearance = playerStats.appearance || CLASS_DEFAULT_APPEARANCE[playerStats.characterClass];
  const paths = appearance ? getAppearancePaths(appearance) : null;

  // Build stacked paper doll layers for the portrait
  const layers = [];
  if (paths) {
    const layerOrder = ['base', 'outfit', 'hair', 'hat'];
    for (const layerName of layerOrder) {
      const path = paths[layerName];
      if (path) {
        layers.push(
          <div key={layerName} style={makeLayerStyle(portraitSize, path)} />
        );
      }
    }
  }

  return (
    <div className="simple-hud" onClick={onClick}>
      <div className="hud-portrait" style={{ position: 'relative', overflow: 'hidden' }}>
        {layers}
      </div>
      <div className="hud-info">
        <div className="hud-top-row">
          <span className="hud-name">{playerStats.username}</span>
          <span className="hud-level">Lv{playerStats.level}</span>
        </div>
        <div className="hud-xp-bar">
          <div className="hud-xp-fill" style={{ width: `${xpPercent}%` }} />
        </div>
      </div>
    </div>
  );
}
