import { Card } from "@/components/ui/card";
import { formatHashRateWithShortSIUnits, calculateSecondsToFindBlock, formatTime, formatHashRateWithNumericUnits, formatHashRateWithLongSIUnits } from "@/utils/mining";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { HelpCircle } from "lucide-react";
import { useNetworkInfo } from "@/contexts/NetworkInfoContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMining } from "@/contexts/MiningContext";
import { useEffect, useState } from "react";

interface MinerReference {
  hashRate: number;
  name: string;
  maybeLink?: string;
}

const MINER_REFERENCES: MinerReference[] = [
  { hashRate: 1e12, name: "Bitaxe", maybeLink: "https://bitaxe.org/" },        // 1 TH/s
  { hashRate: 100e12, name: "Antminer S21" }, // 100 TH/s
  { hashRate: 6e18, name: "OCEAN", maybeLink: "https://www.ocean.xyz/" }, // 6 EH/s
];

// Calculate number of orders of magnitude from 1 H/s (10^0) to 1 PH/s (10^15)
const MAGNITUDE_RANGE = {
  MIN_EXPONENT: 3,  // 1 kH/s
  MAX_EXPONENT: 20, // 100 EH/s
};

const MAX_HASH_RATE = Math.pow(10, MAGNITUDE_RANGE.MAX_EXPONENT);

// Generate magnitude ticks from MIN_EXPONENT to MAX_EXPONENT
const MAGNITUDE_TICKS = Array.from(
  { length: MAGNITUDE_RANGE.MAX_EXPONENT - MAGNITUDE_RANGE.MIN_EXPONENT + 1 },
  (_, i) => Math.pow(10, i + MAGNITUDE_RANGE.MIN_EXPONENT)
);

// Generate proportional ticks for numbers 1-9 in each order of magnitude
const PROPORTIONAL_TICKS = MAGNITUDE_TICKS.flatMap(magnitude => {
  return [2, 3, 4, 5, 6, 7, 8, 9].map(n => magnitude * n);
});

// Combine and sort all ticks
const ALL_TICKS = [...MAGNITUDE_TICKS, ...PROPORTIONAL_TICKS].sort((a, b) => a - b);

const CONFIDENCE_LEVELS = [
  { confidence: 0.01, label: "1%" },
  { confidence: 0.1, label: "10%" },
  { confidence: 0.50, label: "50%" },
  { confidence: 0.90, label: "90%" },
  { confidence: 0.99, label: "99%" },
];

