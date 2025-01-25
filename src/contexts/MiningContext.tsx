import React, { createContext, useContext, useEffect, useState } from "react";
import { MiningStats, HashSolution, NetworkStats } from "@/types/mining";
import { useToast } from "@/hooks/use-toast";
import { calculateLeadingZeroes, generateMockBlockHeader } from "@/utils/mining";

interface MiningContextType {
  miningStats: MiningStats;
  networkStats: NetworkStats;
  isMining: boolean;
  btcAddress: string;
  setBtcAddress: (address: string) => void;
  startMining: () => void;
  stopMining: () => void;
  resetData: () => void;
}

const MiningContext = createContext<MiningContextType | undefined>(undefined);

const STORAGE_KEY = "bitcoin-mining-simulator";

export function MiningProvider({ children }: { children: React.ReactNode }) {
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
  
  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    blockHeight: 828848,
    difficulty: 75e12,
    requiredBinaryZeroes: 144,
  });
  
  const [isMining, setIsMining] = useState(false);
  const [btcAddress, setBtcAddress] = useState("");
  const [worker, setWorker] = useState<Worker | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(miningStats));
  }, [miningStats]);

  const startMining = () => {
    if (worker) return;

    const newWorker = new Worker(new URL('../workers/miningWorker.ts', import.meta.url), {
      type: 'module'
    });

    newWorker.onmessage = (e) => {
      const { type, data } = e.data;
      
      if (type === 'hash') {
        const { binary, hex } = calculateLeadingZeroes(data.hash);
        const solution: HashSolution = {
          id: crypto.randomUUID(),
          ...data,
          binaryZeroes: binary,
          hexZeroes: hex,
        };

        setMiningStats(prev => ({
          ...prev,
          bestHashes: [...prev.bestHashes, solution].sort((a, b) => b.binaryZeroes - a.binaryZeroes).slice(0, 100),
          totalHashes: prev.totalHashes + 1,
        }));

        if (binary >= networkStats.requiredBinaryZeroes) {
          toast({
            title: "Block Found!",
            description: `Found a hash with ${binary} leading binary zeroes!`,
            variant: "default",
          });
        }
      } else if (type === 'hashRate') {
        setMiningStats(prev => ({
          ...prev,
          hashRate: data,
        }));
      }
    };

    setWorker(newWorker);
    setIsMining(true);
    setMiningStats(prev => ({
      ...prev,
      startTime: Date.now(),
    }));

    newWorker.postMessage({
      type: 'start',
      blockHeader: generateMockBlockHeader(),
    });
  };

  const stopMining = () => {
    if (worker) {
      worker.terminate();
      setWorker(null);
    }
    setIsMining(false);
    setMiningStats(prev => ({
      ...prev,
      hashRate: 0,
      startTime: null,
    }));
  };

  const resetData = () => {
    stopMining();
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

  return (
    <MiningContext.Provider
      value={{
        miningStats,
        networkStats,
        isMining,
        btcAddress,
        setBtcAddress,
        startMining,
        stopMining,
        resetData,
      }}
    >
      {children}
    </MiningContext.Provider>
  );
}

export function useMining() {
  const context = useContext(MiningContext);
  if (context === undefined) {
    throw new Error("useMining must be used within a MiningProvider");
  }
  return context;
}