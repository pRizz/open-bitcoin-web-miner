import { formatHashRateWithShortSIUnits } from "@/utils/mining";

interface MinerReference {
  hashRate: number;
  name: string;
}

interface HashRateScaleProps {
  maxHashRate: number;
  minerReferences: MinerReference[];
}

// Generate magnitude ticks from 1 H/s to 100 TH/s
const MAGNITUDE_TICKS = Array.from({ length: 15 }, (_, i) => Math.pow(10, i));

// Helper function to format hash rate without decimals
const formatHashRateWithoutDecimals = (value: number) => {
  const formatted = formatHashRateWithShortSIUnits(value);
  return formatted.replace(/\.00/g, '');
};

export function HashRateScale({ maxHashRate, minerReferences }: HashRateScaleProps) {
  const getLogScale = (value: number) => {
    const logValue = Math.log10(value + 1);
    const logMax = Math.log10(maxHashRate + 1);
    return (logValue / logMax) * 100;
  };

  return (
    <>
      {/* Magnitude ticks */}
      <div className="relative h-8 mt-1">
        {MAGNITUDE_TICKS.map((value) => {
          if (value > maxHashRate) return null;
          const tickPosition = getLogScale(value);
          return (
            <div
              key={value}
              className="absolute -translate-x-1/2"
              style={{ left: `${tickPosition}%` }}
            >
              <div className="h-2 w-px bg-gray-600" />
              <div className="text-[10px] text-gray-500 mt-1 rotate-45 origin-top-left whitespace-nowrap">
                {formatHashRateWithoutDecimals(value)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reference labels */}
      <div className="relative h-16 mt-4">
        {minerReferences.map((miner) => {
          const tickPosition = getLogScale(miner.hashRate);
          return (
            <div
              key={miner.name}
              className="absolute -translate-x-1/2 top-0"
              style={{ left: `${tickPosition}%` }}
            >
              <div className="h-2 w-0.5 bg-gray-400 mx-auto" />
              <div className="text-xs text-gray-400 whitespace-nowrap mt-1">
                {miner.name}
                <span className="block hash-text">
                  {formatHashRateWithoutDecimals(miner.hashRate)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}