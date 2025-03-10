import { useState } from "react";
import { MiningStats, HashSolution } from "@/types/mining";
import { useToast } from "@/hooks/use-toast";
import { useNetworkInfo } from "@/contexts/NetworkInfoContext";
const STORAGE_KEY = "bitcoin-mining-simulator";

export const useMiningState = () => {
  console.log("useMiningState called");
  const { toast } = useToast();
  const { maybeRequiredBinaryZeroes } = useNetworkInfo();
  const [miningStats, setMiningStats] = useState<MiningStats>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {
      maybeHashRate: 0,
      maybeBestHashes: [],
      maybeTotalHashes: 0,
      maybeStartTime: null,
    };
  });

  const updateMiningStats = (solution: HashSolution) => {
    setMiningStats(prev => {
      const currentBest = prev.maybeBestHashes[0];

      if (!currentBest || solution.binaryZeroes > currentBest.binaryZeroes) {
        // Calculate time to find if mining has started
        const timeToFind = prev.maybeStartTime ? Date.now() - prev.maybeStartTime : 0;
        const solutionWithTime = { ...solution, timeToFind };

        const updatedHashes = [solutionWithTime, ...prev.maybeBestHashes]
          .sort((a, b) => b.binaryZeroes - a.binaryZeroes)
          .slice(0, 100);

        if (solution.binaryZeroes >= maybeRequiredBinaryZeroes) {
          toast({
            title: "Block Found!",
            description: `Found a hash with ${solution.binaryZeroes} leading binary zeroes!`,
            variant: "default",
          });
        }

        return {
          ...prev,
          maybeBestHashes: updatedHashes,
          maybeTotalHashes: prev.maybeTotalHashes + 1,
        };
      }

      return {
        ...prev,
        maybeTotalHashes: prev.maybeTotalHashes + 1,
      };
    });
  };

  const updateHashRate = (hashRate: number) => {
    setMiningStats(prev => ({
      ...prev,
      maybeHashRate: hashRate,
    }));
  };

  const resetStats = () => {
    setMiningStats({
      maybeHashRate: 0,
      maybeBestHashes: [],
      maybeTotalHashes: 0,
      maybeStartTime: null,
    });
    localStorage.removeItem(STORAGE_KEY);
    toast({
      title: "Data Reset",
      description: "All mining data has been cleared.",
      variant: "default",
    });
  };

  const startMining = () => {
    setMiningStats(prev => ({
      ...prev,
      maybeStartTime: Date.now(),
    }));
  };

  const stopMining = () => {
    setMiningStats(prev => ({
      ...prev,
      maybeHashRate: 0,
      maybeStartTime: null,
    }));
  };

  return {
    miningStats,
    updateMiningStats,
    updateHashRate,
    resetStats,
    startMining,
    stopMining,
  };
};