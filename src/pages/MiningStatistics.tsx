import { Card } from "@/components/ui/card";
import { useMining } from "@/contexts/MiningContext";
import { useMinerInfo } from "@/contexts/mining/MinerInfoContext";
import { useNetworkInfo } from "@/contexts/NetworkInfoContext";
import { formatHashRateWithShortSIUnits } from "@/utils/mining";
import { formatLargeNumber } from "@/utils/formatters";
import { Database, Target, Binary, CheckCircle2, XCircle, Activity } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";

export default function MiningStatisticsPage() {
  const { miningStats } = useMining();
  const { maybeMinerAddress } = useMinerInfo();
  const { maybeBlockHeight } = useNetworkInfo();

  return (
    <PageTransition>
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Mining Statistics</h1>
          <p className="text-muted-foreground">Real-time mining activity and performance metrics</p>
        </div>

        {/* Mining Activity Overview */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 text-center flex items-center justify-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Mining Activity
          </h2>

          <div className="space-y-4">
            {maybeMinerAddress && (
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Miner Address:</span>
                <div className="font-mono text-xs break-all bg-muted p-2 rounded">
                  {maybeMinerAddress}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Block Height:</span>
              <span className="font-medium">{maybeBlockHeight || "Not available"}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Hash Rate:</span>
              <span className="font-medium text-green-500">
                {formatHashRateWithShortSIUnits(miningStats.maybeHashRate)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Cumulative Hashes:</span>
              <span className="font-medium">{formatLargeNumber(miningStats.cumulativeHashes)}</span>
            </div>
          </div>
        </Card>

        {/* Solutions Statistics */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 text-center flex items-center justify-center gap-2">
            <Binary className="w-5 h-5 text-purple-500" />
            Solutions Found
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Binary className="w-4 h-4 text-purple-500" />
                Total Solutions
              </span>
              <span className="font-medium">{miningStats.maybeTotalSolutions || "0"}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Accepted
              </span>
              <span className="font-medium text-green-500">{miningStats.acceptedSolutions || "0"}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                Rejected
              </span>
              <span className="font-medium text-red-500">{miningStats.rejectedSolutions || "0"}</span>
            </div>
          </div>
        </Card>

        {/* Network Difficulty */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 text-center flex items-center justify-center gap-2">
            <Target className="w-5 h-5 text-yellow-500" />
            Mining Pool Difficulty
          </h2>

          <div className="space-y-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Required Leading Binary Zeros</p>
              <p className="text-2xl font-bold text-yellow-500">
                {miningStats.maybeRequiredBinaryZeroes || "Not available"}
              </p>
            </div>

            {/* TODO: use higher units like septillion, etc., like on the main mining page */}
            {miningStats.maybeRequiredBinaryZeroes && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Odds of Finding a Share</p>
                <p className="text-lg font-mono">
                  1 in {Math.pow(2, miningStats.maybeRequiredBinaryZeroes).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}