import { useState } from "react";
import { MiningStats, HashSolution } from "@/types/mining";
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY = "bitcoin-mining-simulator";

export const useMiningState = () => {
  const { toast } = useToast();
  const [miningStats, setMiningStats] = useState<MiningStats>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {
      hashRate: 0,
      bestHashes: [],
      totalHashes: 0,
      startTime: null,
    };
  });

  const updateMiningStats = (solution: HashSolution, networkRequiredZeroes: number) => {
    setMiningStats(prev => {
      const currentBest = prev.bestHashes[0];
      
      if (!currentBest || solution.binaryZeroes > currentBest.binaryZeroes) {
        // Calculate time to find if mining has started
        const timeToFind = prev.startTime ? Date.now() - prev.startTime : 0;
        const solutionWithTime = { ...solution, timeToFind };

        const updatedHashes = [solutionWithTime, ...prev.bestHashes]
          .sort((a, b) => b.binaryZeroes - a.binaryZeroes)
          .slice(0, 100);

        if (solution.binaryZeroes >= networkRequiredZeroes) {
          toast({
            title: "Block Found!",
            description: `Found a hash with ${solution.binaryZeroes} leading binary zeroes!`,
            variant: "default",
          });
        }

        return {
          ...prev,
          bestHashes: updatedHashes,
          totalHashes: prev.totalHashes + 1,
        };
      }

      return {
        ...prev,
        totalHashes: prev.totalHashes + 1,
      };
    });
  };

  const updateHashRate = (hashRate: number) => {
    setMiningStats(prev => ({
      ...prev,
      hashRate,
    }));
  };

  const resetStats = () => {
    setMiningStats({
      hashRate: 0,
      bestHashes: [],
      totalHashes: 0,
      startTime: null,
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
      startTime: Date.now(),
    }));
  };

  const stopMining = () => {
    setMiningStats(prev => ({
      ...prev,
      hashRate: 0,
      startTime: null,
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