import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { HelpCircle } from "lucide-react";
import { useNetworkInfo } from "@/contexts/NetworkInfoContext";
import { useMining } from "@/contexts/MiningContext";
import { calculateSecondsToFindBlock, formatHashRateWithShortSIUnits, formatTime } from "@/utils/mining";
import { Card } from "@/components/ui/card";

const CONFIDENCE_LEVELS = [
  { confidence: 0.01, label: "1%" },
  { confidence: 0.1, label: "10%" },
  { confidence: 0.50, label: "50%" },
  { confidence: 0.90, label: "90%" },
  { confidence: 0.99, label: "99%" },
];

export interface TimePeriod {
  seconds: number;
  label: string;
}

export const oneMinuteTimePeriod: TimePeriod = {
  seconds: 60,
  label: "1 minute",
};

export const oneHourTimePeriod: TimePeriod = {
  seconds: 60 * 60,
  label: "1 hour",
};

export const oneDayTimePeriod: TimePeriod = {
  seconds: 24 * 60 * 60,
  label: "1 day",
};

export const oneWeekTimePeriod: TimePeriod = {
  seconds: 7 * 24 * 60 * 60,
  label: "1 week",
};

export const oneMonthTimePeriod: TimePeriod = {
  seconds: 30 * 24 * 60 * 60,
  label: "1 month",
};

export const oneYearTimePeriod: TimePeriod = {
  seconds: 365 * 24 * 60 * 60,
  label: "1 year",
};

const defaultTimePeriods: TimePeriod[] = [
  oneMinuteTimePeriod,
  oneHourTimePeriod,
  oneDayTimePeriod,
  oneWeekTimePeriod,
  oneMonthTimePeriod,
  oneYearTimePeriod,
];

// Number of seconds in a day
const SECONDS_IN_DAY = 24 * 60 * 60;

// Based on https://chatgpt.com/c/685dba8b-27cc-8002-b234-0697c4e0eadd
// Calculate probability using Poisson distribution
/**
 * Probability of mining ≥ 1 hash with `leadingZeroBits` leading zeroes
 * within `seconds`, given `hashRate` hashes per second.
 *
 * Returns a value in [0, 1].
 */
const calculateProbability = (minerCount: number, hashRatePerMiner: number, requiredZeroes: number, timeInSeconds: number) => {
  const totalHashRate = minerCount * hashRatePerMiner;
  const totalHashCount = totalHashRate * timeInSeconds;
  if (totalHashCount <= 0) {
    return 0;
  }

  const logLambda = Math.log(totalHashCount) - requiredZeroes * Math.LN2;

  // Extreme-value guards to keep numerical error low
  if (logLambda < -20) {          // λ ≈ 2 × 10⁻⁹ or smaller
    return Math.exp(logLambda);   // P ≈ λ  (very small)
  }
  if (logLambda > 20) {           // λ ≈ 4.8 × 10⁸ or larger
    return 1;                     // Practically certain
  }

  const lambda = Math.exp(logLambda);
  return 1 - Math.exp(-lambda);   // General case
};

interface NetworkMiningPredictionStatsProps {
  minerCount: number;
  minerCountLabel: string;
  showCombinedHashRate: boolean;
  customPanelHeaderText?: string;
  hashRateOverride?: number; // Hash rate per miner in H/s
  maybeTimePeriods?: TimePeriod[];
}

// Example values for the help dialog
const exampleHashRate = 100;
const exampleRequiredZeroes = 20;
const exampleMinerCount = 1000;
const exampleTotalHashRate = exampleHashRate * exampleMinerCount;
const exampleSuccessProbability = Math.pow(2, -exampleRequiredZeroes);
const exampleLambda = (exampleTotalHashRate * SECONDS_IN_DAY) * exampleSuccessProbability;

