import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMining } from "@/contexts/MiningContext";
import { useMinerInfo } from "@/contexts/mining/MinerInfoContext";
import { useNetworkInfo } from "@/contexts/NetworkInfoContext";
import { validateBitcoinAddress } from "@/utils/mining";
import { useToast } from "@/hooks/use-toast";
import { PageTransition } from "@/components/PageTransition";
import { formatHashRateWithShortSIUnits } from "@/utils/mining";
import { getDescriptionStatement } from "@/utils/probabilityPhrases";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const SimpleMining = () => {
  const { toast } = useToast();
  const {
    isMining,
    startMining,
    stopMining,
  } = useMining();
  const {
    maybeMinerAddress,
    setMinerAddress,
  } = useMinerInfo();
  const { maybeNetworkRequiredLeadingZeroes: maybeRequiredBinaryZeroes } = useNetworkInfo();

  const { miningStats } = useMining();
  const { maybeHashRate } = miningStats;

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value;
    setMinerAddress(address);

    if (address && !validateBitcoinAddress(address)) {
      toast({
        title: "Invalid Bitcoin Address",
        description: "Please enter a valid Bitcoin address",
        variant: "destructive",
      });
    }
  };

  const isValidAddress = maybeMinerAddress ? validateBitcoinAddress(maybeMinerAddress) : false;

  return (
    <PageTransition>
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Simple Mining</h1>
          <p className="text-muted-foreground">Start mining Bitcoin with just a few clicks</p>
        </div> */}

        <Card className="p-6 space-y-6">
          {/* Bitcoin Address Input */}
          <div className="space-y-2">
            <Label htmlFor="btc-address">Bitcoin Mining Reward Address (optional)</Label>
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Input
                    id="btc-address"
                    placeholder="Enter your BTC address"
                    value={maybeMinerAddress ?? ""}
                    onChange={handleAddressChange}
                    className="font-mono"
                    disabled={isMining}
                  />
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px]">
                  <p>If you successfully mine a block, you will receive 1 BTC as a reward at this address.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Start/Stop Button */}
          <Button
            size="lg"
            className={isMining
              ? "w-full bg-red-600 hover:bg-red-700 text-white text-lg"
              : "w-full bg-green-600 hover:bg-green-700 text-white text-lg"}
            onClick={isMining ? stopMining : startMining}
          >
            {isMining ? "Stop Mining" : "Start Mining"}
          </Button>

          {/* Warning for mining without address */}
          {isMining && !maybeMinerAddress && (
            <div className="text-sm text-amber-400 bg-amber-950/50 p-3 rounded-md border border-amber-800">
              ⚠️ Warning: You are mining without a Bitcoin address. If you find a block, you will not receive the mining reward.
            </div>
          )}
        </Card>

        {/* Hash Rate Display */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 text-center">Current Hash Rate</h2>
          <div className="text-center">
            {maybeHashRate ? (
              <div className="space-y-2">
                <div className="text-3xl font-bold text-green-500">
                  {formatHashRateWithShortSIUnits(maybeHashRate)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {maybeHashRate.toLocaleString()} H/s
                </p>
              </div>
            ) : (
              <div className="text-2xl text-muted-foreground">
                Not mining
              </div>
            )}
          </div>
        </Card>

        {/* Network Difficulty Perspective */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 text-center">Network Difficulty</h2>
          <div className="space-y-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Required Leading Zeroes</p>
              <p className="text-2xl font-bold">
                {maybeRequiredBinaryZeroes ?? "Loading..."}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Odds of Finding a Block</p>
              <p className="text-lg font-mono">
                {maybeRequiredBinaryZeroes
                  ? `1 in ${Math.pow(2, maybeRequiredBinaryZeroes).toLocaleString()}`
                  : "Loading..."
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">To Put That In Perspective...</p>
              <p className="text-sm leading-relaxed">
                {getDescriptionStatement(maybeRequiredBinaryZeroes) ?? "Loading..."}
              </p>
            </div>
          </div>
        </Card>

        {/* Quick Stats */}
        {isMining && maybeHashRate && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-3 text-center">Mining Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="text-green-500 font-medium">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Address:</span>
                <span className="font-mono text-xs">
                  {maybeMinerAddress ? (isValidAddress ? "Valid" : "Invalid") : "None"}
                </span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </PageTransition>
  );
};

export default SimpleMining;