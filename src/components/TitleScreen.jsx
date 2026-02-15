import { useEffect, useState } from 'react';
import './TitleScreen.css';

export default function TitleScreen({ onComplete }) {
  const [fadeState, setFadeState] = useState('fade-in'); // fade-in, hold, fade-out, done
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    // Fade in for 1 second
    const fadeInTimer = setTimeout(() => {
      setFadeState('hold');
      setCanSkip(true); // Allow skipping after fade-in completes
    }, 1000);

    // Hold for 2 seconds
    const holdTimer = setTimeout(() => {
      setFadeState('fade-out');
    }, 3000);

    // Fade out for 1 second, then complete
    const fadeOutTimer = setTimeout(() => {
      setFadeState('done');
      onComplete();
    }, 4000);

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(holdTimer);
      clearTimeout(fadeOutTimer);
    };
  }, [onComplete]);

  const handleClick = () => {
    if (canSkip && fadeState !== 'fade-out' && fadeState !== 'done') {
      setFadeState('fade-out');
      setTimeout(() => {
        setFadeState('done');
        onComplete();
      }, 1000);
    }
  };

  if (fadeState === 'done') return null;

  return (
    <div className={`title-screen ${fadeState}`} onClick={handleClick}>
      <img
        src="/assets/sprites/scrolls-of-doom-logo.png"
        alt="Scrolls of Doom"
        className="title-image"
      />
      {canSkip && fadeState === 'hold' && (
        <div className="tap-to-continue">Tap to Continue</div>
      )}
    </div>
  );
}
