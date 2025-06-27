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
import { MiningChancesStats, oneDayTimePeriod, oneHourTimePeriod, oneMinuteTimePeriod, oneMonthTimePeriod, oneWeekTimePeriod, oneYearTimePeriod, TimePeriod } from "@/components/MiningChancesStats";
import { WelcomeBanner } from "@/components/WelcomeBanner";
import { showSuccess, showError, showWarning, showInfo, showShort, showLong, showPersistent } from "@/utils/notifications";

const ONE_BITAXE_HASH_RATE = 1e12;

const tenYearsTimePeriod: TimePeriod = {
  seconds: 10 * 365 * 24 * 60 * 60,
  label: "10 years",
};

const hundredYearsTimePeriod: TimePeriod = {
  seconds: 100 * 365 * 24 * 60 * 60,
  label: "100 years",
};

const thousandYearsTimePeriod: TimePeriod = {
  seconds: 1000 * 365 * 24 * 60 * 60,
  label: "1,000 years",
};

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

  const handleTestNotifications = () => {
    // Test different durations
    // showShort("Short Toast", "This will disappear in 3 seconds");
    // setTimeout(() => showLong("Long Toast", "This will stay for 10 seconds"), 1000);
    // setTimeout(() => showPersistent("Persistent Toast", "This won't auto-dismiss"), 2000);
    setTimeout(() => showSuccess("Custom Duration", "5 second duration", { maybeDuration: 15000 }), 3000);
    // setTimeout(() => showError("Quick Error", "2 second error", { maybeDuration: 2000 }), 4000);
  };

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto">
        <WelcomeBanner />
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 glass-card">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-2xl font-bold">Mining Controls</h2>
                <div className="flex gap-2">
                  {/* <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestNotifications}
                    className="text-xs"
                  >
                    Test Notifications
                  </Button> */}
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
              </div>
              <p className="text-muted-foreground mb-4">Configure your mining settings</p>
              <MiningControls />
            </Card>

            <MiningStatePanel />
            <NetworkStats />
          </div>

          <HashRateGauge />

          {/* Personal Probabilities Section */}
          {/* <Card className="p-6 glass-card">
            <h2 className="text-2xl font-bold mb-4">Personal Probabilities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <MiningTimeRequiredStats />
              <MiningChancesStats
                minerCount={1}
                minerCountLabel="1"
                customPanelHeaderText="Chances of finding a block solution"
                showCombinedHashRate={false}
                maybeTimePeriods={[
                  oneMinuteTimePeriod,
                  oneHourTimePeriod,
                  oneDayTimePeriod,
                  oneWeekTimePeriod,
                  oneMonthTimePeriod,
                  oneYearTimePeriod,
                  tenYearsTimePeriod,
                  hundredYearsTimePeriod,
                  thousandYearsTimePeriod,
                ]} />
            </div>
          </Card> */}

          {/* Collective Probabilities Section */}
          <Card className="p-6 glass-card">
            <h2 className="text-2xl font-bold mb-4">Collective Probabilities</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* <MiningChancesStats minerCount={1000} minerCountLabel={(1_000).toLocaleString()} showCombinedHashRate={true} /> */}
              <MiningChancesStats minerCount={1_000_000} minerCountLabel="1 million" showCombinedHashRate={true}
                maybeTimePeriods={[
                  oneMonthTimePeriod,
                  oneYearTimePeriod,
                  tenYearsTimePeriod,
                  hundredYearsTimePeriod,
                  thousandYearsTimePeriod,
                ]}
              />
              <MiningChancesStats minerCount={1_000_000_000} minerCountLabel="1 billion" showCombinedHashRate={true}
                maybeTimePeriods={[
                  oneHourTimePeriod,
                  oneDayTimePeriod,
                  oneWeekTimePeriod,
                  oneYearTimePeriod,
                  tenYearsTimePeriod,
                ]}
              />
              <MiningChancesStats minerCount={8_000_000_000} minerCountLabel="8 billion" showCombinedHashRate={true}
                maybeTimePeriods={[
                  oneHourTimePeriod,
                  oneDayTimePeriod,
                  oneWeekTimePeriod,
                  oneYearTimePeriod,
                  tenYearsTimePeriod,
                ]}
              />
            </div>
          </Card>

          {/* Bitaxe Probabilities Section */}
          <Card className="p-6 glass-card">
            <h2 className="text-2xl font-bold mb-4">Bitaxe Probabilities</h2>
            <p className="text-muted-foreground mb-4">Chances of finding at least 1 block solution with 1 TH/s per Bitaxe</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MiningChancesStats
                minerCount={1}
                minerCountLabel="1 Bitaxe"
                showCombinedHashRate={true}
                customPanelHeaderText="Chances with 1 Bitaxe (~1&nbsp;TH/s)"
                hashRateOverride={ONE_BITAXE_HASH_RATE}
                maybeTimePeriods={[
                  oneMonthTimePeriod,
                  oneYearTimePeriod,
                  tenYearsTimePeriod,
                  hundredYearsTimePeriod,
                  thousandYearsTimePeriod,
                ]}
              />
              <MiningChancesStats
                minerCount={10}
                minerCountLabel="10 Bitaxes"
                showCombinedHashRate={true}
                customPanelHeaderText="Chances with 10 Bitaxes (~10&nbsp;TH/s)"
                hashRateOverride={ONE_BITAXE_HASH_RATE}
                maybeTimePeriods={[
                  oneDayTimePeriod,
                  oneWeekTimePeriod,
                  oneMonthTimePeriod,
                  oneYearTimePeriod,
                  tenYearsTimePeriod,
                ]}
              />
              <MiningChancesStats
                minerCount={100}
                minerCountLabel="100 Bitaxes"
                showCombinedHashRate={true}
                customPanelHeaderText="Chances with 100 Bitaxes (~100&nbsp;TH/s)"
                hashRateOverride={ONE_BITAXE_HASH_RATE}
                maybeTimePeriods={[
                  oneHourTimePeriod,
                  oneDayTimePeriod,
                  oneWeekTimePeriod,
                  oneMonthTimePeriod,
                  oneYearTimePeriod,
                ]}
              />
              <MiningChancesStats
                minerCount={1000}
                minerCountLabel="1,000 Bitaxes"
                showCombinedHashRate={true}
                customPanelHeaderText="Chances with 1,000 Bitaxes (~1&nbsp;PH/s)"
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