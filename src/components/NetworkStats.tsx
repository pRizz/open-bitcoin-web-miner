import { Card } from "@/components/ui/card";
import { NetworkStats as NetworkStatsType } from "@/types/mining";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { HelpCircle } from "lucide-react";
import { BinaryZeroesHelp } from "./BinaryZeroesHelp";
import { formatLargeNumber } from "@/utils/formatters";

const RANDOM_SELECTION_PROBABILITIES = [
  { odds: "1 in 1 octillion", value: 1e27, description: "picking a random water molecule in a bathtub (~1 octillion molecules)" },
  { odds: "1 in 1 septillion", value: 1e24, description: "picking a random star in the observable universe (~1 septillion stars)" },
  { odds: "1 in 1 sextillion", value: 1e21, description: "picking a random bacterium on Earth (~5 sextillion bacteria)" },
  { odds: "1 in 1 quintillion", value: 1e18, description: "picking a random grain of sand on a small beach (~1 quintillion grains)" },
  { odds: "1 in 1 quadrillion", value: 1e15, description: "picking a random cell in a human body (~37T cells)" },
  { odds: "1 in 1 trillion", value: 1e12, description: "picking a random grain of sand in a large sandbox (~1T grains)" },
  { odds: "1 in 1 billion", value: 1e9, description: "picking a random person on Earth (~8B people)" },
  { odds: "1 in 1 million", value: 1e6, description: "picking a random resident of San Francisco (~1M people)" }
];

interface NetworkStatsProps {
  stats: NetworkStatsType;
}

export function NetworkStats({ stats }: NetworkStatsProps) {
  const calculateProbability = (zeroes: number) => {
    return 1 / Math.pow(2, zeroes);
  };

  const findClosestComparison = (probability: number) => {
    const targetValue = 1 / probability;
    const targetLog = Math.log10(targetValue);
    
    return RANDOM_SELECTION_PROBABILITIES.reduce((closest, current) => {
      const currentDelta = Math.abs(Math.log10(current.value) - targetLog);
      const closestDelta = Math.abs(Math.log10(closest.value) - targetLog);
      return currentDelta < closestDelta ? current : closest;
    });
  };

  const probability = calculateProbability(stats.requiredBinaryZeroes);
  const comparison = findClosestComparison(probability);

  return (
    <Card className="p-6 glass-card">
      <h2 className="text-2xl font-bold mb-4">Network Stats</h2>
      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-400">Block Height</label>
          <p className="text-xl font-mono">{stats.blockHeight.toLocaleString()}</p>
        </div>
        <div>
          <label className="text-sm text-gray-400">Network Difficulty</label>
          <p className="text-xl font-mono">{(stats.difficulty / 1e12).toFixed(2)} T</p>
        </div>
        <div>
          <label className="text-sm text-gray-400 flex items-center gap-2">
            Required Leading Binary Zeroes To Mine a Block
            <Dialog>
              <DialogTrigger>
                <HelpCircle className="h-4 w-4 cursor-help text-gray-400 hover:text-gray-300" />
              </DialogTrigger>
              <BinaryZeroesHelp />
            </Dialog>
          </label>
          <p className="text-xl font-mono">{stats.requiredBinaryZeroes}</p>
        </div>
        <div>
          <label className="text-sm text-gray-400">The Odds Any Random Hash Will Mine a Block</label>
          <p className="text-xl font-mono">1 in {formatLargeNumber(Math.pow(2, stats.requiredBinaryZeroes))}</p>
        </div>
        <div>
          <label className="text-sm text-gray-400">To Put That In Perspective...</label>
          <p className="text-xl font-mono">That's similar to {comparison.description}</p>
        </div>
      </div>
    </Card>
  );
}