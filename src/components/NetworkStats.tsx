import { Card } from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { HelpCircle, Loader2 } from "lucide-react";
import { BinaryZeroesHelp } from "./BinaryZeroesHelp";
import { formatLargeNumber } from "@/utils/formatters";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import API_CONFIG, { developmentUrl, productionUrl, productionMainnetUrl } from "@/config/api";
import { toast } from "sonner";
import { useNetworkInfo } from "@/contexts/NetworkInfoContext";

function formatStringValueEvery8Chars(value: string | undefined): string {
  if (!value) {
    return '';
  }

  // This function formats a string value every 8 characters with a space
  // It uses a regular expression to find every 8 characters and replace them with the same 8 characters followed by a space
  // The result is a string with spaces every 8 characters
  return value.replace(/(\w{8})(?=\w)/g, '$1 ');
}

interface HighlightedBinaryHashProps {
  binaryHash: string | undefined;
  leadingZeroes: number | undefined;
  isHighlighted: boolean;
}

function HighlightedBinaryHash({ binaryHash, leadingZeroes, isHighlighted }: HighlightedBinaryHashProps) {
  if (!binaryHash || leadingZeroes === undefined) {
    return <span>{formatStringValueEvery8Chars(binaryHash || '')}</span>;
  }

  const formattedHash = formatStringValueEvery8Chars(binaryHash);
  const spacesToSkip = Math.floor(leadingZeroes / 8);
  let highlightLength = leadingZeroes + spacesToSkip;

  // If the last character to be highlighted is a space, don't include it
  if (formattedHash[highlightLength - 1] === ' ') {
    highlightLength--;
  }

  const highlightedPart = formattedHash.substring(0, highlightLength);
  const restOfHash = formattedHash.substring(highlightLength);

  return (
    <span>
      {isHighlighted ? (
        <>
          <span className="bg-yellow-600">{highlightedPart}</span>
          <span>{restOfHash}</span>
        </>
      ) : (
        formattedHash
      )}
    </span>
  );
}

interface RandomSelectionProbability {
  odds: string;
  oddsDenominator: number;
  description: string;
}

const RANDOM_SELECTION_PROBABILITIES: RandomSelectionProbability[] = [
  { odds: "1 in 1 million", oddsDenominator: 1e6, description: "picking the correct resident of San Francisco (~1M people)" },
  { odds: "1 in 1 billion", oddsDenominator: 1e9, description: "picking the correct person on Earth (~8B people)" },
  { odds: "1 in 1 trillion", oddsDenominator: 1e12, description: "picking the correct grain of sand in a large sandbox (~1T grains)" },
  { odds: "1 in 1 quadrillion", oddsDenominator: 1e15, description: "picking the correct cell in a human body (~37T cells)" },
  { odds: "1 in 1 quintillion", oddsDenominator: 1e18, description: "picking the correct grain of sand on a small beach (~1 quintillion grains)" },
  { odds: "1 in 1 sextillion", oddsDenominator: 1e21, description: "picking the correct bacterium on Earth (~5 sextillion bacteria)" },
  { odds: "1 in 1 septillion", oddsDenominator: 1e24, description: "picking the correct star in the observable universe (~1 septillion stars)" },
  { odds: "1 in 1 octillion", oddsDenominator: 1e27, description: "picking the correct water molecule in a bathtub (~1 octillion molecules)" },
  { odds: "1 in 1 nonillion", oddsDenominator: 1e30, description: "picking the correct DNA base pair in all humans combined (~1 nonillion base pairs)" },
  { odds: "1 in 1 decillion", oddsDenominator: 1e33, description: "picking the correct atom in a grain of sand (~1 decillion atoms)" },
  { odds: "1 in 1 undecillion", oddsDenominator: 1e36, description: "picking the correct virus particle on Earth (~1 undecillion viruses)" },
  { odds: "1 in 1 duodecillion", oddsDenominator: 1e39, description: "picking the correct photon in a bright sunlight beam (~1 duodecillion photons)" },
  { odds: "1 in 1 tredecillion", oddsDenominator: 1e42, description: "picking the correct grain of sand from all beaches on Earth (~1 tredecillion grains)" },
  { odds: "1 in 1 quattuordecillion", oddsDenominator: 1e45, description: "picking the correct neutrino passing through your body (~1 quattuordecillion neutrinos per second)" },
  { odds: "1 in 1 quindecillion", oddsDenominator: 1e48, description: "picking the correct electron in the observable universe (~1 quindecillion electrons)" },
  { odds: "1 in 1 sexdecillion", oddsDenominator: 1e51, description: "picking the correct hydrogen atom in the entire Milky Way (~1 sexdecillion atoms)" }
];

