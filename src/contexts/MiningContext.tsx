import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { FoundHashSolution, MiningChallenge, MiningMode, MiningSolution } from "@/types/mining";
import { calculateLeadingZeroesFromHexString } from "@/utils/mining";
import { useMiningState } from "@/hooks/useMiningState";
import { MiningContextMiningState, MiningContextType, MiningHistoryItem } from "./mining/types";
import { useWorkerPool } from "./mining/useWorkerPool";
import { useInitialThreadCount } from "./mining/useThreadCount";
import { useDebug } from "./DebugContext";
import { MiningSubmission, serializeNoncelessBlockHeader, deserializeNonceLE, MiningSubmissionStatus, MiningSubmissionResponse, BlockTemplateUpdate, WebSocketMiningState } from "@/types/websocket";
import { useMiningWebSocket } from "./mining/useMiningWebSocket";
import { useMiningEvents } from "./mining/MiningEventsContext";
import {
  loadDevDisableWebGPUMiningOnMobileOverride,
  loadMiningMode,
  saveDevDisableWebGPUMiningOnMobileOverride,
  saveMiningMode,
} from "@/utils/localStorage";
import {
  getDisableWebGPUMiningOnMobileEnvDefault,
  isWebGPUSupportedSync,
  resolveDisableWebGPUMiningOnMobile,
  resolveMiningMode,
  resolveWebGPUAvailabilityReason,
  WebGPUAvailabilityReason,
} from "@/utils/miningPolicy";
import { isMobileSync, useIsMobile } from "@/hooks/use-mobile";

function getMiningContextMiningStateFromWebSocketMiningState(webSocketMiningState: WebSocketMiningState): MiningContextMiningState {
  switch (webSocketMiningState) {
  case WebSocketMiningState.MINING:
    return MiningContextMiningState.MINING;
  case WebSocketMiningState.BEHAVIOR_CHECK:
    return MiningContextMiningState.BEHAVIOR_CHECK;
  }
}

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
  miningContextMiningState: MiningContextMiningState.NOT_MINING,
  isWebGPUSupported: false,
  isWebGPUAllowed: false,
  webGPUAvailabilityReason: "unsupported",
  disableWebGPUMiningOnMobile: true,
  maybeMostRecentMiningStartTime: null,
  setMiningSpeed: () => {},
  setThreadCount: () => {},
  setMiningMode: () => {},
  setDisableWebGPUMiningOnMobile: () => {},
  startMining: () => {},
  stopMining: () => {},
  resetData: () => {},
  submitSolution: (submission: MiningSubmission) => {},
  miningHistory: [],
};

const MiningContext = createContext<MiningContextType>(defaultContext);

function getBlockedWebGPUMiningLogMessage(reason: WebGPUAvailabilityReason): string {
  if (reason === "disabled_on_mobile") {
    return "WebGPU mining is disabled on mobile devices by config; using CPU mining instead";
  }

  return "WebGPU mining is not supported in this browser; using CPU mining instead";
}

