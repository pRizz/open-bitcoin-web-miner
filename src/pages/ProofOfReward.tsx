import { Card } from "@/components/ui/card";
import { useMining } from "@/contexts/MiningContext";
import { useMinerInfo } from "@/contexts/mining/MinerInfoContext";
import { useNetworkInfo } from "@/contexts/NetworkInfoContext";
import { formatHashRate } from "@/utils/mining";
import { formatLargeNumber } from "@/utils/formatters";
import { Database, Target, Binary, CheckCircle2, XCircle } from "lucide-react";

export default function ProofOfRewardPage() {
  const { miningStats } = useMining();
  const { maybeMinerAddress } = useMinerInfo();
  const { maybeBlockHeight } = useNetworkInfo();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Proof of Reward</h1>
      
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Mining Activity</h2>
        
        <div className="space-y-4">
          {maybeMinerAddress && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Miner Address:</span>
              <span className="font-mono">{maybeMinerAddress}</span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Current Block Height:</span>
            <span>{maybeBlockHeight || "Not available"}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Hash Rate:</span>
            <span>{formatHashRate(miningStats.maybeHashRate)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Cumulative Hashes:</span>
            <span>{formatLargeNumber(miningStats.cumulativeHashes)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-2">
              <Binary className="w-4 h-4 text-purple-500" />
              Total Solutions
            </span>
            <span>{miningStats.maybeTotalSolutions || "0"}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Accepted Solutions
            </span>
            <span>{miningStats.acceptedSolutions || "0"}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              Rejected Solutions
            </span>
            <span>{miningStats.rejectedSolutions || "0"}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-2">
              <Target className="w-4 h-4 text-yellow-500" />
              Required Leading Binary Zeros
            </span>
            <span>{miningStats.maybeRequiredBinaryZeroes || "Not available"}</span>
          </div>
        </div>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Block Rewards</h3>
          <p className="text-muted-foreground">
            Block rewards information will be available once the backend supports providing full block data.
          </p>
        </div>
      </Card>
    </div>
  );
} 