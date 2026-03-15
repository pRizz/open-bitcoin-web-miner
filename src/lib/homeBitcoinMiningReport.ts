export const FIXED_NETWORK_HASHRATE = 958e18;
export const FIXED_NETWORK_HASHRATE_LABEL = "958 EH/s";
export const HASHES_PER_ZETTAHASH = 1e21;

export const HOME_MINING_PARTICIPANT_COUNTS = [
  1_000_000,
  10_000_000,
  100_000_000,
  1_000_000_000,
  8_000_000_000,
] as const;

export const HASH_RATE_UNIT_ROWS = [
  { unit: "MH/s", hashesPerSecond: "10^6" },
  { unit: "GH/s", hashesPerSecond: "10^9" },
  { unit: "TH/s", hashesPerSecond: "10^12" },
  { unit: "PH/s", hashesPerSecond: "10^15" },
  { unit: "EH/s", hashesPerSecond: "10^18" },
  { unit: "ZH/s", hashesPerSecond: "10^21" },
  { unit: "YH/s", hashesPerSecond: "10^24" },
] as const;

export type HomeMiningScenarioKey = "gpu" | "homeMiner" | "asic";

export interface HomeMiningScenarioDefinition {
  key: HomeMiningScenarioKey;
  title: string;
  shortTitle: string;
  perUserHashRate: number;
  perUserHashRateLabel: string;
  narrative: string;
}

export interface HomeMiningScenarioRow {
  participantCount: number;
  participantCountLabel: string;
  participantCountShortLabel: string;
  perUserHashRateLabel: string;
  combinedHashRate: number;
  combinedHashRateLabel: string;
  comparedToNetworkLabel: string;
  percentOfNetwork: number;
  percentOfNetworkLabel: string;
}

export interface HomeMiningScenarioReport extends HomeMiningScenarioDefinition {
  rows: HomeMiningScenarioRow[];
  usersNeededToEqualNetwork: number;
  usersNeededToEqualNetworkLabel: string;
}

type ChartSeriesPoint = {
  participantCount: number;
  participantCountLabel: string;
  participantCountShortLabel: string;
} & Record<HomeMiningScenarioKey, number>;

const HASH_RATE_UNITS = [
  { threshold: 1e24, label: "YH/s" },
  { threshold: 1e21, label: "ZH/s" },
  { threshold: 1e18, label: "EH/s" },
  { threshold: 1e15, label: "PH/s" },
  { threshold: 1e12, label: "TH/s" },
  { threshold: 1e9, label: "GH/s" },
  { threshold: 1e6, label: "MH/s" },
  { threshold: 1e3, label: "KH/s" },
] as const;

const PEOPLE_COUNT_UNITS = [
  { threshold: 1e12, shortLabel: "T", longLabel: "trillion" },
  { threshold: 1e9, shortLabel: "B", longLabel: "billion" },
  { threshold: 1e6, shortLabel: "M", longLabel: "million" },
  { threshold: 1e3, shortLabel: "K", longLabel: "thousand" },
] as const;

const HOME_MINING_SCENARIO_DEFINITIONS: readonly HomeMiningScenarioDefinition[] = [
  {
    key: "gpu",
    title: "Consumer GPUs (50 MH/s)",
    shortTitle: "GPU",
    perUserHashRate: 50e6,
    perUserHashRateLabel: "50 MH/s",
    narrative: "Even global-scale GPU participation barely registers against Bitcoin’s industrial hash rate.",
  },
  {
    key: "homeMiner",
    title: "Small Home Miners (1 TH/s BitAxe class)",
    shortTitle: "BitAxe class",
    perUserHashRate: 1e12,
    perUserHashRateLabel: "1 TH/s",
    narrative: "Small dedicated miners begin to matter only when adoption climbs into the tens or hundreds of millions of homes.",
  },
  {
    key: "asic",
    title: "Modern ASIC Miners (200 TH/s)",
    shortTitle: "Modern ASIC",
    perUserHashRate: 200e12,
    perUserHashRateLabel: "200 TH/s",
    narrative: "High-end ASICs compress the gap dramatically, which is why industrial mining converged on specialized hardware.",
  },
] as const;

