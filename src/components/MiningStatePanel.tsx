import { Card } from "@/components/ui/card";
import { useMining } from "@/contexts/MiningContext";
import { useMinerInfo } from "@/contexts/mining/MinerInfoContext";
import { useNetworkInfo } from "@/contexts/NetworkInfoContext";
import { useMiningEvents, MiningEventType } from "@/contexts/mining/MiningEventsContext";
import { cn } from "@/lib/utils";
import { Database, Computer, CheckCircle2, XCircle, Target, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { formatHashRate } from "@/utils/mining";
import { useEffect, useState } from "react";
import { AnimatedMiningIcon } from "./AnimatedMiningIcon";

const StatusIndicator = ({ isConnected }: { isConnected: boolean }) => (
  <div className="flex items-center gap-2">
    <div
      className={cn(
        "w-3 h-3 rounded-full",
        isConnected ? "bg-green-500" : "bg-red-500"
      )}
    />
    <span className="text-sm">{isConnected ? "Connected" : "Disconnected"}</span>
  </div>
);

const ArrowPair = () => (
  <div className="relative w-48 h-6 mx-auto flex justify-between items-center">
    <div className="w-12 flex justify-center">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-muted-foreground"
      >
        {/* Down arrow */}
        <path
          d="M12 4L12 20M12 20L8 16M12 20L16 16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
    <div className="w-12 flex justify-center">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-muted-foreground"
      >
        {/* Up arrow */}
        <path
          d="M12 20L12 4M12 4L8 8M12 4L16 8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  </div>
);

const BitcoinIcon = () => (
  <img
    src="/Bitcoin.svg"
    alt="Bitcoin"
    className="w-8 h-8"
  />
);

const AnimatedArrow = ({ isActive, direction }: { isActive: boolean; direction: 'up' | 'down' }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn(
      "transition-colors duration-300",
      isActive ? "text-green-500" : "text-muted-foreground"
    )}
  >
    <path
      d={direction === 'down'
        ? "M12 4L12 20M12 20L8 16M12 20L16 16"
        : "M12 20L12 4M12 4L8 8M12 4L16 8"
      }
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface AnimationInstance {
  id: string;
  type: MiningEventType;
  direction: 'up' | 'down';
}

export const MiningStatePanel = () => {
  const { miningStats, isMining } = useMining();
  const { maybeMinerAddress } = useMinerInfo();
  const { maybeBlockHeight, maybeNetworkDifficulty, maybeRequiredBinaryZeroes } = useNetworkInfo();
  const { subscribe } = useMiningEvents();

  const [activeAnimations, setActiveAnimations] = useState<AnimationInstance[]>([]);
  const [arrowStates, setArrowStates] = useState<{
    up: boolean;
    down: boolean;
  }>({
    up: false,
    down: false,
  });

  // Example 1: we get two events in a row, with a delay of 500ms between them
  // The first event will trigger an animation, and the second event will be queued up
  // first timeSinceLastEvent = big number
  // delay = 0;
  // lastEventTime = now
  // Second event comes in
  // timeSinceLastEvent = now - lastEventTime = 0;
  // delay = 500 - 0 = 500;
  // lastEventTime = now + 500 = now + 500;
  // If a third event comes in 100 ms later,
  // timeSinceLastEvent = now - lastEventTime = -400;
  // delay = 500 - (-400) = 900;
  // lastEventTime = now + 900 = now + 900;
  // If a fourth event comes in 100 ms later,
  // timeSinceLastEvent = now - lastEventTime = -800;
  // delay = 500 - (-800) = 1300;
  // lastEventTime = now + 1300 = now + 1300;
  useEffect(() => {
    let lastEventTime = 0;
    const QUEUE_DELAY = 500; // ms between events

    const handleEvent = (eventType: MiningEventType, data?: any) => {
      console.log("handleEvent", eventType, data);

      const now = Date.now();
      const timeSinceLastEvent = now - lastEventTime;

      // If an event occurred within the last QUEUE_DELAY ms, wait for the remaining time
      const delay = Math.max(0, QUEUE_DELAY - timeSinceLastEvent);
      lastEventTime = Date.now() + delay;

      setTimeout(() => {
        const animationId = `${eventType}-${Date.now()}`;
        const direction = eventType === 'onSubmitSolution' ? 'up' : 'down';

        setActiveAnimations(prev => [...prev, { id: animationId, type: eventType, direction }]);
        setArrowStates(prev => ({ ...prev, [direction]: true }));

        // Remove the animation after it completes
        setTimeout(() => {
          setActiveAnimations(prev => prev.filter(anim => anim.id !== animationId));
          setArrowStates(prev => ({ ...prev, [direction]: false }));
        }, 2000);
      }, delay);
    };

    const unsubscribeChallenge = subscribe('onNewChallengeReceived', handleEvent);
    const unsubscribeDifficulty = subscribe('onNewDifficultyUpdate', handleEvent);
    const unsubscribeSolution = subscribe('onSubmitSolution', handleEvent);
    const unsubscribeResponse = subscribe('onReceiveSubmissionResponse', handleEvent);

    return () => {
      unsubscribeChallenge();
      unsubscribeDifficulty();
      unsubscribeSolution();
      unsubscribeResponse();
    };
  }, [subscribe]);

  return (
    <Card className="p-6 glass-card">
      <h2 className="text-2xl font-bold mb-4">Mining State</h2>

      {/* Bitcoin Network Section */}
      <div className="mb-2 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <BitcoinIcon />
          The Bitcoin Network
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Current Block Height:</span>
            <span className="font-mono text-xs">{maybeBlockHeight || "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Network Difficulty:</span>
            <span className="font-mono text-xs">{maybeNetworkDifficulty !== undefined ? `${(maybeNetworkDifficulty / 1e12).toFixed(2)} T` : "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Required Binary Zeroes:</span>
            <span className="font-mono text-xs">{maybeRequiredBinaryZeroes || "N/A"}</span>
          </div>
        </div>
      </div>

      {/* Arrow pair between Bitcoin Network and Mining Backend */}
      <div className="mb-2">
        <ArrowPair />
      </div>

      {/* Mining Backend Section */}
      <div className="mb-2 p-4 border rounded-lg relative">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Database className="w-8 h-8 text-muted-foreground" />
          Mining Backend
        </h3>
        <StatusIndicator isConnected={true} />
        {activeAnimations
          .filter(anim => ['onNewChallengeReceived', 'onNewDifficultyUpdate', 'onReceiveSubmissionResponse'].includes(anim.type))
          .map((anim, index) => (
            <AnimatedMiningIcon
              key={anim.id}
              type={anim.type === 'onNewChallengeReceived' ? 'challenge' :
                anim.type === 'onNewDifficultyUpdate' ? 'difficulty' :
                  anim.type === 'onReceiveSubmissionResponse' ? 'accepted' : 'rejected'}
              isAnimating={true}
              direction={anim.direction}
              className={cn(
                "left-[25%] top-1/2",
                index > 0 && "ml-4" // Add margin between multiple icons
              )}
            />
          ))}
      </div>

      {/* Arrow pair between Mining Backend and Web Miner */}
      <div className="mb-2 relative">
        <div className="relative w-48 h-6 mx-auto flex justify-between items-center">
          <div className="w-12 flex justify-center">
            <AnimatedArrow isActive={arrowStates.down} direction="down" />
          </div>
          <div className="w-12 flex justify-center">
            <AnimatedArrow isActive={arrowStates.up} direction="up" />
          </div>
        </div>
      </div>

      {/* Web Miner Section */}
      <div className="p-4 border rounded-lg relative">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Computer className="w-8 h-8 text-muted-foreground" />
          Web Miner
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status:</span>
            <span className="font-mono text-xs">{isMining ? "Active" : "Inactive"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Miner Address:</span>
            <span className="font-mono text-xs">{maybeMinerAddress || "Not Set"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Hash Rate:</span>
            <span className="font-mono text-xs">{formatHashRate(miningStats.maybeHashRate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Hashes:</span>
            <span className="font-mono text-xs">{miningStats.maybeTotalHashes || "0"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Accepted Hashes
            </span>
            <span className="font-mono text-xs">{miningStats.acceptedHashes}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              Rejected Hashes
            </span>
            <span className="font-mono text-xs">{miningStats.rejectedHashes}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-2">
              <Target className="w-4 h-4 text-yellow-500" />
              Required Leading Binary Zeros
            </span>
            <span className="font-mono text-xs">{miningStats.maybeRequiredBinaryZeroes || "N/A"}</span>
          </div>
        </div>
        {activeAnimations
          .filter(anim => anim.type === 'onSubmitSolution')
          .map((anim, index) => (
            <AnimatedMiningIcon
              key={anim.id}
              type="solution"
              isAnimating={true}
              direction={anim.direction}
              className={cn(
                "left-[75%] top-[-25px]",
                index > 0 && "ml-4" // Add margin between multiple icons
              )}
            />
          ))}
      </div>
    </Card>
  );
};