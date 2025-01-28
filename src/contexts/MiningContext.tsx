import React, { createContext, useContext, useState, useEffect } from "react";
import { MiningStats, NetworkStats, MiningMode } from "@/types/mining";
import { calculateLeadingZeroes, generateMockBlockHeader } from "@/utils/mining";
import { useMiningState } from "@/hooks/useMiningState";
import { WorkerPool } from "@/workers/WorkerPool";
import { useToast } from "@/hooks/use-toast";

interface MiningContextType {
  miningStats: MiningStats;
  networkStats: NetworkStats;
  isMining: boolean;
  btcAddress: string;
  miningSpeed: number;
  threadCount: number;
  maxThreads: number;
  miningMode: MiningMode;
  setBtcAddress: (address: string) => void;
  setMiningSpeed: (speed: number) => void;
  setThreadCount: (count: number) => void;
  setMiningMode: (mode: MiningMode) => void;
  startMining: () => void;
  stopMining: () => void;
  resetData: () => void;
}

const MiningContext = createContext<MiningContextType | undefined>(undefined);

export function MiningProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
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
  const [threadCountState, setThreadCountState] = useState(1);
  const [miningMode, setMiningMode] = useState<MiningMode>("cpu");
  const [workerPool, setWorkerPool] = useState<WorkerPool | null>(null);

  useEffect(() => {
    if (navigator.hardwareConcurrency) {
      const cores = navigator.hardwareConcurrency;
      setMaxThreads(cores);
      setThreadCountState(Math.max(1, Math.floor(cores / 2)));
    }
  }, []);

  const startMining = () => {
    if (workerPool) return;

    const pool = new WorkerPool(
      threadCountState,
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
      },
      (error) => {
        toast({
          title: "Mining Error",
          description: error,
          variant: "destructive",
        });
        stopMining();
      }
    );

    setWorkerPool(pool);
    setIsMining(true);
    startMiningStats();

    pool.setMode(miningMode);
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

  const setThreadCount = (count: number) => {
    if (workerPool) {
      workerPool.updateThreadCount(count);
    }
    setThreadCountState(count);
  };

  useEffect(() => {
    if (workerPool) {
      workerPool.updateSpeed(miningSpeed);
    }
  }, [miningSpeed, workerPool]);

  useEffect(() => {
    if (workerPool) {
      workerPool.setMode(miningMode);
    }
  }, [miningMode, workerPool]);

  return (
    <MiningContext.Provider
      value={{
        miningStats,
        networkStats,
        isMining,
        btcAddress,
        miningSpeed,
        threadCount: threadCountState,
        maxThreads,
        miningMode,
        setBtcAddress,
        setMiningSpeed,
        setThreadCount,
        setMiningMode,
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