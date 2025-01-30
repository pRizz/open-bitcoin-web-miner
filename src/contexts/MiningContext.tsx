import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { MiningStats, NetworkStats, MiningMode } from "@/types/mining";
import { calculateLeadingZeroes, generateMockBlockHeader } from "@/utils/mining";
import { useMiningState } from "@/hooks/useMiningState";
import { WorkerPool } from "@/workers/WorkerPool";
import { useToast } from "@/hooks/use-toast";

interface GPUCapabilities {
  maxStorageBufferSize: string;
  maxWorkgroupsPerDimension: string;
  maxWorkgroupSize: {
    x: string;
    y: string;
    z: string;
  };
  maxInvocationsPerWorkgroup: string;
  maxTextureDimension2D: string;
  adapterInfo: string;
}

interface MiningContextType {
  miningStats: MiningStats;
  networkStats: NetworkStats;
  isMining: boolean;
  btcAddress: string;
  miningSpeed: number;
  threadCount: number;
  maxThreads: number;
  miningMode: MiningMode;
  gpuCapabilities?: GPUCapabilities;
  setBtcAddress: (address: string) => void;
  setMiningSpeed: (speed: number) => void;
  setThreadCount: (count: number) => void;
  setMiningMode: (mode: MiningMode) => void;
  startMining: () => void;
  stopMining: () => void;
  resetData: () => void;
}

const defaultContext: MiningContextType = {
  miningStats: {
    blockHeight: 0,
    difficulty: 0,
    requiredBinaryZeroes: 0,
  },
  networkStats: {
    blockHeight: 0,
    difficulty: 0,
    requiredBinaryZeroes: 0,
  },
  isMining: false,
  btcAddress: "",
  miningSpeed: 100,
  threadCount: 1,
  maxThreads: 1,
  miningMode: "cpu",
  setBtcAddress: () => {},
  setMiningSpeed: () => {},
  setThreadCount: () => {},
  setMiningMode: () => {},
  startMining: () => {},
  stopMining: () => {},
  resetData: () => {},
};

const MiningContext = createContext<MiningContextType>(defaultContext);

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
  const [gpuCapabilities, setGpuCapabilities] = useState<GPUCapabilities>();

  useEffect(() => {
    return () => {
      if (workerPool) {
        workerPool.stop();
        setWorkerPool(null);
        setIsMining(false);
        stopMiningStats();
      }
    };
  }, [workerPool]);

  useEffect(() => {
    if (navigator.hardwareConcurrency) {
      const cores = navigator.hardwareConcurrency;
      setMaxThreads(cores);
      setThreadCountState(Math.max(1, Math.floor(cores * 0.75))); // Changed from cores / 2 to cores * 0.75
    }
  }, []);

  const startMining = () => {
    if (workerPool) return;

    try {
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
          safeStopMining();
        },
        (capabilities) => {
          setGpuCapabilities(capabilities);
        }
      );

      setWorkerPool(pool);
      setIsMining(true);
      startMiningStats();

      pool.setMode(miningMode);
      pool.start(generateMockBlockHeader(), miningSpeed);
    } catch (error) {
      toast({
        title: "Failed to Start Mining",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      safeStopMining();
    }
  };

  const safeStopMining = () => {
    setWorkerPool((currentPool) => {
      if (currentPool) {
        currentPool.stop();
      }
      return null;
    });
    setIsMining(false);
    stopMiningStats();
  };

  const stopMining = safeStopMining;

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
      const timeoutId = setTimeout(() => {
        workerPool.setMode(miningMode);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [miningMode, workerPool]);

  const handleWorkerMessage = useCallback((e: MessageEvent) => {
    const { type, data } = e.data;
    
    switch (type) {
      case 'gpuCapabilities':
        setGpuCapabilities(data);
        break;
    }
  }, []);

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
        gpuCapabilities,
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
  if (!context) {
    throw new Error("useMining must be used within a MiningProvider");
  }
  return context;
}
