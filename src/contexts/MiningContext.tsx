import React, { createContext, useContext, useState } from "react";
import { MiningMode } from "@/types/mining";
import { calculateLeadingZeroes } from "@/utils/mining";
import { useMiningState } from "@/hooks/useMiningState";
import { MiningContextType } from "./mining/types";
import { useWorkerPool } from "./mining/useWorkerPool";
import { useThreadCount } from "./mining/useThreadCount";

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
  const {
    miningStats,
    updateMiningStats,
    updateHashRate,
    resetStats,
    startMining: startMiningStats,
    stopMining: stopMiningStats,
  } = useMiningState();
  
  const [networkStats] = useState({
    blockHeight: 828848,
    difficulty: 75e12,
    requiredBinaryZeroes: 78,
  });
  
  const [isMining, setIsMining] = useState(false);
  const [btcAddress, setBtcAddress] = useState("");
  const [miningSpeed, setMiningSpeed] = useState(100);
  const [miningMode, setMiningMode] = useState<MiningMode>("cpu");

  const { maxThreads, threadCount, setThreadCount: setThreadCountState } = useThreadCount();

  const { gpuCapabilities, startMining: startWorkerPool, stopMining: stopWorkerPool, updateThreadCount } = useWorkerPool(
    threadCount,
    miningSpeed,
    miningMode,
    updateHashRate,
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

  const startMining = () => {
    startWorkerPool();
    setIsMining(true);
    startMiningStats();
  };

  const stopMining = () => {
    stopWorkerPool();
    setIsMining(false);
    stopMiningStats();
  };

  const setThreadCount = (count: number) => {
    updateThreadCount(count);
    setThreadCountState(count);
  };

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