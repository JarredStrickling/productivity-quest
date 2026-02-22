import './ConnectionOverlay.css';

export default function ConnectionOverlay({ visible }) {
  if (!visible) return null;
  return (
    <div className="connection-overlay">
      <div className="connection-overlay-content">
        <p className="connection-overlay-text">Connection lost. Reconnecting...</p>
      </div>
    </div>
  );
}
