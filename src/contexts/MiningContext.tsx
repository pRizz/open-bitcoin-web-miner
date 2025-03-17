import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from "react";
import { HashSolution, MiningMode, MiningSolution } from "@/types/mining";
import { calculateLeadingZeroes, calculateRequiredBinaryZeroes } from "@/utils/mining";
import { useMiningState } from "@/hooks/useMiningState";
import { MiningContextType } from "./mining/types";
import { useWorkerPool } from "./mining/useWorkerPool";
import { useInitialThreadCount } from "./mining/useThreadCount";
import { useDebug } from "./DebugContext";
import { useNetworkInfo } from "./NetworkInfoContext";
import API_CONFIG from "@/config/api";
import { MiningSubmission, WebSocketServerMessage, WebSocketClientMessage, NoncelessBlockHeader, serializeBlockHeader, deserializeNonceLE } from "@/types/websocket";
import { useMiningWebSocket } from "./mining/useMiningWebSocket";
import { u8ArrayBEToNonce } from "@/utils/nonceUtils";

const defaultContext: MiningContextType = {
  miningStats: {
    maybeBlockHeight: 0,
    maybeDifficulty: 0,
    maybeRequiredBinaryZeroes: 0,
  },
  isMining: false,
  miningSpeed: 100,
  threadCount: 1,
  maxThreads: 1,
  miningMode: "cpu",
  setMiningSpeed: () => {},
  setThreadCount: () => {},
  setMiningMode: () => {},
  startMining: () => {},
  stopMining: () => {},
  resetData: () => {},
  submitSolution: (submission: MiningSubmission) => {},
};

const MiningContext = createContext<MiningContextType>(defaultContext);

function getNumberFromArrayOfBytes(array: number[]): number {
  return array.reduce((acc, byte, index) => {
    return acc + (byte << (index * 8));
  }, 0);
}

