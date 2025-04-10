import { MiningStats, MiningMode } from "@/types/mining";
import { MiningSubmission, NoncelessBlockHeader } from "@/types/websocket";

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
}

export interface MiningContextType {
  miningStats: MiningStats;
  isMining: boolean;
  /// In [0, 100]
  miningSpeed: number;
  /// In [1, maxThreads]
  threadCount: number;
  maxThreads: number;
  miningMode: MiningMode;
  gpuCapabilities?: GPUCapabilities;
  setMiningSpeed: (speed: number) => void;
  setThreadCount: (count: number) => void;
  setMiningMode: (mode: MiningMode) => void;
  startMining: () => void;
  stopMining: () => void;
  resetData: () => void;
  submitSolution: (submission: MiningSubmission) => void;
  miningHistory: MiningHistoryItem[];
}