import { Card } from "@/components/ui/card";
import { formatHashRate, calculateSecondsToFindBlock, formatTime } from "@/utils/mining";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { HelpCircle } from "lucide-react";
import { useNetworkInfo } from "@/contexts/NetworkInfoContext";

interface MinerReference {
  hashRate: number;
  name: string;
}

const MINER_REFERENCES: MinerReference[] = [
  { hashRate: 1e12, name: "Bitaxe" },        // 1 TH/s
  { hashRate: 100e12, name: "Antminer S21" }, // 100 TH/s
];

// Calculate number of orders of magnitude from 1 H/s (10^0) to 1 PH/s (10^15)
const MAGNITUDE_RANGE = {
  MIN_EXPONENT: 0,  // 1 H/s
  MAX_EXPONENT: 15, // 1 PH/s
  // Maximum value is 1 PH/s (10^15)
  MAX_HASH_RATE: Math.pow(10, 15)
};

// Generate magnitude ticks from 1 H/s to 1 PH/s
const MAGNITUDE_TICKS = Array.from(
  { length: MAGNITUDE_RANGE.MAX_EXPONENT - MAGNITUDE_RANGE.MIN_EXPONENT + 1 }, 
  (_, i) => Math.pow(10, i + MAGNITUDE_RANGE.MIN_EXPONENT)
);

const CONFIDENCE_LEVELS = [
  { confidence: 0.05, label: "5%" },
  { confidence: 0.50, label: "50%" },
  { confidence: 0.95, label: "95%" },
];

interface HashRateGaugeProps {
  hashRate: number;
}

export function HashRateGauge({ hashRate }: HashRateGaugeProps) {
  const { maybeRequiredBinaryZeroes } = useNetworkInfo();

  // Use logarithmic scale for better visualization of small hash rates
  const getLogScale = (value: number) => {
    // Add 1 to handle 0 hash rate
    const logValue = Math.log10(value + 1);
    const logMax = Math.log10(MAGNITUDE_RANGE.MAX_HASH_RATE + 1);
    return (logValue / logMax) * 100;
  };

  const percentage = Math.min(getLogScale(hashRate), 100);

  // Helper function to format hash rate without decimals
  const formatHashRateWithoutDecimals = (value: number) => {
    const formatted = formatHashRate(value);
    return formatted.replace(/\.00/g, '');
  };

  return (
    <Card className="p-6 glass-card">
      <h2 className="text-2xl font-bold mb-4">Hash Rate</h2>
      <div className="flex gap-6">
        <div className="text-sm text-gray-400 min-w-[300px]">
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
          {CONFIDENCE_LEVELS.map(({ confidence, label }) => (
            <div key={label} className="flex gap-2">
              <span>{label} chance of finding a block solution in {formatTime(calculateSecondsToFindBlock(hashRate, maybeRequiredBinaryZeroes, confidence))}</span>
            </div>
          ))}
        </div>

        <div className="flex-1">
          <div className="relative">
            <div className="relative h-8 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="absolute h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500 flex items-center justify-end pr-2"
                style={{ width: `${percentage}%` }}
              >
                {percentage > 5 && (
                  <span className="text-xs font-medium text-white relative z-10">
                    {formatHashRateWithoutDecimals(hashRate)}
                  </span>
                )}
              </div>
            </div>

            {/* Magnitude ticks */}
            <div className="relative h-8 mt-1">
              {MAGNITUDE_TICKS.map((value) => {
                if (value > MAGNITUDE_RANGE.MAX_HASH_RATE) return null;
                const tickPosition = getLogScale(value);
                return (
                  <div
                    key={value}
                    className="absolute -translate-x-1/2"
                    style={{ left: `${tickPosition}%` }}
                  >
                    <div className="h-2 w-px bg-gray-600" />
                    <div className="absolute text-xs text-gray-500 mt-1 rotate-45 origin-top-left whitespace-nowrap translate-x-2">
                      {formatHashRateWithoutDecimals(value)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reference labels */}
            <div className="relative h-16 mt-8">
              {MINER_REFERENCES.map((miner) => {
                const tickPosition = getLogScale(miner.hashRate);
                return (
                  <div
                    key={miner.name}
                    className="absolute -translate-x-1/2"
                    style={{ left: `${tickPosition}%` }}
                  >
                    <div className="h-2 w-0.5 bg-gray-400 mx-auto" />
                    <div className="text-xs text-gray-400 whitespace-nowrap mt-1 text-center">
                      {miner.name}
                      <span className="block hash-text">
                        ~ {formatHashRateWithoutDecimals(miner.hashRate)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