export function MiningProvider({ children }: { children: React.ReactNode }) {
  console.log("MiningProvider constructor called");
  const { addLog } = useDebug();
  const miningWebSocket = useMiningWebSocket();
  const { maybeRequiredBinaryZeroes } = useNetworkInfo();
  const {
    miningStats,
    updateMiningStats,
    updateHashRate,
    resetStats,
    startMining: startMiningStats,
    stopMining: stopMiningStats,
  } = useMiningState();

  const [isMining, setIsMining] = useState(false);
  const [miningSpeed, setMiningSpeed] = useState(100);
  const [miningMode, setMiningMode] = useState<MiningMode>("cpu");

  const { maxThreads, threadCount, setThreadCount: setThreadCountState } = useInitialThreadCount();

  const workerPool = useWorkerPool(
    threadCount,
    miningSpeed,
    miningMode,
    updateHashRate,
    (solution: MiningSolution) => {
      const { leadingBinaryZeroes, leadingHexZeroes } = calculateLeadingZeroes(solution.hash);

      if (!solution.maybeJobId || !solution.maybeBlockHeader) {
        console.error('Invalid solution received: missing jobId or blockHeader');
        return;
      }
      console.log("Found solution", solution);
      console.log("leadingBinaryZeroes", leadingBinaryZeroes);

      const miningSubmission: MiningSubmission = {
        job_id: solution.maybeJobId,
        nonceVecU8: Array.from(solution.nonceVecU8),
        nonceless_block_header: solution.maybeBlockHeader
      };
      console.log(`Submitting mining solution for job ${solution.maybeJobId}`);
      addLog(`Submitting mining solution for job ${solution.maybeJobId}`);
      console.log(`Mining submission: ${JSON.stringify(miningSubmission)}`);
      addLog(`Mining submission: ${JSON.stringify(miningSubmission)}`);

      const serializedBlockHeader = serializeBlockHeader(solution.maybeBlockHeader, deserializeNonceLE(solution.nonceVecU8));
      console.log("serializedBlockHeader", serializedBlockHeader);

      submitSolution(miningSubmission);

      const solutionStats: HashSolution = {
        id: crypto.randomUUID(),
        hash: solution.hash,
        nonce: deserializeNonceLE(solution.nonceVecU8),
        timestamp: Date.now(),
        merkleRoot: Array.from(new Uint8Array(solution.maybeBlockHeader.merkle_root))
          .map(b => b.toString(16).padStart(2, '0'))
          .join(''),
        previousBlock: Array.from(new Uint8Array(solution.maybeBlockHeader.previous_block_hash))
          .map(b => b.toString(16).padStart(2, '0'))
          .join(''),
        version: getNumberFromArrayOfBytes(solution.maybeBlockHeader.version),
        bits: Array.from(new Uint8Array(solution.maybeBlockHeader.compact_target))
          .map(b => b.toString(16).padStart(2, '0'))
          .join(''),
        binaryZeroes: leadingBinaryZeroes,
        hexZeroes: leadingHexZeroes,
        timeToFind: 0,
      };
      updateMiningStats(solutionStats);
    }
  );

  const { gpuCapabilities, startMining: startWorkerPool, stopMining: stopWorkerPool, updateThreadCount, updateMiningChallenge } = workerPool;

  const handleNewChallenge = useCallback((jobId: string, blockHeader: NoncelessBlockHeader, targetZeros: number) => {
    addLog(`New mining challenge received. Job ID: ${jobId}, Target zeros: ${targetZeros}`);
    console.log(`New mining challenge received. Job ID: ${jobId}, Target zeros: ${targetZeros}, Block header: ${JSON.stringify(blockHeader)}`);

    updateMiningChallenge({
      maybeJobId: jobId,
      blockHeader: blockHeader,
      maybeTargetZeros: targetZeros
    });
  }, [addLog, updateMiningChallenge]);

  const handleBlockTemplateUpdate = useCallback((blockHeader: NoncelessBlockHeader) => {
    addLog("New block template received");
    updateMiningChallenge({
      blockHeader: blockHeader,
      maybeKeepExisting: true
    });
  }, [addLog, updateMiningChallenge]);

  const disconnectWebSocket = useCallback(() => {
    miningWebSocket.disconnect();
  }, []);

  const submitSolution = useCallback((submission: MiningSubmission) => {
    miningWebSocket.submitSolution(submission);
    addLog(`Submitted mining solution for job ${submission.job_id}`);
  }, [addLog, miningWebSocket]);

  const stopMining = useCallback(() => {
    const modeString = miningMode.toUpperCase();
    addLog(`Stopping ${modeString} mining`);

    disconnectWebSocket();
    stopWorkerPool();
    setIsMining(false);
    stopMiningStats();
  }, [miningMode, addLog, disconnectWebSocket, stopWorkerPool, stopMiningStats]);

  const miningWebSocketManagerCallbacks = {
    onNewChallenge: handleNewChallenge,
    onBlockTemplateUpdate: handleBlockTemplateUpdate,
    onSubmissionResponse: (status, message, maybeDifficultyUpdate) => {
      addLog(`Mining submission response: ${message} (status: ${status})`);
      if (maybeDifficultyUpdate) {
        const newDifficulty = maybeDifficultyUpdate.new_min_leading_zero_count;
        addLog(`Updating mining difficulty to ${newDifficulty} leading zeros`);
        workerPool.updateDifficulty(newDifficulty);
      }
    },
    onConnectionStateChange: (connected) => {
      addLog(connected ? 'WebSocket connection established' : 'WebSocket connection closed');
      if (!connected) {
        stopMining();
      }
    },
    onError: (error) => {
      addLog(`WebSocket error: ${error}`);
    }
  };

  miningWebSocket.setCallbacks(miningWebSocketManagerCallbacks);

  const connectWebSocket = useCallback(() => {
    console.log("in MiningProvider, connecting to WebSocket");
    miningWebSocket.connect();
  }, [miningWebSocket]);

  const startMining = useCallback(() => {
    console.log("Starting mining");
    const modeString = miningMode.toUpperCase();
    const threadInfo = miningMode === "cpu" ? ` with ${threadCount} threads` : "";
    addLog(`Starting ${modeString} mining${threadInfo} at ${miningSpeed}% speed`);

    connectWebSocket();
    startWorkerPool();
    setIsMining(true);
    startMiningStats();
  }, [miningMode, threadCount, miningSpeed, addLog, connectWebSocket, startWorkerPool, startMiningStats]);

  const setThreadCount = useCallback((count: number) => {
    updateThreadCount(count);
    setThreadCountState(count);
    if (isMining) {
      addLog(`Updating CPU mining thread count to ${count}`);
    }
  }, [updateThreadCount, setThreadCountState, isMining, addLog]);

  const handleSetMiningSpeed = useCallback((speed: number) => {
    const statusText = isMining ? "Mining speed updated to" : "Mining speed set to";
    addLog(`${statusText} ${speed}%`);
    console.log(`${statusText} ${speed}%`);
    setMiningSpeed(speed);
  }, [isMining, addLog]);

  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, []);

  return (
    <MiningContext.Provider
      value={{
        miningStats,
        isMining,
        miningSpeed,
        threadCount,
        maxThreads,
        miningMode,
        gpuCapabilities,
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
