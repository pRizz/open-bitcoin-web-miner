import { Card } from "@/components/ui/card";
import { formatHashRate } from "@/utils/mining";
import { useMining } from "@/contexts/MiningContext";
import { ParticleEffect } from "./ParticleEffect";
import { ProbabilityInfo } from "./ProbabilityInfo";
import { HashRateScale } from "./HashRateScale";

const MINER_REFERENCES = [
  { hashRate: 1e12, name: "Bitaxe" },        // 1 TH/s
  { hashRate: 100e12, name: "Antminer S21" }, // 100 TH/s
];

interface HashRateGaugeProps {
  hashRate: number;
}

export function HashRateGauge({ hashRate }: HashRateGaugeProps) {
  const { networkStats } = useMining();
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
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-2xl font-bold">Hash Rate</h2>
        <ProbabilityInfo hashRate={hashRate} networkStats={networkStats} />
      </div>
      
      <div className="relative">
        <div className="relative h-8 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="absolute h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500 flex items-center justify-end pr-2"
            style={{ width: `${percentage}%` }}
          >
            <ParticleEffect />
            {percentage > 5 && (
              <span className="text-sm md:text-base lg:text-lg font-medium text-white relative z-10">
                {formatHashRateWithoutDecimals(hashRate)}
              </span>
            )}
          </div>
        </div>

        <HashRateScale maxHashRate={maxHashRate} minerReferences={MINER_REFERENCES} />
      </div>
    </Card>
  );
}