import { Card } from "@/components/ui/card";
import { formatHashRate } from "@/utils/mining";

interface MinerReference {
  hashRate: number;
  name: string;
}

const MINER_REFERENCES: MinerReference[] = [
  { hashRate: 1e12, name: "Bitaxe" },        // 1 TH/s
  { hashRate: 100e12, name: "Antminer S21" }, // 100 TH/s
];

// Generate magnitude ticks from 1 H/s to 100 TH/s
const MAGNITUDE_TICKS = Array.from({ length: 15 }, (_, i) => Math.pow(10, i));

interface HashRateGaugeProps {
  hashRate: number;
}

export function HashRateGauge({ hashRate }: HashRateGaugeProps) {
  const maxHashRate = 100e12; // 100 TH/s (Antminer S21)
  
  // Use logarithmic scale for better visualization of small hash rates
  const getLogScale = (value: number) => {
    // Add 1 to handle 0 hash rate
    const logValue = Math.log10(value + 1);
    const logMax = Math.log10(maxHashRate + 1);
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
      <div className="relative">
        {/* Main gauge */}
        <div className="relative h-8 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="absolute h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500 flex items-center justify-end pr-2"
            style={{ width: `${percentage}%` }}
          >
            {percentage > 5 && (
              <span className="text-xs font-medium text-white">
                {formatHashRateWithoutDecimals(hashRate)}
              </span>
            )}
          </div>
        </div>

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
          {MINER_REFERENCES.map((miner, index) => {
            const tickPosition = getLogScale(miner.hashRate);
            // Alternate between two heights to prevent overlap
            const topOffset = index % 2 === 0 ? "top-0" : "top-8";
            return (
              <div
                key={miner.name}
                className={`absolute -translate-x-1/2 ${topOffset}`}
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
      </div>
      
      <div className="flex justify-between text-sm text-gray-400 mt-2">
        <span>{formatHashRateWithoutDecimals(hashRate)}</span>
        <span>{formatHashRateWithoutDecimals(maxHashRate)} (Max)</span>
      </div>
    </Card>
  );
}