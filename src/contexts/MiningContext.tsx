import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { HashSolution, MiningMode, MiningSolution } from "@/types/mining";
import { calculateLeadingZeroes, calculateRequiredBinaryZeroes } from "@/utils/mining";
import { useMiningState } from "@/hooks/useMiningState";
import { MiningContextType } from "./mining/types";
import { useWorkerPool } from "./mining/useWorkerPool";
import { useThreadCount } from "./mining/useThreadCount";
import { useDebug } from "./DebugContext";
import { useGRPC } from "./GRPCContext";
import API_CONFIG from "@/config/api";
import { MiningSubmission, WebSocketServerMessage, WebSocketClientMessage, NoncelessBlockHeader } from "@/types/websocket";

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
  submitSolution: (submission: MiningSubmission) => {},
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

  const { gpuCapabilities, startMining: startWorkerPool, stopMining: stopWorkerPool, updateThreadCount, updateMiningChallenge } = useWorkerPool(
    threadCount,
    miningSpeed,
    miningMode,
    updateHashRate,
    (solution: MiningSolution) => {
      const { leadingBinaryZeroes, leadingHexZeroes } = calculateLeadingZeroes(solution.hash);

      if (!solution.jobId || !solution.blockHeader) {
        console.error('Invalid solution received: missing jobId or blockHeader');
        return;
      }

      const miningSubmission: MiningSubmission = {
        job_id: solution.jobId,
        nonce: [solution.nonce], // FIXME: need to convert this to a 32-bit integer
        nonceless_block_header: solution.blockHeader
      };

      // Submit the solution if it meets the target
      if (leadingBinaryZeroes >= networkStats.requiredBinaryZeroes) {
        submitSolution(miningSubmission);
      }

      // Update stats for display
      const solutionStats: HashSolution = {
        id: crypto.randomUUID(),
        hash: solution.hash,
        nonce: solution.nonce, // Convert from array to number for stats
        timestamp: Date.now(),
        merkleRoot: Buffer.from(solution.blockHeader.merkle_root).toString('hex'),
        previousBlock: Buffer.from(solution.blockHeader.previous_block_hash).toString('hex'),
        version: Buffer.from(solution.blockHeader.version).readInt32BE(0),
        bits: Buffer.from(solution.blockHeader.compact_target).toString('hex'),
        binaryZeroes: leadingBinaryZeroes,
        hexZeroes: leadingHexZeroes,
        timeToFind: 0, // TODO: Track time to find
      };
      updateMiningStats(solutionStats, networkStats.requiredBinaryZeroes);
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
      try {
        const message = JSON.parse(event.data) as WebSocketServerMessage;
        console.log('WebSocket message received:', message);
        addLog(`WebSocket message type: ${message.type}`);

        switch (message.type) {
        case "ChallengeResponse": {
          const { job_id, nonceless_block_header, target_leading_zero_count } = message.data;
          addLog(`New mining challenge received. Job ID: ${job_id}, Target zeros: ${target_leading_zero_count}`);

          // Update network stats with new target
          // setNetworkStats(prev => ({
          //   ...prev,
          //   requiredBinaryZeroes: target_leading_zero_count
          // }));

          // Update worker pool with new challenge
          // if (isMining) {
          updateMiningChallenge({
            jobId: job_id,
            blockHeader: nonceless_block_header,
            targetZeros: target_leading_zero_count
          });
          // }
          break;
        }
        case "SubmissionResponse": {
          const { status, message: responseMessage } = message.data;
          addLog(`Mining submission response: ${responseMessage} (status: ${status})`);
          break;
        }
        case "BlockTemplateUpdate": {
          const { nonceless_block_header } = message.data;
          addLog("New block template received");
          // Update worker pool with new block template
          // if (isMining) {
          updateMiningChallenge({
            blockHeader: nonceless_block_header,
            // Keep existing jobId and targetZeros
            keepExisting: true
          });
          // }
          break;
        }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        addLog(`Error processing WebSocket message: ${error}`);
      }
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
    addLog('Disconnecting WebSocket');
    console.log('Disconnecting WebSocket');
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
  };

  const submitSolution = (submission: MiningSubmission) => {
    if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
      addLog('Cannot submit solution: WebSocket not connected');
      return;
    }

    const message: WebSocketClientMessage = {
      type: "Submission",
      data: submission
    };

    websocketRef.current.send(JSON.stringify(message));
    addLog(`Submitted mining solution for job ${submission.job_id}`);
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
        submitSolution,
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
