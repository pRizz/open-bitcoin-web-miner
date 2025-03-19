import { Card } from "@/components/ui/card";
import { useMining } from "@/contexts/MiningContext";
import { useMinerInfo } from "@/contexts/mining/MinerInfoContext";
import { useNetworkInfo } from "@/contexts/NetworkInfoContext";
import { useMiningEvents, MiningEventType } from "@/contexts/mining/MiningEventsContext";
import { cn } from "@/lib/utils";
import { Database, Computer, CheckCircle2, XCircle, Target } from "lucide-react";
import { formatHashRate } from "@/utils/mining";
import { useEffect, useState } from "react";
import { AnimatedMiningIcon, getIconTypeFromEvent, type IconType } from "./AnimatedMiningIcon";
import { FlashingText } from "./FlashingText";

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

const Pipe = ({ direction, children }: { direction: 'up' | 'down', children?: React.ReactNode }) => (
  <div className="relative w-32 h-12 my-[-8px]">
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-10 h-full border-x-2 border-muted-foreground/20" />
    </div>
    <div className="absolute inset-0 flex items-center justify-center">
      {children}
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

interface AnimationInstance {
  id: string;
  type: IconType;
  direction: 'up' | 'down';
}

export const MiningStatePanel = () => {
  const { miningStats, isMining } = useMining();
  const { maybeMinerAddress } = useMinerInfo();
  const { maybeBlockHeight, maybeNetworkDifficulty, maybeRequiredBinaryZeroes } = useNetworkInfo();
  const { subscribe } = useMiningEvents();

  const [activeAnimations, setActiveAnimations] = useState<AnimationInstance[]>([]);

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
        const iconType = getIconTypeFromEvent(eventType, data);

        setActiveAnimations(prev => [...prev, { id: animationId, type: iconType, direction }]);

        // Remove the animation after it completes
        setTimeout(() => {
          setActiveAnimations(prev => prev.filter(anim => anim.id !== animationId));
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
      <div className="mb-2 p-4 border rounded-lg relative z-10 bg-background">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <BitcoinIcon />
          The Bitcoin Network
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Current Block Height:</span>
            <FlashingText value={maybeBlockHeight} />
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Network Difficulty:</span>
            <FlashingText value={maybeNetworkDifficulty !== undefined ? `${(maybeNetworkDifficulty / 1e12).toFixed(2)} T` : undefined} />
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Required Binary Zeroes:</span>
            <FlashingText value={maybeRequiredBinaryZeroes} />
          </div>
        </div>
      </div>

      {/* Pipes between Bitcoin Network and Mining Backend */}
      <div className="mb-2 flex justify-center gap-8 relative z-0">
        <Pipe direction="down">
          {activeAnimations
            .filter(anim => ['challenge', 'difficulty'].includes(anim.type))
            .map((anim) => (
              <AnimatedMiningIcon
                key={anim.id}
                type={anim.type}
                isAnimating={true}
                direction={anim.direction}
                className="absolute"
              />
            ))}
        </Pipe>
        <Pipe direction="up">
          {activeAnimations
            .filter(anim => anim.type === 'solution')
            .map((anim) => (
              <AnimatedMiningIcon
                key={anim.id}
                type={anim.type}
                isAnimating={true}
                direction={anim.direction}
                className="absolute"
              />
            ))}
        </Pipe>
      </div>

      {/* Mining Backend Section */}
      <div className="mb-2 p-4 border rounded-lg relative z-10 bg-background">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Database className="w-8 h-8 text-muted-foreground" />
          Mining Backend
        </h3>
        <StatusIndicator isConnected={true} />
      </div>

      {/* Pipes between Mining Backend and Web Miner */}
      <div className="mb-2 flex justify-center gap-8 relative z-0">
        <Pipe direction="down">
          {activeAnimations
            .filter(anim => ['challenge', 'difficulty', 'accepted', 'rejected'].includes(anim.type))
            .map((anim) => (
              <AnimatedMiningIcon
                key={anim.id}
                type={anim.type}
                isAnimating={true}
                direction={anim.direction}
                className="absolute"
              />
            ))}
        </Pipe>
        <Pipe direction="up">
          {activeAnimations
            .filter(anim => anim.type === 'solution')
            .map((anim) => (
              <AnimatedMiningIcon
                key={anim.id}
                type={anim.type}
                isAnimating={true}
                direction={anim.direction}
                className="absolute"
              />
            ))}
        </Pipe>
      </div>

      {/* Web Miner Section */}
      <div className="p-4 border rounded-lg relative z-10 bg-background">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Computer className="w-8 h-8 text-muted-foreground" />
          Web Miner
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status:</span>
            <FlashingText value={isMining ? "Active" : "Inactive"} />
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Miner Address:</span>
            <FlashingText value={maybeMinerAddress} />
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Hash Rate:</span>
            <FlashingText value={formatHashRate(miningStats.maybeHashRate)} disableFlash />
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Hashes:</span>
            <FlashingText value={miningStats.maybeTotalHashes || "0"} />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Accepted Hashes
            </span>
            <FlashingText value={miningStats.acceptedHashes} />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              Rejected Hashes
            </span>
            <FlashingText value={miningStats.rejectedHashes || "0"} />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-2">
              <Target className="w-4 h-4 text-yellow-500" />
              Required Leading Binary Zeros
            </span>
            <FlashingText value={miningStats.maybeRequiredBinaryZeroes} />
          </div>
        </div>
      </div>
    </Card>
  );
};