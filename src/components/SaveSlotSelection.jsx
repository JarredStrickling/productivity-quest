import { useEffect, useState } from 'react';
import './SaveSlotSelection.css';
import { CLASS_CONFIG } from '../config/classes';
import { loadCharacterSlots, deleteCharacterSlot } from '../utils/saveManager';

const MAX_SLOTS = 2;

export default function SaveSlotSelection({ onBack, onSelectSlot, uid }) {
  const [saveSlots, setSaveSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSlots = async () => {
    setLoading(true);
    setError(null);
    try {
      const slotsObj = await loadCharacterSlots(uid);
      // Convert { 1: data|null, 2: data|null } to [{ slotId, data }] array
      const slotsArray = [];
      for (let i = 1; i <= MAX_SLOTS; i++) {
        slotsArray.push({ slotId: i, data: slotsObj[i] || null });
      }
      setSaveSlots(slotsArray);
    } catch (err) {
      console.error('Failed to load save slots:', err);
      setError('Failed to load save slots. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const handleSlotClick = (slot) => {
    onSelectSlot({ slotId: slot.slotId, data: slot.data });
  };

  const handleDelete = async (e, slot) => {
    e.stopPropagation();
    const confirmed = window.confirm(`Delete ${slot.data.username}? This cannot be undone.`);
    if (!confirmed) return;
    try {
      await deleteCharacterSlot(uid, slot.slotId);
      await loadSlots();
    } catch (err) {
      console.error('Failed to delete character:', err);
      alert('Failed to delete character. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="save-slot-selection">
        <div className="menu-background" />
        <div className="slot-content">
          <h2 className="slot-title">Select Save Slot</h2>
          <div className="slot-loading">
            <p className="slot-loading-text">Loading saves...</p>
          </div>
          <button className="back-btn" onClick={onBack}>
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="save-slot-selection">
        <div className="menu-background" />
        <div className="slot-content">
          <h2 className="slot-title">Select Save Slot</h2>
          <div className="slot-error">
            <p className="slot-error-text">{error}</p>
            <button className="slot-retry-btn" onClick={loadSlots}>
              Retry
            </button>
          </div>
          <button className="back-btn" onClick={onBack}>
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="save-slot-selection">
      <div className="menu-background" />

      <div className="slot-content">
        <h2 className="slot-title">Select Save Slot</h2>

        <div className="slots-grid">
          {saveSlots.map((slot) => (
            <div
              key={slot.slotId}
              className={`save-slot ${slot.data ? 'slot-filled' : 'slot-empty'}`}
              onClick={() => handleSlotClick(slot)}
            >
              {slot.data ? (
                <>
                  <div className="slot-header">
                    <span className="slot-number">Slot {slot.slotId}</span>
                    <span
                      className="slot-class-icon"
                      style={{ color: CLASS_CONFIG[slot.data.characterClass]?.color || '#3b2415' }}
                    >
                      {CLASS_CONFIG[slot.data.characterClass]?.icon || '?'}
                    </span>
                  </div>
                  <div className="slot-info">
                    <div className="slot-name">{slot.data.username}</div>
                    <div className="slot-details">
                      <span
                        className="slot-class"
                        style={{ color: CLASS_CONFIG[slot.data.characterClass]?.color || '#3b2415' }}
                      >
                        {CLASS_CONFIG[slot.data.characterClass]?.name || 'Unknown'}
                      </span>
                      <span className="slot-level">Lv {slot.data.level}</span>
                    </div>
                  </div>
                  <button
                    className="slot-delete-btn"
                    onClick={(e) => handleDelete(e, slot)}
                  >
                    Delete
                  </button>
                </>
              ) : (
                <>
                  <div className="slot-header">
                    <span className="slot-number">Slot {slot.slotId}</span>
                  </div>
                  <div className="slot-empty-content">
                    <div className="slot-empty-icon">- -</div>
                    <div className="slot-empty-text">Empty Slot</div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <button className="back-btn" onClick={onBack}>
          Back to Menu
        </button>
      </div>
    </div>
  );
}
