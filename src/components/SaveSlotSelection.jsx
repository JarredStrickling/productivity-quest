import { useEffect, useState } from 'react';
import './SaveSlotSelection.css';
import { CLASS_CONFIG } from '../config/classes';

export default function SaveSlotSelection({ onBack, onSelectSlot }) {
  const [saveSlots, setSaveSlots] = useState([]);

  useEffect(() => {
    // Load all save slots from localStorage
    const slots = [];
    for (let i = 1; i <= 3; i++) {
      const slotKey = `saveSlot${i}`;
      const savedData = localStorage.getItem(slotKey);
      if (savedData) {
        try {
          slots.push({ slotId: i, data: JSON.parse(savedData) });
        } catch (e) {
          slots.push({ slotId: i, data: null });
        }
      } else {
        slots.push({ slotId: i, data: null });
      }
    }
    setSaveSlots(slots);
  }, []);

  const handleSlotClick = (slot) => {
    onSelectSlot({ slotId: slot.slotId, data: slot.data });
  };

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
                      style={{ color: CLASS_CONFIG[slot.data.characterClass]?.color || '#fff' }}
                    >
                      {CLASS_CONFIG[slot.data.characterClass]?.icon || '❓'}
                    </span>
                  </div>
                  <div className="slot-info">
                    <div className="slot-name">{slot.data.username}</div>
                    <div className="slot-details">
                      <span
                        className="slot-class"
                        style={{ color: CLASS_CONFIG[slot.data.characterClass]?.color || '#fff' }}
                      >
                        {CLASS_CONFIG[slot.data.characterClass]?.name || 'Unknown'}
                      </span>
                      <span className="slot-level">Lv {slot.data.level}</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="slot-header">
                    <span className="slot-number">Slot {slot.slotId}</span>
                  </div>
                  <div className="slot-empty-content">
                    <div className="slot-empty-icon">✨</div>
                    <div className="slot-empty-text">Empty Slot</div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <button className="back-btn" onClick={onBack}>
          ← Back to Menu
        </button>
      </div>
    </div>
  );
}
