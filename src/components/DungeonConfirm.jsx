import './DungeonConfirm.css';

export default function DungeonConfirm({ isOpen, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content dungeon-confirm-modal" onClick={e => e.stopPropagation()}>
        <h2>Enter the Dungeon?</h2>
        <p>Prepare for battle against the Orc Warrior!</p>
        <p className="warning-text">Your team will be assembled automatically.</p>

        <div className="confirm-buttons">
          <button className="btn-confirm" onClick={onConfirm}>
            Yes, Enter!
          </button>
          <button className="btn-cancel" onClick={onCancel}>
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
