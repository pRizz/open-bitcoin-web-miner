import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { HashRateGauge } from "@/components/HashRateGauge";
import { NetworkStats } from "@/components/NetworkStats";
import { HashList } from "@/components/HashList";
import { GlobalLeaderboard } from "@/components/GlobalLeaderboard";
import { useMining } from "@/contexts/MiningContext";
import { validateBitcoinAddress } from "@/utils/mining";
import { useToast } from "@/hooks/use-toast";
import { Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { URL_PARAMS } from "@/constants/mining";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const Index = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [includeAutoStart, setIncludeAutoStart] = useState(false);
  const [includeAddress, setIncludeAddress] = useState(false);
  
  const {
    miningStats,
    networkStats,
    isMining,
    btcAddress,
    miningSpeed,
    threadCount,
    maxThreads,
    setBtcAddress,
    setMiningSpeed,
    setThreadCount,
    startMining,
    stopMining,
    resetData,
  } = useMining();

  // Check for auto-start parameter and prefilled address on mount
  useEffect(() => {
    const shouldAutoStart = searchParams.get(URL_PARAMS.AUTO_START) === "true";
    const prefilledAddress = searchParams.get(URL_PARAMS.BITCOIN_ADDRESS);
    
    if (prefilledAddress) {
      setBtcAddress(prefilledAddress);
    }
    
    if (shouldAutoStart && !isMining) {
      startMining();
    }
  }, [searchParams, startMining, isMining, setBtcAddress]);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value;
    setBtcAddress(address);
    
    if (address && !validateBitcoinAddress(address)) {
      toast({
        title: "Invalid Bitcoin Address",
        description: "Please enter a valid Bitcoin address",
        variant: "destructive",
      });
    }
  };

  const handleSpeedChange = (value: number[]) => {
    setMiningSpeed(value[0]);
  };

  const handleThreadChange = (value: number[]) => {
    setThreadCount(value[0]);
  };

  const handleShare = async () => {
    const url = new URL(window.location.href);
    
    if (includeAutoStart) {
      url.searchParams.set(URL_PARAMS.AUTO_START, "true");
    } else {
      url.searchParams.delete(URL_PARAMS.AUTO_START);
    }

    if (includeAddress && btcAddress) {
      url.searchParams.set(URL_PARAMS.BITCOIN_ADDRESS, btcAddress);
    } else {
      url.searchParams.delete(URL_PARAMS.BITCOIN_ADDRESS);
    }
    
    try {
      await navigator.clipboard.writeText(url.toString());
      toast({
        title: "Link Copied!",
        description: "The URL has been copied to your clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to Copy",
        description: "Could not copy the URL to clipboard",
        variant: "destructive",
      });
    }
  };

  const isValidAddress = btcAddress ? validateBitcoinAddress(btcAddress) : false;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold">Bitcoin Mining Simulator</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleShare}
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button variant="destructive" onClick={resetData}>
              Reset Data
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 glass-card">
            <h2 className="text-2xl font-bold mb-4">Mining Controls</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">
                  Bitcoin Address (Optional)
                </label>
                <Input
                  placeholder="Enter your Bitcoin address"
                  value={btcAddress}
                  onChange={handleAddressChange}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">
                  Mining Speed: {miningSpeed}%
                </label>
                <Slider
                  value={[miningSpeed]}
                  onValueChange={handleSpeedChange}
                  min={10}
                  max={100}
                  step={10}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">
                  CPU Threads: {threadCount} of {maxThreads}
                </label>
                <Slider
                  value={[threadCount]}
                  onValueChange={handleThreadChange}
                  min={1}
                  max={maxThreads}
                  step={1}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-400">
                    Auto-start when sharing
                  </label>
                  <Switch
                    checked={includeAutoStart}
                    onCheckedChange={setIncludeAutoStart}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-400">
                    Include Bitcoin address in share link
                  </label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Switch
                            checked={includeAddress}
                            onCheckedChange={setIncludeAddress}
                            disabled={!isValidAddress}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Enter a valid Bitcoin address to enable this option</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <Button
                className="w-full"
                variant={isMining ? "destructive" : "default"}
                onClick={isMining ? stopMining : startMining}
              >
                {isMining ? "Stop Mining" : "Start Mining"}
              </Button>
            </div>
          </Card>

          <NetworkStats stats={networkStats} />
        </div>

        <HashRateGauge hashRate={miningStats.hashRate} />
        <HashList hashes={miningStats.bestHashes} />
        <GlobalLeaderboard />
      </div>
    </div>
  );
};

export default Index;