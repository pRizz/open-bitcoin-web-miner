import { CheckCircle2, XCircle, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type IconType = 'challenge' | 'difficulty' | 'solution' | 'accepted' | 'rejected';

interface AnimatedMiningIconProps {
  type: IconType;
  isAnimating: boolean;
  direction: 'up' | 'down';
  className?: string;
}

const getIcon = (type: IconType) => {
  switch (type) {
    case 'challenge':
      return <Target className="w-6 h-6 text-blue-500" />;
    case 'difficulty':
      return <ArrowDownRight className="w-6 h-6 text-yellow-500" />;
    case 'solution':
      return <ArrowUpRight className="w-6 h-6 text-purple-500" />;
    case 'accepted':
      return <CheckCircle2 className="w-6 h-6 text-green-500" />;
    case 'rejected':
      return <XCircle className="w-6 h-6 text-red-500" />;
  }
};

export const AnimatedMiningIcon = ({ type, isAnimating, direction, className }: AnimatedMiningIconProps) => {
  return (
    <div
      className={cn(
        'absolute',
        isAnimating
          ? direction === 'down'
            ? 'animate-move-down'
            : 'animate-move-up'
          : 'translate-y-0 opacity-0',
        className
      )}
    >
      {getIcon(type)}
    </div>
  );
}; 