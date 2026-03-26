import React from "react";
import { HomeBitcoinMiningReport } from "@/components/home-bitcoin-mining/HomeBitcoinMiningReport";
import { PageTransition } from "@/components/PageTransition";
import { useNetworkInfo } from "@/contexts/NetworkInfoContext";
import {
  calculateUsersNeededToEqualNetwork,
  FIXED_NETWORK_HASHRATE,
  HASHES_PER_ZETTAHASH,
  HOME_MINING_SCENARIOS_BY_KEY,
  estimateBitcoinNetworkHashRateFromDifficulty,
  formatUsersNeededToEqualNetwork,
} from "@/lib/homeBitcoinMiningReport";
import { useMemo } from "react";

export default function HomeBitcoinMiningPage() {
  const { maybeNetworkDifficulty, maybeFormattedNetworkDifficulty } = useNetworkInfo();

  const zettahashPerspective = useMemo(() => ({
    gpu: formatUsersNeededToEqualNetwork(
      calculateUsersNeededToEqualNetwork(HOME_MINING_SCENARIOS_BY_KEY.gpu.perUserHashRate, HASHES_PER_ZETTAHASH),
    ),
    homeMiner: formatUsersNeededToEqualNetwork(
      calculateUsersNeededToEqualNetwork(HOME_MINING_SCENARIOS_BY_KEY.homeMiner.perUserHashRate, HASHES_PER_ZETTAHASH),
    ),
    asic: formatUsersNeededToEqualNetwork(
      calculateUsersNeededToEqualNetwork(HOME_MINING_SCENARIOS_BY_KEY.asic.perUserHashRate, HASHES_PER_ZETTAHASH),
    ),
  }), []);

  const maybeLiveNetworkHashRate = useMemo(
    () => estimateBitcoinNetworkHashRateFromDifficulty(maybeNetworkDifficulty),
    [maybeNetworkDifficulty],
  );

  const maybeLiveBaselineDelta = useMemo(() => {
    if (!maybeLiveNetworkHashRate) {
      return undefined;
    }

    return ((maybeLiveNetworkHashRate - FIXED_NETWORK_HASHRATE) / FIXED_NETWORK_HASHRATE) * 100;
  }, [maybeLiveNetworkHashRate]);

  return (
    <PageTransition>
      <HomeBitcoinMiningReport
        maybeNetworkDifficulty={maybeNetworkDifficulty}
        maybeFormattedNetworkDifficulty={maybeFormattedNetworkDifficulty}
        maybeLiveNetworkHashRate={maybeLiveNetworkHashRate}
        maybeLiveBaselineDelta={maybeLiveBaselineDelta}
        zettahashPerspective={zettahashPerspective}
      />
    </PageTransition>
  );
}
