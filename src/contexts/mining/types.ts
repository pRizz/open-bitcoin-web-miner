import { MiningStats, MiningMode } from "@/types/mining";
import { MiningSubmission } from "@/types/websocket";

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

export interface MiningContextType {
  miningStats: MiningStats;
  isMining: boolean;
  btcAddress: string;
  /// In [0, 100]
  miningSpeed: number;
  /// In [1, maxThreads]
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
  submitSolution: (submission: MiningSubmission) => void;
}