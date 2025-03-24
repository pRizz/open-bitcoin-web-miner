import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface FlashingTextProps {
  value: string | number | undefined | null;
  className?: string;
  disableFlash?: boolean;
  defaultValue?: string | number | undefined | null;
}

export const FlashingText = ({ value, className, defaultValue = 'N/A', disableFlash = false }: FlashingTextProps) => {
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
    <span
      key={disableFlash ? 0 : animationKeyRef.current}
      className={cn(
        "font-mono text-xs transition-all",
        !disableFlash && isFlashing && "animate-flash",
        className
      )}
    >
      {value || defaultValue}
    </span>
  );
};