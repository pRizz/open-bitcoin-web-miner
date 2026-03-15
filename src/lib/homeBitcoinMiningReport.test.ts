import { describe, expect, it } from "vitest";

import {
  FIXED_NETWORK_HASHRATE,
  HOME_MINING_SCENARIOS_BY_KEY,
  calculateCombinedHashRate,
  calculatePercentOfNetwork,
  calculateUsersNeededToEqualNetwork,
  estimateBitcoinNetworkHashRateFromDifficulty,
  formatHashRate,
} from "@/lib/homeBitcoinMiningReport";

describe("homeBitcoinMiningReport", () => {
  it("computes the GPU scenario for 1 million participants", () => {
    const combinedHashRate = calculateCombinedHashRate(1_000_000, HOME_MINING_SCENARIOS_BY_KEY.gpu.perUserHashRate);

    expect(formatHashRate(combinedHashRate)).toBe("50 TH/s");
    expect(calculatePercentOfNetwork(combinedHashRate)).toBeCloseTo(0.0000052192, 10);
  });

  it("computes the home miner scenario for 100 million participants", () => {
    const combinedHashRate = calculateCombinedHashRate(100_000_000, HOME_MINING_SCENARIOS_BY_KEY.homeMiner.perUserHashRate);

    expect(formatHashRate(combinedHashRate)).toBe("100 EH/s");
    expect(calculatePercentOfNetwork(combinedHashRate)).toBeCloseTo(10.4384, 4);
  });

  it("computes users needed to equal the fixed network baseline for modern ASICs", () => {
    const usersNeeded = calculateUsersNeededToEqualNetwork(HOME_MINING_SCENARIOS_BY_KEY.asic.perUserHashRate, FIXED_NETWORK_HASHRATE);

    expect(usersNeeded).toBeCloseTo(4_790_000, -4);
  });

  it("estimates the live network hash rate from difficulty", () => {
    const estimatedHashRate = estimateBitcoinNetworkHashRateFromDifficulty(100_000_000_000_000);

    expect(estimatedHashRate).toBeCloseTo(715_827_882_666_666_600_000, -8);
  });

  it("returns undefined when difficulty is missing", () => {
    expect(estimateBitcoinNetworkHashRateFromDifficulty(undefined)).toBeUndefined();
  });
});
