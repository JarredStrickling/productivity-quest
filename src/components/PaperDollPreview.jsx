import { MS_PATH, getAppearancePaths, getEffectiveAppearance } from '../config/appearance';

// Renders a Mana Seed paper doll character from an appearance object.
// Shows frame 0 (standing facing down) by default.
// All sheets are 512x512 with 64x64 cells (8×8 grid).
export default function PaperDollPreview({ appearance, equipment, size = 128 }) {
  if (!appearance) return null;

  const effective = getEffectiveAppearance(appearance, equipment);
  const paths = getAppearancePaths(effective);
  const scale = size / 64; // 64px cell → desired display size
  const sheetPx = Math.round(512 * scale);

  const layerOrder = ['base', 'outfit', 'hair', 'hat'];

  const layerStyle = (path) => ({
    position: 'absolute',
    top: 0,
    left: 0,
    width: size,
    height: size,
    backgroundImage: `url(${MS_PATH}/${path})`,
    backgroundSize: `${sheetPx}px ${sheetPx}px`,
    backgroundPosition: '0px 0px',
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated',
  });

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      {layerOrder.map(layer => {
        const path = paths[layer];
        if (!path) return null;
        return <div key={layer} style={layerStyle(path)} />;
      })}
    </div>
  );
}
