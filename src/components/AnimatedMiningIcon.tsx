import React from "react";
import { CheckCircle2, XCircle, Target, ArrowUpRight, ArrowDownRight, Puzzle, Binary } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MiningEventType } from '@/contexts/mining/MiningEventsContext';
import { SubmissionResponse } from '@/contexts/mining/MiningEventsContext';

export type IconType = 'challenge' | 'difficulty' | 'solution' | 'accepted' | 'rejected';

interface AnimatedMiningIconProps {
  type: IconType;
  isAnimating: boolean;
  direction: 'up' | 'down';
  className?: string;
}

export const getIconTypeFromEvent = (eventType: MiningEventType, response?: SubmissionResponse): IconType => {
  switch (eventType) {
  case 'onNewChallengeReceived':
    return 'challenge';
  case 'onNewDifficultyUpdate':
    return 'difficulty';
  case 'onSubmitSolution':
    return 'solution';
  case 'onReceiveSubmissionResponse':
    return response?.accepted ? 'accepted' : 'rejected';
  }
};

const getIcon = (type: IconType) => {
  switch (type) {
  case 'challenge':
    return <Puzzle className="w-6 h-6 text-blue-500" />;
  case 'difficulty':
    return <Target className="w-6 h-6 text-yellow-500" />;
  case 'solution':
    return <Binary className="w-6 h-6 text-purple-500" />;
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