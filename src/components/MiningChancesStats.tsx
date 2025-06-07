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

// Number of seconds in a day
const SECONDS_IN_DAY = 24 * 60 * 60;

interface NetworkMiningPredictionStatsProps {
  minerCount: number;
  minerCountLabel: string;
  showCombinedHashRate: boolean;
  customPanelHeaderText?: string;
  hashRateOverride?: number; // Hash rate per miner in H/s
}

export function MiningChancesStats({
  minerCount,
  minerCountLabel,
  showCombinedHashRate,
  customPanelHeaderText,
  hashRateOverride
}: NetworkMiningPredictionStatsProps) {
  const { maybeNetworkRequiredLeadingZeroes: maybeRequiredBinaryZeroes } = useNetworkInfo();
  const { miningStats } = useMining();
  const { maybeHashRate } = miningStats;

  // Use hashRateOverride if provided, otherwise use the current miner's hash rate
  const hashRatePerMiner = hashRateOverride ?? (maybeHashRate ?? 0);
  const combinedHashRate = hashRatePerMiner * minerCount;

  // Calculate the probability of at least one miner finding a block in a day
  const calculateNetworkProbability = (hashRate: number, requiredZeroes: number, minerCount: number): number => {
    // Probability of a single hash being successful
    const successProbability = Math.pow(2, -requiredZeroes);

    // Expected number of successful hashes per day for all miners
    const expectedSuccessesPerDay = (hashRate * minerCount * SECONDS_IN_DAY) * successProbability;

    // Probability of at least one success in a day (using Poisson approximation)
    // P(at least 1 success) = 1 - P(0 successes) = 1 - e^(-λ)
    return 1 - Math.exp(-expectedSuccessesPerDay);
  };

  // Format number with locale-specific separators
  const formatNumber = (num: number, precision: number = 2): string => {
    return num.toLocaleString(undefined, { maximumFractionDigits: precision });
  };

  // Example values for the help dialog
  const exampleHashRate = 100;
  const exampleRequiredZeroes = 20;
  const exampleMinerCount = 1000;
  const exampleTotalHashRate = exampleHashRate * exampleMinerCount;
  const exampleSuccessProbability = Math.pow(2, -exampleRequiredZeroes);
  const exampleLambda = (exampleTotalHashRate * SECONDS_IN_DAY) * exampleSuccessProbability;

  // Calculate probability using Poisson distribution
  const calculateProbability = (minerCount: number, hashRatePerMiner: number, requiredZeroes: number, timeInSeconds: number) => {
    // λ (lambda) = total_hashrate / 2^required_zeroes
    const lambda = (minerCount * hashRatePerMiner) / Math.pow(2, requiredZeroes);
    // P(X ≥ 1) = 1 - P(X = 0) = 1 - e^(-λt)
    return 1 - Math.exp(-lambda * timeInSeconds);
  };

  // Example hash rate per miner (in H/s)
  // const hashRatePerMiner = 100;

  // Time periods to check (in seconds)
  const timePeriods = [
    { seconds: 60, label: "1 minute" },
    { seconds: 3600, label: "1 hour" },
    { seconds: 86400, label: "1 day" },
    { seconds: 604800, label: "1 week" },
  ];

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
        {maybeRequiredBinaryZeroes && combinedHashRate ? (
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
              const probability = calculateProbability(minerCount, combinedHashRate, maybeRequiredBinaryZeroes, seconds);
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