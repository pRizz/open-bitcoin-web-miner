import { useMemo } from "react";

interface Particle {
  id: number;
  delay: string;
  duration: string;
  left: string;
  size: number;
  opacity: number;
}

interface ParticleEffectProps {
  count?: number;
}

export function ParticleEffect({ count = 15 }: ParticleEffectProps) {
  // Memoize particles so they don't get recreated on every rerender
  const particles = useMemo(() => 
    Array.from({ length: count }, (_, i) => ({
      id: i,
      delay: `${Math.random() * 2}s`,
      duration: `${2.5 + Math.random() * 2}s`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.2 + 0.2,
    })), [count]
  );

  return (
    <>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full animate-fade-up pointer-events-none bg-white/40"
          style={{
            left: particle.left,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
            animationDelay: particle.delay,
            animationDuration: particle.duration,
          }}
        />
      ))}
    </>
  );
}