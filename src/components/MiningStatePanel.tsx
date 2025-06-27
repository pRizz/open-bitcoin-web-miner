import { Card } from "@/components/ui/card";
import { useMining } from "@/contexts/MiningContext";
import { useMinerInfo } from "@/contexts/mining/MinerInfoContext";
import { useNetworkInfo } from "@/contexts/NetworkInfoContext";
import { useMiningEvents, MiningEventType } from "@/contexts/mining/MiningEventsContext";
import { cn } from "@/lib/utils";
import { Database, Computer, CheckCircle2, XCircle, Target, HelpCircle, RotateCcw, Binary, ChevronRight } from "lucide-react";
import { formatHashRateWithShortSIUnits } from "@/utils/mining";
import { useEffect, useState } from "react";
import { AnimatedMiningIcon, getIconTypeFromEvent, type IconType } from "./AnimatedMiningIcon";
import { FlashingText } from "./FlashingText";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { formatLargeNumber } from "@/utils/formatters";
import { TypedLink } from "@/components/TypedLink";
import { MiningPickaxe } from "./MiningPickaxe";
import { OddsExplanation } from "./OddsExplanation";
import { MiningContextMiningState } from "@/contexts/mining/types";

const StatusIndicator = ({ isConnected }: { isConnected: boolean }) => (
  <div className="flex items-center gap-2 text-muted-foreground border-b border-muted-foreground/20 pb-1">
    <div
      className={cn(
        "w-3 h-3 mx-0.5 rounded-full",
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

const BitcoinIcon = ({ className }: { className?: string }) => (
  <img
    src="/Bitcoin.svg"
    alt="Bitcoin"
    className={cn("w-8 h-8", className)}
  />
);

interface AnimationInstance {
  id: string;
  type: IconType;
  direction: 'up' | 'down';
}

function formatSatsToBTC(sats: number) {
  return `${Number((sats / 1e8).toFixed(8)).toString()} BTC`;
}

export const MiningStatePanel = () => {
  const { miningStats, isMining, resetData, miningContextMiningState, maybeMostRecentMiningStartTime } = useMining();
  const { maybeMinerAddress } = useMinerInfo();
  const { maybeBlockHeight, maybeNetworkRequiredLeadingZeroes: maybeRequiredBinaryZeroes, maybeFormattedNetworkDifficulty, maybeConnectedMinerCount, maybeServerStartingMinLeadingZeroCount, maybeBaseBlockReward, maybeMiningReward } = useNetworkInfo();
  const { subscribe } = useMiningEvents();
  const isConnected = maybeConnectedMinerCount !== undefined;

  const [activeAnimations, setActiveAnimations] = useState<AnimationInstance[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every second when mining is active
  useEffect(() => {
    if (!isMining || !maybeMostRecentMiningStartTime) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [isMining, maybeMostRecentMiningStartTime]);

  // Calculate duration in mm:ss format
  const getDurationText = () => {
    if (!maybeMostRecentMiningStartTime || !isMining) {
      return "";
    }

    const durationMs = currentTime - maybeMostRecentMiningStartTime;
    if (durationMs < 1000) {
      return " (0:00)";
    }
    const totalSeconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return ` (${minutes}:${seconds.toString().padStart(2, '0')})`;
  };

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
    const QUEUE_DELAY = 300; // ms between events

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

  let miningStateText = "";
  switch (miningContextMiningState) {
  case MiningContextMiningState.MINING:
    miningStateText = "Mining" + getDurationText();
    break;
  case MiningContextMiningState.BEHAVIOR_CHECK:
    miningStateText = "Behavior Check";
    break;
  case MiningContextMiningState.NOT_MINING:
    miningStateText = "Not Mining";
    break;
  }
  if (!isMining) {
    miningStateText = "Not Mining";
  }

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
          <div className="flex justify-between border-b border-muted-foreground/20 pb-1">
            <span className="text-muted-foreground flex items-center gap-2">
              Current Block Reward
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[300px]">
                    <p>This is the sum of the base block reward and the transaction fees included in the block template.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </span>
            <FlashingText value={maybeBaseBlockReward ? formatSatsToBTC(maybeBaseBlockReward) : "N/A"} />
          </div>
          <div className="flex justify-between border-b border-muted-foreground/20 pb-1">
            <span className="text-muted-foreground">Block Height</span>
            {maybeBlockHeight && (
              <a
                href={`https://bitcoinexplorer.org/block-height/${maybeBlockHeight}`}
                target="_blank"
                rel="noopener"
                className="text-blue-500 hover:text-blue-600 underline"
              >
                {maybeBlockHeight?.toLocaleString()}
              </a>
            ) || "N/A"}
          </div>
          <div className="flex justify-between border-b border-muted-foreground/20 pb-1">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-yellow-500" />
              <span className="text-muted-foreground">Network Difficulty</span>
            </div>
            <FlashingText value={maybeFormattedNetworkDifficulty} />
          </div>
          <div className="flex justify-between items-center border-b border-muted-foreground/20 pb-1">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-yellow-500" />
              <span className="text-muted-foreground">Equivalent Required Leading Binary Zeros</span>
            </div>
            <FlashingText value={maybeRequiredBinaryZeroes?.toLocaleString()} />
          </div>
          <OddsExplanation maybeServerStartingMinLeadingZeroCount={maybeRequiredBinaryZeroes} />
        </div>
      </div>

      {/* Pipes between Bitcoin Network and Mining Backend */}
      <div className="mb-2 flex justify-center gap-8 relative z-0">
        <Pipe direction="up">
          {activeAnimations
            .filter(anim => [].includes(anim.type))
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
        <Pipe direction="down">
          {activeAnimations
            .filter(anim => [].includes(anim.type))
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
        <h3 className="text-lg font-semibold mb-2 flex gap-2">
          <Database className="w-8 h-8 text-muted-foreground" />
          Win3Bitco.in Backend
        </h3>
        <div className="space-y-2 text-sm">
          <StatusIndicator isConnected={isConnected} />
          <div className="flex justify-between border-b border-muted-foreground/20 pb-1">
            <span className="text-muted-foreground flex items-center gap-2 text-sm">
              <BitcoinIcon className="w-4 h-4" /> Mining Reward
            </span>
            <FlashingText value={maybeMiningReward ? formatSatsToBTC(maybeMiningReward) : "N/A"} />
          </div>
          <div className="flex justify-between border-b border-muted-foreground/20 pb-1">
            <span className="text-muted-foreground flex items-center gap-2 text-sm">
              <Target className="w-4 h-4 text-yellow-500" />
                Minimum Required Starting Leading Binary Zeros
            </span>
            <FlashingText value={maybeServerStartingMinLeadingZeroCount?.toLocaleString()} />
          </div>
          <OddsExplanation maybeServerStartingMinLeadingZeroCount={maybeServerStartingMinLeadingZeroCount} />
        </div>
      </div>

      {/* Pipes between Mining Backend and Web Miner */}
      <div className="mb-2 flex justify-center gap-8 relative z-0">
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
      </div>

      {/* Web Miner Section */}
      <div className="p-4 border rounded-lg relative z-10 bg-background">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Computer className="w-8 h-8 text-muted-foreground" />
            Web Miner
          </h3>
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetData}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset Stats
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reset all mining statistics</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between border-b border-muted-foreground/20 pb-1">
            <span className="text-muted-foreground flex items-center gap-2">
              Status
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[300px]">
                    <p>Possible mining states:</p>
                    <ul className="list-disc pl-4 mt-1 space-y-1">
                      <li><strong>Not Mining:</strong> The miner is inactive</li>
                      <li><strong>Behavior Check:</strong> The miner is verifying compliant behavior before mining with your BTC address. This is done in order to mitigate misbehaving clients.</li>
                      <li><strong>Mining:</strong> The miner is actively searching for solutions using your BTC address. If a block is found, your address will be rewarded with 1 Bitcoin!</li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </span>
            <span className="text-muted-foreground flex items-center gap-2">
              {miningStateText}
              <MiningPickaxe isMining={isMining} />
            </span>
          </div>
          {maybeMinerAddress && (
            <div className="flex justify-between border-b border-muted-foreground/20 pb-1">
              <TypedLink routeKeyName="proofOfReward" className="text-primary hover:underline">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Proof of Reward for Your Address</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </TypedLink>
            </div>
          )}
          <div className="flex justify-between border-b border-muted-foreground/20 pb-1">
            <span className="text-muted-foreground">Hash Rate</span>
            <FlashingText value={formatHashRateWithShortSIUnits(miningStats.maybeHashRate)} disableFlash />
          </div>
          <div className="flex justify-between border-b border-muted-foreground/20 pb-1">
            <span className="text-muted-foreground">Cumulative Hashes</span>
            <FlashingText value={formatLargeNumber(miningStats.cumulativeHashes)} />
          </div>
          <div className="flex justify-between border-b border-muted-foreground/20 pb-1">
            <span className="text-muted-foreground flex items-center gap-2">
              <Binary className="w-4 h-4 text-purple-500" />
              Total Solutions
            </span>
            <FlashingText value={miningStats.maybeTotalSolutions || "0"} />
          </div>
          <div className="flex justify-between border-b border-muted-foreground/20 pb-1">
            <span className="text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Accepted Solutions
            </span>
            <FlashingText value={miningStats.acceptedSolutions || "0"} />
          </div>

          <div className="flex justify-between border-b border-muted-foreground/20 pb-1">
            <span className="text-muted-foreground flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              Rejected Solutions
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[300px]">
                    <p>Solutions may be rejected if:</p>
                    <ul className="list-disc pl-4 mt-1 space-y-1">
                      <li>A solution was attempted to be submitted while a difficulty update was sent to the client</li>
                      <li>A solution was attempted to be submitted while a block update was sent to the client</li>
                      <li>The solution does not meet the current difficulty requirements</li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </span>
            <FlashingText value={miningStats.rejectedSolutions || "0"} />
          </div>

          <div className="flex justify-between border-b border-muted-foreground/20 pb-1">
            <span className="text-muted-foreground flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              Rejected Rate (%)
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[300px]">
                    <p>The percentage of solutions that were rejected.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </span>
            <FlashingText value={`${((miningStats.rejectedSolutions / (miningStats.maybeTotalSolutions || 1)) * 100 || 0).toFixed(2)}%`} />
          </div>

          <div className="flex justify-between border-muted-foreground/20 pb-1">
            <span className="text-muted-foreground flex items-center gap-2">
              <Target className="w-4 h-4 text-yellow-500" />
              Required Leading Binary Zeros
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[400px] z-50">
                    <p>This value is dynamically adjusted based on your computer's mining speed to maintain an optimal solution submission rate.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </span>
            <FlashingText value={miningStats.maybeRequiredBinaryZeroes} />
          </div>
        </div>
      </div>
    </Card>
  );
};