import React from "react";
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import './FloatingDeltaText.css';

interface FloatingDeltaTextProps {
  value: string | number | undefined | null;
  prevValue: string | number | undefined | null;
  className?: string;
  enableGreenDelta?: boolean;
}

interface FloatingText {
  id: string;
  delta: number;
  startTime: number;
  basePosition: { x: number; y: number };
}

const RightwardsLinearDiv = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="rightwards-linear-div" style={{ zIndex: 1000 }}>
      {children}
    </div>
  )
}

const VerticalSineWaveDiv = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="vertical-sine-wave-div" style={{ zIndex: 1000 }}>
      {children}
    </div>
  )
}

const UpwardsLinearDiv = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="upwards-linear-div" style={{ zIndex: 1000 }}>
      {children}
    </div>
  )
}

export const FloatingDeltaText = ({ value, prevValue, className, enableGreenDelta = false }: FloatingDeltaTextProps) => {
  const [activeTexts, setActiveTexts] = useState<FloatingText[]>([]);

  useEffect(() => {
    if (!enableGreenDelta) {
      return;
    }

    // Early return if values are the same or either is undefined/null
    if (value === prevValue || value === undefined || value === null ||
        prevValue === undefined || prevValue === null) {
      return;
    }

    // Extract numeric values from strings if needed
    const currentNum = typeof value === 'string' ? parseFloat(value) : value;
    const prevNum = typeof prevValue === 'string' ? parseFloat(prevValue) : prevValue;

    // Early return if values are not valid numbers
    if (isNaN(currentNum) || isNaN(prevNum)) {
      return;
    }

    const newDelta = currentNum - prevNum;

    // Early return if delta is zero
    if (newDelta === 0) {
      return;
    }

    // Generate base position with slight randomization
    // const randomX = (Math.random() - 0.5) * 40; // -20 to +20 pixels
    // const randomY = -30 - Math.random() * 30; // -30 to -60 pixels
    const randomX = 0;
    const randomY = 0;

    const newText: FloatingText = {
      id: `${Date.now()}-${Math.random()}`,
      delta: newDelta,
      startTime: Date.now(),
      basePosition: { x: randomX, y: randomY }
    };

    setActiveTexts(prev => [...prev, newText]);

    // Remove this specific text after animation
    const timeout = setTimeout(() => {
      setActiveTexts(prev => prev.filter(text => text.id !== newText.id));
    }, 5000);

    return () => clearTimeout(timeout);
  }, [value, prevValue]);

  if (!enableGreenDelta || activeTexts.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1000, top: 0, right: 0 }}>
      {activeTexts.map(text => (
        <div
          key={text.id}
          className={cn(
            "font-mono text-sm font-bold text-success",
            className
          )}
          style={{
            position: 'absolute',
            left: `${text.basePosition.x}px`,
            top: `${text.basePosition.y}px`,
            zIndex: 1000
          }}
        >
          <RightwardsLinearDiv>
            <VerticalSineWaveDiv>
              <UpwardsLinearDiv>
                {text.delta > 0 ? '+' : ''}{text.delta}
              </UpwardsLinearDiv>
            </VerticalSineWaveDiv>
          </RightwardsLinearDiv>
        </div>
      ))}
    </div>
  );
};
