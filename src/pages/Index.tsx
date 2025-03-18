import { Card } from "@/components/ui/card";
import { HashRateGauge } from "@/components/HashRateGauge";
import { NetworkStats } from "@/components/NetworkStats";
import { HashList } from "@/components/HashList";
import { useMining } from "@/contexts/MiningContext";
import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { URL_PARAMS } from "@/constants/mining";
import { MiningControls } from "@/components/mining/MiningControls";
import { LeaderboardInfoPanel } from "@/components/LeaderboardInfoPanel";
import { DebugLogPanel } from "@/components/debug/DebugLogPanel";
import { useMinerInfo } from "@/contexts/mining/MinerInfoContext";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [searchParams] = useSearchParams();
  const {
    miningStats,
    isMining,
    startMining,
  } = useMining();
  const { setMinerAddress, setBlockchainMessage, resetSettings } = useMinerInfo();

  useEffect(() => {
    const shouldAutoStart = searchParams.get(URL_PARAMS.AUTO_START) === "true";
    const prefilledAddress = searchParams.get(URL_PARAMS.BITCOIN_ADDRESS);
    const maybeBlockchainMessage = searchParams.get(URL_PARAMS.BLOCKCHAIN_MESSAGE) || null;

    if (prefilledAddress) {
      setMinerAddress(prefilledAddress);
    }

    if (maybeBlockchainMessage) {
      setBlockchainMessage(maybeBlockchainMessage);
    }

    if (shouldAutoStart && !isMining) {
      startMining();
    }
  }, [searchParams, startMining, isMining, setMinerAddress, setBlockchainMessage]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 glass-card">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-2xl font-bold">Mining Controls</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetSettings}
                className="text-muted-foreground hover:text-foreground"
              >
                Reset Settings
              </Button>
            </div>
            <p className="text-muted-foreground mb-4">Configure your mining settings</p>
            <MiningControls />
          </Card>

          <NetworkStats />
        </div>

        <HashRateGauge hashRate={miningStats.maybeHashRate} />
        <DebugLogPanel />
        <LeaderboardInfoPanel />
        <HashList hashes={miningStats.maybeBestHashes} />
      </div>
    </div>
  );
};

export default Index;