export function MiningChancesStats({
  minerCount,
  minerCountLabel,
  showCombinedHashRate,
  customPanelHeaderText,
  hashRateOverride,
  maybeTimePeriods,
}: NetworkMiningPredictionStatsProps) {
  const { maybeNetworkRequiredLeadingZeroes } = useNetworkInfo();
  const { miningStats } = useMining();
  const { maybeHashRate: maybeUserHashRate } = miningStats;

  const hashRatePerMiner = hashRateOverride ?? (maybeUserHashRate ?? 0);
  const combinedHashRate = hashRatePerMiner * minerCount;

  // Format number with locale-specific separators
  const formatNumber = (num: number, precision: number = 3): string => {
    return num.toLocaleString(undefined, { maximumFractionDigits: precision });
  };

  const timePeriods: TimePeriod[] = maybeTimePeriods ?? defaultTimePeriods;

  return (
    <Card className="p-6 glass-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">{customPanelHeaderText || `Chances of at least 1 miner finding a block solution with ${minerCountLabel} miners at your hash rate`}</h2>
        <Dialog>
          <DialogTrigger>
            <HelpCircle className="h-5 w-5 cursor-help text-gray-400 hover:text-gray-300" />
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-y-auto max-w-2xl">
            <DialogHeader>
              <DialogTitle>How are these network probabilities calculated?</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <p>
                The probability of at least one miner finding a block in a day follows a Poisson distribution, where the expected number of successes depends on the total hash rate of all miners and the network difficulty.
              </p>
              <div className="space-y-2">
                <p>In mathematical notation:</p>
                <div className="font-mono bg-gray-900 p-4 rounded-md">
                  P(at least 1 success) = 1 - e^(-λ)
                </div>
                <p>where:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>λ (lambda) = (total_hashrate (H/s) * seconds_in_day (s)) *
                    <div className="inline-flex flex-col items-center mx-1">
                      <span className="border-b border-gray-600 px-1">1</span>
                      <span className="px-1">2^required_zeroes (hashes/solution)</span>
                    </div>
                    = solutions/day
                  </li>
                  <li className="ml-6 text-gray-400">Lambda represents the expected number of block solutions found per day across the entire network, in solutions/day. For example, if lambda = 2 solutions/day, the network expects to find 2 block solutions per day on average.</li>
                  <li>total_hashrate = your_hashrate (hashes/s) * number_of_miners</li>
                  <li>seconds_in_day = 24 * 60 * 60 = 86,400</li>
                  <li>e is Euler's number (approximately 2.71828)</li>
                </ul>
              </div>
              <p>
                This gives us the probability that at least one miner will find a block solution within one day.
              </p>
              <div className="mt-6 p-4 bg-gray-900 rounded-md space-y-3">
                <p className="font-semibold text-green-400">Simple Example:</p>
                <p>Let's say you have:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Hash Rate: {formatNumber(exampleHashRate)} H/s</li>
                  <li>Required Zeroes: {exampleRequiredZeroes}</li>
                  <li>Number of Miners: {formatNumber(exampleMinerCount)}</li>
                  <li>Time Period: 1 day (86,400 seconds)</li>
                </ul>
                <p>Then:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Total Hash Rate = {formatNumber(exampleHashRate)} H/s * {formatNumber(exampleMinerCount)} = {formatNumber(exampleTotalHashRate)} H/s</li>
                  <li>
                    Success Probability = 1 / 2^{exampleRequiredZeroes} =
                    <div className="inline-flex flex-col items-center mx-1">
                      <span className="border-b border-gray-600 px-1">1</span>
                      <span className="px-1">{formatNumber(Math.pow(2, exampleRequiredZeroes), 5)} hashes/solution</span>
                    </div>
                    ≈ {formatNumber(exampleSuccessProbability, 5)} = {formatNumber(exampleSuccessProbability * 100, 2)}%</li>
                  <li>
                    λ = ({formatNumber(exampleTotalHashRate)} H/s * 86,400 s) *
                    <div className="inline-flex flex-col items-center mx-1">
                      <span className="border-b border-gray-600 px-1">1</span>
                      <span className="px-1">{formatNumber(Math.pow(2, exampleRequiredZeroes), 5)} hashes/solution</span>
                    </div>
                    ≈ {formatNumber(exampleLambda)} solutions/day
                  </li>
                  <li>P(at least 1 success) = 1 - e^(-{formatNumber(exampleLambda)} solutions/day) ≈ {formatNumber(1 - Math.exp(-exampleLambda), 5)} = {formatNumber((1 - Math.exp(-exampleLambda)) * 100, 2)}%</li>
                </ol>
                <p className="text-green-400">
                  This means there is a {formatNumber((1 - Math.exp(-exampleLambda)) * 100, 2)}% chance that at least one miner will find a block solution within one day.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="text-sm text-gray-400">
        {maybeNetworkRequiredLeadingZeroes && combinedHashRate ? (
          <div className="space-y-2">
            {showCombinedHashRate ? (
              <div className="flex gap-2">
                <span className="text-gray-500">Combined Hash Rate:</span>
                <span>
                  {formatHashRateWithShortSIUnits(combinedHashRate)}
                </span>
              </div>
            ) : null}
            {timePeriods.map(({ seconds, label }) => {
              const probability = calculateProbability(minerCount, hashRatePerMiner, maybeNetworkRequiredLeadingZeroes, seconds);
              return (
                <div key={label} className="flex gap-2">
                  <span className="text-gray-500">•</span>
                  <span>
                    {formatNumber(probability * 100)}% chance within {label}
                  </span>
                </div>
              );
            })}
          </div>
        ) : !combinedHashRate ? (
          <span className="text-gray-500">• Start mining to see your chances</span>
        ) : (
          <span className="text-gray-500">• Network difficulty information not available</span>
        )}
      </div>
    </Card>
  );
}