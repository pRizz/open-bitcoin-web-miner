import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { HashRateGauge } from "@/components/HashRateGauge";
import { NetworkStats } from "@/components/NetworkStats";
import { HashList } from "@/components/HashList";
import { useMining } from "@/contexts/MiningContext";
import { validateBitcoinAddress } from "@/utils/mining";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();
  const {
    miningStats,
    networkStats,
    isMining,
    btcAddress,
    miningSpeed,
    setBtcAddress,
    setMiningSpeed,
    startMining,
    stopMining,
    resetData,
  } = useMining();

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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold">Bitcoin Mining Simulator</h1>
          <Button
            variant="destructive"
            onClick={resetData}
          >
            Reset Data
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 glass-card">
            <h2 className="text-2xl font-bold mb-4">Mining Controls</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Bitcoin Address (Optional)</label>
                <Input
                  placeholder="Enter your Bitcoin address"
                  value={btcAddress}
                  onChange={handleAddressChange}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Mining Speed: {miningSpeed}%</label>
                <Slider
                  value={[miningSpeed]}
                  onValueChange={handleSpeedChange}
                  min={10}
                  max={100}
                  step={10}
                  className="w-full"
                />
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
      </div>
    </div>
  );
};

export default Index;