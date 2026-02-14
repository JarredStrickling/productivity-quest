import { useEffect, useState } from 'react';
import './TitleScreen.css';

export default function TitleScreen({ onComplete }) {
  const [fadeState, setFadeState] = useState('fade-in'); // fade-in, hold, fade-out, done

  useEffect(() => {
    // Fade in for 1 second
    const fadeInTimer = setTimeout(() => {
      setFadeState('hold');
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

  if (fadeState === 'done') return null;

  return (
    <div className={`title-screen ${fadeState}`}>
      <img
        src="/assets/sprites/scrollsofdoomtitle.png"
        alt="Scrolls of Doom"
        className="title-image"
      />
    </div>
  );
}
