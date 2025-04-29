import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from "react";
import { HashSolution, MiningChallenge, MiningMode, MiningSolution } from "@/types/mining";
import { calculateLeadingZeroesFromHexString } from "@/utils/mining";
import { useMiningState } from "@/hooks/useMiningState";
import { MiningContextType, MiningHistoryItem } from "./mining/types";
import { useWorkerPool } from "./mining/useWorkerPool";
import { useInitialThreadCount } from "./mining/useThreadCount";
import { useDebug } from "./DebugContext";
import { MiningSubmission, NoncelessBlockHeader, serializeBlockHeader, deserializeNonceLE, MiningSubmissionStatus, MiningSubmissionResponse, BlockTemplateUpdate } from "@/types/websocket";
import { useMiningWebSocket } from "./mining/useMiningWebSocket";
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
  miningHistory: [],
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
  const { emit } = useMiningEvents();
  const miningState = useMiningState();

  const [isMining, setIsMining] = useState(false);
  const [miningSpeed, setMiningSpeed] = useState(100);
  const [miningMode, setMiningMode] = useState<MiningMode>("cpu");
  const [miningHistory, setMiningHistory] = useState<MiningHistoryItem[]>([]);
  const { maxThreads, threadCount, setThreadCount: setThreadCountState } = useInitialThreadCount();

  const workerPool = useWorkerPool(
    threadCount,
    miningSpeed,
    miningMode,
    miningState.updateHashRate,
    (miningSolution: MiningSolution) => {
      const { leadingBinaryZeroes, leadingHexZeroes } = calculateLeadingZeroesFromHexString(miningSolution.hash);

      if (!miningSolution.maybeBlockHeader) {
        console.error('Invalid solution received: missing blockHeader');
        return;
      }
      console.log("Found solution", miningSolution);
      console.log("leadingBinaryZeroes", leadingBinaryZeroes);
      const nonceAsHex = Array.from(miningSolution.nonceVecU8).map(byteNumber => byteNumber.toString(16).padStart(2, '0')).join('');
      // console.log("nonceAsHex", nonceAsHex);

      const miningSubmission: MiningSubmission = {
        nonceHex: nonceAsHex,
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
        nonceNumber: deserializeNonceLE(miningSolution.nonceVecU8),
        timestamp: Date.now(),
        merkleRootHex: miningSolution.maybeBlockHeader.merkle_root_hex,
        previousBlockHex: miningSolution.maybeBlockHeader.previous_block_hash_hex,
        versionNumber: parseInt(miningSolution.maybeBlockHeader.version_hex, 16),
        bitsHex: miningSolution.maybeBlockHeader.compact_target_hex,
        binaryZeroes: leadingBinaryZeroes,
        hexZeroes: leadingHexZeroes,
        timeToFindMs: miningState.miningStats.maybeStartTime ? Date.now() - miningState.miningStats.maybeStartTime : 0,
        status: 'pending',
      };
      miningState.updateMiningStats(hashSolution, miningSolution.cumulativeHashes);
      miningState.addSubmittedHash(hashSolution);
    }
  );

  const handleNewChallenge = useCallback((challenge: MiningChallenge) => {
    addLog(`New mining challenge received. Target zeros: ${challenge.targetZeros}, Block header: ${JSON.stringify(challenge.blockHeader)}`);
    console.log(`New mining challenge received. Target zeros: ${challenge.targetZeros}, Block header: ${JSON.stringify(challenge.blockHeader)}`);

    const miningHistoryItem: MiningHistoryItem = {
      blockHeader: challenge.blockHeader,
      targetZeros: challenge.targetZeros,
      timestamp: Date.now(),
      proofOfReward: challenge.proofOfReward
    };
    setMiningHistory([...miningHistory, miningHistoryItem]);
    workerPool.updateMiningChallenge(challenge);

    // Update mining stats with new target zeros
    miningState.updateRequiredBinaryZeroes(challenge.targetZeros);
    // Emit new challenge event
    emit('onNewChallengeReceived');
  }, [addLog, miningState, workerPool, emit, miningHistory, setMiningHistory]);

  const handleBlockTemplateUpdate = useCallback((blockTemplateUpdate: BlockTemplateUpdate) => {
    addLog("New block template received");
    workerPool.updateBlockHeader(blockTemplateUpdate.nonceless_block_header);
    const miningHistoryItem: MiningHistoryItem = {
      blockHeader: blockTemplateUpdate.nonceless_block_header,
      targetZeros: miningState.miningStats.maybeRequiredBinaryZeroes,
      timestamp: Date.now(),
      proofOfReward: blockTemplateUpdate.proof_of_reward
    };
    setMiningHistory([...miningHistory, miningHistoryItem]);
  }, [addLog, workerPool, miningHistory, setMiningHistory, miningState]);

  const disconnectWebSocket = useCallback(() => {
    miningWebSocket.disconnect();
  }, [miningWebSocket]);

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
    workerPool.stopMining();
    setIsMining(false);
    miningState.stopMining();
  }, [miningMode, addLog, disconnectWebSocket, miningState, workerPool]);

  const handleSubmissionResponse = useCallback((submissionResponse: MiningSubmissionResponse) => {
    addLog(`Mining submission response: ${JSON.stringify(submissionResponse)}`);

    const workMetadata = submissionResponse.work_metadata || [];
    for (const workMetadataItem of workMetadata) {
      console.log("workMetadata", workMetadataItem);
      miningState.updateSubmissionStats({workMetadata: workMetadataItem});
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
      miningState.updateRequiredBinaryZeroes(newDifficulty);

      // Emit difficulty update event
      emit('onNewDifficultyUpdate');
    }
  }, [addLog, emit, miningState, workerPool]);

  const miningWebSocketManagerCallbacks = {
    onNewChallenge: handleNewChallenge,
    onBlockTemplateUpdate: handleBlockTemplateUpdate,
    onSubmissionResponse: handleSubmissionResponse,
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
    workerPool.startMining();
    setIsMining(true);
    miningState.startMining();
  }, [miningMode, threadCount, miningSpeed, addLog, connectWebSocket, miningState, workerPool]);

  const setThreadCount = useCallback((count: number) => {
    workerPool.updateThreadCount(count);
    setThreadCountState(count);
    if (isMining) {
      addLog(`Updating CPU mining thread count to ${count}`);
    }
  }, [workerPool, setThreadCountState, isMining, addLog]);

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
        miningStats: miningState.miningStats,
        isMining,
        miningSpeed,
        threadCount,
        maxThreads,
        miningMode,
        setMiningSpeed: handleSetMiningSpeed,
        setThreadCount,
        setMiningMode,
        startMining,
        stopMining,
        resetData: miningState.resetStats,
        submitSolution,
        miningHistory,
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
