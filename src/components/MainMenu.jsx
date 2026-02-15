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
          <button className="menu-btn menu-btn-primary" onClick={onNewGame}>
            <span className="btn-icon">✨</span>
            New Game
          </button>

          <button className="menu-btn menu-btn-secondary" onClick={() => setShowSaveSlots(true)}>
            <span className="btn-icon">📜</span>
            Continue
          </button>
        </div>

        <div className="menu-footer">
          <p>A 2D MMO RPG where real-life achievements power your adventure!</p>
        </div>
      </div>
    </div>
  );
}
