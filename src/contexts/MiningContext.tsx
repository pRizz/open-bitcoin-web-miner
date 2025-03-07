import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { MiningMode } from "@/types/mining";
import { calculateLeadingZeroes, calculateRequiredBinaryZeroes } from "@/utils/mining";
import { useMiningState } from "@/hooks/useMiningState";
import { MiningContextType } from "./mining/types";
import { useWorkerPool } from "./mining/useWorkerPool";
import { useThreadCount } from "./mining/useThreadCount";
import { useDebug } from "./DebugContext";
import { useGRPC } from "./GRPCContext";
import API_CONFIG from "@/config/api";

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
  const { addLog } = useDebug();
  const { getNetworkInfo } = useGRPC();
  const websocketRef = useRef<WebSocket | null>(null);

  const {
    miningStats,
    updateMiningStats,
    updateHashRate,
    resetStats,
    startMining: startMiningStats,
    stopMining: stopMiningStats,
  } = useMiningState();

  const [networkStats, setNetworkStats] = useState({
    blockHeight: 0,
    difficulty: 0,
    requiredBinaryZeroes: 0,
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

  const connectWebSocket = () => {
    const wsProtocol = API_CONFIG.baseUrl.startsWith('https') ? 'wss' : 'ws';
    const wsUrl = `${wsProtocol}://${API_CONFIG.baseUrl.split('://')[1]}/mining-work`;

    console.log(`Connecting to WebSocket: ${wsUrl}`);

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connection established');
      addLog('WebSocket connection established');
    };

    ws.onmessage = (event) => {
      console.log('WebSocket message received:', event.data);
      addLog(`WebSocket message: ${event.data}`);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      addLog(`WebSocket error occurred`);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
      addLog('WebSocket connection closed');
    };

    websocketRef.current = ws;
  };

  const disconnectWebSocket = () => {
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
  };

  useEffect(() => {
    const updateNetworkInfo = async () => {
      try {
        const info = await getNetworkInfo();
        if (info?.blockHeight && info?.networkDifficulty) {
          const requiredZeroes = calculateRequiredBinaryZeroes(info.networkDifficulty);
          setNetworkStats({
            blockHeight: info.blockHeight,
            difficulty: info.networkDifficulty,
            requiredBinaryZeroes: requiredZeroes,
          });
          addLog(`Network difficulty updated: ${info.networkDifficulty}, required zeros: ${requiredZeroes}`);
        } else {
          addLog(`Failed to parse values from network info: ${JSON.stringify(info)}`);
          console.log(`Failed to parse values from network info: ${JSON.stringify(info)}`);
        }

      } catch (error) {
        addLog(`Failed to fetch network info: ${error}`);
      }

    };

    updateNetworkInfo();
    const interval = setInterval(updateNetworkInfo, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [getNetworkInfo, addLog]);

  const startMining = () => {
    const modeString = miningMode.toUpperCase();
    const threadInfo = miningMode === "cpu" ? ` with ${threadCount} threads` : "";
    addLog(`Starting ${modeString} mining${threadInfo} at ${miningSpeed}% speed`);

    connectWebSocket();
    startWorkerPool();
    setIsMining(true);
    startMiningStats();
  };

  const stopMining = () => {
    const modeString = miningMode.toUpperCase();
    addLog(`Stopping ${modeString} mining`);

    disconnectWebSocket();
    stopWorkerPool();
    setIsMining(false);
    stopMiningStats();
  };

  const setThreadCount = (count: number) => {
    updateThreadCount(count);
    setThreadCountState(count);
    if (isMining) {
      addLog(`Updating CPU mining thread count to ${count}`);
    }
  };

  const handleSetMiningSpeed = (speed: number) => {
    const statusText = isMining ? "Mining speed updated to" : "Mining speed set to";
    addLog(`${statusText} ${speed}%`);
    setMiningSpeed(speed);
  };

  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, []);

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
        setMiningSpeed: handleSetMiningSpeed,
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
