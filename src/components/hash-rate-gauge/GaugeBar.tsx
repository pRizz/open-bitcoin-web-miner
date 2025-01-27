import { formatHashRate } from "@/utils/mining";

interface GaugeBarProps {
  percentage: number;
  hashRate: number;
}

// Helper function to format hash rate without decimals
const formatHashRateWithoutDecimals = (value: number) => {
  const formatted = formatHashRate(value);
  return formatted.replace(/\.00/g, '');
};

export function GaugeBar({ percentage, hashRate }: GaugeBarProps) {
  return (
    <div className="relative h-8 bg-gray-700 rounded-full overflow-hidden">
      <div
        className="absolute h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500 flex items-center justify-end pr-2"
        style={{ width: `${percentage}%` }}
      >
        {percentage > 5 && (
          <span className="text-sm md:text-base lg:text-lg font-medium text-white relative z-10">
            {formatHashRateWithoutDecimals(hashRate)}
          </span>
        )}
      </div>
    </div>
  );
}