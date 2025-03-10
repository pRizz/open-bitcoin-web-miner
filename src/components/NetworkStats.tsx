
import { Card } from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { HelpCircle } from "lucide-react";
import { BinaryZeroesHelp } from "./BinaryZeroesHelp";
import { formatLargeNumber } from "@/utils/formatters";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import API_CONFIG from "@/config/api";
import { toast } from "sonner";
import { useNetworkInfo } from "@/contexts/NetworkInfoContext";

const RANDOM_SELECTION_PROBABILITIES = [
  { odds: "1 in 1 million", value: 1e6, description: "picking the correct resident of San Francisco (~1M people)" },
  { odds: "1 in 1 billion", value: 1e9, description: "picking the correct person on Earth (~8B people)" },
  { odds: "1 in 1 trillion", value: 1e12, description: "picking the correct grain of sand in a large sandbox (~1T grains)" },
  { odds: "1 in 1 quadrillion", value: 1e15, description: "picking the correct cell in a human body (~37T cells)" },
  { odds: "1 in 1 quintillion", value: 1e18, description: "picking the correct grain of sand on a small beach (~1 quintillion grains)" },
  { odds: "1 in 1 sextillion", value: 1e21, description: "picking the correct bacterium on Earth (~5 sextillion bacteria)" },
  { odds: "1 in 1 septillion", value: 1e24, description: "picking the correct star in the observable universe (~1 septillion stars)" },
  { odds: "1 in 1 octillion", value: 1e27, description: "picking the correct water molecule in a bathtub (~1 octillion molecules)" },
  { odds: "1 in 1 nonillion", value: 1e30, description: "picking the correct DNA base pair in all humans combined (~1 nonillion base pairs)" },
  { odds: "1 in 1 decillion", value: 1e33, description: "picking the correct atom in a grain of sand (~1 decillion atoms)" },
  { odds: "1 in 1 undecillion", value: 1e36, description: "picking the correct virus particle on Earth (~1 undecillion viruses)" },
  { odds: "1 in 1 duodecillion", value: 1e39, description: "picking the correct photon in a bright sunlight beam (~1 duodecillion photons)" },
  { odds: "1 in 1 tredecillion", value: 1e42, description: "picking the correct grain of sand from all beaches on Earth (~1 tredecillion grains)" },
  { odds: "1 in 1 quattuordecillion", value: 1e45, description: "picking the correct neutrino passing through your body (~1 quattuordecillion neutrinos per second)" },
  { odds: "1 in 1 quindecillion", value: 1e48, description: "picking the correct electron in the observable universe (~1 quindecillion electrons)" },
  { odds: "1 in 1 sexdecillion", value: 1e51, description: "picking the correct hydrogen atom in the entire Milky Way (~1 sexdecillion atoms)" }
];

export function NetworkStats() {
  const { maybeBlockHeight, maybeNetworkDifficulty, maybeRequiredBinaryZeroes } = useNetworkInfo();
  const [isLocalhost, setIsLocalhost] = useState(true);

  useEffect(() => {
    const currentUrl = API_CONFIG.baseUrl;
    setIsLocalhost(currentUrl.includes('localhost'));
  }, []);

  const toggleEndpoint = () => {
    const newUrl = isLocalhost
      ? 'https://btc-mining-webapp.lightningfaucet.us:443'
      : 'http://localhost:3007';

    // Update the environment variable
    import.meta.env.VITE_API_URL = newUrl;
    API_CONFIG.baseUrl = newUrl;

    setIsLocalhost(!isLocalhost);
    toast.success(`Switched to ${isLocalhost ? 'production' : 'localhost'} endpoint`);
  };

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

  const probability = calculateProbability(maybeRequiredBinaryZeroes);
  const comparison = findClosestComparison(probability);

  return (
    <Card className="p-6 glass-card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Network Stats</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Production</span>
          <Switch
            checked={isLocalhost}
            onCheckedChange={toggleEndpoint}
          />
          <span className="text-sm text-gray-400">Localhost</span>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-400">Block Height</label>
          <p className="text-xl font-mono">{maybeBlockHeight?.toLocaleString()}</p>
        </div>
        <div>
          <label className="text-sm text-gray-400">Network Difficulty</label>
          <p className="text-xl font-mono">{(maybeNetworkDifficulty / 1e12).toFixed(2)} T</p>
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
          <p className="text-xl font-mono">{maybeRequiredBinaryZeroes}</p>
        </div>
        <div>
          <label className="text-sm text-gray-400">The Odds Any Random Hash Will Mine a Block</label>
          <p className="text-xl font-mono">1 in {formatLargeNumber(Math.pow(2, maybeRequiredBinaryZeroes))}</p>
        </div>
        <div>
          <label className="text-sm text-gray-400">To Put That In Perspective...</label>
          <p className="text-xl font-mono">That's similar to {comparison.description}</p>
        </div>
      </div>
    </Card>
  );
}
