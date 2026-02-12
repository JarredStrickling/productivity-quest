import { useState } from 'react';
import './CharacterCreationModal.css';
import { CLASS_CONFIG } from '../config/classes';

export default function CharacterCreationModal({ isOpen, onComplete }) {
  const [stage, setStage] = useState('username'); // 'username' | 'class' | 'confirm'
  const [username, setUsername] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const validateUsername = () => {
    const trimmed = username.trim();
    if (trimmed.length < 3) {
      setError('Username must be at least 3 characters');
      return false;
    }
    if (trimmed.length > 16) {
      setError('Username must be 16 characters or less');
      return false;
    }
    if (!/^[a-zA-Z0-9 ]+$/.test(trimmed)) {
      setError('Username can only contain letters, numbers, and spaces');
      return false;
    }
    setError('');
    return true;
  };

  const handleUsernameNext = () => {
    if (validateUsername()) {
      setStage('class');
    }
  };

  const handleClassSelect = (classKey) => {
    setSelectedClass(classKey);
  };

  const handleClassConfirm = () => {
    if (selectedClass) {
      setStage('confirm');
    }
  };

  const handleComplete = () => {
    const classData = CLASS_CONFIG[selectedClass];
    onComplete({
      username: username.trim(),
      characterClass: selectedClass,
      stats: {
        hp: classData.baseStats.hp,
        maxHp: classData.baseStats.hp,
        strength: classData.baseStats.strength,
        agility: classData.baseStats.agility,
        mindPower: classData.baseStats.mindPower
      }
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content character-creation-modal">
        {stage === 'username' && (
          <>
            <h2>⚔️ Create Your Character</h2>
            <p className="modal-subtitle">Choose a name for your hero</p>

            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username..."
                maxLength={16}
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && handleUsernameNext()}
              />
              {error && <p className="error-message">{error}</p>}
            </div>

            <button onClick={handleUsernameNext} className="btn-primary">
              Next →
            </button>
          </>
        )}

        {stage === 'class' && (
          <>
            <h2>Choose Your Class</h2>
            <p className="modal-subtitle">Each class has unique strengths</p>

            <div className="class-grid">
              {Object.entries(CLASS_CONFIG).map(([key, classData]) => (
                <div
                  key={key}
                  className={`class-card ${selectedClass === key ? 'selected' : ''}`}
                  onClick={() => handleClassSelect(key)}
                  style={{
                    borderColor: selectedClass === key ? classData.color : '#475569'
                  }}
                >
                  <div className="class-icon">{classData.icon}</div>
                  <h3 style={{ color: classData.color }}>{classData.name}</h3>
                  <p className="class-description">{classData.description}</p>

                  <div className="stats-preview">
                    <div className="stat-preview-item">
                      <span className="stat-preview-label">HP</span>
                      <span className="stat-preview-value">{classData.baseStats.hp}</span>
                    </div>
                    <div className="stat-preview-item">
                      <span className="stat-preview-label">STR</span>
                      <span className="stat-preview-value">{classData.baseStats.strength}</span>
                    </div>
                    <div className="stat-preview-item">
                      <span className="stat-preview-label">AGI</span>
                      <span className="stat-preview-value">{classData.baseStats.agility}</span>
                    </div>
                    <div className="stat-preview-item">
                      <span className="stat-preview-label">MIND</span>
                      <span className="stat-preview-value">{classData.baseStats.mindPower}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="button-group">
              <button onClick={() => setStage('username')} className="btn-secondary">
                ← Back
              </button>
              <button
                onClick={handleClassConfirm}
                className="btn-primary"
                disabled={!selectedClass}
              >
                Confirm Class
              </button>
            </div>
          </>
        )}

        {stage === 'confirm' && (
          <>
            <h2>Confirm Your Hero</h2>
            <p className="modal-subtitle">Ready to begin your adventure?</p>

            <div className="confirmation-card">
              <div className="confirmation-header">
                <span className="confirmation-icon">
                  {CLASS_CONFIG[selectedClass].icon}
                </span>
                <div>
                  <h3>{username}</h3>
                  <p style={{ color: CLASS_CONFIG[selectedClass].color }}>
                    {CLASS_CONFIG[selectedClass].name}
                  </p>
                </div>
              </div>

              <div className="stats-full">
                <h4>Starting Stats</h4>
                <div className="stat-row">
                  <span className="stat-name">❤️ HP</span>
                  <span className="stat-value">{CLASS_CONFIG[selectedClass].baseStats.hp}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-name">⚔️ Strength</span>
                  <span className="stat-value">{CLASS_CONFIG[selectedClass].baseStats.strength}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-name">⚡ Agility</span>
                  <span className="stat-value">{CLASS_CONFIG[selectedClass].baseStats.agility}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-name">🔮 Mind Power</span>
                  <span className="stat-value">{CLASS_CONFIG[selectedClass].baseStats.mindPower}</span>
                </div>
              </div>
            </div>

            <div className="button-group">
              <button onClick={() => setStage('class')} className="btn-secondary">
                ← Back
              </button>
              <button onClick={handleComplete} className="btn-primary">
                Start Adventure! 🎮
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
