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

export function MiningPredictionStats() {
  const { maybeRequiredBinaryZeroes } = useNetworkInfo();
  const { miningStats } = useMining();
  const { maybeHashRate } = miningStats;

  return (
    <Card className="p-6 glass-card">
      <h2 className="text-2xl font-bold mb-4">Mining Predictions</h2>
      <div className="text-sm text-gray-400">
        <div className="font-semibold mb-1 flex items-center gap-2">
          Chances of Finding a Block Solution
          <Dialog>
            <DialogTrigger>
              <HelpCircle className="h-4 w-4 cursor-help text-gray-400 hover:text-gray-300" />
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
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
                    <li>λ (lambda) = your_hashrate / 2^required_zeroes</li>
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
                    <li>Hash Rate: 100 H/s</li>
                    <li>Required Zeroes: 10</li>
                    <li>Confidence Level: 50%</li>
                  </ul>
                  <p>Then:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>λ = 100 / 2^10 = 100 / 1024 ≈ 0.0977 solutions/second</li>
                    <li>t = -ln(1 - 0.5) / 0.0977</li>
                    <li>t ≈ 7.1 seconds</li>
                  </ol>
                  <p className="text-green-400">
                    This means you have a 50% chance of finding a solution within 7.1 seconds.
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {maybeHashRate && maybeRequiredBinaryZeroes && CONFIDENCE_LEVELS.map(({ confidence, label }) => (
          <div key={label} className="flex gap-2">
            <span className="text-gray-500">•</span>
            <span>{label} chance of finding a block solution in {formatTime(calculateSecondsToFindBlock(maybeHashRate, maybeRequiredBinaryZeroes, confidence))}</span>
          </div>
        )) || <span className="text-gray-500">• Start mining to see your chances of finding a block solution</span>}
      </div>
    </Card>
  );
}