import React, { createContext, useContext, useState, useEffect } from "react";
import { MiningStats, NetworkStats } from "@/types/mining";
import { calculateLeadingZeroes, generateMockBlockHeader } from "@/utils/mining";
import { useMiningState } from "@/hooks/useMiningState";
import { WorkerPool } from "@/workers/WorkerPool";

interface MiningContextType {
  miningStats: MiningStats;
  networkStats: NetworkStats;
  isMining: boolean;
  btcAddress: string;
  miningSpeed: number;
  threadCount: number;
  maxThreads: number;
  setBtcAddress: (address: string) => void;
  setMiningSpeed: (speed: number) => void;
  setThreadCount: (count: number) => void;
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
  const [maxThreads, setMaxThreads] = useState(1);
  const [threadCount, setThreadCount] = useState(1);
  const [workerPool, setWorkerPool] = useState<WorkerPool | null>(null);

  // Detect CPU cores on mount
  useEffect(() => {
    if (navigator.hardwareConcurrency) {
      const cores = navigator.hardwareConcurrency;
      setMaxThreads(cores);
      setThreadCount(Math.max(1, Math.floor(cores / 2))); // Default to half available cores
    }
  }, []);

  const startMining = () => {
    if (workerPool) return;

    const pool = new WorkerPool(
      threadCount,
      (hashRate) => updateHashRate(hashRate),
      (data) => {
        const { binary, hex } = calculateLeadingZeroes(data.hash);
        const solution = {
          id: crypto.randomUUID(),
          ...data,
          binaryZeroes: binary,
          hexZeroes: hex,
        };
        updateMiningStats(solution, networkStats.requiredBinaryZeroes);
      }
    );

    setWorkerPool(pool);
    setIsMining(true);
    startMiningStats();

    pool.start(generateMockBlockHeader(), miningSpeed);
  };

  const stopMining = () => {
    if (workerPool) {
      workerPool.stop();
      setWorkerPool(null);
    }
    setIsMining(false);
    stopMiningStats();
  };

  // Update worker pool when mining speed changes
  React.useEffect(() => {
    if (workerPool) {
      workerPool.updateSpeed(miningSpeed);
    }
  }, [miningSpeed, workerPool]);

  return (
    <MiningContext.Provider
      value={{
        miningStats,
        networkStats,
        isMining,
        btcAddress,
        miningSpeed,
        threadCount,
        maxThreads,
        setBtcAddress,
        setMiningSpeed,
        setThreadCount,
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