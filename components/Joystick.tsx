import React, { useEffect, useRef, useState } from 'react';

interface JoystickProps {
  onMove: (vector: { x: number; y: number }) => void;
}

const Joystick: React.FC<JoystickProps> = ({ onMove }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleStart = (e: TouchEvent | MouseEvent) => {
      e.preventDefault();
      setActive(true);
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      touchStartRef.current = { x: clientX, y: clientY };
      setPosition({ x: 0, y: 0 });
      onMove({ x: 0, y: 0 });
    };

    const handleMove = (e: TouchEvent | MouseEvent) => {
      if (!active || !touchStartRef.current) return;
      e.preventDefault();

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const dx = clientX - touchStartRef.current.x;
      const dy = clientY - touchStartRef.current.y;
      
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDistance = 40; // Max radius of joystick movement
      
      let cappedDx = dx;
      let cappedDy = dy;

      if (distance > maxDistance) {
        const ratio = maxDistance / distance;
        cappedDx = dx * ratio;
        cappedDy = dy * ratio;
      }

      setPosition({ x: cappedDx, y: cappedDy });
      
      // Normalize output -1 to 1
      onMove({ 
        x: cappedDx / maxDistance, 
        y: cappedDy / maxDistance 
      });
    };

    const handleEnd = () => {
      setActive(false);
      setPosition({ x: 0, y: 0 });
      onMove({ x: 0, y: 0 });
      touchStartRef.current = null;
    };

    container.addEventListener('touchstart', handleStart, { passive: false });
    container.addEventListener('touchmove', handleMove, { passive: false });
    container.addEventListener('touchend', handleEnd);
    container.addEventListener('mousedown', handleStart);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);

    return () => {
      container.removeEventListener('touchstart', handleStart);
      container.removeEventListener('touchmove', handleMove);
      container.removeEventListener('touchend', handleEnd);
      container.removeEventListener('mousedown', handleStart);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
    };
  }, [active, onMove]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-32 h-32 rounded-full border-2 border-white/20 bg-black/30 backdrop-blur-sm touch-none transition-opacity duration-200 ${active ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}
    >
      <div 
        ref={knobRef}
        className="absolute w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          left: '50%',
          top: '50%',
          transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`
        }}
      />
    </div>
  );
};

export default Joystick;