import { useMemo } from 'react';

function composeStars(count) {
  return Array.from({ length: count }, () => ({
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 2 + 1,
    delay: `${Math.random() * 6}s`,
    duration: `${Math.random() * 4 + 4}s`,
    opacity: Math.random() * 0.5 + 0.2,
  }));
}

export default function Starfield({ count = 80 }) {
  const stars = useMemo(() => composeStars(count), [count]);

  return (
    <div className="starfield" aria-hidden="true">
      {stars.map((star, i) => (
        <span
          key={i}
          className="star"
          style={{
            top: star.top,
            left: star.left,
            width: `${star.size}px`,
            height: `${star.size}px`,
            '--star-opacity': star.opacity,
            animationDelay: star.delay,
            animationDuration: star.duration,
          }}
        />
      ))}
    </div>
  );
}
