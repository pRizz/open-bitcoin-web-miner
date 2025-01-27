import { useEffect, useRef } from "react";

interface ParticleEffectProps {
  count?: number;
}

export function ParticleEffect({ count = 15 }: ParticleEffectProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create particles once and inject them into the DOM
    const particles = Array.from({ length: count }, (_, i) => {
      const particle = document.createElement('div');
      particle.className = 'absolute rounded-full pointer-events-none bg-white/40';
      
      // Set random initial positions and sizes
      const size = Math.random() * 2 + 1;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.opacity = `${Math.random() * 0.2 + 0.2}`;
      
      // Add keyframe animation with random delays and durations
      particle.style.animation = `
        particle-rise ${2.5 + Math.random() * 2}s ease-out infinite ${Math.random() * 2}s
      `;
      
      return particle;
    });

    // Add particles to container
    particles.forEach(particle => {
      containerRef.current?.appendChild(particle);
    });

    // Cleanup function to remove particles
    return () => {
      particles.forEach(particle => {
        particle.remove();
      });
    };
  }, [count]); // Only recreate particles if count changes

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 overflow-hidden"
      style={{
        // Add @keyframes animation definition
        ['--particle-keyframes' as string]: `
          @keyframes particle-rise {
            0% {
              transform: translateY(100%);
              opacity: var(--particle-opacity, 0.3);
            }
            100% {
              transform: translateY(-100%);
              opacity: 0;
            }
          }
        `
      }}
    />
  );
}