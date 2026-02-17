import { useState } from 'react';
import './WeeklyQuestsModal.css';

export default function WeeklyQuestsModal({ isOpen, onClose }) {
  // Placeholder weekly quests
  const [quests] = useState([
    {
      id: 1,
      title: 'Complete 5 Daily Tasks',
      description: 'Submit 5 tasks to the Task Master',
      reward: '100 XP',
      progress: 0,
      goal: 5,
      completed: false
    },
    {
      id: 2,
      title: 'Level Up',
      description: 'Reach the next character level',
      reward: '200 XP + Item',
      progress: 0,
      goal: 1,
      completed: false
    },
    {
      id: 3,
      title: 'Defeat Dungeon Boss',
      description: 'Complete a dungeon run successfully',
      reward: '300 XP + Rare Item',
      progress: 0,
      goal: 1,
      completed: false
    }
  ]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content weekly-quests-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📜 Weekly Quests</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="quests-container">
          <p className="quests-intro">
            Complete these quests before the week ends for bonus rewards!
          </p>

          <div className="quests-list">
            {quests.map(quest => (
              <div
                key={quest.id}
                className={`quest-card ${quest.completed ? 'completed' : ''}`}
              >
                <div className="quest-header">
                  <h3>{quest.title}</h3>
                  {quest.completed && <span className="completed-badge">✓ Done</span>}
                </div>

                <p className="quest-description">{quest.description}</p>

                <div className="quest-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${(quest.progress / quest.goal) * 100}%` }}
                    />
                  </div>
                  <span className="progress-text">{quest.progress} / {quest.goal}</span>
                </div>

                <div className="quest-reward">
                  <span className="reward-label">Reward:</span>
                  <span className="reward-value">{quest.reward}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="quests-footer">
            <p className="reset-timer">Quests reset in: 5 days, 14 hours</p>
            <button className="close-modal-btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