export function HashRateGauge() {
  const { maybeNetworkRequiredLeadingZeroes: maybeRequiredBinaryZeroes } = useNetworkInfo();
  const { miningStats } = useMining();
  const { maybeHashRate } = miningStats;

  // Responsive breakpoint for medium tablets (1024px)
  const [isMediumTabletOrSmaller, setIsMediumTabletOrSmaller] = useState(false);

  useEffect(() => {
    const checkViewportSize = () => {
      // console.log("viewport width changed to", window.innerWidth);
      setIsMediumTabletOrSmaller(window.innerWidth <= 1024);
    };

    checkViewportSize();
    window.addEventListener('resize', checkViewportSize);
    return () => window.removeEventListener('resize', checkViewportSize);
  }, []);

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

  // Use logarithmic scale for better visualization of small hash rates
  const getLogScale = (value: number) => {
    // Add 1 to handle 0 hash rate
    const logValue = Math.log10(value + 1);
    const logMin = MAGNITUDE_RANGE.MIN_EXPONENT - 1;
    const logMax = MAGNITUDE_RANGE.MAX_EXPONENT + 1;
    const percentage = ((logValue - logMin) / (logMax - logMin)) * 100;
    return Math.max(0, Math.min(100, percentage));
  };

  const maybePercentage = Math.min(getLogScale(maybeHashRate), 100);

  // Helper function to format hash rate without decimals
  const formatHashRateWithoutDecimals = (value: number) => {
    const formatted = formatHashRateWithShortSIUnits(value);
    return formatted.replace(/\.00/g, '');
  };

  const formatHashRateWithLongSIAndNumericUnitsWithoutDecimals = (value: number) => {
    let formatted_programmer_units = formatHashRateWithLongSIUnits(value);
    formatted_programmer_units = formatted_programmer_units.replace(/\.00/g, '');
    let formatted_numeric_units = formatHashRateWithNumericUnits(value);
    formatted_numeric_units = formatted_numeric_units.replace(/\.00/g, '');
    return `${formatted_programmer_units} (${formatted_numeric_units})`;
  };

  return (
    <Card className="p-6 glass-card">
      <div className="flex gap-6">
        <div className="flex-1 basis-1/3">
          <h2 className="text-2xl font-bold mb-4">Hash Rate</h2>
          <div className="text-sm text-gray-400 basis-7/24 shrink-0">
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
                        <li>Hash Rate: {formatNumber(exampleHashRate)} H/s</li>
                        <li>Required Zeroes: {exampleRequiredZeroes}</li>
                        <li>Confidence Level: {formatNumber(exampleConfidence * 100)}%</li>
                      </ul>
                      <p>Then:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>λ = {formatNumber(exampleHashRate)} / 2^{exampleRequiredZeroes} = {formatNumber(exampleHashRate)} / {formatNumber(Math.pow(2, exampleRequiredZeroes))} ≈ {formatNumber(exampleLambda)} solutions/second</li>
                        <li>t = -ln(1 - {formatNumber(exampleConfidence)}) / {formatNumber(exampleLambda)}</li>
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
            {maybeHashRate && CONFIDENCE_LEVELS.map(({ confidence, label }) => (
              <div key={label} className="flex gap-2">
                <span className="text-gray-500">•</span>
                <span>{label} chance in {formatTime(calculateSecondsToFindBlock(maybeHashRate, maybeRequiredBinaryZeroes, confidence))}</span>
              </div>
            )) || <span className="text-gray-500">• Start mining to see your chances of finding a block solution</span>}
          </div>
        </div>

        {!isMediumTabletOrSmaller && (
          <div className="flex-1 basis-2/3 px-10">
            <div className="relative">
              {/* Reference labels - moved above the gauge */}
              <div className="relative h-16">
                {MINER_REFERENCES.map((miner) => {
                  const tickPosition = getLogScale(miner.hashRate);
                  return (
                    <div
                      key={miner.name}
                      className="absolute -translate-x-1/2"
                      style={{ left: `${tickPosition}%` }}
                    >
                      <div className="text-xs text-gray-400 whitespace-nowrap text-center mb-1">
                        {miner.maybeLink ? (
                          <a className="text-blue-500 hover:text-blue-600 underline" href={miner.maybeLink} target="_blank" rel="noopener">
                            {miner.name}
                          </a>
                        ) : (
                          miner.name
                        )}
                        <span className="block hash-text">
                          ~{formatHashRateWithoutDecimals(miner.hashRate)}
                        </span>
                      </div>
                      <div className="h-2 w-0.5 bg-gray-400 mx-auto" />
                    </div>
                  );
                })}
              </div>

              <div className="relative h-8 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="absolute h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500 flex items-center justify-end pr-2"
                  style={{ width: `${maybePercentage || 0}%` }}
                >
                  {(maybePercentage || 0) > 5 && (
                    <span className="text-xs font-medium text-white relative z-10">
                      {formatHashRateWithoutDecimals(maybeHashRate)}
                    </span>
                  )}
                </div>
              </div>

              {/* Magnitude ticks */}
              <div className="relative h-8 mt-1 mb-8">
                {ALL_TICKS.map((value) => {
                  if (value > MAX_HASH_RATE) return null;
                  const tickPosition = getLogScale(value);
                  const isMainTick = MAGNITUDE_TICKS.includes(value);
                  return (
                    <TooltipProvider key={value}>
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <div
                            className="absolute -translate-x-1/2"
                            style={{ left: `${tickPosition}%` }}
                          >
                            <div className={`h-${isMainTick ? '4' : '2'} w-px bg-gray-600`} />
                            <div className={`absolute ${isMainTick ? 'text-xs' : 'hidden'} text-gray-500 mt-1 rotate-45 origin-top-left whitespace-nowrap translate-x-2`}>
                              {formatHashRateWithoutDecimals(value)}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" align="center">
                          {formatHashRateWithLongSIAndNumericUnitsWithoutDecimals(value)}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
