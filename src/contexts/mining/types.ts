import { MiningStats, MiningMode } from "@/types/mining";
import { MiningSubmission, NoncelessBlockHeader, ProofOfReward } from "@/types/websocket";

export interface GPUCapabilities {
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

export interface MiningHistoryItem {
  blockHeader: NoncelessBlockHeader;
  targetZeros: number;
  timestamp: number;
  maybeProofOfReward: ProofOfReward | null;
  miningState: MiningContextMiningState;
}

export enum MiningContextMiningState {
  NOT_MINING = 0,
  BEHAVIOR_CHECK = 1,
  MINING = 2,
}

export interface MiningContextType {
  miningStats: MiningStats;
  isMining: boolean; // TODO: remove this and use miningState instead
  /// In [0, 100]
  miningSpeed: number;
  /// In [1, maxThreads]
  threadCount: number;
  maxThreads: number;
  miningMode: MiningMode;
  miningContextMiningState: MiningContextMiningState;
  gpuCapabilities?: GPUCapabilities;
  maybeMostRecentMiningStartTime: number | null;
  setMiningSpeed: (speed: number) => void;
  setThreadCount: (count: number) => void;
  setMiningMode: (mode: MiningMode) => void;
  startMining: () => void;
  stopMining: () => void;
  resetData: () => void;
  submitSolution: (submission: MiningSubmission) => void;
  miningHistory: MiningHistoryItem[];
}