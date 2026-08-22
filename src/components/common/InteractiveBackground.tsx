import React, { useEffect, useRef } from 'react';

/** A low-key, pointer-aware background that never competes with workspace content. */
export const InteractiveBackground: React.FC = () => {
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const updatePointer = (event: PointerEvent) => {
      if (frame.current) cancelAnimationFrame(frame.current);

      frame.current = requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--pointer-x', `${(event.clientX / window.innerWidth) * 100}%`);
        document.documentElement.style.setProperty('--pointer-y', `${(event.clientY / window.innerHeight) * 100}%`);
      });
    };

    window.addEventListener('pointermove', updatePointer, { passive: true });
    return () => {
      window.removeEventListener('pointermove', updatePointer);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  return (
    <div className="ambient-background" aria-hidden="true">
      <div className="ambient-orb ambient-orb-one" />
      <div className="ambient-orb ambient-orb-two" />
      <div className="ambient-grid" />
      <div className="ambient-cursor-glow" />
    </div>
  );
};
