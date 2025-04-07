import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { HelpCircle } from "lucide-react";
import { useNetworkInfo } from "@/contexts/NetworkInfoContext";
import { useMining } from "@/contexts/MiningContext";
import { calculateSecondsToFindBlock, formatTime } from "@/utils/mining";
import { Card } from "@/components/ui/card";

const CONFIDENCE_LEVELS = [
  { confidence: 0.01, label: "1%" },
  { confidence: 0.1, label: "10%" },
  { confidence: 0.50, label: "50%" },
  { confidence: 0.90, label: "90%" },
  { confidence: 0.99, label: "99%" },
];

export function MiningTimeRequiredStats() {
  const { maybeNetworkRequiredLeadingZeroes: maybeRequiredBinaryZeroes } = useNetworkInfo();
  const { miningStats } = useMining();
  const { maybeHashRate } = miningStats;

  // Format number with locale-specific separators
  const formatNumber = (num: number): string => {
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  // Example values for the help dialog
  const exampleHashRate = 100;
  const exampleRequiredZeroes = 10;
  const exampleConfidence = 0.5;
  const exampleLambda = exampleHashRate / Math.pow(2, exampleRequiredZeroes);
  const exampleTime = -Math.log(1 - exampleConfidence) / exampleLambda;

  return (
    <Card className="p-6 glass-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Time Required to Find a Block Solution</h2>
        <Dialog>
          <DialogTrigger>
            <HelpCircle className="h-5 w-5 cursor-help text-gray-400 hover:text-gray-300" />
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-y-auto max-w-2xl">
            <DialogHeader>
              <DialogTitle>How are these probabilities calculated?</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <p>
                The probability of finding a block solution follows an exponential distribution, where the expected time depends on your hash rate and the network difficulty.
              </p>
              <div className="space-y-2">
                <p>In mathematical notation:</p>
                <div className="font-mono bg-gray-900 p-4 rounded-md">
                  P(T ≤ t) = 1 - e^(-λt)
                </div>
                <p>where:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>T is the random variable representing the time to find a solution</li>
                  <li>t is a specific time</li>
                  <li>λ (lambda) =
                    <div className="inline-flex flex-col items-center mx-1">
                      <span className="border-b border-gray-600 px-1">your_hashrate (hashes/s)</span>
                      <span className="px-1">2^required_zeroes (hashes/solution)</span>
                    </div>
                    = solutions/second
                  </li>
                  <li className="ml-6 text-gray-400">Lambda represents the average rate at which you'll find block solutions in solutions/second. For example, if lambda = 0.1 solutions/second, you expect to find a solution once every 10 seconds on average.</li>
                  <li>e is Euler's number (approximately 2.71828)</li>
                </ul>
              </div>
              <p>
                For a given confidence level (e.g., 5%, 50%, or 95%), we solve for t using:
              </p>
              <div className="font-mono bg-gray-900 p-4 rounded-md">
                t = -ln(1 - confidence) / λ
              </div>
              <p>
                This gives us the time within which you have the specified probability of finding a solution. For example, with 50% confidence, you have a 50-50 chance of finding a solution within that time.
              </p>
              <div className="mt-6 p-4 bg-gray-900 rounded-md space-y-3">
                <p className="font-semibold text-green-400">Simple Example:</p>
                <p>Let's say you have:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Hash Rate: {formatNumber(exampleHashRate)} hashes/s</li>
                  <li>Required Zeroes: {exampleRequiredZeroes}</li>
                  <li>Confidence Level: {formatNumber(exampleConfidence * 100)}%</li>
                </ul>
                <p>Then:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>
                    λ =
                    <div className="inline-flex flex-col items-center mx-1">
                      <span className="border-b border-gray-600 px-1">{formatNumber(exampleHashRate)} hashes/s</span>
                      <span className="px-1">{formatNumber(Math.pow(2, exampleRequiredZeroes))} hashes/solution</span>
                    </div>
                    ≈ {formatNumber(exampleLambda)} solutions/second
                  </li>
                  <li>t = -ln(1 - {formatNumber(exampleConfidence)}) / {formatNumber(exampleLambda)} solutions/second</li>
                  <li>t ≈ {formatNumber(exampleTime)} seconds</li>
                </ol>
                <p className="text-green-400">
                  This means you have a {formatNumber(exampleConfidence * 100)}% chance of finding a solution within {formatNumber(exampleTime)} seconds.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="text-sm text-gray-400">
        {maybeHashRate && maybeRequiredBinaryZeroes && CONFIDENCE_LEVELS.map(({ confidence, label }) => (
          <div key={label} className="flex gap-2">
            <span className="text-gray-500">•</span>
            <span>{label} chance of finding a block solution in {formatTime(calculateSecondsToFindBlock(maybeHashRate, maybeRequiredBinaryZeroes, confidence))}</span>
          </div>
        )) || <span className="text-gray-500">• Start mining to see the time required to find a block solution</span>}
      </div>
    </Card>
  );
}