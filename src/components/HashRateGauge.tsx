import { Card } from "@/components/ui/card";
import { formatHashRate } from "@/utils/mining";

interface HashRateGaugeProps {
  hashRate: number;
}

export function HashRateGauge({ hashRate }: HashRateGaugeProps) {
  const maxHashRate = 100e12; // 100 TH/s (Antminer S21)
  const percentage = Math.min((hashRate / maxHashRate) * 100, 100);
  
  return (
    <Card className="p-6 glass-card">
      <h2 className="text-2xl font-bold mb-4">Hash Rate</h2>
      <div className="relative h-4 bg-gray-700 rounded-full overflow-hidden mb-2">
        <div
          className="absolute h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-sm text-gray-400">
        <span>{formatHashRate(hashRate)}</span>
        <span>{formatHashRate(maxHashRate)} (Antminer S21)</span>
      </div>
    </Card>
  );
}