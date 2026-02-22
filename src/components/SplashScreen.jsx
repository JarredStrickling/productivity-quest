import './SplashScreen.css';

export default function SplashScreen({ showError = false, errorMessage = '', onRetry }) {
  return (
    <div className="splash-screen">
      <img
        src="/assets/sprites/scrolls-of-doom-logo.png"
        alt="Scrolls of Doom"
        className="splash-logo"
      />
      {showError && (
        <div className="splash-error">
          <p className="splash-error-message">{errorMessage || 'Failed to connect. Please try again.'}</p>
          {onRetry && (
            <button className="splash-retry-btn" onClick={onRetry}>
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}
