import { useState } from 'react';
import './MainMenu.css';
import SaveSlotSelection from './SaveSlotSelection';

const MAX_SLOTS = 2;

function areSlotsFullFn() {
  for (let i = 1; i <= MAX_SLOTS; i++) {
    if (!localStorage.getItem(`saveSlot${i}`)) return false;
  }
  return true;
}

export default function MainMenu({ onNewGame, onLoadGame }) {
  const [showSaveSlots, setShowSaveSlots] = useState(false);
  const [slotsFull, setSlotsFull] = useState(areSlotsFullFn);

  if (showSaveSlots) {
    return (
      <SaveSlotSelection
        onBack={() => {
          setSlotsFull(areSlotsFullFn());
          setShowSaveSlots(false);
        }}
        onSelectSlot={(slot) => {
          if (slot.data) {
            onLoadGame(slot);
          } else {
            onNewGame(slot.slotId);
          }
        }}
      />
    );
  }

  return (
    <div className="main-menu">
      <div className="menu-background" />

      <div className="menu-content">
        <div className="game-logo">
          <img src="/assets/sprites/scrolls-of-doom-logo.png" alt="Scrolls of Doom" />
        </div>

        <div className="menu-buttons">
          <button
            className={`menu-btn-sprite ${slotsFull ? 'menu-btn-disabled' : ''}`}
            onClick={slotsFull ? undefined : onNewGame}
            disabled={slotsFull}
          >
            <img src="/assets/sprites/new-game-button.png" alt="New Game" />
          </button>
          {slotsFull && (
            <p className="slots-full-msg">Delete a character to start a new game</p>
          )}

          <button className="menu-btn-sprite" onClick={() => setShowSaveSlots(true)}>
            <img src="/assets/sprites/continue-button.png" alt="Continue" />
          </button>
        </div>
      </div>
    </div>
  );
}