function trimTrailingZeros(value: string): string {
  return value.replace(/\.0+$|(\.\d*?[1-9])0+$/, "$1");
}

function formatScaledValue(value: number, maximumFractionDigits: number = 2): string {
  return trimTrailingZeros(value.toLocaleString(undefined, { maximumFractionDigits }));
}

export function formatHashRate(hashRate: number): string {
  if (!Number.isFinite(hashRate) || hashRate <= 0) {
    return "0 H/s";
  }

  for (const { threshold, label } of HASH_RATE_UNITS) {
    if (hashRate >= threshold) {
      return `${formatScaledValue(hashRate / threshold)} ${label}`;
    }
  }

  return `${formatScaledValue(hashRate)} H/s`;
}

export function formatHashRateInExahashes(hashRate: number): string {
  return `${formatScaledValue(hashRate / 1e18, 8)} EH/s`;
}

export function formatShortParticipantCount(participantCount: number): string {
  for (const { threshold, shortLabel } of PEOPLE_COUNT_UNITS) {
    if (participantCount >= threshold) {
      return `${formatScaledValue(participantCount / threshold, participantCount / threshold >= 10 ? 0 : 1)}${shortLabel}`;
    }
  }

  return participantCount.toLocaleString();
}

export function formatLongParticipantCount(participantCount: number): string {
  for (const { threshold, longLabel } of PEOPLE_COUNT_UNITS) {
    if (participantCount >= threshold) {
      return `${formatScaledValue(participantCount / threshold, participantCount / threshold >= 10 ? 0 : 1)} ${longLabel}`;
    }
  }

  return participantCount.toLocaleString();
}

