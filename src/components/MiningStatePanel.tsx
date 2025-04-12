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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
  const { miningStats, isMining, resetData } = useMining();
  const { maybeMinerAddress } = useMinerInfo();
  const { maybeBlockHeight, maybeNetworkRequiredLeadingZeroes: maybeRequiredBinaryZeroes, maybeFormattedNetworkDifficulty, maybeConnectedMinerCount, maybeServerStartingMinLeadingZeroCount, maybeBaseBlockReward, maybeMiningReward } = useNetworkInfo();
  const { subscribe } = useMiningEvents();
  const isConnected = maybeConnectedMinerCount !== undefined;

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
            <span className="text-muted-foreground">Base Block Reward</span>
            <FlashingText value={maybeBaseBlockReward ? formatSatsToBTC(maybeBaseBlockReward) : "N/A"} />
          </div>
          <div className="flex justify-between border-b border-muted-foreground/20 pb-1">
            <span className="text-muted-foreground">Block Height</span>
            <FlashingText value={maybeBlockHeight?.toLocaleString()} />
          </div>
          <div className="flex justify-between border-b border-muted-foreground/20 pb-1">
            <span className="text-muted-foreground">Network Difficulty</span>
            <FlashingText value={maybeFormattedNetworkDifficulty} />
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Required Binary Zeroes</span>
            <FlashingText value={maybeRequiredBinaryZeroes?.toLocaleString()} />
          </div>
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
          Mining Backend
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
          <p className="text-muted-foreground text-xs">
                The odds any random hash has
            <FlashingText value={maybeServerStartingMinLeadingZeroCount?.toLocaleString()} defaultValue="n" /> leading zeros are 1 in 2^
            <FlashingText value={maybeServerStartingMinLeadingZeroCount?.toLocaleString()} defaultValue="n" />
            {maybeServerStartingMinLeadingZeroCount && <span > or 1 in {Math.pow(2, maybeServerStartingMinLeadingZeroCount || 0).toLocaleString()}
            </span>}
            <Dialog>
              <DialogTrigger>
                <HelpCircle className="h-4 w-4 inline ml-1 cursor-help text-muted-foreground hover:text-foreground" />
              </DialogTrigger>
              <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Understanding the Odds of Leading Zeros</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                  <p>
                      The probability of finding a hash with a specific number of leading zeros can be understood using a simple coin flip analogy.
                  </p>

                  <div className="space-y-2">
                    <p className="font-semibold">Coin Flip Analogy:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Each bit in a hash has a 50/50 chance of being 0 or 1, just like a coin flip</li>
                      <li>For one leading zero, the probability is 50% (1/2)</li>
                      <li>For two leading zeros, the probability is 25% (1/4)</li>
                      <li>For three leading zeros, the probability is 12.5% (1/8)</li>
                      <li>And so on...</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <p className="font-semibold">Mathematical Proof:</p>
                    <p>For n leading zeros, the probability is (1/2)^n, which equals 1/2^n</p>
                    <p>This means the odds are 1 in 2^n</p>
                    {maybeServerStartingMinLeadingZeroCount &&
                      <>
                        <p>For example, with {maybeServerStartingMinLeadingZeroCount} leading zeros:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Probability = 1/2^{maybeServerStartingMinLeadingZeroCount}</li>
                          <li>Odds = 1 in 2^{maybeServerStartingMinLeadingZeroCount} = 1 in {Math.pow(2, maybeServerStartingMinLeadingZeroCount || 0).toLocaleString()}</li>
                        </ul>
                      </>
                    }
                  </div>

                  <div className="mt-4 p-4 bg-gray-900 rounded-md space-y-3">
                    <p className="font-semibold text-green-400">Why This Matters for Mining:</p>
                    <p>
                        Bitcoin mining requires finding a hash with a specific number of leading zeros. The more zeros required, the harder it is to find a valid hash. This is what makes Bitcoin mining a competitive process - miners must perform many hash calculations to find one that meets the difficulty requirement.
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </p>
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
            </span>
            <MiningPickaxe isMining={isMining} />
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