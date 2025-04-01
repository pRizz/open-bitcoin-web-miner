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
import { MiningSubmission, NoncelessBlockHeader, serializeBlockHeader, deserializeNonceLE, MiningSubmissionStatus, MiningSubmissionResponse } from "@/types/websocket";
import { useMiningWebSocket } from "./mining/useMiningWebSocket";
import { u8ArrayBEToNonce } from "@/utils/nonceUtils";
import { useMiningEvents } from "./mining/MiningEventsContext";

const defaultContext: MiningContextType = {
  miningStats: {
    maybeBlockHeight: 0,
    maybeDifficulty: 0,
    maybeRequiredBinaryZeroes: 0,
    acceptedSolutions: 0,
    rejectedSolutions: 0,
    cumulativeHashes: 0,
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
  const { emit } = useMiningEvents();
  const {
    miningStats,
    updateMiningStats,
    updateHashRate,
    updateRequiredBinaryZeroes,
    updateSubmissionStats,
    resetStats,
    startMining: startMiningStats,
    stopMining: stopMiningStats,
    addSubmittedHash,
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
    (miningSolution: MiningSolution) => {
      const { leadingBinaryZeroes, leadingHexZeroes } = calculateLeadingZeroes(miningSolution.hash);

      if (!miningSolution.maybeBlockHeader) {
        console.error('Invalid solution received: missing blockHeader');
        return;
      }
      console.log("Found solution", miningSolution);
      console.log("leadingBinaryZeroes", leadingBinaryZeroes);

      const miningSubmission: MiningSubmission = {
        nonceVecU8: Array.from(miningSolution.nonceVecU8),
        nonceless_block_header: miningSolution.maybeBlockHeader
      };
      console.log(`Submitting mining solution`);
      addLog(`Submitting mining solution`);
      console.log(`Mining submission: ${JSON.stringify(miningSubmission)}`);
      addLog(`Mining submission: ${JSON.stringify(miningSubmission)}`);

      const serializedBlockHeader = serializeBlockHeader(miningSolution.maybeBlockHeader, deserializeNonceLE(miningSolution.nonceVecU8));
      console.log("serializedBlockHeader", serializedBlockHeader);

      submitSolution(miningSubmission);

      const hashSolution: HashSolution = {
        id: crypto.randomUUID(),
        hash: miningSolution.hash,
        nonce: deserializeNonceLE(miningSolution.nonceVecU8),
        timestamp: Date.now(),
        merkleRoot: Array.from(new Uint8Array(miningSolution.maybeBlockHeader.merkle_root))
          .map(b => b.toString(16).padStart(2, '0'))
          .join(''),
        previousBlock: Array.from(new Uint8Array(miningSolution.maybeBlockHeader.previous_block_hash))
          .map(b => b.toString(16).padStart(2, '0'))
          .join(''),
        version: getNumberFromArrayOfBytes(miningSolution.maybeBlockHeader.version),
        bits: Array.from(new Uint8Array(miningSolution.maybeBlockHeader.compact_target))
          .map(b => b.toString(16).padStart(2, '0'))
          .join(''),
        binaryZeroes: leadingBinaryZeroes,
        hexZeroes: leadingHexZeroes,
        timeToFindMs: miningStats.maybeStartTime ? Date.now() - miningStats.maybeStartTime : 0,
        status: 'pending',
      };
      updateMiningStats(hashSolution, miningSolution.cumulativeHashes);
      addSubmittedHash(hashSolution);
    }
  );

  const { gpuCapabilities, startMining: startWorkerPool, stopMining: stopWorkerPool, updateThreadCount, updateMiningChallenge } = workerPool;

  const handleNewChallenge = useCallback((blockHeader: NoncelessBlockHeader, targetZeros: number) => {
    addLog(`New mining challenge received. Target zeros: ${targetZeros}, Block header: ${JSON.stringify(blockHeader)}`);
    console.log(`New mining challenge received. Target zeros: ${targetZeros}, Block header: ${JSON.stringify(blockHeader)}`);

    updateMiningChallenge({
      blockHeader: blockHeader,
      maybeTargetZeros: targetZeros
    }, false);

    // Update mining stats with new target zeros
    updateRequiredBinaryZeroes(targetZeros);

    // Emit new challenge event
    emit('onNewChallengeReceived');
  }, [addLog, updateMiningChallenge, updateRequiredBinaryZeroes, emit]);

  const handleBlockTemplateUpdate = useCallback((blockHeader: NoncelessBlockHeader) => {
    addLog("New block template received");
    updateMiningChallenge({
      blockHeader: blockHeader,
    }, true);
  }, [addLog, updateMiningChallenge]);

  const disconnectWebSocket = useCallback(() => {
    miningWebSocket.disconnect();
  }, []);

  const submitSolution = useCallback((submission: MiningSubmission) => {
    miningWebSocket.submitSolution(submission);
    addLog(`Submitted mining solution`);
    // Emit solution submission event
    emit('onSubmitSolution');
  }, [addLog, miningWebSocket, emit]);

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
    onSubmissionResponse: (submissionResponse: MiningSubmissionResponse) => {
      addLog(`Mining submission response: ${JSON.stringify(submissionResponse)}`);

      const workMetadata = submissionResponse.work_metadata || [];
      for (const workMetadataItem of workMetadata) {
        console.log("workMetadata", workMetadataItem);
        updateSubmissionStats({workMetadata: workMetadataItem});
        // Emit mining events based on submission status
        switch (workMetadataItem.status) {
        case MiningSubmissionStatus.ACCEPTED:
        case MiningSubmissionStatus.ACCEPTED_AND_FOUND_BLOCK:
          // Emit accepted submission response event
          emit('onReceiveSubmissionResponse', { accepted: true });
          break;
        case MiningSubmissionStatus.REJECTED:
          console.error(`Mining submission rejected: ${JSON.stringify(workMetadataItem)}`);
          // Emit rejected submission response event
          emit('onReceiveSubmissionResponse', { accepted: false });
          break;
        case MiningSubmissionStatus.OUTDATED:
          // Outdated submissions don't count towards accepted/rejected stats
          break;
        default:
          console.warn(`Unknown submission status: ${workMetadataItem.status}`);
        }
      }

      if (submissionResponse.maybe_difficulty_update) {
        const newDifficulty = submissionResponse.maybe_difficulty_update.new_min_leading_zero_count;
        addLog(`Updating mining difficulty to ${newDifficulty} leading zeros`);
        workerPool.updateDifficulty(newDifficulty);

        // Update mining stats with new difficulty
        updateRequiredBinaryZeroes(newDifficulty);

        // Emit difficulty update event
        emit('onNewDifficultyUpdate');
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