export function MiningProvider({ children }: { children: React.ReactNode }) {
  console.log("MiningProvider constructor called");
  const { addLog } = useDebug();
  const miningWebSocket = useMiningWebSocket();
  const { emit } = useMiningEvents();
  const miningState = useMiningState();
  const isMobile = useIsMobile() || isMobileSync();
  const disableWebGPUMiningOnMobileEnvDefault = getDisableWebGPUMiningOnMobileEnvDefault();
  const isWebGPUSupported = isWebGPUSupportedSync();
  const [miningContextMiningState, setMiningContextMiningState] = useState<MiningContextMiningState>(MiningContextMiningState.NOT_MINING);

  const [isMining, setIsMining] = useState(false);
  const [miningSpeed, setMiningSpeed] = useState(100);
  const [disableWebGPUMiningOnMobile, setDisableWebGPUMiningOnMobileState] = useState(() => resolveDisableWebGPUMiningOnMobile({
    maybeEnvValue: import.meta.env.VITE_DISABLE_WEBGPU_MINING_ON_MOBILE,
    isDev: import.meta.env.DEV,
    maybeDevOverride: import.meta.env.DEV ? loadDevDisableWebGPUMiningOnMobileOverride() : null,
  }));
  const webGPUAvailabilityReason = resolveWebGPUAvailabilityReason({
    isWebGPUSupported,
    isMobile,
    disableWebGPUMiningOnMobile,
  });
  const isWebGPUAllowed = webGPUAvailabilityReason === "allowed";
  const [miningMode, setMiningModeState] = useState<MiningMode>(() => {
    // Load mining mode from localStorage on initialization
    const maybeSavedMode = loadMiningMode();
    const resolvedMiningMode = resolveMiningMode({
      maybePreferredMode: maybeSavedMode,
      isWebGPUAllowed,
    });

    if (maybeSavedMode === "webgpu" && resolvedMiningMode !== maybeSavedMode) {
      saveMiningMode(resolvedMiningMode);
    }

    return resolvedMiningMode;
  });
  const [miningHistory, setMiningHistory] = useState<MiningHistoryItem[]>([]);
  const [maybeMostRecentMiningStartTime, setMaybeMostRecentMiningStartTime] = useState<number | null>(null);
  const { maxThreads, threadCount, setThreadCount: setThreadCountState } = useInitialThreadCount();
  const [maybeScreenWakeLock, setMaybeScreenWakeLock] = useState<WakeLockSentinel | null>(null);

  const workerPool = useWorkerPool(
    threadCount,
    miningSpeed,
    miningMode,
    miningState.updateHashRate,
    (miningSolution: MiningSolution) => {
      const { leadingBinaryZeroes, leadingHexZeroes } = calculateLeadingZeroesFromHexString(miningSolution.hash);

      console.log("Found solution", miningSolution);
      console.log("leadingBinaryZeroes", leadingBinaryZeroes);
      const nonceAsHex = Array.from(miningSolution.nonceVecU8).map(byteNumber => byteNumber.toString(16).padStart(2, '0')).join('');
      // console.log("nonceAsHex", nonceAsHex);

      const miningSubmission: MiningSubmission = {
        nonceHex: nonceAsHex,
        nonceless_block_header: miningSolution.noncelessBlockHeader
      };
      console.log(`Submitting mining solution`);
      addLog(`Submitting mining solution`);
      console.log(`Mining submission: ${JSON.stringify(miningSubmission)}`);
      addLog(`Mining submission: ${JSON.stringify(miningSubmission)}`);

      const serializedBlockHeader = serializeNoncelessBlockHeader(miningSolution.noncelessBlockHeader, deserializeNonceLE(miningSolution.nonceVecU8));
      console.log("serializedBlockHeader", serializedBlockHeader);

      submitSolutionToWebSocket(miningSubmission);

      const hashSolution: FoundHashSolution = {
        id: crypto.randomUUID(),
        hash: miningSolution.hash,
        nonceNumber: deserializeNonceLE(miningSolution.nonceVecU8),
        timestamp: Date.now(),
        merkleRootHex: miningSolution.noncelessBlockHeader.merkle_root_hex,
        previousBlockHex: miningSolution.noncelessBlockHeader.previous_block_hash_hex,
        versionNumber: parseInt(miningSolution.noncelessBlockHeader.version_hex, 16),
        bitsHex: miningSolution.noncelessBlockHeader.compact_target_hex,
        binaryZeroes: leadingBinaryZeroes,
        hexZeroes: leadingHexZeroes,
        timeToFindMs: miningState.miningStats.maybeStartTime ? Date.now() - miningState.miningStats.maybeStartTime : 0,
      };
      miningState.updateMiningStats(hashSolution, miningSolution.cumulativeHashes);
      miningState.addSubmittedHash(hashSolution);
    }
  );

  const handleNewChallenge = useCallback((challenge: MiningChallenge) => {
    addLog(`New mining challenge received. Target zeros: ${challenge.targetZeros}, Block header: ${JSON.stringify(challenge.noncelessBlockHeader)}`);
    console.log(`New mining challenge received. Target zeros: ${challenge.targetZeros}, Block header: ${JSON.stringify(challenge.noncelessBlockHeader)}`);
    const webSocketMiningState = challenge.webSocketMiningState;
    const miningContextMiningState = getMiningContextMiningStateFromWebSocketMiningState(webSocketMiningState);
    setMiningContextMiningState(miningContextMiningState);

    const miningHistoryItem: MiningHistoryItem = {
      blockHeader: challenge.noncelessBlockHeader,
      targetZeros: challenge.targetZeros,
      timestamp: Date.now(),
      maybeProofOfReward: challenge.maybeProofOfReward,
      miningState: miningContextMiningState,
    };
    setMiningHistory([...miningHistory, miningHistoryItem]);
    workerPool.updateMiningChallenge(challenge);

    // Update mining stats with new target zeros
    miningState.updateRequiredBinaryZeroes(challenge.targetZeros);
    // Emit new challenge event
    emit('onNewChallengeReceived');
  }, [addLog, miningState, workerPool, emit, miningHistory, setMiningHistory, miningContextMiningState]);

  const handleBlockTemplateUpdate = useCallback((blockTemplateUpdate: BlockTemplateUpdate) => {
    addLog("New block template received");
    const miningContextMiningState = getMiningContextMiningStateFromWebSocketMiningState(blockTemplateUpdate.mining_mode);
    setMiningContextMiningState(miningContextMiningState);
    workerPool.updateBlockHeader(blockTemplateUpdate.nonceless_block_header);

    const miningHistoryItem: MiningHistoryItem = {
      blockHeader: blockTemplateUpdate.nonceless_block_header,
      targetZeros: miningState.miningStats.maybeRequiredBinaryZeroes,
      timestamp: Date.now(),
      maybeProofOfReward: blockTemplateUpdate.maybe_proof_of_reward,
      miningState: miningContextMiningState,
    };
    setMiningHistory([...miningHistory, miningHistoryItem]);
  }, [addLog, workerPool, miningHistory, setMiningHistory, miningState, miningContextMiningState]);

  const disconnectWebSocket = useCallback(() => {
    miningWebSocket.disconnect();
  }, [miningWebSocket]);

  const submitSolutionToWebSocket = useCallback((submission: MiningSubmission) => {
    miningWebSocket.submitSolution(submission);
    addLog(`Submitted mining solution`);
    // Emit solution submission event
    emit('onSubmitSolution');
  }, [addLog, miningWebSocket, emit]);

  const stopMining = useCallback(() => {
    if (maybeScreenWakeLock) {
      maybeScreenWakeLock.release();
      setMaybeScreenWakeLock(null);
    }

    const modeString = miningMode.toUpperCase();
    addLog(`Stopping ${modeString} mining`);

    disconnectWebSocket();
    workerPool.stopMining();
    setIsMining(false);
    miningState.stopMining();
  }, [miningMode, addLog, disconnectWebSocket, miningState, workerPool, maybeScreenWakeLock]);

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
    console.log("Starting mining...");
    addLog("Converting electrical energy into digital energy...");
    console.log("peterlog: miningcontext: startMining: miningMode", miningMode);
    const modeString = miningMode.toUpperCase();
    const withThreadInfo = miningMode === "cpu" ? ` with ${threadCount} threads` : "";
    addLog(`Starting ${modeString} mining${withThreadInfo} at ${miningSpeed}% speed`);

    // Make user's device not go to sleep
    navigator.wakeLock.request('screen').then((wakeLock) => {
      addLog("Screen wake lock acquired");
      setMaybeScreenWakeLock(wakeLock);
      wakeLock.addEventListener('release', () => {
        addLog("Screen wake lock released");
      });
    }).catch((error) => {
      addLog(`Failed to request screen wake lock: ${error}`);
    });

    const startTime = Date.now();
    setMaybeMostRecentMiningStartTime(startTime);
    connectWebSocket();
    workerPool.startMining();
    setIsMining(true);
    miningState.startMining();
  }, [miningMode, threadCount, miningSpeed, addLog, connectWebSocket, miningState, workerPool, maybeScreenWakeLock]);

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

  const handleSetMiningMode = useCallback((mode: MiningMode) => {
    const resolvedMiningMode = resolveMiningMode({
      maybePreferredMode: mode,
      isWebGPUAllowed,
    });

    setMiningModeState(resolvedMiningMode);
    saveMiningMode(resolvedMiningMode);

    if (resolvedMiningMode !== mode) {
      addLog(getBlockedWebGPUMiningLogMessage(webGPUAvailabilityReason));
      return;
    }

    addLog(`Mining mode set to ${resolvedMiningMode.toUpperCase()}`);
  }, [addLog, isWebGPUAllowed, webGPUAvailabilityReason]);

  const handleSetDisableWebGPUMiningOnMobile = useCallback((disabled: boolean) => {
    if (!import.meta.env.DEV) {
      return;
    }

    setDisableWebGPUMiningOnMobileState(disabled);
    saveDevDisableWebGPUMiningOnMobileOverride(
      disabled === disableWebGPUMiningOnMobileEnvDefault ? null : disabled
    );
    addLog(`Disable WebGPU on mobile devices ${disabled ? "enabled" : "disabled"} for this browser`);
  }, [addLog, disableWebGPUMiningOnMobileEnvDefault]);

  useEffect(() => {
    const resolvedMiningMode = resolveMiningMode({
      maybePreferredMode: miningMode,
      isWebGPUAllowed,
    });

    if (resolvedMiningMode === miningMode) {
      return;
    }

    setMiningModeState(resolvedMiningMode);
    saveMiningMode(resolvedMiningMode);
    addLog(getBlockedWebGPUMiningLogMessage(webGPUAvailabilityReason));
  }, [addLog, isWebGPUAllowed, miningMode, webGPUAvailabilityReason]);

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
        miningContextMiningState,
        maybeMostRecentMiningStartTime,
        gpuCapabilities: workerPool.gpuCapabilities,
        isWebGPUSupported,
        isWebGPUAllowed,
        webGPUAvailabilityReason,
        disableWebGPUMiningOnMobile,
        setMiningSpeed: handleSetMiningSpeed,
        setThreadCount,
        setMiningMode: handleSetMiningMode,
        setDisableWebGPUMiningOnMobile: handleSetDisableWebGPUMiningOnMobile,
        startMining,
        stopMining,
        resetData: miningState.resetStats,
        submitSolution: submitSolutionToWebSocket,
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
