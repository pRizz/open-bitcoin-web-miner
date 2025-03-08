import { Card } from "@/components/ui/card";
import { useMining } from "@/contexts/MiningContext";
import { GaugeBar } from "./GaugeBar";
import { HashRateScale } from "./HashRateScale";
import { ProbabilityInfo } from "./ProbabilityInfo";

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

  return (
    <Card className="p-6 glass-card">
      <h2 className="text-2xl font-bold mb-4">Hash Rate</h2>

      <div className="relative mb-16">
        <GaugeBar percentage={percentage} hashRate={hashRate} />
        <HashRateScale maxHashRate={maxHashRate} minerReferences={MINER_REFERENCES} />
      </div>

      <div className="mt-8">
        <ProbabilityInfo hashRate={hashRate} networkStats={networkStats} />
      </div>
    </Card>
  );
}