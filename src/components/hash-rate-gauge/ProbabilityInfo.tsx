import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { HelpCircle } from "lucide-react";
import { calculateSecondsToFindBlock, formatTime } from "@/utils/mining";
import { NetworkStats } from "@/types/mining";

interface ProbabilityInfoProps {
  hashRate: number;
  networkStats: NetworkStats;
}

const CONFIDENCE_LEVELS = [
  { confidence: 0.05, label: "5%" },
  { confidence: 0.50, label: "50%" },
  { confidence: 0.95, label: "95%" },
];

export function ProbabilityInfo({ hashRate, networkStats }: ProbabilityInfoProps) {
  return (
    <div className="text-right text-sm text-gray-400">
      <div className="font-semibold mb-1 flex items-center justify-end gap-2">
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
                This gives us the time within which you have the specified probability of finding a solution.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {CONFIDENCE_LEVELS.map(({ confidence, label }) => (
        <div key={label} className="flex justify-end gap-2">
          <span>{label} chance of finding a block solution in</span>
          <span>
            {formatTime(calculateSecondsToFindBlock(hashRate, networkStats.requiredBinaryZeroes, confidence))}
          </span>
        </div>
      ))}
    </div>
  );
}