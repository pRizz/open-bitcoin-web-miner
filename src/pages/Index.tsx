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

const Index = () => {
  const [searchParams] = useSearchParams();
  const {
    miningStats,
    networkStats,
    isMining,
    startMining,
    setBtcAddress,
  } = useMining();

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

  return (
    <div className="max-w-7xl mx-auto">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 glass-card">
            <h2 className="text-2xl font-bold mb-1">Mining Controls</h2>
            <p className="text-muted-foreground mb-4">Configure your mining settings</p>
            <MiningControls />
          </Card>

          <NetworkStats stats={networkStats} />
        </div>

        <HashRateGauge hashRate={miningStats.hashRate} />
        <DebugLogPanel />
        <LeaderboardInfoPanel />
        <HashList hashes={miningStats.bestHashes} />
      </div>
    </div>
  );
};

export default Index;