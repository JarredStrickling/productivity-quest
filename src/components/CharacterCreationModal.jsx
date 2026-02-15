import { useState } from 'react';
import './CharacterCreationModal.css';
import { CLASS_CONFIG } from '../config/classes';

export default function CharacterCreationModal({ isOpen, onComplete }) {
  const [stage, setStage] = useState('username'); // 'username' | 'class' | 'confirm'
  const [username, setUsername] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [usernameError, setUsernameError] = useState('');

  if (!isOpen) return null;

  const validateUsername = (value) => {
    if (value.length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (value.length > 16) {
      return 'Username must be 16 characters or less';
    }
    if (!/^[a-zA-Z0-9 ]+$/.test(value)) {
      return 'Username can only contain letters, numbers, and spaces';
    }
    return '';
  };

  const handleUsernameNext = () => {
    const error = validateUsername(username);
    if (error) {
      setUsernameError(error);
      return;
    }
    setUsernameError('');
    setStage('class');
  };

  const handleClassSelect = (classKey) => {
    setSelectedClass(classKey);
  };

  const handleClassConfirm = () => {
    if (!selectedClass) return;
    setStage('confirm');
  };

  const handleFinalConfirm = () => {
    const classData = CLASS_CONFIG[selectedClass];
    onComplete({
      username: username.trim(),
      characterClass: selectedClass,
      stats: {
        maxHp: classData.baseStats.hp,
        strength: classData.baseStats.strength,
        agility: classData.baseStats.agility,
        mindPower: classData.baseStats.mindPower
      }
    });
  };

  const selectedClassData = selectedClass ? CLASS_CONFIG[selectedClass] : null;

  return (
    <div className="modal-overlay char-creation-overlay">
      <div className="modal-content char-creation-content">
        {/* Stage 1: Username */}
        {stage === 'username' && (
          <>
            <h2>Create Your Character</h2>
            <p className="stage-description">Choose a name for your hero</p>

            <div className="username-input-section">
              <label htmlFor="username">Character Name</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setUsernameError('');
                }}
                placeholder="Enter your name..."
                maxLength={16}
                autoFocus
              />
              {usernameError && <div className="error-text">{usernameError}</div>}
            </div>

            <button
              className="btn btn-primary"
              onClick={handleUsernameNext}
              disabled={!username.trim()}
            >
              Next
            </button>
          </>
        )}

        {/* Stage 2: Class Selection */}
        {stage === 'class' && (
          <>
            <h2>Choose Your Class</h2>
            <p className="stage-description">Select your character's role</p>

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
                  <div className="class-icon" style={{ color: classData.color }}>
                    {classData.icon}
                  </div>
                  <h3 style={{ color: classData.color }}>{classData.name}</h3>
                  <p className="class-description">{classData.description}</p>

                  <div className="stats-preview">
                    <div className="stat-item">
                      <span className="stat-label">HP</span>
                      <span className="stat-value">{classData.baseStats.hp}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">STR</span>
                      <span className="stat-value">{classData.baseStats.strength}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">AGI</span>
                      <span className="stat-value">{classData.baseStats.agility}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">MIND</span>
                      <span className="stat-value">{classData.baseStats.mindPower}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="button-group">
              <button className="btn btn-secondary" onClick={() => setStage('username')}>
                Back
              </button>
              <button
                className="btn btn-primary"
                onClick={handleClassConfirm}
                disabled={!selectedClass}
              >
                Confirm Class
              </button>
            </div>
          </>
        )}

        {/* Stage 3: Confirmation */}
        {stage === 'confirm' && selectedClassData && (
          <>
            <h2>Confirm Your Hero</h2>
            <p className="stage-description">Ready to begin your adventure?</p>

            <div className="confirmation-card">
              <div className="confirmation-header">
                <div className="class-icon-large" style={{ color: selectedClassData.color }}>
                  {selectedClassData.icon}
                </div>
                <div>
                  <div className="confirm-username">{username}</div>
                  <div className="confirm-class" style={{ color: selectedClassData.color }}>
                    {selectedClassData.name}
                  </div>
                </div>
              </div>

              <div className="stats-breakdown">
                <h3>Starting Stats</h3>
                <div className="stat-row">
                  <span className="stat-label">Health Points</span>
                  <span className="stat-value">{selectedClassData.baseStats.hp} HP</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Strength</span>
                  <span className="stat-value">{selectedClassData.baseStats.strength}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Agility</span>
                  <span className="stat-value">{selectedClassData.baseStats.agility}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Mind Power</span>
                  <span className="stat-value">{selectedClassData.baseStats.mindPower}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Mana</span>
                  <span className="stat-value">{selectedClassData.baseStats.mindPower * 10}</span>
                </div>
              </div>
            </div>

            <div className="button-group">
              <button className="btn btn-secondary" onClick={() => setStage('class')}>
                Back
              </button>
              <button className="btn btn-primary btn-start-adventure" onClick={handleFinalConfirm}>
                Start Adventure!
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
