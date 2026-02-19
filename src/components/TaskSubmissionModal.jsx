import { useState } from 'react';
import './TaskSubmissionModal.css';
import { API_URL } from '../config';

export default function TaskSubmissionModal({ isOpen, onClose, onSubmit }) {
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stage, setStage] = useState('description'); // 'description' | 'photo' | 'result'
  const [verificationRequest, setVerificationRequest] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [result, setResult] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGetVerification = async () => {
    if (!description.trim()) {
      alert('Please describe what you accomplished!');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/generate-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description })
      });

      if (!response.ok) throw new Error('Failed to generate verification');

      const data = await response.json();
      setVerificationRequest(data.verificationRequest);
      setTaskDescription(description);
      setStage('photo');
    } catch (error) {
      console.error('Error generating verification:', error);
      alert('Error generating verification: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!image) {
      alert('Photo is required for verification!');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('description', taskDescription);
      formData.append('verificationRequest', verificationRequest);
      formData.append('image', image);

      const response = await fetch(`${API_URL}/api/evaluate-task`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to evaluate task');
      }

      const evaluationResult = await response.json();

      // Set result and show result stage
      setResult(evaluationResult);
      setStage('result');

      // Pass result to parent for XP gain
      onSubmit(evaluationResult);
    } catch (error) {
      console.error('Error submitting task:', error);
      alert('Error submitting task: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setStage('description');
    setDescription('');
    setImage(null);
    setImagePreview(null);
    setVerificationRequest('');
    setTaskDescription('');
    setResult(null);
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      onKeyDown={(e) => e.stopPropagation()}
      onKeyUp={(e) => e.stopPropagation()}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        onKeyUp={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Submit Achievement</h2>
          <button className="close-btn" onClick={onClose}>X</button>
        </div>

        {stage === 'description' && (
          <div className="task-form">
            <div className="form-group">
              <label>What did you accomplish?</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                onKeyUp={(e) => e.stopPropagation()}
                placeholder="Describe your achievement (e.g., 'Cleaned my entire apartment', 'Finished a major project', 'Went to the gym')"
                rows={4}
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            <div className="xp-tiers-info">
              <h3>XP Tiers:</h3>
              <div className="tier-list">
                <div className="tier common">
                  <span className="tier-badge">Common</span>
                  <span className="tier-xp">10 XP</span>
                  <small>Small routine tasks</small>
                </div>
                <div className="tier strong">
                  <span className="tier-badge">Strong Work</span>
                  <span className="tier-xp">25 XP</span>
                  <small>Meaningful effort</small>
                </div>
                <div className="tier busting">
                  <span className="tier-badge">Busting Chops</span>
                  <span className="tier-xp">50 XP</span>
                  <small>Significant achievement</small>
                </div>
                <div className="tier legendary">
                  <span className="tier-badge">Legendary</span>
                  <span className="tier-xp">150 XP</span>
                  <small>Life-changing milestone</small>
                </div>
              </div>
            </div>

            <button onClick={handleGetVerification} className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Generating...' : 'Get Verification Request'}
            </button>
          </div>
        )}

        {stage === 'photo' && (
          <div className="task-form">
            <div className="verification-request">
              <h3>Photo Verification Required</h3>
              <p>{verificationRequest}</p>
            </div>

            <div className="form-group">
              <label>Upload Photo with Verification</label>
              <div className="image-upload-area">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageChange}
                  id="image-upload"
                  disabled={isSubmitting}
                />
                <label htmlFor="image-upload" className="upload-label">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="image-preview" />
                  ) : (
                    <div className="upload-placeholder">
                      <span>[ ]</span>
                      <p>Take photo with verification</p>
                      <small>Show {taskDescription} with the required verification</small>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <button onClick={handleSubmit} className="submit-btn" disabled={!image || isSubmitting}>
              {isSubmitting ? 'Evaluating...' : 'Submit for Evaluation'}
            </button>
          </div>
        )}

        {stage === 'result' && result && (
          <div className="task-form">
            <div className="result-display" style={{ borderColor: result.color }}>
              <h3 style={{ color: result.color }}>{result.tier}</h3>
              <p className="xp-gained">+{result.xp} XP</p>
              <p className="explanation">{result.explanation}</p>
            </div>

            <button onClick={() => { handleReset(); onClose(); }} className="submit-btn">
              Submit Another Task
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
