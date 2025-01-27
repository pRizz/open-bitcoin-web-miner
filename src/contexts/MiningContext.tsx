import React, { createContext, useContext, useState } from "react";
import { MiningStats, NetworkStats } from "@/types/mining";
import { calculateLeadingZeroes, generateMockBlockHeader } from "@/utils/mining";
import { useMiningState } from "@/hooks/useMiningState";

interface MiningContextType {
  miningStats: MiningStats;
  networkStats: NetworkStats;
  isMining: boolean;
  btcAddress: string;
  miningSpeed: number;
  setBtcAddress: (address: string) => void;
  setMiningSpeed: (speed: number) => void;
  startMining: () => void;
  stopMining: () => void;
  resetData: () => void;
}

const MiningContext = createContext<MiningContextType | undefined>(undefined);

export function MiningProvider({ children }: { children: React.ReactNode }) {
  const {
    miningStats,
    updateMiningStats,
    updateHashRate,
    resetStats,
    startMining: startMiningStats,
    stopMining: stopMiningStats,
  } = useMiningState();
  
  const [networkStats] = useState<NetworkStats>({
    blockHeight: 828848,
    difficulty: 75e12,
    requiredBinaryZeroes: 78,
  });
  
  const [isMining, setIsMining] = useState(false);
  const [btcAddress, setBtcAddress] = useState("");
  const [miningSpeed, setMiningSpeed] = useState(100);
  const [worker, setWorker] = useState<Worker | null>(null);

  const startMining = () => {
    if (worker) return;

    const newWorker = new Worker(new URL('../workers/miningWorker.ts', import.meta.url), {
      type: 'module'
    });

    newWorker.onmessage = (e) => {
      const { type, data } = e.data;
      
      if (type === 'hash') {
        const { binary, hex } = calculateLeadingZeroes(data.hash);
        const solution = {
          id: crypto.randomUUID(),
          ...data,
          binaryZeroes: binary,
          hexZeroes: hex,
        };

        updateMiningStats(solution, networkStats.requiredBinaryZeroes);
      } else if (type === 'hashRate') {
        updateHashRate(data);
      }
    };

    setWorker(newWorker);
    setIsMining(true);
    startMiningStats();

    newWorker.postMessage({
      type: 'start',
      blockHeader: generateMockBlockHeader(),
      miningSpeed,
    });
  };

  const stopMining = () => {
    if (worker) {
      worker.terminate();
      setWorker(null);
    }
    setIsMining(false);
    stopMiningStats();
  };

  // Update worker when mining speed changes
  React.useEffect(() => {
    if (worker) {
      worker.postMessage({
        type: 'updateSpeed',
        miningSpeed,
      });
    }
  }, [miningSpeed, worker]);

  return (
    <MiningContext.Provider
      value={{
        miningStats,
        networkStats,
        isMining,
        btcAddress,
        miningSpeed,
        setBtcAddress,
        setMiningSpeed,
        startMining,
        stopMining,
        resetData: resetStats,
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