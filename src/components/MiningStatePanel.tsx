import { Card } from "@/components/ui/card";
import { useMining } from "@/contexts/MiningContext";
import { useMinerInfo } from "@/contexts/mining/MinerInfoContext";
import { useNetworkInfo } from "@/contexts/NetworkInfoContext";
import { cn } from "@/lib/utils";
import { Database, Computer } from "lucide-react";

const StatusIndicator = ({ isConnected }: { isConnected: boolean }) => (
  <div className="flex items-center gap-2">
    <div
      className={cn(
        "w-3 h-3 rounded-full",
        isConnected ? "bg-green-500" : "bg-red-500"
      )}
    />
    <span className="text-sm">{isConnected ? "Connected" : "Disconnected"}</span>
  </div>
);

const ArrowPair = () => (
  <div className="relative w-24 h-6 mx-auto flex justify-between items-center">
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-muted-foreground"
    >
      {/* Down arrow */}
      <path
        d="M12 4L12 20M12 20L8 16M12 20L16 16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-muted-foreground"
    >
      {/* Up arrow */}
      <path
        d="M12 20L12 4M12 4L8 8M12 4L16 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

const BitcoinIcon = () => (
  <img 
    src="/Bitcoin.svg" 
    alt="Bitcoin" 
    className="w-8 h-8"
  />
);

export const MiningStatePanel = () => {
  const { miningStats, isMining } = useMining();
  const { maybeMinerAddress } = useMinerInfo();
  const { maybeBlockHeight, maybeNetworkDifficulty, maybeRequiredBinaryZeroes } = useNetworkInfo();

  return (
    <Card className="p-6 glass-card">
      <h2 className="text-2xl font-bold mb-4">Mining State</h2>
      
      {/* Bitcoin Network Section */}
      <div className="mb-2 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <BitcoinIcon />
          The Bitcoin Network
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Current Block Height:</span>
            <span>{maybeBlockHeight || "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Network Difficulty:</span>
            <span>{maybeNetworkDifficulty || "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Required Binary Zeroes:</span>
            <span>{maybeRequiredBinaryZeroes || "N/A"}</span>
          </div>
        </div>
      </div>

      {/* Arrow pair between Bitcoin Network and Mining Backend */}
      <div className="mb-2">
        <ArrowPair />
      </div>

      {/* Mining Backend Section */}
      <div className="mb-2 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Database className="w-8 h-8 text-muted-foreground" />
          Mining Backend
        </h3>
        <StatusIndicator isConnected={true} />
      </div>

      {/* Arrow pair between Mining Backend and Web Miner */}
      <div className="mb-2">
        <ArrowPair />
      </div>

      {/* Web Miner Section */}
      <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Computer className="w-8 h-8 text-muted-foreground" />
          Web Miner
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status:</span>
            <span>{isMining ? "Active" : "Inactive"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Miner Address:</span>
            <span className="font-mono text-xs">{maybeMinerAddress || "Not Set"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Hash Rate:</span>
            <span>{miningStats.maybeHashRate || "0"} H/s</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Hashes:</span>
            <span>{miningStats.maybeTotalHashes || "0"}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}; 