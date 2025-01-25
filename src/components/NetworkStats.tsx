import { Card } from "@/components/ui/card";
import { NetworkStats as NetworkStatsType } from "@/types/mining";

interface NetworkStatsProps {
  stats: NetworkStatsType;
}

export function NetworkStats({ stats }: NetworkStatsProps) {
  return (
    <Card className="p-6 glass-card">
      <h2 className="text-2xl font-bold mb-4">Network Stats</h2>
      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-400">Block Height</label>
          <p className="text-xl font-mono">{stats.blockHeight.toLocaleString()}</p>
        </div>
        <div>
          <label className="text-sm text-gray-400">Network Difficulty</label>
          <p className="text-xl font-mono">{(stats.difficulty / 1e12).toFixed(2)} T</p>
        </div>
        <div>
          <label className="text-sm text-gray-400">Required Binary Zeroes</label>
          <p className="text-xl font-mono">{stats.requiredBinaryZeroes}</p>
        </div>
      </div>
    </Card>
  );
}