export function formatPercentOfNetwork(percentOfNetwork: number): string {
  const absolutePercent = Math.abs(percentOfNetwork);

  if (absolutePercent >= 1) {
    return `${percentOfNetwork.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;
  }

  if (absolutePercent >= 0.1) {
    return `${percentOfNetwork.toLocaleString(undefined, { maximumFractionDigits: 3 })}%`;
  }

  if (absolutePercent >= 0.01) {
    return `${percentOfNetwork.toLocaleString(undefined, { maximumFractionDigits: 4 })}%`;
  }

  if (absolutePercent >= 0.001) {
    return `${percentOfNetwork.toLocaleString(undefined, { maximumFractionDigits: 5 })}%`;
  }

  if (absolutePercent >= 0.0001) {
    return `${percentOfNetwork.toLocaleString(undefined, { maximumFractionDigits: 6 })}%`;
  }

  if (absolutePercent >= 0.00001) {
    return `${percentOfNetwork.toLocaleString(undefined, { maximumFractionDigits: 7 })}%`;
  }

  return `${percentOfNetwork.toLocaleString(undefined, { maximumFractionDigits: 8 })}%`;
}

export function formatUsersNeededToEqualNetwork(usersNeeded: number): string {
  for (const { threshold, longLabel } of PEOPLE_COUNT_UNITS) {
    if (usersNeeded >= threshold) {
      const scaledUsers = usersNeeded / threshold;
      const maximumFractionDigits = scaledUsers >= 10 ? 0 : 1;
      return `~${formatScaledValue(scaledUsers, maximumFractionDigits)} ${longLabel}`;
    }
  }

  return `~${Math.round(usersNeeded).toLocaleString()}`;
}

export function calculateCombinedHashRate(participantCount: number, perUserHashRate: number): number {
  return participantCount * perUserHashRate;
}

export function calculatePercentOfNetwork(
  combinedHashRate: number,
  networkHashRate: number = FIXED_NETWORK_HASHRATE,
): number {
  return (combinedHashRate / networkHashRate) * 100;
}

export function calculateUsersNeededToEqualNetwork(
  perUserHashRate: number,
  networkHashRate: number = FIXED_NETWORK_HASHRATE,
): number {
  return networkHashRate / perUserHashRate;
}

export function estimateBitcoinNetworkHashRateFromDifficulty(maybeDifficulty?: number): number | undefined {
  if (!maybeDifficulty || maybeDifficulty <= 0) {
    return undefined;
  }

  return maybeDifficulty * (2 ** 32) / 600;
}

function buildScenarioRows(scenario: HomeMiningScenarioDefinition): HomeMiningScenarioRow[] {
  return HOME_MINING_PARTICIPANT_COUNTS.map((participantCount) => {
    const combinedHashRate = calculateCombinedHashRate(participantCount, scenario.perUserHashRate);
    const percentOfNetwork = calculatePercentOfNetwork(combinedHashRate);

    return {
      participantCount,
      participantCountLabel: formatLongParticipantCount(participantCount),
      participantCountShortLabel: formatShortParticipantCount(participantCount),
      perUserHashRateLabel: scenario.perUserHashRateLabel,
      combinedHashRate,
      combinedHashRateLabel: formatHashRate(combinedHashRate),
      comparedToNetworkLabel: `${formatHashRateInExahashes(combinedHashRate)} vs ${FIXED_NETWORK_HASHRATE_LABEL}`,
      percentOfNetwork,
      percentOfNetworkLabel: formatPercentOfNetwork(percentOfNetwork),
    };
  });
}

export const HOME_MINING_SCENARIOS: readonly HomeMiningScenarioReport[] = HOME_MINING_SCENARIO_DEFINITIONS.map((scenario) => {
  const usersNeededToEqualNetwork = calculateUsersNeededToEqualNetwork(scenario.perUserHashRate);

  return {
    ...scenario,
    rows: buildScenarioRows(scenario),
    usersNeededToEqualNetwork,
    usersNeededToEqualNetworkLabel: formatUsersNeededToEqualNetwork(usersNeededToEqualNetwork),
  };
});

export const HOME_MINING_SCENARIOS_BY_KEY = HOME_MINING_SCENARIOS.reduce((scenarioMap, scenario) => {
  scenarioMap[scenario.key] = scenario;
  return scenarioMap;
}, {} as Record<HomeMiningScenarioKey, HomeMiningScenarioReport>);

export const HOME_MINING_HASH_RATE_CHART_DATA: readonly ChartSeriesPoint[] = HOME_MINING_PARTICIPANT_COUNTS.map((participantCount) => ({
  participantCount,
  participantCountLabel: formatLongParticipantCount(participantCount),
  participantCountShortLabel: formatShortParticipantCount(participantCount),
  gpu: calculateCombinedHashRate(participantCount, HOME_MINING_SCENARIOS_BY_KEY.gpu.perUserHashRate),
  homeMiner: calculateCombinedHashRate(participantCount, HOME_MINING_SCENARIOS_BY_KEY.homeMiner.perUserHashRate),
  asic: calculateCombinedHashRate(participantCount, HOME_MINING_SCENARIOS_BY_KEY.asic.perUserHashRate),
}));

export const HOME_MINING_PERCENT_CHART_DATA: readonly ChartSeriesPoint[] = HOME_MINING_HASH_RATE_CHART_DATA.map((point) => ({
  participantCount: point.participantCount,
  participantCountLabel: point.participantCountLabel,
  participantCountShortLabel: point.participantCountShortLabel,
  gpu: calculatePercentOfNetwork(point.gpu),
  homeMiner: calculatePercentOfNetwork(point.homeMiner),
  asic: calculatePercentOfNetwork(point.asic),
}));

export const HOME_MINING_USERS_TO_EQUAL_NETWORK_CHART_DATA = HOME_MINING_SCENARIOS.map((scenario) => ({
  scenarioKey: scenario.key,
  scenarioLabel: scenario.shortTitle,
  usersNeeded: scenario.usersNeededToEqualNetwork,
  usersNeededLabel: scenario.usersNeededToEqualNetworkLabel,
}));
