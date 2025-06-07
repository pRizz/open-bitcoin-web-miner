import { Card } from "@/components/ui/card";
import { HashRateGauge } from "@/components/HashRateGauge";
import { NetworkStats } from "@/components/NetworkStats";
import { SubmittedSolutionsList } from "@/components/SubmittedSolutionsList";
import { useMining } from "@/contexts/MiningContext";
import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { URL_PARAMS } from "@/constants/mining";
import { MiningControls } from "@/components/mining/MiningControls";
import { LeaderboardInfoPanel } from "@/components/LeaderboardInfoPanel";
import { DebugLogPanel } from "@/components/debug/DebugLogPanel";
import { useMinerInfo } from "@/contexts/mining/MinerInfoContext";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/PageTransition";
import { MiningStatePanel } from "@/components/MiningStatePanel";
import { MiningTimeRequiredStats } from "@/components/MiningTimeRequiredStats";
import { MiningChancesStats } from "@/components/MiningChancesStats";
import { WelcomeBanner } from "@/components/WelcomeBanner";

const ONE_BITAXE_HASH_RATE = 1e12;

const Index = () => {
  const [searchParams] = useSearchParams();
  const {
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
    <PageTransition>
      <div className="max-w-7xl mx-auto">
        <WelcomeBanner />
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 glass-card">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-2xl font-bold">Mining Controls</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetSettings}
                  disabled={isMining}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Reset Settings
                </Button>
              </div>
              <p className="text-muted-foreground mb-4">Configure your mining settings</p>
              <MiningControls />
            </Card>

            <MiningStatePanel />
            <NetworkStats />
          </div>

          <HashRateGauge />

          {/* Personal Probabilities Section */}
          <Card className="p-6 glass-card">
            <h2 className="text-2xl font-bold mb-4">Personal Probabilities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <MiningTimeRequiredStats />
              <MiningChancesStats minerCount={1} minerCountLabel="1" customPanelHeaderText="Chances of finding a block solution" showCombinedHashRate={false} />
            </div>
          </Card>

          {/* Collective Probabilities Section */}
          <Card className="p-6 glass-card">
            <h2 className="text-2xl font-bold mb-4">Collective Probabilities</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MiningChancesStats minerCount={1000} minerCountLabel={(1_000).toLocaleString()} showCombinedHashRate={true} />
              <MiningChancesStats minerCount={1_000_000} minerCountLabel="1 million" showCombinedHashRate={true} />
              <MiningChancesStats minerCount={1_000_000_000} minerCountLabel="1 billion" showCombinedHashRate={true} />
            </div>
          </Card>

          {/* Bitaxe Probabilities Section */}
          <Card className="p-6 glass-card">
            <h2 className="text-2xl font-bold mb-4">Bitaxe Probabilities</h2>
            <p className="text-muted-foreground mb-4">Chances of finding a block solution with 1 TH/s per Bitaxe</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MiningChancesStats
                minerCount={1}
                minerCountLabel="1 Bitaxe"
                showCombinedHashRate={true}
                customPanelHeaderText="Chances with 1 Bitaxe (~1&nbsp;TH/s)"
                hashRateOverride={ONE_BITAXE_HASH_RATE}
              />
              <MiningChancesStats
                minerCount={1000}
                minerCountLabel="1,000 Bitaxes"
                showCombinedHashRate={true}
                customPanelHeaderText="Chances with 1,000 Bitaxes (~1&nbsp;PH/s)"
                hashRateOverride={ONE_BITAXE_HASH_RATE}
              />
              <MiningChancesStats
                minerCount={1_000_000}
                minerCountLabel="1 million Bitaxes"
                showCombinedHashRate={true}
                customPanelHeaderText="Chances with 1 million Bitaxes (~1&nbsp;EH/s)"
                hashRateOverride={ONE_BITAXE_HASH_RATE}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <MiningChancesStats
                minerCount={130_000_000}
                minerCountLabel="130 million Bitaxes"
                showCombinedHashRate={true}
                customPanelHeaderText="Chances with 130 million Bitaxes (~130&nbsp;EH/s) (There are ~130 million households in the US)"
                hashRateOverride={ONE_BITAXE_HASH_RATE}
              />
              <MiningChancesStats
                minerCount={2_300_000_000}
                minerCountLabel="2.3 billion Bitaxes"
                showCombinedHashRate={true}
                customPanelHeaderText="Chances with 2.3 billion Bitaxes (~2.3&nbsp;ZH/s) (There are ~2.3 billion households in the world)"
                hashRateOverride={ONE_BITAXE_HASH_RATE}
              />
            </div>
          </Card>

          <LeaderboardInfoPanel />
          <SubmittedSolutionsList />
          <DebugLogPanel />
        </div>
      </div>
    </PageTransition>
  );
};

export default Index;