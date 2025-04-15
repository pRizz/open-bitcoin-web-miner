import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { FloatingDeltaText } from './FloatingDeltaText';

interface FlashingTextProps {
  value: string | number | undefined | null;
  className?: string;
  disableFlash?: boolean;
  defaultValue?: string | number | undefined | null;
  enableGreenDelta?: boolean;
}

export const FlashingText = ({ value, className, defaultValue = 'N/A', disableFlash = false, enableGreenDelta = false }: FlashingTextProps) => {
  const [isFlashing, setIsFlashing] = useState(false);
  const [prevValue, setPrevValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const animationKeyRef = useRef(0);

  useEffect(() => {
    if (!disableFlash && value !== prevValue && value !== undefined && value !== null) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Reset the animation state and increment the key
      setIsFlashing(false);
      animationKeyRef.current += 1;

      // Start the animation
      setIsFlashing(true);
      setPrevValue(value);

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        setIsFlashing(false);
      }, 200);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [value, prevValue, disableFlash]);

  return (
    <div className="relative">
      <span
        key={disableFlash ? 0 : animationKeyRef.current}
        className={cn(
          "font-mono text-xs transition-all relative",
          !disableFlash && isFlashing && "animate-flash",
          className
        )}
      >
        {value || defaultValue}
      </span>
      <span className="relative inset-0 pointer-events-none">
        <FloatingDeltaText
          value={value}
          prevValue={prevValue}
          enableGreenDelta={enableGreenDelta}
        />
      </span>
    </div>
  );
};