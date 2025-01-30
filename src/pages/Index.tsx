import { Card } from "@/components/ui/card";
import { HashRateGauge } from "@/components/HashRateGauge";
import { NetworkStats } from "@/components/NetworkStats";
import { HashList } from "@/components/HashList";
import { useMining } from "@/contexts/MiningContext";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { URL_PARAMS } from "@/constants/mining";
import { MiningControls } from "@/components/mining/MiningControls";
import { ShareControls } from "@/components/mining/ShareControls";
import { LeaderboardInfoPanel } from "@/components/LeaderboardInfoPanel";

const Index = () => {
  const [searchParams] = useSearchParams();
  const [includeAutoStart, setIncludeAutoStart] = useState(false);
  const [includeAddress, setIncludeAddress] = useState(false);
  
  const {
    miningStats,
    networkStats,
    isMining,
    btcAddress,
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
        <ShareControls
          includeAutoStart={includeAutoStart}
          includeAddress={includeAddress}
          btcAddress={btcAddress}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 glass-card">
            <h2 className="text-2xl font-bold mb-4">Mining Controls</h2>
            <MiningControls />
          </Card>

          <NetworkStats stats={networkStats} />
        </div>

        <HashRateGauge hashRate={miningStats.hashRate} />
        <LeaderboardInfoPanel />
        <HashList hashes={miningStats.bestHashes} />
      </div>
    </div>
  );
};

export default Index;