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
        <h1 className="game-title">
          <span className="title-icon">⚔️</span>
          PRODUCTIVITY QUEST
          <span className="title-icon">⚔️</span>
        </h1>

        <div className="menu-buttons">
          <button className="menu-btn-sprite" onClick={onNewGame}>
            <img src="/assets/sprites/Newgame.PNG" alt="New Game" />
          </button>

          <button className="menu-btn-sprite" onClick={() => setShowSaveSlots(true)}>
            <img src="/assets/sprites/Continue.PNG" alt="Continue" />
          </button>
        </div>
      </div>
    </div>
  );
}
