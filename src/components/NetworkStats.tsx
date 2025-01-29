import { Card } from "@/components/ui/card";
import { NetworkStats as NetworkStatsType } from "@/types/mining";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { HelpCircle } from "lucide-react";
import { BinaryZeroesHelp } from "./BinaryZeroesHelp";
import { formatLargeNumber } from "@/utils/formatters";

const RANDOM_SELECTION_PROBABILITIES = [
  { odds: "1 in 1 million", value: 1e6, description: "picking a random resident of San Francisco (~1M people)" },
  { odds: "1 in 1 billion", value: 1e9, description: "picking a random person on Earth (~8B people)" },
  { odds: "1 in 1 trillion", value: 1e12, description: "picking a random grain of sand in a large sandbox (~1T grains)" },
  { odds: "1 in 1 quadrillion", value: 1e15, description: "picking a random cell in a human body (~37T cells)" },
  { odds: "1 in 1 quintillion", value: 1e18, description: "picking a random grain of sand on a small beach (~1 quintillion grains)" },
  { odds: "1 in 1 sextillion", value: 1e21, description: "picking a random bacterium on Earth (~5 sextillion bacteria)" },
  { odds: "1 in 1 septillion", value: 1e24, description: "picking a random star in the observable universe (~1 septillion stars)" },
  { odds: "1 in 1 octillion", value: 1e27, description: "picking a random water molecule in a bathtub (~1 octillion molecules)" },
  { odds: "1 in 1 nonillion", value: 1e30, description: "picking a random DNA base pair in all humans combined (~1 nonillion base pairs)" },
  { odds: "1 in 1 decillion", value: 1e33, description: "picking a random atom in a grain of sand (~1 decillion atoms)" },
  { odds: "1 in 1 undecillion", value: 1e36, description: "picking a random virus particle on Earth (~1 undecillion viruses)" },
  { odds: "1 in 1 duodecillion", value: 1e39, description: "picking a random photon in a bright sunlight beam (~1 duodecillion photons)" },
  { odds: "1 in 1 tredecillion", value: 1e42, description: "picking a random grain of sand from all beaches on Earth (~1 tredecillion grains)" },
  { odds: "1 in 1 quattuordecillion", value: 1e45, description: "picking a random neutrino passing through your body (~1 quattuordecillion neutrinos per second)" },
  { odds: "1 in 1 quindecillion", value: 1e48, description: "picking a random electron in the observable universe (~1 quindecillion electrons)" },
  { odds: "1 in 1 sexdecillion", value: 1e51, description: "picking a random hydrogen atom in the entire Milky Way (~1 sexdecillion atoms)" }
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