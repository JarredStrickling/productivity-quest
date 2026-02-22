import { useState } from 'react';
import './CharacterCreationModal.css';
import { CLASS_CONFIG } from '../config/classes';
import {
  SKIN_TONES, HAIR_STYLES, HAIR_COLORS, OUTFIT_COLORS,
  HAT_STYLES, HAT_COLORS, CLASS_DEFAULT_APPEARANCE, CLASS_REQUIRED_HATS
} from '../config/appearance';
import PaperDollPreview from './PaperDollPreview';

// Cycle helper: wraps around in either direction
function cycle(arr, current, delta) {
  const idx = arr.indexOf(current);
  return arr[(idx + delta + arr.length) % arr.length];
}

function cycleObj(arr, currentId, delta) {
  const idx = arr.findIndex(item => item.id === currentId);
  const next = arr[(idx + delta + arr.length) % arr.length];
  return next.id;
}

function getObjName(arr, id) {
  return arr.find(item => item.id === id)?.name || '';
}

export default function CharacterCreationModal({ isOpen, onComplete }) {
  const [stage, setStage] = useState('username');
  const [username, setUsername] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [appearance, setAppearance] = useState(CLASS_DEFAULT_APPEARANCE.paladin);

  if (!isOpen) return null;

  const validateUsername = (value) => {
    if (value.length < 3) return 'Username must be at least 3 characters';
    if (value.length > 16) return 'Username must be 16 characters or less';
    if (!/^[a-zA-Z0-9 ]+$/.test(value)) return 'Letters, numbers, and spaces only';
    return '';
  };

  const handleUsernameNext = () => {
    const error = validateUsername(username);
    if (error) { setUsernameError(error); return; }
    setUsernameError('');
    setStage('class');
  };

  const handleClassSelect = (classKey) => {
    setSelectedClass(classKey);
  };

  const handleClassConfirm = () => {
    if (!selectedClass) return;
    const defaultAppearance = { ...CLASS_DEFAULT_APPEARANCE[selectedClass] };
    // Classes without a required hat get no hat
    if (!CLASS_REQUIRED_HATS[selectedClass]) {
      defaultAppearance.hatStyle = null;
      defaultAppearance.hatColor = 'v01';
    }
    setAppearance(defaultAppearance);
    setStage('customize');
  };

  const updateAppearance = (key, value) => {
    setAppearance(prev => ({ ...prev, [key]: value }));
  };

  const handleFinalConfirm = () => {
    const classData = CLASS_CONFIG[selectedClass];
    onComplete({
      username: username.trim(),
      characterClass: selectedClass,
      appearance,
      stats: {
        maxHp: classData.baseStats.hp,
        strength: classData.baseStats.strength,
        agility: classData.baseStats.agility,
        mindPower: classData.baseStats.mindPower
      }
    });
  };

  const selectedClassData = selectedClass ? CLASS_CONFIG[selectedClass] : null;
  const hatStyleObj = HAT_STYLES.find(h => h.id === appearance.hatStyle);

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
                onChange={(e) => { setUsername(e.target.value); setUsernameError(''); }}
                placeholder="Enter your name..."
                maxLength={16}
                autoFocus
              />
              {usernameError && <div className="error-text">{usernameError}</div>}
            </div>

            <button className="btn btn-primary" onClick={handleUsernameNext} disabled={!username.trim()}>
              Next
            </button>
          </>
        )}

        {/* Stage 2: Class Selection */}
        {stage === 'class' && (
          <>
            <h2>Choose Your Class</h2>
            <p className="stage-description">Select your character's role</p>

            <div className="class-list">
              {Object.entries(CLASS_CONFIG).map(([key, classData]) => (
                <div
                  key={key}
                  className={`class-row ${selectedClass === key ? 'selected' : ''}`}
                  onClick={() => handleClassSelect(key)}
                  style={{ borderColor: selectedClass === key ? classData.color : undefined }}
                >
                  <div className="class-row-icon" style={{ color: classData.color }}>{classData.icon}</div>
                  <div className="class-row-info">
                    <h3 style={{ color: classData.color }}>{classData.name}</h3>
                    <div className="class-row-stats">
                      <span>HP {classData.baseStats.hp}</span>
                      <span>STR {classData.baseStats.strength}</span>
                      <span>AGI {classData.baseStats.agility}</span>
                      <span>MIND {classData.baseStats.mindPower}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="button-group">
              <button className="btn btn-secondary" onClick={() => setStage('username')}>Back</button>
              <button className="btn btn-primary" onClick={handleClassConfirm} disabled={!selectedClass}>
                Customize Look
              </button>
            </div>
          </>
        )}

        {/* Stage 3: Customize Appearance */}
        {stage === 'customize' && (
          <>
            <h2>Customize Appearance</h2>
            <p className="stage-description">Design your hero's look</p>

            <div className="customize-layout">
              <div className="preview-area">
                <PaperDollPreview appearance={appearance} size={160} />
              </div>

              <div className="customize-options">
                {/* Skin Tone */}
                <div className="option-row">
                  <span className="option-label">Skin</span>
                  <div className="option-control">
                    <button className="cycle-btn" onClick={() => updateAppearance('skin', cycle(SKIN_TONES, appearance.skin, -1))}>&#9664;</button>
                    <span className="option-value">{SKIN_TONES.indexOf(appearance.skin) + 1} / {SKIN_TONES.length}</span>
                    <button className="cycle-btn" onClick={() => updateAppearance('skin', cycle(SKIN_TONES, appearance.skin, 1))}>&#9654;</button>
                  </div>
                </div>

                {/* Hair Style */}
                <div className="option-row">
                  <span className="option-label">Hair</span>
                  <div className="option-control">
                    <button className="cycle-btn" onClick={() => updateAppearance('hairStyle', cycleObj(HAIR_STYLES, appearance.hairStyle, -1))}>&#9664;</button>
                    <span className="option-value">{getObjName(HAIR_STYLES, appearance.hairStyle)}</span>
                    <button className="cycle-btn" onClick={() => updateAppearance('hairStyle', cycleObj(HAIR_STYLES, appearance.hairStyle, 1))}>&#9654;</button>
                  </div>
                </div>

                {/* Hair Color */}
                <div className="option-row">
                  <span className="option-label">Hair Color</span>
                  <div className="option-control">
                    <button className="cycle-btn" onClick={() => updateAppearance('hairColor', cycle(HAIR_COLORS, appearance.hairColor, -1))}>&#9664;</button>
                    <span className="option-value">{HAIR_COLORS.indexOf(appearance.hairColor) + 1} / {HAIR_COLORS.length}</span>
                    <button className="cycle-btn" onClick={() => updateAppearance('hairColor', cycle(HAIR_COLORS, appearance.hairColor, 1))}>&#9654;</button>
                  </div>
                </div>

                {/* Outfit Color */}
                <div className="option-row">
                  <span className="option-label">Outfit</span>
                  <div className="option-control">
                    <button className="cycle-btn" onClick={() => updateAppearance('outfit', cycle(OUTFIT_COLORS, appearance.outfit, -1))}>&#9664;</button>
                    <span className="option-value">{OUTFIT_COLORS.indexOf(appearance.outfit) + 1} / {OUTFIT_COLORS.length}</span>
                    <button className="cycle-btn" onClick={() => updateAppearance('outfit', cycle(OUTFIT_COLORS, appearance.outfit, 1))}>&#9654;</button>
                  </div>
                </div>

                {/* Hat Style - classes with required hats (locked to their hat type) */}
                {CLASS_REQUIRED_HATS[selectedClass] && (
                <div className="option-row">
                  <span className="option-label">Hat</span>
                  <div className="option-control">
                    <span className="option-value">{hatStyleObj?.name || 'None'}</span>
                  </div>
                </div>
                )}

                {/* Hat Color (only if hat is equipped) */}
                {CLASS_REQUIRED_HATS[selectedClass] && appearance.hatStyle && (
                  <div className="option-row">
                    <span className="option-label">Hat Color</span>
                    <div className="option-control">
                      <button className="cycle-btn" onClick={() => updateAppearance('hatColor', cycle(HAT_COLORS, appearance.hatColor, -1))}>&#9664;</button>
                      <span className="option-value">{HAT_COLORS.indexOf(appearance.hatColor) + 1} / {HAT_COLORS.length}</span>
                      <button className="cycle-btn" onClick={() => updateAppearance('hatColor', cycle(HAT_COLORS, appearance.hatColor, 1))}>&#9654;</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="button-group">
              <button className="btn btn-secondary" onClick={() => setStage('class')}>Back</button>
              <button className="btn btn-primary" onClick={() => setStage('confirm')}>Continue</button>
            </div>
          </>
        )}

        {/* Stage 4: Confirmation */}
        {stage === 'confirm' && selectedClassData && (
          <>
            <h2>Confirm Your Hero</h2>
            <p className="stage-description">Ready to begin your adventure?</p>

            <div className="confirmation-card">
              <div className="confirmation-header">
                <PaperDollPreview appearance={appearance} size={192} />
                <div>
                  <div className="confirm-username">{username}</div>
                  <div className="confirm-class" style={{ color: selectedClassData.color }}>
                    {selectedClassData.name}
                  </div>
                </div>
              </div>

              <div className="stats-compact">
                <div className="stat-row"><span className="stat-label">HP</span><span className="stat-value">{selectedClassData.baseStats.hp}</span></div>
                <div className="stat-row"><span className="stat-label">STR</span><span className="stat-value">{selectedClassData.baseStats.strength}</span></div>
                <div className="stat-row"><span className="stat-label">AGI</span><span className="stat-value">{selectedClassData.baseStats.agility}</span></div>
                <div className="stat-row"><span className="stat-label">MIND</span><span className="stat-value">{selectedClassData.baseStats.mindPower}</span></div>
                <div className="stat-row"><span className="stat-label">MANA</span><span className="stat-value">{selectedClassData.baseStats.mindPower * 10}</span></div>
              </div>
            </div>

            <div className="button-group">
              <button className="btn btn-secondary" onClick={() => setStage('customize')}>Back</button>
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