function Spinner() {
  return <Loader2 className="h-4 w-4 animate-spin" />;
}

function StatValue({ children, isLoading }: { children: React.ReactNode, isLoading: boolean }) {
  if (isLoading) {
    return <div className="flex items-center gap-2 h-[28px]">
      <Spinner />
      <span className="text-gray-400">Loading...</span>
    </div>;
  }
  return <p className="text-xl font-mono">{children}</p>;
}

export function NetworkStats() {
  const { maybeBlockHeight, maybeNetworkRequiredLeadingZeroes: maybeRequiredBinaryZeroes, maybeFormattedNetworkDifficulty, maybeLatestBlockHashHex, maybeLatestBlockHashBinary, maybeLeadingZeroesInLatestBlockHash } = useNetworkInfo();
  const [selectedBackend, setSelectedBackend] = useState<string>('localhost');
  const [isHighlighted, setIsHighlighted] = useState(false);

  const backends = [
    { value: 'localhost', label: 'Localhost', url: developmentUrl },
    { value: 'production', label: 'Production', url: productionUrl },
    { value: 'mainnet', label: 'Mainnet', url: productionMainnetUrl }
  ];

  useEffect(() => {
    // Try to get the persisted backend selection from localStorage
    const persistedBackend = localStorage.getItem('selectedBackend');
    if (persistedBackend) {
      setSelectedBackend(persistedBackend);
    } else {
      // Fall back to detecting from current API URL
      const currentUrl = API_CONFIG.baseUrl;
      const currentBackend = backends.find(backend => backend.url === currentUrl);
      if (currentBackend) {
        setSelectedBackend(currentBackend.value);
      }
    }
  }, []);

  const handleBackendChange = (value: string) => {
    const selectedBackendConfig = backends.find(backend => backend.value === value);
    if (selectedBackendConfig) {
      // Update the environment variable
      import.meta.env.VITE_API_URL = selectedBackendConfig.url;
      API_CONFIG.baseUrl = selectedBackendConfig.url;

      // Persist the selection to localStorage
      localStorage.setItem('selectedBackend', value);

      setSelectedBackend(value);
      toast.success(`Switched to ${selectedBackendConfig.label} endpoint`);
    }
  };

  const calculateProbability = (zeroes: number) => {
    return 1 / Math.pow(2, zeroes);
  };

  const findClosestComparison = (probability: number): RandomSelectionProbability | undefined => {
    const targetValue = 1 / probability;
    const targetLog = Math.log10(targetValue);

    return RANDOM_SELECTION_PROBABILITIES.reduce((closest, current) => {
      const currentDelta = Math.abs(Math.log10(current.oddsDenominator) - targetLog);
      const closestDelta = Math.abs(Math.log10(closest.oddsDenominator) - targetLog);
      return currentDelta < closestDelta ? current : closest;
    });
  };

  const getDescriptionPrefix = (probability: number, comparison: RandomSelectionProbability | undefined): string | undefined => {
    if (!comparison) {
      return undefined;
    }
    const comparisonProbability = 1 / comparison.oddsDenominator;
    if (probability < comparisonProbability) {
      console.log(`probability: ${probability}, comparison: ${comparisonProbability}`);
      return `That's harder than`;
    }
    return `That's similar to`;
  };

  const probability = maybeRequiredBinaryZeroes ? calculateProbability(maybeRequiredBinaryZeroes) : undefined;
  const comparison = probability ? findClosestComparison(probability) : undefined;
  const descriptionPrefix = probability ? getDescriptionPrefix(probability, comparison) : undefined;
  const descriptionStatement = comparison && `${descriptionPrefix} ${comparison.description}`;

  return (
    <Card className="p-6 glass-card" style={{ zIndex: 9 }}>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Network Stats</h2>

        {import.meta.env.DEV && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Backend:</span>
            <Select value={selectedBackend} onValueChange={handleBackendChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {backends.map((backend) => (
                  <SelectItem key={backend.value} value={backend.value}>
                    {backend.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-4">

        <div>
          <label className="text-sm text-gray-400">Latest Block Height</label>
          <StatValue isLoading={maybeBlockHeight === undefined}>
            <a
              href={`https://bitcoinexplorer.org/block-height/${maybeBlockHeight}`}
              target="_blank"
              rel="noopener"
              className="text-blue-400 hover:text-blue-300"
            >
              {maybeBlockHeight?.toLocaleString()}
            </a>
          </StatValue>
        </div>

        <div>
          <label className="text-sm text-gray-400">Latest Block Hash As Hexadecimal</label>
          <StatValue isLoading={maybeLatestBlockHashHex === undefined}>
            <a
              href={`https://bitcoinexplorer.org/block/${maybeLatestBlockHashHex}`}
              target="_blank"
              rel="noopener"
              className="text-blue-400 hover:text-blue-300"
            >
              {formatStringValueEvery8Chars(maybeLatestBlockHashHex)}
            </a>
          </StatValue>
        </div>

        <div>
          <label className="text-sm text-gray-400">Latest Block Hash As Binary</label>
          <StatValue isLoading={maybeLatestBlockHashBinary === undefined}>
            <HighlightedBinaryHash
              binaryHash={maybeLatestBlockHashBinary}
              leadingZeroes={maybeLeadingZeroesInLatestBlockHash}
              isHighlighted={isHighlighted}
            />
          </StatValue>
        </div>

        <div>
          <label className="text-sm text-gray-400">Leading Zeroes In Latest Block Hash</label>
          <StatValue isLoading={maybeLeadingZeroesInLatestBlockHash === undefined}>
            <span
              onMouseEnter={() => setIsHighlighted(true)}
              onMouseLeave={() => setIsHighlighted(false)}
              className="cursor-help"
            >
              {maybeLeadingZeroesInLatestBlockHash}
            </span>
          </StatValue>
        </div>

        <div>
          <label className="text-sm text-gray-400">Network Difficulty</label>
          <StatValue isLoading={maybeFormattedNetworkDifficulty === undefined}>
            {maybeFormattedNetworkDifficulty}
          </StatValue>
        </div>

        <div>
          <label className="text-sm text-gray-400 flex items-center gap-2">
            Network Equivalent Required Leading Binary Zeroes In a BlockHash To Mine a Bitcoin Block
            <Dialog>
              <DialogTrigger>
                <HelpCircle className="h-4 w-4 cursor-help text-gray-400 hover:text-gray-300" />
              </DialogTrigger>
              <BinaryZeroesHelp />
            </Dialog>
          </label>
          <StatValue isLoading={maybeRequiredBinaryZeroes === undefined}>
            {maybeRequiredBinaryZeroes}
          </StatValue>
        </div>

        <div>
          <label className="text-sm text-gray-400">The Odds Any Random Hash Will Mine a Bitcoin Block</label>
          <StatValue isLoading={maybeRequiredBinaryZeroes === undefined}>
            {maybeRequiredBinaryZeroes !== undefined && `1 in ${formatLargeNumber(Math.pow(2, maybeRequiredBinaryZeroes))}`}
          </StatValue>
        </div>

        <div>
          <label className="text-sm text-gray-400">To Put That In Perspective...</label>
          <StatValue isLoading={!descriptionStatement}>
            {descriptionStatement}
          </StatValue>
        </div>

      </div>
    </Card>
  );
}
