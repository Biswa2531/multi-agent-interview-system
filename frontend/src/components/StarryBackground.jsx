import { useMemo } from 'react';

function StarryBackground() {
  // Generate 60 random stars only once when component mounts
  const stars = useMemo(() => {
    return Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 3 + 1}px`, // Random size between 1px and 4px
      duration: `${Math.random() * 3 + 2}s`, // Random twinkle speed
      delay: `${Math.random() * 5}s`, // Random delay so they don't twinkle together
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {stars.map((star) => (
        <div
          key={star.id}
          className="star"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            '--duration': star.duration,
            '--delay': star.delay,
          }}
        />
      ))}
    </div>
  );
}

export default StarryBackground;