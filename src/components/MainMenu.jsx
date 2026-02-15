import { useState } from 'react';
import './MainMenu.css';
import SaveSlotSelection from './SaveSlotSelection';

export default function MainMenu({ onNewGame, onLoadGame }) {
  const [showSaveSlots, setShowSaveSlots] = useState(false);

  if (showSaveSlots) {
    return (
      <SaveSlotSelection
        onBack={() => setShowSaveSlots(false)}
        onSelectSlot={(slot) => {
          if (slot.data) {
            // Load existing save
            onLoadGame(slot);
          } else {
            // Empty slot selected, start new game in that slot
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
          <button className="menu-btn-sprite" onClick={onNewGame}>
            <img src="/assets/sprites/NewGameButton.png" alt="New Game" />
          </button>

          <button className="menu-btn-sprite" onClick={() => setShowSaveSlots(true)}>
            <img src="/assets/sprites/ContinueButton.png" alt="Continue" />
          </button>
        </div>
      </div>
    </div>
  );
}
